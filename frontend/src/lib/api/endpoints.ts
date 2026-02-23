/** API endpoints barrel re-export. */
import { uploadEndpoints } from "./upload";
import { jobsEndpoints } from "./jobs";
import { sessionsEndpoints } from "./sessions";
import { overviewEndpoints } from "./overview";
import { labelingEndpoints } from "./labeling";
import { leaderboardEndpoints, fetchMyScore } from "./leaderboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const endpoints = {
  upload: uploadEndpoints,
  jobs: jobsEndpoints,
  overview: overviewEndpoints,
  sessions: sessionsEndpoints,
  labeling: labelingEndpoints,
  leaderboard: leaderboardEndpoints.list,
  achievements: {
    list: `${API_BASE}/achievements`,
    me: `${API_BASE}/achievements/me`,
    unlock: `${API_BASE}/achievements/unlock`,
  },
} as const;

export {
  uploadEndpoints,
  jobsEndpoints,
  sessionsEndpoints,
  overviewEndpoints,
  labelingEndpoints,
  leaderboardEndpoints,
  fetchMyScore,
};
