/** API 엔드포인트 barrel re-export — 모든 도메인 API를 endpoints 객체로 통합. */
// Backward-compatible re-exports. New code should import from domain modules.
import { uploadEndpoints } from "./upload";
import { jobsEndpoints } from "./jobs";
import { sessionsEndpoints } from "./sessions";
import { overviewEndpoints } from "./overview";
import { labelingEndpoints } from "./labeling";
import { leaderboardEndpoints, fetchMyScore } from "./leaderboard";

export const endpoints = {
  upload: uploadEndpoints,
  jobs: jobsEndpoints,
  overview: overviewEndpoints,
  sessions: sessionsEndpoints,
  labeling: labelingEndpoints,
  leaderboard: leaderboardEndpoints.list,
} as const;

export { uploadEndpoints, jobsEndpoints, sessionsEndpoints, overviewEndpoints, labelingEndpoints, leaderboardEndpoints, fetchMyScore };
