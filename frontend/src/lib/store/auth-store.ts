/** 인증 상태 관리: 유저 정보, 로딩, bypass 모드. */
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  isBypass: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

const isBypass =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_BYPASS_LOGIN !== "false"
    : true;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: !isBypass,
  isBypass,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, loading: false }),
}));
