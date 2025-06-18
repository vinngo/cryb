import { create } from "zustand";
import { supabase } from "../supabase/client";
import { PollVote, PollOption, Poll } from "../../../types/database";
import { PollProps as PollObject } from "../../../types/poll";
import { useRootStore } from "./rootStore";

interface PollsData {
  polls: PollObject[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchPollData: () => Promise<void>;
  fetchPollsForce: () => Promise<void>;
}

interface PollsResult {
  polls: Poll[];
  options: PollOption[];
  votes: PollVote[];
}

async function fetchPollsForHouse(house_id: string): Promise<PollsResult> {
  try {
    if (!house_id) throw new Error("House ID is required");

    const { data: polls, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("house_id", house_id);

    if (pollError) throw pollError;
    if (!polls || polls.length === 0)
      return { polls: [], options: [], votes: [] };

    // Get all poll options for all polls in the house
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("*")
      .in(
        "poll_id",
        polls.map((poll) => poll.id),
      );

    if (optionsError) {
      console.error(`Error fetching options for polls:`, optionsError);
      return { polls, options: [], votes: [] };
    }

    // Get all votes for all polls in the house
    const { data: votes, error: votesError } = await supabase
      .from("poll_votes")
      .select("*")
      .in(
        "poll_id",
        polls.map((poll) => poll.id),
      );

    if (votesError) {
      console.error(`Error fetching votes for polls:`, votesError);
      return { polls, options: options || [], votes: [] };
    }

    return {
      polls: polls || [],
      options: options || [],
      votes: votes || [],
    };
  } catch (e) {
    console.error(e);
    return { polls: [], options: [], votes: [] };
  }
}

export const usePollStore = create<PollsData>((set) => ({
  polls: [],
  loading: false,
  initialized: false,
  error: null,
  fetchPollData: async () => {
    try {
      set({ loading: true });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user: appUser } = useRootStore.getState();

      if (usePollStore.getState().initialized) {
        set({ loading: false });
        return;
      }

      if (!appUser?.house_id) {
        set({
          polls: [],
          loading: false,
          initialized: true,
        });
        return;
      }

      const { polls, options, votes } = await fetchPollsForHouse(
        appUser.house_id,
      );

      const pollData: PollObject[] = [];

      for (const poll of polls) {
        const poll_options = options.filter(
          (option) => option.poll_id === poll.id,
        );

        const poll_votes = votes.filter((vote) => vote.poll_id === poll.id);

        // Consolidate into one PollObject
        const pollObject: PollObject = {
          id: poll.id,
          title: poll.question, // Changed from title to question based on Poll interface
          multipleChoice: poll.multiple_choice,
          options: poll_options,
          votes: poll_votes,
          created_at: poll.created_at,
          expires_at: poll.expires_at,
        };

        pollData.push(pollObject);
      }

      set({
        polls: pollData,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({ loading: false, error: String(error) });
    }
  },
  fetchPollsForce: async () => {
    try {
      set({ loading: true });

      const rootStore = useRootStore.getState();

      if (!rootStore.initialized) {
        await rootStore.fetchCoreData();
      }

      const { user: appUser } = useRootStore.getState();

      if (!appUser?.house_id) {
        set({
          polls: [],
          loading: false,
          initialized: true,
        });
        return;
      }

      const { polls, options, votes } = await fetchPollsForHouse(
        appUser.house_id,
      );

      const pollData: PollObject[] = [];

      for (const poll of polls) {
        const poll_options = options.filter(
          (option) => option.poll_id === poll.id,
        );

        const poll_votes = votes.filter((vote) => vote.poll_id === poll.id);

        // Consolidate into one PollObject
        const pollObject: PollObject = {
          id: poll.id,
          title: poll.question, // Changed from title to question based on Poll interface
          multipleChoice: poll.multiple_choice,
          options: poll_options,
          votes: poll_votes,
          created_at: poll.created_at,
          expires_at: poll.expires_at,
        };

        pollData.push(pollObject);
      }

      set({
        polls: pollData,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({ loading: false, error: String(error) });
    }
  },
}));
