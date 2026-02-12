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
