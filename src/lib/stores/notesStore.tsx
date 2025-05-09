import { create } from "zustand";
import { supabase } from "../supabase/client";
import { User, HouseMember, Note } from "../../../types/database";

interface NotesData {
  user: User | null;
  members: HouseMember[];
  notes: Note[];
  loading: boolean;
  error: string | null;
  fetchNotesData: () => Promise<void>;
}

export const useNotesStore = create<NotesData>((set) => ({
  user: null,
  members: [],
  notes: [],
  loading: true,
  error: null,

  async fetchNotesData() {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("User not authenticated!");

      const { data: appUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!appUser?.house_id) {
        set({
          user: appUser,
          members: [],
          notes: [],
          loading: false,
        });
        return;
      }

      const [membersRes, notesRes] = await Promise.all([
        supabase
          .from("house_members")
          .select("*")
          .eq("house_id", appUser.house_id),
        supabase.from("notes").select("*").eq("house_id", appUser.house_id),
      ]);

      if (membersRes.error) throw new Error("Failed to fetch members data!");
      if (notesRes.error) throw new Error("Failed to fetch notes data!");

      set({
        user: appUser,
        members: membersRes.data || [],
        notes: notesRes.data || [],
        loading: false,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to fetch notes data!";

      set({
        error: message,
        loading: false,
      });
    }
  },
}));
