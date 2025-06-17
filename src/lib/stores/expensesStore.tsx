import { create } from "zustand";
import { supabase } from "../supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Expense, Contribution } from "../../../types/database";
import { useRootStore } from "./rootStore";

interface ExpensesData {
  expenses: Expense[];
  contributions: Contribution[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchExpensesData: () => Promise<void>;
  fetchExpensesForce: () => Promise<void>;
  realtimeExpenseSubscription: RealtimeChannel | null;
  realtimeContributionSubscription: RealtimeChannel | null;
  setupRealtimeExpenseSubscription: () => void;
  cleanupRealtimeExpenseSubscription: () => void;
  setupRealtimeContributionSubscription: () => void;
  cleanupRealtimeContributionSubscription: () => void;
}

export const useExpenseStore = create<ExpensesData>((set, get) => ({
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

    const { setupRealtimeExpenseSubscription } = useExpenseStore.getState();
    setupRealtimeExpenseSubscription();

    const { setupRealtimeContributionSubscription } =
      useExpenseStore.getState();
    setupRealtimeContributionSubscription();
  },

  async fetchExpensesForce() {
    try {
      set({ loading: true, error: null });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user } = useRootStore.getState();
      // Force refresh should ignore initialized state
      if (!user?.house_id) {
        set({
          expenses: [],
          contributions: [],
          loading: false,
          initialized: true,
        });
        return;
      }

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

    const { setupRealtimeExpenseSubscription } = useExpenseStore.getState();
    setupRealtimeExpenseSubscription();

    const { setupRealtimeContributionSubscription } =
      useExpenseStore.getState();
    setupRealtimeContributionSubscription();
  },

  realtimeExpenseSubscription: null,
  realtimeContributionSubscription: null,

  setupRealtimeExpenseSubscription: () => {
    const { user } = useRootStore.getState();
    if (!user?.house_id) return;

    const channel = supabase
      .channel("expense-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          const currentExpenses = get().expenses;

          if (payload.eventType === "INSERT") {
            set({ expenses: [...currentExpenses, payload.new as Expense] });
          } else if (payload.eventType === "UPDATE") {
            const updatedExpense = payload.new as Expense;
            const updatedExpenses = currentExpenses.map((expense) =>
              expense.id === updatedExpense.id ? updatedExpense : expense,
            );
            set({ expenses: updatedExpenses });
          } else if (payload.eventType === "DELETE") {
            set({
              expenses: currentExpenses.filter(
                (expense) => expense.id !== payload.old.id,
              ),
            });
          }
        },
      )
      .subscribe();
    set({ realtimeExpenseSubscription: channel });
  },

  cleanupRealtimeExpenseSubscription: () => {
    const subscription = get().realtimeExpenseSubscription;
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ realtimeContributionSubscription: null });
    }
  },

  setupRealtimeContributionSubscription: () => {
    const { user } = useRootStore.getState();

    if (!user?.house_id) return;

    const channel = supabase
      .channel("contribution-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          const currentContributions = get().contributions;

          if (payload.eventType === "INSERT") {
            set({
              contributions: [
                ...currentContributions,
                payload.new as Contribution,
              ],
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedContribution = payload.new as Contribution;
            const updatedContributions = currentContributions.map(
              (contribution) =>
                contribution.id === updatedContribution.id
                  ? updatedContribution
                  : contribution,
            );
            set({ contributions: updatedContributions });
          } else if (payload.eventType === "DELETE") {
            set({
              contributions: currentContributions.filter(
                (contribution) => contribution.id !== payload.old.id,
              ),
            });
          }
        },
      )
      .subscribe();

    set({ realtimeContributionSubscription: channel });
  },

  cleanupRealtimeContributionSubscription: () => {
    const subscription = get().realtimeContributionSubscription;

    if (subscription) {
      supabase.removeChannel(subscription);
      set({ realtimeContributionSubscription: null });
    }
  },
}));
