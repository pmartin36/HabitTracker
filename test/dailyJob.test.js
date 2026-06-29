import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";

// This import will fail until src/jobs/dailyJob.js is implemented — that is expected.
import { runDailyJob } from "../src/jobs/dailyJob.js";

describe("runDailyJob", () => {
  let db;
  let habitId;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);

    db.prepare(
      "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
    ).run("Test Habit", "✅", 1);
    habitId = db.prepare("SELECT id FROM habits LIMIT 1").get().id;
  });

  // ── Return shape ─────────────────────────────────────────────────────────────

  it("returns { lockedEntries: 0, lockedMoods: 0 } when nothing to lock", () => {
    const result = runDailyJob(db, "2024-01-10");
    expect(result).toEqual({ lockedEntries: 0, lockedMoods: 0 });
  });

  it("returns an object with numeric lockedEntries and lockedMoods", () => {
    const result = runDailyJob(db, "2024-01-10");
    expect(typeof result.lockedEntries).toBe("number");
    expect(typeof result.lockedMoods).toBe("number");
  });

  // ── Entry locking ────────────────────────────────────────────────────────────

  it("flips a pending (explicit=false) entry from 2 days ago to fail", () => {
    // asOfDate = 2024-01-10, cutoff = date <= 2024-01-08 (10 - 2 days)
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-08", "pending", 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(1);

    const entry = db
      .prepare("SELECT status FROM entries WHERE habit_id = ? AND date = ?")
      .get(habitId, "2024-01-08");
    expect(entry.status).toBe("fail");
  });

  it("flips a pending entry from more than 2 days ago", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-01", "pending", 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(1);

    const entry = db
      .prepare("SELECT status FROM entries WHERE habit_id = ? AND date = ?")
      .get(habitId, "2024-01-01");
    expect(entry.status).toBe("fail");
  });

  it("does NOT flip a pending entry from yesterday (1 day ago)", () => {
    // asOfDate = 2024-01-10, yesterday = 2024-01-09 — outside the cutoff
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-09", "pending", 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(0);

    const entry = db
      .prepare("SELECT status FROM entries WHERE habit_id = ? AND date = ?")
      .get(habitId, "2024-01-09");
    expect(entry.status).toBe("pending");
  });

  it("does NOT flip a pending entry from today", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-10", "pending", 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(0);
  });

  it("does NOT touch skip entries (explicit=true) regardless of age", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-08", "skip", 1);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(0);

    const entry = db
      .prepare("SELECT status FROM entries WHERE habit_id = ? AND date = ?")
      .get(habitId, "2024-01-08");
    expect(entry.status).toBe("skip");
  });

  it("does NOT touch pass entries regardless of age", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-01", "pass", 1);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(0);

    const entry = db
      .prepare("SELECT status FROM entries WHERE habit_id = ? AND date = ?")
      .get(habitId, "2024-01-01");
    expect(entry.status).toBe("pass");
  });

  it("does NOT touch fail entries regardless of age", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-01", "fail", 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(0);

    const entry = db
      .prepare("SELECT status FROM entries WHERE habit_id = ? AND date = ?")
      .get(habitId, "2024-01-01");
    expect(entry.status).toBe("fail");
  });

  it("handles multiple pending entries spread across several old dates", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-06", "pending", 0);
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-07", "pending", 0);
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-08", "pending", 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(3);
  });

  it("only counts and flips entries that were actually pending (mixed statuses)", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-06", "pending", 0);
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-07", "pass", 1);
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-08", "skip", 1);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(1);
  });

  it("does NOT create new entry rows", () => {
    const { cnt: before } = db
      .prepare("SELECT COUNT(*) as cnt FROM entries")
      .get();
    runDailyJob(db, "2024-01-10");
    const { cnt: after } = db
      .prepare("SELECT COUNT(*) as cnt FROM entries")
      .get();
    expect(after).toBe(before);
  });

  // ── Mood locking ─────────────────────────────────────────────────────────────

  it("locks an unlocked daily_mood row from 2 days ago", () => {
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-08", 4, 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedMoods).toBe(1);

    const mood = db
      .prepare("SELECT locked FROM daily_mood WHERE date = ?")
      .get("2024-01-08");
    expect(mood.locked).toBe(1);
  });

  it("locks a daily_mood row from more than 2 days ago", () => {
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-01", 3, 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedMoods).toBe(1);
  });

  it("does NOT lock a daily_mood row from yesterday (1 day ago)", () => {
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-09", 3, 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedMoods).toBe(0);

    const mood = db
      .prepare("SELECT locked FROM daily_mood WHERE date = ?")
      .get("2024-01-09");
    expect(mood.locked).toBe(0);
  });

  it("does NOT lock a daily_mood row from today", () => {
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-10", 2, 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedMoods).toBe(0);
  });

  it("does NOT re-lock an already-locked daily_mood row", () => {
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-08", 4, 1);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedMoods).toBe(0);
  });

  it("does NOT create new daily_mood rows", () => {
    const { cnt: before } = db
      .prepare("SELECT COUNT(*) as cnt FROM daily_mood")
      .get();
    runDailyJob(db, "2024-01-10");
    const { cnt: after } = db
      .prepare("SELECT COUNT(*) as cnt FROM daily_mood")
      .get();
    expect(after).toBe(before);
  });

  it("handles multiple unlocked moods from 2+ days ago", () => {
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-06", 5, 0);
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-07", 3, 0);
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-08", 1, 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedMoods).toBe(3);
  });

  // ── Combined entries + moods in one run ──────────────────────────────────────

  it("locks both pending entries and unlocked moods in the same run", () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, "2024-01-08", "pending", 0);
    db.prepare(
      "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
    ).run("2024-01-08", 4, 0);

    const result = runDailyJob(db, "2024-01-10");
    expect(result.lockedEntries).toBe(1);
    expect(result.lockedMoods).toBe(1);
  });
});
