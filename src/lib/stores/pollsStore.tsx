import { create } from "zustand";
import { supabase } from "../supabase/client";
import { PollVote, PollOption, Poll } from "../../../types/database";
import { PollProps as PollObject } from "../../../types/poll";
import { useRootStore } from "./rootStore";
import { RealtimeChannel } from "@supabase/supabase-js";

//we want to subscribe to polls and their votes.
//when a change happens, we modify the PollObject in place.
//Scenarios:
//
//add poll: add a poll to the store
//add vote: modify the corresponding poll object - add the vote to PollObject.votes
//remove vote: modify the corresponding poll object - remove the vote from PollObject.votes
//

interface PollsData {
  polls: PollObject[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchPollData: () => Promise<void>;
  fetchPollsForce: () => Promise<void>;
  realtimeSubscription: RealtimeChannel | null;
  setupRealtimeSubscription: () => void;
  cleanupRealtimeSubscription: () => void;
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

async function fetchPollOptions(poll_id: string): Promise<PollOption[] | null> {
  try {
    const options = await supabase
      .from("poll_options")
      .select("*")
      .eq("poll_id", poll_id);

    return options.data as PollOption[];
  } catch (e) {
    console.error(`Error fetching options for poll ${poll_id}:`, e);
    return null;
  }
}

export const usePollStore = create<PollsData>((set, get) => ({
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

      const { setupRealtimeSubscription } = usePollStore.getState();
      setupRealtimeSubscription();
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
      const { setupRealtimeSubscription } = usePollStore.getState();
      setupRealtimeSubscription();
    } catch (error) {
      set({ loading: false, error: String(error) });
    }
  },

  realtimeSubscription: null,

  setupRealtimeSubscription: () => {
    const { user } = useRootStore.getState();
    if (!user?.house_id) {
      console.log("No house_id available, skipping realtime subscription");
      return;
    }

    // Clean up existing subscription if any
    const pollStore = usePollStore.getState();
    if (pollStore.realtimeSubscription) {
      console.log("Cleaning up existing subscription");
      pollStore.cleanupRealtimeSubscription();
    }

    try {
      console.log(
        `Setting up unified realtime subscription for house ${user.house_id}`,
      );

      // Create a single channel for both polls and votes
      const channel = supabase
        .channel(`polls-and-votes-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "polls",
          },
          async (payload) => {
            try {
              console.log("Poll INSERT event received:", payload);

              if (payload.new.house_id !== user.house_id) {
                console.log("Poll belongs to different house, ignoring");
                return;
              }

              const currentPolls = get().polls;
              console.log("Fetching options for new poll");
              const options = await fetchPollOptions(payload.new.id);

              if (!options || options.length === 0) {
                console.log("No options found for poll, skipping");
                return;
              }

              const newPoll: PollObject = {
                id: payload.new.id,
                title: payload.new.question,
                multipleChoice: payload.new.multiple_choice,
                options: options,
                votes: [],
                created_at: payload.new.created_at,
                expires_at: payload.new.expires_at,
              };

              console.log("Adding new poll to state:", newPoll.id);
              set({ polls: [...currentPolls, newPoll] });
            } catch (error) {
              console.error("Error processing poll insert:", error);
            }
          },
        )
        //Poll DELETE EVENTS
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "polls",
          },
          (payload) => {
            try {
              const currentPolls = get().polls;
              const pollId = payload.old.id;

              const updatedPolls = currentPolls.filter((p) => p.id !== pollId);

              set({ polls: updatedPolls });
            } catch (error) {
              console.error("Error processing poll delete:", error);
            }
          },
        )
        // Vote INSERT events
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "poll_votes",
          },
          (payload) => {
            try {
              console.log("Vote INSERT event received:", payload);

              // Filter by house_id if available
              // This check would need to be modified if poll_votes doesn't have house_id
              const currentPolls = get().polls;
              const pId = payload.new.poll_id;
              const poll = currentPolls.find((p) => p.id === pId);

              if (!poll) {
                console.log("Poll not found for vote, ignoring");
                return;
              }

              console.log(`Adding vote to poll ${pId}`);
              // Create a new updated poll object
              const updatedPoll = {
                ...poll,
                votes: [...poll.votes, payload.new as PollVote],
              };

              // Replace the poll in the array
              set({
                polls: currentPolls.map((p) =>
                  p.id === pId ? updatedPoll : p,
                ),
              });
            } catch (error) {
              console.error("Error processing vote insert:", error);
            }
          },
        )
        // Vote DELETE events
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "poll_votes",
          },
          (payload) => {
            try {
              console.log("Vote DELETE event received:", payload);
              const currentPolls = get().polls;
              console.log(currentPolls);
              const poll = currentPolls.find((p) =>
                p.votes.some((v) => v.id === payload.old.id),
              );

              if (!poll) {
                console.log("Poll not found for deleted vote, ignoring");
                return;
              }

              const pId = poll.id;

              console.log(`Removing vote from poll ${pId}`);
              // Create a new updated poll object
              const updatedPoll = {
                ...poll,
                votes: poll.votes.filter((v) => v.id !== payload.old.id),
              };

              // Replace the poll in the array
              set({
                polls: currentPolls.map((p) =>
                  p.id === pId ? updatedPoll : p,
                ),
              });
            } catch (error) {
              console.error("Error processing vote delete:", error);
            }
          },
        )
        .subscribe((status) => {
          console.log(`Unified subscription status: ${status}`);
        });

      set({ realtimeSubscription: channel });
    } catch (error) {
      console.error("Error setting up unified subscription:", error);
    }
  },

  cleanupRealtimeSubscription: () => {
    const subscription = get().realtimeSubscription;
    if (subscription) {
      console.log("Cleaning up unified subscription");
      supabase.removeChannel(subscription);
      set({ realtimeSubscription: null });
    }
  },
}));
