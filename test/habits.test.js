import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";

// This import will fail until src/routes/habits.js is implemented — that is expected.
import habitsRouter from "../src/routes/habits.js";

/**
 * Creates a fresh Express app with the habits router mounted.
 * The router is expected to be a factory function that accepts a db instance
 * so tests can inject their own isolated in-memory database.
 */
function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use("/api/habits", habitsRouter(db));
  return app;
}

describe("Habits API", () => {
  let db;
  let app;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    app = createApp(db);
  });

  // ── GET /api/habits ──────────────────────────────────────────────────────────

  describe("GET /api/habits", () => {
    it("returns 200 with an empty array when no habits exist", async () => {
      const res = await request(app).get("/api/habits");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns habits ordered by sort_order ascending", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Sleep", "😴", 2);
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Exercise", "🏃", 1);

      const res = await request(app).get("/api/habits");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("Exercise");
      expect(res.body[1].name).toBe("Sleep");
    });

    it("returns habits with all expected fields", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Read", "📚", 1);

      const res = await request(app).get("/api/habits");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ name: "Read", emoji: "📚", sort_order: 1 });
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("created_at");
    });
  });

  // ── POST /api/habits ─────────────────────────────────────────────────────────

  describe("POST /api/habits", () => {
    it("creates a habit and returns 201 with the created habit", async () => {
      const res = await request(app)
        .post("/api/habits")
        .send({ name: "Meditate", emoji: "🧘" });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: "Meditate", emoji: "🧘" });
      expect(res.body).toHaveProperty("id");
    });

    it("persists the created habit to the database", async () => {
      await request(app)
        .post("/api/habits")
        .send({ name: "Journal", emoji: "📓" });
      const row = db.prepare("SELECT * FROM habits WHERE name = 'Journal'").get();
      expect(row).toBeDefined();
    });

    it("returns 400 if name is missing", async () => {
      const res = await request(app)
        .post("/api/habits")
        .send({ emoji: "🧘" });
      expect(res.status).toBe(400);
    });

    it("returns 400 if name is an empty string", async () => {
      const res = await request(app)
        .post("/api/habits")
        .send({ name: "", emoji: "🧘" });
      expect(res.status).toBe(400);
    });

    it("returns 409 if 5 habits already exist", async () => {
      for (let i = 1; i <= 5; i++) {
        db.prepare(
          "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
        ).run(`Habit ${i}`, "✅", i);
      }
      const res = await request(app)
        .post("/api/habits")
        .send({ name: "Sixth habit", emoji: "❌" });
      expect(res.status).toBe(409);
    });

    it("allows creating the fifth habit (boundary: exactly 4 existing)", async () => {
      for (let i = 1; i <= 4; i++) {
        db.prepare(
          "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
        ).run(`Habit ${i}`, "✅", i);
      }
      const res = await request(app)
        .post("/api/habits")
        .send({ name: "Fifth habit", emoji: "5️⃣" });
      expect(res.status).toBe(201);
    });
  });

  // ── PATCH /api/habits/:id ────────────────────────────────────────────────────

  describe("PATCH /api/habits/:id", () => {
    it("updates name and returns 200 with the updated habit", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Old Name", "🔥", 1);
      const { id } = db.prepare("SELECT id FROM habits LIMIT 1").get();

      const res = await request(app)
        .patch(`/api/habits/${id}`)
        .send({ name: "New Name" });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id, name: "New Name" });
    });

    it("updates emoji and returns 200 with the updated habit", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Exercise", "🏃", 1);
      const { id } = db.prepare("SELECT id FROM habits LIMIT 1").get();

      const res = await request(app)
        .patch(`/api/habits/${id}`)
        .send({ emoji: "💪" });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id, emoji: "💪" });
    });

    it("persists the updated fields to the database", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Old", "🔥", 1);
      const { id } = db.prepare("SELECT id FROM habits LIMIT 1").get();

      await request(app)
        .patch(`/api/habits/${id}`)
        .send({ name: "Updated", emoji: "⭐" });

      const row = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
      expect(row.name).toBe("Updated");
      expect(row.emoji).toBe("⭐");
    });

    it("returns 404 for an unknown id", async () => {
      const res = await request(app)
        .patch("/api/habits/9999")
        .send({ name: "Ghost" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/habits/:id ───────────────────────────────────────────────────

  describe("DELETE /api/habits/:id", () => {
    it("deletes a habit and returns 204", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("To Delete", "🗑️", 1);
      const { id } = db.prepare("SELECT id FROM habits LIMIT 1").get();

      const res = await request(app).delete(`/api/habits/${id}`);
      expect(res.status).toBe(204);
    });

    it("removes the row from the database", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Gone", "👻", 1);
      const { id } = db.prepare("SELECT id FROM habits LIMIT 1").get();

      await request(app).delete(`/api/habits/${id}`);
      const row = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
      expect(row).toBeUndefined();
    });

    it("returns 404 for an unknown id", async () => {
      const res = await request(app).delete("/api/habits/9999");
      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/habits/reorder ────────────────────────────────────────────────

  describe("PATCH /api/habits/reorder", () => {
    it("updates sort_order for multiple habits and returns 200", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Habit A", "🅰️", 1);
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Habit B", "🅱️", 2);
      const [a, b] = db.prepare("SELECT id FROM habits ORDER BY sort_order").all();

      const res = await request(app)
        .patch("/api/habits/reorder")
        .send([
          { id: a.id, sort_order: 2 },
          { id: b.id, sort_order: 1 },
        ]);
      expect(res.status).toBe(200);
    });

    it("persists new sort_orders atomically to the database", async () => {
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("First", "1️⃣", 1);
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES (?, ?, ?)"
      ).run("Second", "2️⃣", 2);
      const [a, b] = db.prepare("SELECT id FROM habits ORDER BY sort_order").all();

      await request(app)
        .patch("/api/habits/reorder")
        .send([
          { id: a.id, sort_order: 2 },
          { id: b.id, sort_order: 1 },
        ]);

      const updatedA = db.prepare("SELECT sort_order FROM habits WHERE id = ?").get(a.id);
      const updatedB = db.prepare("SELECT sort_order FROM habits WHERE id = ?").get(b.id);
      expect(updatedA.sort_order).toBe(2);
      expect(updatedB.sort_order).toBe(1);
    });
  });
});
