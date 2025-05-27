"use server";
import { createClient } from "@/lib/supabase/server";
import { PollOption } from "../../../types/database";

export async function votePoll(
  poll_id: string,
  user_id: string,
  option_id?: string,
  options?: PollOption[],
): Promise<{ success: boolean; error: string | Error | null }> {
  const supabase = await createClient();

  if (!poll_id || !user_id) {
    return { success: false, error: "Missing required parameters" };
  }

  if (!option_id && !options) {
    return {
      success: false,
      error: "Missing both option_id and options parameter.",
    };
  }

  if (option_id && options) {
    return {
      success: false,
      error: "Use either option_id or options, not both.",
    };
  }
  if (option_id) {
    try {
      const { error: voteError } = await supabase.from("poll_votes").insert({
        poll_id,
        user_id,
        option_id,
      });
      if (voteError) {
        return { success: false, error: voteError };
      }
      return { success: true, error: null };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  } else if (options) {
    try {
      //place a vote for all selected option
      for (const option of options) {
        const { error: voteError } = await supabase.from("poll_votes").insert({
          poll_id,
          user_id,
          option_id: option.id,
        });
        if (voteError) {
          return { success: false, error: voteError };
        }
      }
      return { success: true, error: null };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }
  return { success: false, error: "No valid options provided" };
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
