"use client";
import { User, House } from "../../../types/database";

import { supabase } from "../supabase/client";
import { create } from "zustand";

interface UserData {
  user: User | null;
  email: string | null;
  house: House | null;
  loading: boolean;
  error: string | null;
  fetchUserData: () => Promise<void>;
}

export const useUserStore = create<UserData>((set) => ({
  user: null,
  email: null,
  house: null,
  loading: true,
  error: null,
  async fetchUserData() {
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
          email: user.email,
          house: null,
          loading: false,
        });
        return;
      }

      const { data: houseData, error: houseError } = await supabase
        .from("houses")
        .select("*")
        .eq("id", appUser.house_id)
        .single();

      if (houseError) throw new Error("failed to fetch house");

      set({
        user: appUser,
        email: user.email,
        house: houseData,
        loading: false,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      set({ error: message, loading: false });
    }
  },
}));
