# Market research

Researched 2026-07-31. Verdict: not viable as a product. This stays a personal app.

Self-hosting is an implementation detail of it being personal, not a positioning. It is not treated as a differentiator below.

## Verdict

The habit tracker category is saturated, every feature in this app already ships in an established competitor, and the discovery channel that determines revenue in this category is one this app is not in.

## Feature overlap

Nothing here is unclaimed.

| Feature | Already shipped by |
|---|---|
| Done / Skip / Fail three-state | Loop Habit Tracker (done / missed / skipped) |
| Streak counter, dark card-per-habit layout | Streaks, Habitify, HabitKit |
| Year calendar grid per habit | HabitKit, whose grid is its entire visual identity |
| 5-point emoji mood scale | Daylio (five mood faces, tags, save) |
| Habits and mood in one logging flow | Daylio, Bearable |
| Cap on number of habits | Productive caps at 5, Habitify at 3, Streaks at 12 |
| Self-hosted habits, SQLite, Docker | Beaverhabits (1.8k GitHub stars), HabitTrove, Habitica |
| Scheduled reminders | Universal |

Nearest single competitor: Beaverhabits. Self-hosted, SQLite, Docker, streaks, calendar view, no goals, plus an API with Home Assistant and Apple Shortcuts integrations. It has no mood tracking. That gap is the only thing this app holds alone, and it is not worth a product on its own.

Visual comparison: the dark, card-per-habit, one-big-number layout is closest to HabitKit and Streaks. Occupied territory.

## Design choices that do not travel

- **Grace window with auto-fail at midnight.** The category is moving the other way. Loop replaced streaks with a decaying habit strength score to avoid punitive resets; others ship pause states and not-applicable days. Punitive design suits a single committed user and drives churn in a paying audience.
- **5-habit cap.** Correct for one user, a paywall trigger everywhere else.
- **ntfy dependency.** Requires the user to already run or understand ntfy.

## Commercial ceiling

HabitKit is the benchmark for a solo developer in this exact niche. Native iOS and Android, building in public since 2023, reported revenue in the $15k/mo range with January peaks near $30-40k. It took until 2025 to reach the top 5 for the App Store keyword "habit tracker" in the US, and its developer states that keyword rank is the thing that drives the business.

Structural facts:

- Roughly 94% of habit tracker revenue flows through the Apple and Google stores, at a 15-30% cut.
- This is a web app, so it is outside that channel entirely.
- Apple and Google are both adding native habit and goal tracking at the OS level, compressing the floor under standalone apps.

The only paths to revenue would be a native rebuild plus a multi-year ASO and marketing commitment, or an open-core hosted tier around $3/mo. The second addresses people who want self-hosting and will not self-host, which is a small market.

## Sources

- https://github.com/daya0576/beaverhabits
- https://www.indiehackers.com/post/tech/how-building-in-public-got-my-habit-tracking-mobile-app-to-15k-mo-DCOYyF9O14dBnuGkkaQR
- https://www.revenuecat.com/blog/growth/sebastian-rohl-habitkit-launched-podcast-2026
- https://dataintelo.com/report/habit-tracker-app-market
- https://bearable.app/bearable-vs-daylio-which-one-should-you-choose/
- https://goalsandprogress.com/habit-tracker-trigger-action-reward-two-day-rule/
- https://zapier.com/blog/best-habit-tracker-app/
- https://medevel.com/17-habit-tracker/
