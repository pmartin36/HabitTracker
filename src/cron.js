import cron from 'node-cron';
import db from './db/index.js';
import { localToday, addDays } from './utils/date.js';
import { runDailyJob } from './jobs/dailyJob.js';
import {
  buildNotificationMessage,
  buildGraceWarningMessage,
  buildEveningMessage,
  sendNotification,
} from './jobs/notify.js';

function getNtfyUrl() {
  const url = process.env.NTFY_URL;
  if (!url) console.warn('NTFY_URL is not set — skipping notification');
  return url ?? null;
}

// 8am: conditional grace-window warning — fires only if yesterday has pending habits
const task8am = cron.schedule('0 0 8 * * *', async () => {
  const ntfyUrl = getNtfyUrl();
  if (!ntfyUrl) return;
  const yesterday = addDays(localToday(), -1);
  await sendNotification(await buildGraceWarningMessage(db, yesterday), ntfyUrl);
});

// 8:30am: run daily grace-locking job then send yesterday's full summary
const task830am = cron.schedule('0 30 8 * * *', async () => {
  const today = localToday();
  runDailyJob(db, today);
  const ntfyUrl = getNtfyUrl();
  if (!ntfyUrl) return;
  await sendNotification(await buildNotificationMessage(db, addDays(today, -1)), ntfyUrl);
});

// 9pm: evening reminder — always fires, reports today's habits
const task9pm = cron.schedule('0 0 21 * * *', async () => {
  const ntfyUrl = getNtfyUrl();
  if (!ntfyUrl) return;
  await sendNotification(await buildEveningMessage(db, localToday()), ntfyUrl);
});

export { task8am, task830am, task9pm };
