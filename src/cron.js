import cron from 'node-cron';
import db from './db/index.js';
import { localToday, addDays } from './utils/date.js';
import { runDailyJob } from './jobs/dailyJob.js';
import {
  buildNotificationMessage,
  buildEveningMessage,
  sendNotification,
} from './jobs/notify.js';

function getNtfyUrl() {
  const url = process.env.NTFY_URL;
  if (!url) console.warn('NTFY_URL is not set — skipping notification');
  return url ?? null;
}

// Midnight: lock pending entries/moods that are now outside the grace window
const taskMidnight = cron.schedule('0 0 0 * * *', () => {
  runDailyJob(db, localToday());
});

// 8am: send yesterday's habit status with check-in link
const task8am = cron.schedule('0 0 8 * * *', async () => {
  const ntfyUrl = getNtfyUrl();
  if (!ntfyUrl) return;
  const yesterday = addDays(localToday(), -1);
  await sendNotification(await buildNotificationMessage(db, yesterday), ntfyUrl);
});

// 9pm: evening reminder — reports today's current status
const task9pm = cron.schedule('0 0 21 * * *', async () => {
  const ntfyUrl = getNtfyUrl();
  if (!ntfyUrl) return;
  await sendNotification(await buildEveningMessage(db, localToday()), ntfyUrl);
});

export { taskMidnight, task8am, task9pm };
