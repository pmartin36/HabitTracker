import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";

// This import will fail until src/routes/entries.js is implemented — that is expected.
import entriesRouter from "../src/routes/entries.js";

/**
 * Creates a fresh Express app with the entries router mounted.
 * The router is expected to be a factory function that accepts a db instance
 * so tests can inject their own isolated in-memory database.
 */
function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use("/api/entries", entriesRouter(db));
  return app;
}

describe("Entries API", () => {
  let db;
  let app;
  let habitId;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    app = createApp(db);

    // Insert a test habit with a known old created_at so streak computation
    // correctly walks back through the test entry dates (2024-01-xx).
    db.prepare(
      "INSERT INTO habits (name, emoji, sort_order, created_at) VALUES (?, ?, ?, ?)"
    ).run("Test Habit", "✅", 1, "2020-01-01");
    habitId = db.prepare("SELECT id FROM habits LIMIT 1").get().id;
  });

  // ── POST /api/entries ────────────────────────────────────────────────────────

  describe("POST /api/entries", () => {
    it("returns 200 with {entry, streak} on a valid check-in", async () => {
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("entry");
      expect(res.body).toHaveProperty("streak");
    });

    it("entry in response contains the expected fields", async () => {
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      expect(res.body.entry).toMatchObject({
        habit_id: habitId,
        date: "2024-01-01",
        status: "pass",
      });
      expect(res.body.entry).toHaveProperty("id");
    });

    it("upserts when called twice for the same (habit_id, date)", async () => {
      await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "fail" });

      expect(res.status).toBe(200);
      expect(res.body.entry.status).toBe("fail");
    });

    it("upsert does not create a duplicate row", async () => {
      await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "skip" });

      const { cnt } = db
        .prepare(
          "SELECT COUNT(*) as cnt FROM entries WHERE habit_id = ? AND date = ?"
        )
        .get(habitId, "2024-01-01");
      expect(cnt).toBe(1);
    });

    it("sets explicit=true (1) on the upserted entry", async () => {
      await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      const row = db
        .prepare(
          "SELECT explicit FROM entries WHERE habit_id = ? AND date = ?"
        )
        .get(habitId, "2024-01-01");
      expect(row.explicit).toBe(1);
    });

    it("returned streak is an integer reflecting the new state", async () => {
      // After a single pass the streak should be at least 1.
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      expect(typeof res.body.streak).toBe("number");
      expect(res.body.streak).toBeGreaterThanOrEqual(1);
    });

    it("streak grows as consecutive passes are recorded", async () => {
      await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pass" });
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-02", status: "pass" });
      expect(res.body.streak).toBe(2);
    });

    it("returns 400 if status is 'pending' (system-only status)", async () => {
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "pending" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for an unrecognised status value", async () => {
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01", status: "invalid" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when status is missing from the request body", async () => {
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: habitId, date: "2024-01-01" });
      expect(res.status).toBe(400);
    });

    it("returns 404 if habit_id does not exist", async () => {
      const res = await request(app)
        .post("/api/entries")
        .send({ habit_id: 9999, date: "2024-01-01", status: "pass" });
      expect(res.status).toBe(404);
    });

    it.each(["pass", "skip", "fail"])(
      "accepts valid status='%s'",
      async (status) => {
        const res = await request(app)
          .post("/api/entries")
          .send({ habit_id: habitId, date: "2024-01-01", status });
        expect(res.status).toBe(200);
      }
    );
  });

  // ── GET /api/entries?month=YYYY-MM (all habits) ──────────────────────────────

  describe("GET /api/entries?month=YYYY-MM (all habits)", () => {
    it("returns all entries for that month across all habits", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order, created_at) VALUES (?, ?, ?, ?)"
      ).run("Other Habit", "🔲", 2, "2020-01-01");
      const otherId = db
        .prepare("SELECT id FROM habits WHERE name = 'Other Habit'")
        .get().id;

      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-03-05", "pass", 1);
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(otherId, "2024-03-10", "skip", 1);

      const res = await request(app).get("/api/entries?month=2024-03");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("returns empty array when no entries exist for that month", async () => {
      const res = await request(app).get("/api/entries?month=2024-06");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── GET /api/entries/:habit_id ────────────────────────────────────────────────

  describe("GET /api/entries/:habit_id?month=YYYY-MM", () => {
    it("returns 200 with all entries for the habit in the given month", async () => {
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-03-05", "pass", 1);
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-03-10", "skip", 1);

      const res = await request(app).get(`/api/entries/${habitId}?month=2024-03`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("returned entries have the correct dates", async () => {
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-03-05", "pass", 1);
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-03-10", "skip", 1);

      const res = await request(app).get(`/api/entries/${habitId}?month=2024-03`);
      const dates = res.body.map((e) => e.date);
      expect(dates).toContain("2024-03-05");
      expect(dates).toContain("2024-03-10");
    });

    it("does not include entries from other months", async () => {
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-03-15", "pass", 1);
      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(habitId, "2024-04-01", "fail", 1);

      const res = await request(app).get(`/api/entries/${habitId}?month=2024-03`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].date).toBe("2024-03-15");
    });

    it("returns an empty array when no entries exist for that month", async () => {
      const res = await request(app).get(`/api/entries/${habitId}?month=2024-06`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("does not include entries for a different habit_id in the same month", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order, created_at) VALUES (?, ?, ?, ?)"
      ).run("Other Habit", "🔲", 2, "2020-01-01");
      const otherId = db
        .prepare("SELECT id FROM habits WHERE name = 'Other Habit'")
        .get().id;

      db.prepare(
        "INSERT INTO entries (habit_id, date, status, explicit) VALUES (?, ?, ?, ?)"
      ).run(otherId, "2024-03-07", "pass", 1);

      const res = await request(app).get(`/api/entries/${habitId}?month=2024-03`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });
});
