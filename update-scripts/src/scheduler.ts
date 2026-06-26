/**
 * Entry point: runs the full update once at startup and every day at 03:00.
 * Flags: --no-push (don't push data to git), --debug (tiny test run, implies no push).
 */
import schedule from 'node-schedule';

import { DEBUG, SKIP_PUSH } from './config.ts';
import { runUpdateJob } from './update-job.ts';

const job = () => runUpdateJob({ skipPush: SKIP_PUSH, debug: DEBUG });

console.log('Starting scheduler', { DEBUG });
schedule.scheduleJob('0 3 * * *', job);
void job();
