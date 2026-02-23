/** 리더보드 도메인 타입: LeaderboardEntry 인터페이스. */
export type UserRole = "lead_analyst" | "acoustic_eng" | "data_analyst" | "junior_tagger" | "contractor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  todayScore: number;
  accuracy: number;
  allTimeScore: number;
}
