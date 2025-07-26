"use server";
import { createClient } from "@/lib/supabase/server";
import { PollOption, PollVote } from "../../../types/database";

export async function votePoll(
  poll_id: string,
  user_id: string,
  house_id: string,
  option_id?: string,
  options?: PollOption[],
): Promise<{
  success: boolean;
  data: PollVote | PollVote[] | null;
  error: string | Error | null;
}> {
  const supabase = await createClient();

  if (!poll_id || !user_id) {
    return { success: false, data: null, error: "Missing required parameters" };
  }

  if (!house_id) {
    return { success: false, data: null, error: "Missing house_id parameter." };
  }

  if (!option_id && !options) {
    return {
      success: false,
      data: null,
      error: "Missing both option_id and options parameter.",
    };
  }

  if (option_id && options) {
    return {
      success: false,
      data: null,
      error: "Use either option_id or options, not both.",
    };
  }
  if (option_id) {
    try {
      const { data: voteData, error: voteError } = await supabase
        .from("poll_votes")
        .insert({
          poll_id,
          user_id,
          house_id,
          option_id,
        })
        .select()
        .single();
      if (!voteData || voteError) {
        return { success: false, data: null, error: voteError };
      }
      return { success: true, data: voteData, error: null };
    } catch (e) {
      return { success: false, data: null, error: e as Error };
    }
  } else if (options) {
    try {
      //place a vote for all selected option
      const votes = [];
      for (const option of options) {
        const { data: voteData, error: voteError } = await supabase
          .from("poll_votes")
          .insert({
            poll_id,
            user_id,
            house_id,
            option_id: option.id,
          })
          .select()
          .single();
        if (!voteData || voteError) {
          return { success: false, data: null, error: voteError };
        }
        votes.push(voteData);
      }
      return { success: true, data: votes, error: null };
    } catch (e) {
      return { success: false, data: null, error: e as Error };
    }
  }
  return { success: false, data: null, error: "No valid options provided" };
}

export async function removeVote(
  option_id: string,
): Promise<{ success: boolean; error: string | Error | null }> {
  const supabase = await createClient();

  try {
    const { error: removeVoteError } = await supabase
      .from("poll_votes")
      .delete()
      .eq("option_id", option_id);
    if (removeVoteError) {
      return { success: false, error: removeVoteError };
    }
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}

export async function removeVotes(
  option_ids: string[],
): Promise<{ success: boolean; error: string | Error | null }> {
  const supabase = await createClient();

  try {
    const { error: removeVotesError } = await supabase
      .from("poll_votes")
      .delete()
      .in("option_id", option_ids);
    if (removeVotesError) {
      return { success: false, error: removeVotesError };
    }
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}

export async function removePoll(
  poll_id: string,
): Promise<{ success: boolean; error: string | Error | null }> {
  const supabase = await createClient();

  try {
    const { error: removePollError } = await supabase
      .from("polls")
      .delete()
      .eq("id", poll_id);
    if (removePollError) {
      return { success: false, error: removePollError };
    }
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}
