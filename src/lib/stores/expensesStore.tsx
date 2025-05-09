import { create } from "zustand";
import { supabase } from "../supabase/client";
import {
  User,
  Expense,
  HouseMember,
  Contribution,
} from "../../../types/database";

interface ExpensesData {
  user: User | null;
  expenses: Expense[];
  members: HouseMember[];
  contributions: Contribution[];
  loading: boolean;
  error: string | null;
  fetchExpensesData: () => Promise<void>;
}

export const useExpenseStore = create<ExpensesData>((set) => ({
  user: null,
  expenses: [],
  members: [],
  contributions: [],
  loading: true,
  error: null,

  async fetchExpensesData() {
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
          expenses: [],
          members: [],
          contributions: [],
          loading: false,
        });
        return;
      }

      const [expensesRes, membersRes, contributionsRes] = await Promise.all([
        supabase.from("expenses").select("*").eq("house_id", appUser.house_id),
        supabase
          .from("house_members")
          .select("*")
          .eq("house_id", appUser.house_id),
        supabase
          .from("contributions")
          .select("*, expenses(*)")
          .eq("expenses.house_id", appUser.house_id),
      ]);

      if (expensesRes.error)
        console.error("expenses error:", expensesRes.error.message);
      if (membersRes.error)
        console.error("members error:", membersRes.error.message);
      if (contributionsRes.error)
        console.error("contributions error:", contributionsRes.error.message);

      set({
        user: appUser,
        expenses: expensesRes.data || [],
        members: membersRes.data || [],
        contributions: contributionsRes.data || [],
        loading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load expenses";

      set({
        error: message,
        loading: false,
      });
    }
  },
}));
