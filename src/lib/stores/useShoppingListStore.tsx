import { create } from "zustand";
import { ShoppingListItem } from "../../../types/database";
import { supabase } from "../supabase/client";
import { useRootStore } from "./rootStore";

interface ShoppingListData {
  items: ShoppingListItem[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchShoppingListData: () => Promise<void>;
  fetchShoppingListForce: () => Promise<void>;
}

export const useShoppingListStore = create<ShoppingListData>((set) => ({
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
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },
}));
