import Database from "better-sqlite3";
import { runMigrations } from "./migrations.js";

const DB_PATH = process.env.DB_PATH ?? "./habits.db";

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
runMigrations(db);

export default db;
