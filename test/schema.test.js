import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";

// This import will fail until src/db/migrations.js is implemented — that is expected.
import { runMigrations } from "../src/db/migrations.js";

/** Helper: return the list of column names for a given table. */
function getColumns(db, tableName) {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return rows.map((r) => r.name);
}

/** Helper: return true when a table exists in the schema. */
function tableExists(db, tableName) {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    )
    .get(tableName);
  return row !== undefined;
}

describe("runMigrations", () => {
  let db;

  beforeEach(() => {
    // Fresh in-memory database for every test — fully isolated.
    db = new Database(":memory:");
  });

  it("runs without throwing on a fresh database", () => {
    expect(() => runMigrations(db)).not.toThrow();
  });

  it("is idempotent — running twice does not throw", () => {
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();
  });

  // ── habits table ──────────────────────────────────────────────────────────

  describe("habits table", () => {
    beforeEach(() => runMigrations(db));

    it("exists after migrations", () => {
      expect(tableExists(db, "habits")).toBe(true);
    });

    it("has column: id", () => {
      expect(getColumns(db, "habits")).toContain("id");
    });

    it("has column: name", () => {
      expect(getColumns(db, "habits")).toContain("name");
    });

    it("has column: emoji", () => {
      expect(getColumns(db, "habits")).toContain("emoji");
    });

    it("has column: sort_order", () => {
      expect(getColumns(db, "habits")).toContain("sort_order");
    });

    it("has column: created_at", () => {
      expect(getColumns(db, "habits")).toContain("created_at");
    });
  });

  // ── entries table ─────────────────────────────────────────────────────────

  describe("entries table", () => {
    beforeEach(() => runMigrations(db));

    it("exists after migrations", () => {
      expect(tableExists(db, "entries")).toBe(true);
    });

    it("has column: id", () => {
      expect(getColumns(db, "entries")).toContain("id");
    });

    it("has column: habit_id", () => {
      expect(getColumns(db, "entries")).toContain("habit_id");
    });

    it("has column: date", () => {
      expect(getColumns(db, "entries")).toContain("date");
    });

    it("has column: status", () => {
      expect(getColumns(db, "entries")).toContain("status");
    });

    it("has column: explicit", () => {
      expect(getColumns(db, "entries")).toContain("explicit");
    });

    it("has column: updated_at", () => {
      expect(getColumns(db, "entries")).toContain("updated_at");
    });

    it("accepts valid status value 'pass'", () => {
      runMigrations(db);
      // First insert a habit to satisfy any foreign key constraint.
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES ('Test', '✅', 1)"
      ).run();
      const habitId = db.prepare("SELECT id FROM habits LIMIT 1").get().id;
      expect(() =>
        db
          .prepare(
            "INSERT INTO entries (habit_id, date, status) VALUES (?, '2024-01-01', 'pass')"
          )
          .run(habitId)
      ).not.toThrow();
    });

    it("rejects invalid status value via CHECK constraint", () => {
      runMigrations(db);
      db.prepare(
        "INSERT INTO habits (name, emoji, sort_order) VALUES ('Test', '✅', 1)"
      ).run();
      const habitId = db.prepare("SELECT id FROM habits LIMIT 1").get().id;
      expect(() =>
        db
          .prepare(
            "INSERT INTO entries (habit_id, date, status) VALUES (?, '2024-01-02', 'invalid_status')"
          )
          .run(habitId)
      ).toThrow();
    });

    it.each(["pass", "skip", "fail", "pending"])(
      "accepts status='%s'",
      (status) => {
        runMigrations(db);
        db.prepare(
          "INSERT INTO habits (name, emoji, sort_order) VALUES ('H', '🔥', 1)"
        ).run();
        const habitId = db.prepare("SELECT id FROM habits LIMIT 1").get().id;
        expect(() =>
          db
            .prepare(
              `INSERT INTO entries (habit_id, date, status) VALUES (?, '2024-01-0${Math.random().toString().slice(2, 3) || 1}', ?)`
            )
            .run(habitId, status)
        ).not.toThrow();
      }
    );
  });

  // ── daily_mood table ──────────────────────────────────────────────────────

  describe("daily_mood table", () => {
    beforeEach(() => runMigrations(db));

    it("exists after migrations", () => {
      expect(tableExists(db, "daily_mood")).toBe(true);
    });

    it("has column: id", () => {
      expect(getColumns(db, "daily_mood")).toContain("id");
    });

    it("has column: date", () => {
      expect(getColumns(db, "daily_mood")).toContain("date");
    });

    it("has column: rating", () => {
      expect(getColumns(db, "daily_mood")).toContain("rating");
    });

    it("has column: locked", () => {
      expect(getColumns(db, "daily_mood")).toContain("locked");
    });

    it("has column: updated_at", () => {
      expect(getColumns(db, "daily_mood")).toContain("updated_at");
    });

    it("accepts rating=1 (minimum valid value)", () => {
      expect(() =>
        db
          .prepare("INSERT INTO daily_mood (date, rating) VALUES ('2024-01-01', 1)")
          .run()
      ).not.toThrow();
    });

    it("accepts rating=5 (maximum valid value)", () => {
      expect(() =>
        db
          .prepare("INSERT INTO daily_mood (date, rating) VALUES ('2024-01-02', 5)")
          .run()
      ).not.toThrow();
    });

    it("rejects rating=6 via CHECK constraint", () => {
      expect(() =>
        db
          .prepare("INSERT INTO daily_mood (date, rating) VALUES ('2024-01-03', 6)")
          .run()
      ).toThrow();
    });

    it("rejects rating=0 via CHECK constraint", () => {
      expect(() =>
        db
          .prepare("INSERT INTO daily_mood (date, rating) VALUES ('2024-01-04', 0)")
          .run()
      ).toThrow();
    });
  });
});
