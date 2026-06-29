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

// 8am: conditional grace-window warning — fires only if yesterday has pending habits
const task8am = cron.schedule('0 0 8 * * *', async () => {
  const today = localToday();
  const yesterday = addDays(today, -1);

  const ntfyUrl = process.env.NTFY_URL;
  if (!ntfyUrl) {
    console.warn('NTFY_URL is not set — skipping notification');
    return;
  }

  const message = await buildGraceWarningMessage(db, yesterday);
  if (message !== null) {
    await sendNotification(message, ntfyUrl);
  }
});

// 8:30am: run daily grace-locking job then send yesterday's full summary
const task830am = cron.schedule('0 30 8 * * *', async () => {
  const today = localToday();
  const yesterday = addDays(today, -1);

  runDailyJob(db, today);

  const ntfyUrl = process.env.NTFY_URL;
  if (!ntfyUrl) {
    console.warn('NTFY_URL is not set — skipping notification');
    return;
  }

  const message = await buildNotificationMessage(db, yesterday);
  await sendNotification(message, ntfyUrl);
});

// 9pm: evening reminder — always fires, reports today's habits
const task9pm = cron.schedule('0 0 21 * * *', async () => {
  const today = localToday();

  const ntfyUrl = process.env.NTFY_URL;
  if (!ntfyUrl) {
    console.warn('NTFY_URL is not set — skipping notification');
    return;
  }

  const message = await buildEveningMessage(db, today);
  await sendNotification(message, ntfyUrl);
});

export { task8am, task830am, task9pm };
export default task830am;
