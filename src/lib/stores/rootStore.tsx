import { create } from "zustand";
import { supabase } from "../supabase/client";
import { User, House, HouseMember } from "../../../types/database";

interface RootStoreState {
  user: User | null;
  email: string | null;
  house: House | null;
  houseMembers: HouseMember[] | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchCoreData: () => Promise<void>;
}

export const useRootStore = create<RootStoreState>((set) => ({
  user: null,
  email: null,
  house: null,
  houseMembers: null,
  loading: false,
  error: null,
  initialized: false,

  async fetchCoreData() {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!user || userError) {
        throw new Error("User not found");
      }
      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!appUser || appUserError) {
        throw new Error("Failed to fetch user data");
      }
      const [houseRes, memberRes] = await Promise.all([
        supabase.from("houses").select("*").eq("id", appUser.house_id).single(),
        supabase
          .from("house_members")
          .select("*")
          .eq("house_id", appUser.house_id),
      ]);
      set({
        user: appUser,
        email: appUser.email,
        house: houseRes.data,
        houseMembers: memberRes.data,
        loading: false,
        error: null,
        initialized: true,
      });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
