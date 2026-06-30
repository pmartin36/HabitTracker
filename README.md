# Habit Tracker

Self-hosted habit streak tracker. Runs on a Raspberry Pi 4, accessed over Tailscale.

## Running the app

```sh
npm install
npm start
```

`npm start` runs `node src/server.js`. Use `npm run dev` for auto-reload during development.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `./habits.db` | Path to the SQLite database file. Set to a persistent location on the Pi, e.g. `/home/pi/data/habits.db` |
| `APP_URL` | `http://localhost:3000` | The URL shown in notifications. Set to your Tailscale URL, e.g. `http://pi.hostname:3000` |
| `NTFY_URL` | *(unset)* | Your ntfy.sh topic URL, e.g. `https://ntfy.sh/your-private-topic-name`. If unset, notifications are skipped |

## Cron / notifications

The app uses `node-cron` internally — no system cron setup needed. Three jobs run daily:

- **Midnight** — Locks pending entries/moods outside the grace window (anything older than yesterday becomes fail)
- **8:00 am** — Sends yesterday's habit status with a link to the check-in modal
- **9:00 pm** — Evening check-in showing today's current status

Notifications are sent via [ntfy.sh](https://ntfy.sh). Pick a hard-to-guess topic name — topics are public by obscurity on the ntfy.sh public server.

## Pi setup

```sh
git clone <repo>
cd HabitTracker
npm install
export DB_PATH=/home/pi/data/habits.db
export APP_URL=http://pi.hostname:3000
export NTFY_URL=https://ntfy.sh/your-private-topic-name
npm start
```

To keep it running after logout:

```sh
pm2 start npm -- start
pm2 save
```

Or write a systemd service. Access the app at `http://<tailscale-hostname>:3000`.

## Backups

The SQLite file (set via `DB_PATH`) is the only thing to back up.

```sh
# Simple one-off copy
cp $DB_PATH $DB_PATH.bak

# Or rsync to another device on a schedule
rsync -av $DB_PATH user@backup-host:/backups/habits.db
```
