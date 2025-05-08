import { create } from "zustand";
import { supabase } from "../supabase/client";
import { User, Chore, HouseMember } from "../../../types/database";

interface ChoresData {
  user: User | null;
  chores: Chore[];
  members: HouseMember[];
  loading: boolean;
  error: string | null;
  fetchChoresData: () => Promise<void>;
}

export const useChoreStore = create<ChoresData>((set) => ({
  user: null,
  chores: [],
  members: [],
  loading: true,
  error: null,

  async fetchChoresData() {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("User not authenticated");

      const { data: appUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!appUser?.house_id) {
        set({
          user: appUser,
          chores: [],
          members: [],
          loading: false,
        });
        return;
      }

      const [choresRes, membersRes] = await Promise.all([
        supabase.from("chores").select("*").eq("house_id", appUser.house_id),
        supabase
          .from("house_members")
          .select("*")
          .eq("house_id", appUser.house_id),
      ]);

      if (choresRes.error)
        console.error("chores error:", choresRes.error.message);
      if (membersRes.error)
        console.error("members error:", membersRes.error.message);

      set({
        user: appUser,
        chores: choresRes.data || [],
        members: membersRes.data || [],
        loading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load chores";

      set({
        error: message,
        loading: false,
      });
    }
  },
}));
