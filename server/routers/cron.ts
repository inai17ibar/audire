/**
 * Cron job management API
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getCronJobsStatus, runJobNow } from "../cron/scheduler";

export const cronRouter = router({
  // Get status of all cron jobs
  getStatus: publicProcedure.query(() => {
    return getCronJobsStatus();
  }),

  // Run a specific job immediately
  runNow: publicProcedure
    .input(z.object({ jobName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await runJobNow(input.jobName);
        return {
          success: true,
          message: `Job "${input.jobName}" completed successfully`,
          ...result,
        };
      } catch (error) {
        console.error(`Failed to run job "${input.jobName}":`, error);
        throw new Error(`Failed to run job: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
