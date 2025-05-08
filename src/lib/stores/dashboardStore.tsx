import { create } from "zustand";
import { supabase } from "../supabase/client";
import {
  User,
  House,
  Chore,
  Expense,
  HouseMember,
  Note,
} from "../../../types/database";

interface DashboardData {
  user: User | null;
  house: House | null;
  members: HouseMember[];
  chores: Chore[];
  expenses: Expense[];
  notes: Note[];
  loading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardData>((set) => ({
  user: null,
  house: null,
  members: [],
  chores: [],
  expenses: [],
  notes: [],
  loading: true,
  error: null,

  async fetchDashboardData() {
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
          house: null,
          members: [],
          chores: [],
          expenses: [],
          notes: [],
          loading: false,
        });
        return;
      }

      const [houseRes, membersRes, choresRes, expensesRes, notesRes] =
        await Promise.all([
          supabase
            .from("houses")
            .select("*")
            .eq("id", appUser.house_id)
            .single(),
          supabase
            .from("house_members")
            .select("*")
            .eq("house_id", appUser.house_id),
          supabase.from("chores").select("*").eq("house_id", appUser.house_id),
          supabase
            .from("expenses")
            .select("*")
            .eq("house_id", appUser.house_id),
          supabase.from("notes").select("*").eq("house_id", appUser.house_id),
        ]);

      if (houseRes.error) console.error("house error:", houseRes.error.message);
      if (membersRes.error)
        console.error("members error:", membersRes.error.message);
      if (choresRes.error)
        console.error("chores error:", choresRes.error.message);
      if (expensesRes.error)
        console.error("expenses error:", expensesRes.error.message);
      if (notesRes.error) console.error("notes error:", notesRes.error.message);

      set({
        user: appUser,
        house: houseRes.data || null,
        members: membersRes.data || [],
        chores: choresRes.data || [],
        expenses: expensesRes.data || [],
        notes: notesRes.data || [],
        loading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load dashboard";

      set({
        error: message,
        loading: false,
      });
    }
  },
}));
