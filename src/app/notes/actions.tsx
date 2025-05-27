"use server";

import { createClient } from "@/lib/supabase/server";
import { Option } from "./notes";

export async function addNewNote(
  formData: FormData,
  house_id: string | undefined,
  user_id: string | undefined,
) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const is_pinned = formData.get("is_pinned") as string;

  try {
    const { error } = await supabase.from("notes").insert({
      title,
      content,
      is_pinned,
      house_id,
      created_by: user_id,
    });

    if (error) {
      return { success: false, error: (error as Error).message };
    }
    return { success: true };
  } catch (e) {
    console.error("Failed to add note:", e);
    return { success: false, error: (e as Error).message };
  }
}

export async function addNewPoll(
  formData: FormData,
  options: Option[],
  house_id: string | undefined,
  user_id: string | undefined,
) {
  if (!house_id || !user_id) {
    return { success: false, error: "Missing house_id or user_id" };
  }

  const supabase = await createClient();

  const question = formData.get("question") as string;
  const is_mult_choice = formData.get("mult_choice") as string;
  const duration = formData.get("duration") as string;
  let expires_at: Date | undefined;
  const now = new Date();
  switch (duration) {
    case "1 hour":
      expires_at = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case "4 hours":
      expires_at = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      break;
    case "8 hours":
      expires_at = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      break;
    case "24 hours":
      expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "3 days":
      expires_at = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      break;
    case "1 week":
      expires_at = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "2 weeks":
      expires_at = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      break;
    default:
      return { success: false, error: "invalid duration" };
  }
  try {
    const { data: pollData, error: pollError } = await supabase
      .from("polls")
      .insert({
        house_id,
        created_by: user_id,
        question,
        multiple_choice: is_mult_choice === "true" ? true : false,
        expires_at: expires_at?.toISOString(),
      })
      .select()
      .single();

    if (pollError) {
      throw new Error(pollError.message);
    }

    const pollId = pollData.id;

    //map each option to an object with poll id and option_text
    const pollOptions = options.map((option) => ({
      poll_id: pollId,
      option_text: option.text,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(pollOptions);

    if (optionsError) {
      throw new Error(optionsError.message);
    }
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function togglePinned(id: string, pinned_status: boolean) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: !pinned_status })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteNoteAction(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: (e as Error).message };
  }
}
