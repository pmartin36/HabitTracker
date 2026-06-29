import cron from 'node-cron';
import db from './db/index.js';
import { localToday, addDays } from './utils/date.js';
import { runDailyJob } from './jobs/dailyJob.js';
import { buildNotificationMessage, sendNotification } from './jobs/notify.js';

// Schedule at 8:30am daily (second, minute, hour, day, month, weekday)
const task = cron.schedule('0 30 8 * * *', async () => {
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

export default task;
