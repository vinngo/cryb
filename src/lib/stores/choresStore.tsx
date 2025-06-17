import { create } from "zustand";
import { supabase } from "../supabase/client";
import { Chore } from "../../../types/database";
import { useRootStore } from "./rootStore";

interface ChoresData {
  chores: Chore[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchChoresData: () => Promise<void>;
}

export const useChoreStore = create<ChoresData>((set) => ({
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
  },
}));
