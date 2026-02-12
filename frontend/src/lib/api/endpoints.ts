// Backward-compatible re-exports. New code should import from domain modules.
import { uploadEndpoints } from "./upload";
import { jobsEndpoints } from "./jobs";
import { sessionsEndpoints } from "./sessions";
import { overviewEndpoints } from "./overview";
import { labelingEndpoints } from "./labeling";
import { leaderboardEndpoints } from "./leaderboard";

export const endpoints = {
  upload: uploadEndpoints,
  jobs: jobsEndpoints,
  overview: overviewEndpoints,
  sessions: sessionsEndpoints,
  labeling: labelingEndpoints,
  leaderboard: leaderboardEndpoints.list,
} as const;

export { uploadEndpoints, jobsEndpoints, sessionsEndpoints, overviewEndpoints, labelingEndpoints, leaderboardEndpoints };
