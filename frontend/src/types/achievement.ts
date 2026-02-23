/** Achievement & UserAchievement types — mirrors BE models. */
export interface Achievement {
  id: string;
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  icon: string;
  category: string;
  threshold: number;
  sort_order: number;
  created_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at?: string;
}
