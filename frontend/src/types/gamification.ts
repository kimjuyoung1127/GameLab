export type MissionState = "NotStarted" | "InProgress" | "Completed" | "Claimed";

export interface NextAchievement {
  id: string | null;
  remaining: number | null;
}

export interface RewardEvent {
  id: string;
  eventType: string;
  refType?: string | null;
  refId?: string | null;
  points: number;
  message: string;
  occurredAt: string;
}

export interface GamificationSnapshot {
  todayScore: number;
  weekScore: number;
  allTimeScore: number;
  streakDays: number;
  dailyGoal: number;
  dailyProgress: number;
  rankDaily?: number | null;
  rankWeekly?: number | null;
  rankAllTime?: number | null;
  nextAchievement: NextAchievement;
  recentEvents: RewardEvent[];
}

export interface MissionReward {
  points: number;
  badge?: string | null;
}

export interface MissionItem {
  missionId: string;
  scope: "daily" | "weekly";
  title: string;
  description: string;
  progress: number;
  target: number;
  state: MissionState;
  reward: MissionReward;
}

export interface MissionsResponse {
  daily: MissionItem[];
  weekly: MissionItem[];
}

export interface ClaimMissionResponse {
  missionId: string;
  state: MissionState | "NotFound";
  claimedAt?: string | null;
  rewardPoints: number;
}
