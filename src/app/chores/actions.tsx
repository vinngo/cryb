"use server";

import { createClient } from "@/lib/supabase/server";

export default async function addNewChore(
  formData: FormData,
  house_id: string | undefined,
) {
  const supabase = await createClient();

  // Extract form values
  const title = formData.get("title") as string;
  const assignedTo = formData.get("assigned_to") as string;
  const dueDate = formData.get("due_date") as string;

  const dueDateinDate = new Date(dueDate);

  try {
    // TODO: Get house_id from user session

    if (house_id === undefined) {
      throw new Error("User needs to be in a house!");
    }

    // Insert new chore
    const { data, error } = await supabase.from("chores").insert({
      title,
      assigned_to: assignedTo,
      due_date: dueDateinDate,
      house_id,
      completed: false,
    });

    if (error) throw new Error(error.message);

    return { success: true, data };
  } catch (error) {
    console.error("Failed to add chore:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateChore(choreId: string, completed: boolean) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("chores")
      .update({ completed })
      .eq("id", choreId)
      .select();

    if (error) throw new Error(error.message);

    return { success: true, data };
  } catch (error) {
    console.error("Failed to update chore:", error);
    return { success: false, error: (error as Error).message };
  }
}
