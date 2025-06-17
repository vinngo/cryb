import { create } from "zustand";
import { supabase } from "../supabase/client";
import { useRootStore } from "./rootStore";
import { Note } from "../../../types/database";

interface NotesData {
  notes: Note[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchNotesData: () => Promise<void>;
}

export const useNotesStore = create<NotesData>((set) => ({
  notes: [],
  loading: true,
  initialized: false,
  error: null,

  async fetchNotesData() {
    try {
      set({ loading: true, error: null });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user } = useRootStore.getState();

      if (useNotesStore.getState().initialized) {
        set({ loading: false });
        return;
      }

      if (!user?.house_id) {
        set({
          notes: [],
          loading: false,
          initialized: true,
        });
        return;
      }

      const [membersRes, notesRes] = await Promise.all([
        supabase
          .from("house_members")
          .select("*")
          .eq("house_id", user.house_id),
        supabase.from("notes").select("*").eq("house_id", user.house_id),
      ]);

      if (membersRes.error) throw new Error("Failed to fetch members data!");
      if (notesRes.error) throw new Error("Failed to fetch notes data!");

      set({
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
