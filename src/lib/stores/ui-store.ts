"use client";

import { create } from "zustand";

type UiStore = {
  mobileNavOpen: boolean;
  reportDate: string;
  setMobileNavOpen: (value: boolean) => void;
  toggleMobileNav: () => void;
  setReportDate: (value: string) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  mobileNavOpen: false,
  reportDate: "",
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setReportDate: (value) => set({ reportDate: value }),
}));
