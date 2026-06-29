import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";

// This import will fail until src/routes/mood.js is implemented — that is expected.
import moodRouter from "../src/routes/mood.js";

/**
 * Creates a fresh Express app with the mood router mounted.
 * The router is expected to be a factory function that accepts a db instance
 * so tests can inject their own isolated in-memory database.
 */
function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use("/api/mood", moodRouter(db));
  return app;
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

describe("Mood API", () => {
  let db;
  let app;
  const today = dateOffset(0);
  const yesterday = dateOffset(-1);
  const twoDaysAgo = dateOffset(-2);

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    app = createApp(db);
  });

  // ── GET /api/mood ─────────────────────────────────────────────────────────────

  describe("GET /api/mood", () => {
    it("returns empty array when no moods exist for the month", async () => {
      const res = await request(app).get("/api/mood?month=2024-01");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns only moods for the requested month", async () => {
      db.prepare("INSERT INTO daily_mood (date, rating) VALUES (?, ?)").run("2024-01-10", 3);
      db.prepare("INSERT INTO daily_mood (date, rating) VALUES (?, ?)").run("2024-01-20", 2);
      db.prepare("INSERT INTO daily_mood (date, rating) VALUES (?, ?)").run("2024-02-05", 4);

      const res = await request(app).get("/api/mood?month=2024-01");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const dates = res.body.map((m) => m.date);
      expect(dates).toContain("2024-01-10");
      expect(dates).toContain("2024-01-20");
      expect(dates).not.toContain("2024-02-05");
    });
  });

  // ── POST /api/mood ────────────────────────────────────────────────────────────

  describe("POST /api/mood", () => {
    it("creates a mood entry and returns { date, rating, locked: false }", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: today, rating: 3 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ date: today, rating: 3, locked: false });
    });

    it("returns 400 when rating=0", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: today, rating: 0 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when rating=6", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: today, rating: 6 });
      expect(res.status).toBe(400);
    });

    it("returns 200 with correct shape when rating=3", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: today, rating: 3 });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("date");
      expect(res.body).toHaveProperty("rating", 3);
      expect(res.body).toHaveProperty("locked");
    });

    it("upserts: second POST for same date overwrites the rating", async () => {
      await request(app).post("/api/mood").send({ date: today, rating: 2 });
      const res = await request(app).post("/api/mood").send({ date: today, rating: 4 });
      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(4);

      const row = db
        .prepare("SELECT COUNT(*) as cnt FROM daily_mood WHERE date = ?")
        .get(today);
      expect(row.cnt).toBe(1);
    });

    it("returns 409 when the day is explicitly locked in the database", async () => {
      db.prepare(
        "INSERT INTO daily_mood (date, rating, locked) VALUES (?, ?, ?)"
      ).run(yesterday, 3, 1);
      const res = await request(app)
        .post("/api/mood")
        .send({ date: yesterday, rating: 2 });
      expect(res.status).toBe(409);
    });

    it("accepts posting a mood for today (within grace window)", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: today, rating: 2 });
      expect(res.status).toBe(200);
    });

    it("accepts posting a mood for yesterday (within grace window)", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: yesterday, rating: 4 });
      expect(res.status).toBe(200);
    });

    it("returns 409 for a date 2 days ago (outside grace window)", async () => {
      const res = await request(app)
        .post("/api/mood")
        .send({ date: twoDaysAgo, rating: 3 });
      expect(res.status).toBe(409);
    });
  });
});
