import { create } from "zustand";
import { supabase } from "../supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRootStore } from "./rootStore";
import { Note } from "../../../types/database";

interface NotesData {
  notes: Note[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchNotesData: () => Promise<void>;
  fetchNotesForce: () => Promise<void>;
  realtimeNoteSubscription: RealtimeChannel | null;
  setupRealtimeNoteSubscription: () => void;
  cleanupRealtimeNoteSubscription: () => void;
}

export const useNotesStore = create<NotesData>((set, get) => ({
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
        initialized: true,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to fetch notes data!";

      set({
        error: message,
        loading: false,
      });
    }
    const { setupRealtimeNoteSubscription } = useNotesStore.getState();
    setupRealtimeNoteSubscription();
  },

  async fetchNotesForce() {
    try {
      set({ loading: true, error: null });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user } = useRootStore.getState();

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

    const { setupRealtimeNoteSubscription } = useNotesStore.getState();
    setupRealtimeNoteSubscription();
  },

  realtimeNoteSubscription: null,
  setupRealtimeNoteSubscription: () => {
    const { user } = useRootStore.getState();

    if (!user?.house_id) {
      return;
    }

    const channel = supabase
      .channel("note-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notes",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          console.log("INSERT event received", payload);
          const currentNotes = get().notes;
          set({
            notes: [...currentNotes, payload.new as Note],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notes",
          filter: `house_id=eq.${user.house_id}`,
        },
        (payload) => {
          console.log("UPDATE event received", payload);
          const currentNotes = get().notes;
          const updatedNote = payload.new as Note;
          const updatedNotes = currentNotes.map((note) =>
            note.id === updatedNote.id ? updatedNote : note,
          );
          set({ notes: updatedNotes });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notes",
          // No filter for DELETE events
        },
        (payload) => {
          console.log("DELETE event received", payload);
          const currentNotes = get().notes;
          // Since we're not filtering by house_id, we need to check it manually
          const deletedNoteId = payload.old.id;
          set({
            notes: currentNotes.filter((note) => note.id !== deletedNoteId),
          });
        },
      )
      .subscribe();

    set({ realtimeNoteSubscription: channel });
  },

  cleanupRealtimeNoteSubscription: () => {
    const subscription = get().realtimeNoteSubscription;

    if (subscription) {
      supabase.removeChannel(subscription);
      set({ realtimeNoteSubscription: null });
    }
  },
}));
