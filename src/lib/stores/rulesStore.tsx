"use client";

import { HouseRule } from "../../../types/database";
import { supabase } from "../supabase/client";
import { useRootStore } from "./rootStore";
import { create } from "zustand";

interface RulesData {
  rules: HouseRule | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchRulesData: () => Promise<void>;
}

export const useRulesStore = create<RulesData>((set) => ({
  rules: null,
  loading: false,
  initialized: false,
  error: null,

  async fetchRulesData() {
    try {
      set({ loading: true });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user: appUser } = useRootStore.getState();

      if (useRulesStore.getState().initialized) {
        set({ loading: false, error: null });
        return;
      }

      if (!appUser?.house_id) {
        set({
          rules: null,
          loading: false,
          initialized: true,
          error: null,
        });
      }

      const { data: rulesData, error: rulesError } = await supabase
        .from("rules")
        .select("*")
        .eq("house_id", appUser?.house_id)
        .single();

      if (rulesError) {
        throw new Error(rulesError.message);
      }

      set({
        rules: rulesData || null,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to fetch house rules";

      set({
        error: message,
        loading: false,
      });
    }
  },
}));
