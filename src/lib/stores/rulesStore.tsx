"use client";

import { User, HouseRule } from "../../../types/database";
import { supabase } from "../supabase/client";
import { create } from "zustand";

interface RulesData {
  user: User | null;
  rules: HouseRule | null;
  loading: boolean;
  error: string | null;
  fetchRulesData: () => Promise<void>;
}

export const useRulesStore = create<RulesData>((set) => ({
  user: null,
  rules: null,
  loading: true,
  error: null,

  async fetchRulesData() {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("User not authenticated!");

      const { data: appUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!appUser?.house_id) {
        set({
          user: appUser,
          rules: null,
          loading: false,
        });
        return;
      }

      const { data: rulesData, error: rulesError } = await supabase
        .from("house_rules")
        .select("*")
        .eq("house_id", appUser.house_id);

      if (rulesError) throw new Error("Failed to fetch rules");

      set({
        user: appUser,
        rules: rulesData.length > 0 ? (rulesData[0] as HouseRule) : null,
        loading: false,
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
