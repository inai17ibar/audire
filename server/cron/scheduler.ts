/**
 * Cron job scheduler
 * Manages scheduled tasks for the application
 */

import cron from "node-cron";
import { fetchAndStoreArticles } from "./fetch-articles";

interface CronJobConfig {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  enabled: boolean;
}

const jobs: CronJobConfig[] = [
  {
    name: "Fetch and Store Articles",
    schedule: "0 */6 * * *", // Every 6 hours at minute 0
    task: fetchAndStoreArticles,
    enabled: true,
  },
];

let scheduledTasks: cron.ScheduledTask[] = [];

/**
 * Start all enabled cron jobs
 */
export function startCronJobs() {
  console.log("=== Starting Cron Jobs ===");
  
  for (const job of jobs) {
    if (!job.enabled) {
      console.log(`[CRON] Skipping disabled job: ${job.name}`);
      continue;
    }
    
    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      console.error(`[CRON] Invalid schedule for ${job.name}: ${job.schedule}`);
      continue;
    }
    
    // Schedule the job
    const scheduledTask = cron.schedule(job.schedule, async () => {
      console.log(`[CRON] Running job: ${job.name}`);
      const startTime = Date.now();
      
      try {
        await job.task();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[CRON] Job completed: ${job.name} (${duration}s)`);
      } catch (error) {
        console.error(`[CRON] Job failed: ${job.name}`, error);
      }
    });
    
    scheduledTasks.push(scheduledTask);
    console.log(`[CRON] Scheduled: ${job.name} (${job.schedule})`);
  }
  
  console.log(`=== ${scheduledTasks.length} Cron Jobs Started ===`);
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs() {
  console.log("=== Stopping Cron Jobs ===");
  
  for (const task of scheduledTasks) {
    task.stop();
  }
  
  scheduledTasks = [];
  console.log("=== All Cron Jobs Stopped ===");
}

/**
 * Get status of all cron jobs
 */
export function getCronJobsStatus() {
  return jobs.map((job, index) => ({
    name: job.name,
    schedule: job.schedule,
    enabled: job.enabled,
    running: index < scheduledTasks.length,
  }));
}

/**
 * Run a specific job immediately (for testing)
 */
export async function runJobNow(jobName: string) {
  const job = jobs.find((j) => j.name === jobName);
  
  if (!job) {
    throw new Error(`Job not found: ${jobName}`);
  }
  
  console.log(`[CRON] Running job immediately: ${jobName}`);
  const startTime = Date.now();
  
  try {
    await job.task();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[CRON] Job completed: ${jobName} (${duration}s)`);
    return { success: true, duration };
  } catch (error) {
    console.error(`[CRON] Job failed: ${jobName}`, error);
    throw error;
  }
}
