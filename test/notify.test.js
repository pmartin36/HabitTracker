import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";

// This import will fail until src/jobs/notify.js is implemented — that is expected.
import { buildNotificationMessage, sendNotification } from "../src/jobs/notify.js";

const AS_OF_DATE = "2024-01-15";

describe("buildNotificationMessage", () => {
  let db;
  let habitId1;
  let habitId2;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);

    // Use a known old created_at so streak computation correctly walks back through test dates
    db.prepare(
      "INSERT INTO habits (name, emoji, sort_order, created_at) VALUES (?, ?, ?, ?)"
    ).run("Sleep enough", "😴", 1, "2020-01-01");
    db.prepare(
      "INSERT INTO habits (name, emoji, sort_order, created_at) VALUES (?, ?, ?, ?)"
    ).run("Exercise", "🏃", 2, "2020-01-01");

    habitId1 = db.prepare("SELECT id FROM habits WHERE name = 'Sleep enough'").get().id;
    habitId2 = db.prepare("SELECT id FROM habits WHERE name = 'Exercise'").get().id;
  });

  afterEach(() => {
    delete process.env.APP_URL;
  });

  it("returns a string containing the date header", async () => {
    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("2024-01-15");
  });

  it("contains each habit name", async () => {
    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("Sleep enough");
    expect(msg).toContain("Exercise");
  });

  it("uses 🌱 emoji for Pass status", async () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId1, AS_OF_DATE, "pass", 1);

    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("🌱 Sleep enough: Pass");
  });

  it("uses 🔴 emoji for Fail status", async () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId1, AS_OF_DATE, "fail", 1);

    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("🔴 Sleep enough: Fail");
  });

  it("uses 🟡 emoji for Skip status", async () => {
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId1, AS_OF_DATE, "skip", 1);

    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("🟡 Sleep enough: Skip");
  });

  it("uses ⚪ emoji for Pending status when no entry row exists", async () => {
    // habitId1 has no entry for AS_OF_DATE — should be Pending
    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("⚪ Sleep enough: Pending");
  });

  it("lists habits in sort_order order", async () => {
    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    const pos1 = msg.indexOf("Sleep enough");
    const pos2 = msg.indexOf("Exercise");
    expect(pos1).toBeGreaterThanOrEqual(0);
    expect(pos2).toBeGreaterThanOrEqual(0);
    expect(pos1).toBeLessThan(pos2);
  });

  it("includes the correct streak count for a habit with 3 consecutive passes", async () => {
    // 3 consecutive passes ending on AS_OF_DATE
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId1, "2024-01-13", "pass", 1);
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId1, "2024-01-14", "pass", 1);
    db.prepare(
      "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
    ).run(habitId1, AS_OF_DATE, "pass", 1);

    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("Sleep enough: Pass (streak: 3)");
  });

  it("includes APP_URL from process.env.APP_URL in the message", async () => {
    process.env.APP_URL = "http://test-host:9999";
    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("http://test-host:9999");
  });

  it("defaults to http://localhost:3000 when APP_URL env var is not set", async () => {
    delete process.env.APP_URL;
    const msg = await buildNotificationMessage(db, AS_OF_DATE);
    expect(msg).toContain("http://localhost:3000");
  });

  it("returns a message containing 'No habits configured.' when no habits exist", async () => {
    const emptyDb = new Database(":memory:");
    emptyDb.pragma("foreign_keys = ON");
    runMigrations(emptyDb);

    const msg = await buildNotificationMessage(emptyDb, AS_OF_DATE);
    expect(msg).toContain("No habits configured.");
  });
});

describe("sendNotification", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls fetch with the correct URL and body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const message = "Test notification message";
    const ntfyUrl = "http://ntfy.sh/test-topic";

    await sendNotification(message, ntfyUrl);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      ntfyUrl,
      expect.objectContaining({
        method: "POST",
        body: message,
      })
    );
  });
});
