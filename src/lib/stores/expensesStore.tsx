import { create } from "zustand";
import { supabase } from "../supabase/client";
import { Expense, Contribution } from "../../../types/database";
import { useRootStore } from "./rootStore";

interface ExpensesData {
  expenses: Expense[];
  contributions: Contribution[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchExpensesData: () => Promise<void>;
}

export const useExpenseStore = create<ExpensesData>((set) => ({
  expenses: [],
  contributions: [],
  loading: true,
  initialized: false,
  error: null,

  async fetchExpensesData() {
    try {
      set({ loading: true, error: null });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user } = useRootStore.getState();
      if (useExpenseStore.getState().initialized) {
        set({ loading: false, error: null });
        return;
      }

      if (!user?.house_id) {
        set({
          expenses: [],
          contributions: [],
          loading: false,
          initialized: true,
        });
        return;
      }

      console.log(user.house_id);

      const [expensesRes, contributionsRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("*")
          .eq("house_id", user.house_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("contributions")
          .select("*, expenses!inner(*)")
          .eq("user_id", user.id)
          .eq("expenses.house_id", user.house_id),
        ,
      ]);

      if (expensesRes.error || contributionsRes.error) {
        throw new Error("Failed to load expenses");
      }

      set({
        expenses: expensesRes.data,
        contributions: contributionsRes.data,
        loading: false,
        initialized: true,
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
