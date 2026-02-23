/** UI 상태 관리: 사이드바 접기, 모달, 토스트 메시지, 로딩 상태. */
import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  modalOpen: string | null;
  toastMessage: string | null;
  loading: boolean;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  modalOpen: null,
  toastMessage: null,
  loading: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (id) => set({ modalOpen: id }),
  closeModal: () => set({ modalOpen: null }),
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
  clearToast: () => set({ toastMessage: null }),
  setLoading: (loading) => set({ loading }),
}));
