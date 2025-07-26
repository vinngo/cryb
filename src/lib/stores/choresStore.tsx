import { create } from "zustand";
import { supabase } from "../supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Chore } from "../../../types/database";
import { useRootStore } from "./rootStore";

interface ChoresData {
  chores: Chore[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchChoresData: () => Promise<void>;
  fetchChoresForce: () => Promise<void>;
  realtimeSubscription: RealtimeChannel | null;
  setupRealtimeSubscription: () => void;
  cleanupRealtimeSubscription: () => void;
}

export const useChoreStore = create<ChoresData>((set, get) => ({
  chores: [],
  loading: true,
  error: null,
  initialized: false,

  async fetchChoresData() {
    try {
      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user } = useRootStore.getState();

      if (useChoreStore.getState().initialized) {
        set({ loading: false });
        return;
      }

      if (!user?.house_id) {
        set({
          chores: [],
          loading: false,
          initialized: true,
        });
        return;
      }

      const { data: choresData, error: choresError } = await supabase
        .from("chores")
        .select("*")
        .eq("house_id", user.house_id);

      if (choresError) {
        throw new Error("Failed to load chores");
      }

      set({
        chores: choresData || [],
        loading: false,
        initialized: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load chores";

      set({
        error: message,
        loading: false,
      });
    }

    const { setupRealtimeSubscription } = useChoreStore.getState();
    setupRealtimeSubscription();
  },

  async fetchChoresForce() {
    try {
      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user } = useRootStore.getState();

      if (!user?.house_id) {
        set({
          chores: [],
          loading: false,
          initialized: true,
        });
        return;
      }

      const { data: choresData, error: choresError } = await supabase
        .from("chores")
        .select("*")
        .eq("house_id", user.house_id);

      if (choresError) {
        throw new Error("Failed to load chores");
      }

      set({
        chores: choresData || [],
        loading: false,
        initialized: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load chores";

      set({
        error: message,
        loading: false,
      });
    }

    const { setupRealtimeSubscription } = useChoreStore.getState();
    setupRealtimeSubscription();
  },

  realtimeSubscription: null,
  setupRealtimeSubscription: () => {
    const { user } = useRootStore.getState();
    if (!user?.house_id) return;

    const channel = supabase
      .channel("chores-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chores",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          const currentChores = get().chores;
          set({
            chores: [...currentChores, payload.new as Chore],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chores",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          const currentChores = get().chores;
          const updatedChore = payload.new as Chore;
          const updatedChores = currentChores.map((chore) =>
            chore.id === updatedChore.id ? updatedChore : chore,
          );
          set({
            chores: updatedChores,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chores",
        },
        (payload) => {
          const currentChores = get().chores;
          const deletedChoreId = payload.old.id;
          const updatedChores = currentChores.filter(
            (chore) => chore.id !== deletedChoreId,
          );
          set({
            chores: updatedChores,
          });
        },
      )
      .subscribe();
    set({ realtimeSubscription: channel });
  },
  cleanupRealtimeSubscription: () => {
    const subscription = get().realtimeSubscription;
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ realtimeSubscription: null });
    }
  },
}));
