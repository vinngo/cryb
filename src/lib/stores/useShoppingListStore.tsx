import { create } from "zustand";
import { ShoppingListItem } from "../../../types/database";
import { supabase } from "../supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRootStore } from "./rootStore";

interface ShoppingListData {
  items: ShoppingListItem[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchShoppingListData: () => Promise<void>;
  fetchShoppingListForce: () => Promise<void>;
  realtimeChannel: RealtimeChannel | null;
  setupRealtimeListSubscription: () => void;
  cleanupRealtimeListSubscription: () => void;
}

export const useShoppingListStore = create<ShoppingListData>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,
  error: null,
  fetchShoppingListData: async () => {
    try {
      set({ loading: true });
      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user: appUser } = useRootStore.getState();

      if (useShoppingListStore.getState().initialized) {
        set({ loading: false, error: null });
        return;
      }

      if (!appUser?.house_id) {
        set({
          items: [],
          loading: false,
          initialized: true,
          error: null,
        });
        return;
      }

      const { data: shoppingListData, error: shoppingListError } =
        await supabase
          .from("shopping_list")
          .select("*")
          .eq("house_id", appUser.house_id);

      if (shoppingListError) throw new Error(shoppingListError.message);

      set({
        items: shoppingListData || [],
        loading: false,
        initialized: true,
        error: null,
      });

      useShoppingListStore.getState().setupRealtimeListSubscription();
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  async fetchShoppingListForce() {
    try {
      set({ loading: true });
      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user: appUser } = useRootStore.getState();

      if (!appUser?.house_id) {
        set({
          items: [],
          loading: false,
          initialized: true,
          error: null,
        });
        return;
      }

      const { data: shoppingListData, error: shoppingListError } =
        await supabase
          .from("shopping_list")
          .select("*")
          .eq("house_id", appUser.house_id);

      if (shoppingListError) throw new Error(shoppingListError.message);

      set({
        items: shoppingListData || [],
        loading: false,
        initialized: true,
        error: null,
      });

      useShoppingListStore.getState().setupRealtimeListSubscription();
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },
  realtimeChannel: null,
  setupRealtimeListSubscription: () => {
    const { user } = useRootStore.getState();

    if (!user?.house_id) {
      return;
    }

    const channel = supabase
      .channel("list-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shopping_list",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          const currentList = get().items;
          set({
            items: [...currentList, payload.new as ShoppingListItem],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shopping_list",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          const currentList = get().items;
          const updatedItem = payload.new as ShoppingListItem;
          const updatedList = currentList.map((item) =>
            item.id === updatedItem.id ? updatedItem : item,
          );
          set({
            items: updatedList,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "shopping_list",
        },
        (payload) => {
          const currentList = get().items;
          const deletedItem = payload.old as ShoppingListItem;
          const updatedList = currentList.filter(
            (item) => item.id !== deletedItem.id,
          );
          set({
            items: updatedList,
          });
        },
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },
  cleanupRealtimeListSubscription: () => {
    const subscription = get().realtimeChannel;
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ realtimeChannel: null });
    }
  },
}));
