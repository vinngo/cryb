"use server";

import { createClient } from "@/lib/supabase/server";

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
