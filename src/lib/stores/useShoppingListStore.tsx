import { create } from "zustand";
import { ShoppingListItem } from "../../../types/database";
import { createClient } from "../supabase/client";

interface ShoppingListData {
  items: ShoppingListItem[];
  loading: boolean;
  error: string | null;
  fetchShoppingListData: () => Promise<void>;
}

export const useShoppingListStore = create<ShoppingListData>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchShoppingListData: async () => {
    try {
      set({ loading: true });

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("user not found!");

      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (appUserError) throw new Error(appUserError.message);

      if (!appUser?.house_id) {
        set({
          items: [],
          loading: false,
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
        error: null,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },
}));
