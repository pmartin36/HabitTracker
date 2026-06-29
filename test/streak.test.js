import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";

// This import will fail until src/streak.js is implemented — that is expected.
import { computeStreak } from "../src/streak.js";

describe("computeStreak", () => {
  let db;
  let habitId;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);

    // Insert a habit whose created_at precedes all the test entry dates so
    // the algorithm's "walk back to created_at" boundary doesn't interfere.
    db.prepare(
      "INSERT INTO habits (name, emoji, sort_order, created_at) VALUES (?, ?, ?, ?)"
    ).run("Test Habit", "✅", 1, "2024-01-01");
    habitId = db.prepare("SELECT id FROM habits LIMIT 1").get().id;
  });

  /** Small helper — inserts an entry for this test's habitId. */
  function addEntry(date, status) {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId, date, status, 1);
  }

  // ── Edge cases ───────────────────────────────────────────────────────────────

  it("returns 0 for an unknown habit_id", () => {
    expect(computeStreak(db, 9999, "2024-01-10")).toBe(0);
  });

  it("returns 0 when there are no entries at all (all pending)", () => {
    expect(computeStreak(db, habitId, "2024-01-10")).toBe(0);
  });

  it("returns 0 when asOfDate is before habit.created_at", () => {
    // The habit was created on 2024-01-01; asking for streak on 2023-12-31
    // means the while condition is immediately false.
    expect(computeStreak(db, habitId, "2023-12-31")).toBe(0);
  });

  // ── Single-day cases ─────────────────────────────────────────────────────────

  it("returns 1 for a single pass on asOfDate", () => {
    addEntry("2024-01-01", "pass");
    expect(computeStreak(db, habitId, "2024-01-01")).toBe(1);
  });

  it("returns 0 for a single fail on asOfDate", () => {
    addEntry("2024-01-01", "fail");
    expect(computeStreak(db, habitId, "2024-01-01")).toBe(0);
  });

  it("returns 0 for a single skip on asOfDate (no pass before it)", () => {
    addEntry("2024-01-01", "skip");
    // skip does not increment; there are no passes behind it either.
    expect(computeStreak(db, habitId, "2024-01-01")).toBe(0);
  });

  // ── Spec examples ────────────────────────────────────────────────────────────

  it("Pass, Pass, Skip, Pass (days 1–4) → streak = 3", () => {
    // Walking back from day 4: pass(1), skip(no change), pass(2), pass(3)
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-02", "pass");
    addEntry("2024-01-03", "skip");
    addEntry("2024-01-04", "pass");
    expect(computeStreak(db, habitId, "2024-01-04")).toBe(3);
  });

  it("Pass, Fail, Pass (days 1–3) → streak = 1", () => {
    // Walking back from day 3: pass(1), fail → break. Streak = 1.
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-02", "fail");
    addEntry("2024-01-03", "pass");
    expect(computeStreak(db, habitId, "2024-01-03")).toBe(1);
  });

  // ── pending (no row) is transparent ─────────────────────────────────────────

  it("pending (no row) behaves like skip — does not break streak", () => {
    // Day 1: pass, Day 2: no entry (pending/transparent), Day 3: pass
    // Walk from day 3: pass(1), pending(skip, no change), pass(2) → streak = 2
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-03", "pass");
    expect(computeStreak(db, habitId, "2024-01-03")).toBe(2);
  });

  it("multiple pending days between passes all remain transparent", () => {
    // Day 1: pass, Days 2-4: no entries, Day 5: pass → streak = 2
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-05", "pass");
    expect(computeStreak(db, habitId, "2024-01-05")).toBe(2);
  });

  // ── Skip behaviour ───────────────────────────────────────────────────────────

  it("skip between passes does not break the streak", () => {
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-02", "pass");
    addEntry("2024-01-03", "skip");
    expect(computeStreak(db, habitId, "2024-01-03")).toBe(2);
  });

  it("skip on asOfDate carries the streak from earlier passes", () => {
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-02", "skip");
    // Walk from day 2: skip(no change), pass(1) → streak = 1
    expect(computeStreak(db, habitId, "2024-01-02")).toBe(1);
  });

  // ── Fail stops the walk ──────────────────────────────────────────────────────

  it("fail on asOfDate returns 0 immediately", () => {
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-02", "fail");
    expect(computeStreak(db, habitId, "2024-01-02")).toBe(0);
  });

  it("fail in the middle resets the streak to only count from there", () => {
    addEntry("2024-01-01", "pass");
    addEntry("2024-01-02", "pass");
    addEntry("2024-01-03", "fail");
    addEntry("2024-01-04", "pass");
    addEntry("2024-01-05", "pass");
    // Walk from day 5: pass(1), pass(2), fail → break. Streak = 2.
    expect(computeStreak(db, habitId, "2024-01-05")).toBe(2);
  });

  // ── created_at boundary ──────────────────────────────────────────────────────

  it("does not walk back before habit.created_at", () => {
    // Habit created 2024-01-05; entries on days 5 and 6 only.
    db.prepare("UPDATE habits SET created_at = ? WHERE id = ?").run(
      "2024-01-05",
      habitId
    );
    addEntry("2024-01-05", "pass");
    addEntry("2024-01-06", "pass");
    // Walk from day 6: pass(1), pass(2), stop at created_at. Streak = 2.
    expect(computeStreak(db, habitId, "2024-01-06")).toBe(2);
  });

  it("counts streak = 1 when only created_at day has a pass", () => {
    addEntry("2024-01-01", "pass");
    expect(computeStreak(db, habitId, "2024-01-01")).toBe(1);
  });

  // ── asOfDate input formats ───────────────────────────────────────────────────

  it("accepts a Date object as asOfDate", () => {
    addEntry("2024-01-01", "pass");
    expect(computeStreak(db, habitId, new Date("2024-01-01T12:00:00Z"))).toBe(1);
  });

  it("accepts a 'YYYY-MM-DD' string as asOfDate", () => {
    addEntry("2024-01-01", "pass");
    expect(computeStreak(db, habitId, "2024-01-01")).toBe(1);
  });

  // ── Return type ──────────────────────────────────────────────────────────────

  it("always returns an integer", () => {
    const result = computeStreak(db, habitId, "2024-01-10");
    expect(Number.isInteger(result)).toBe(true);
  });
});
