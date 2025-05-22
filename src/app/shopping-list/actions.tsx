"use server";

import { createClient } from "@/lib/supabase/server";

export async function addShoppingListItem(
  formData: FormData,
  house_id: string,
  user_id: string,
) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const quantity = formData.get("quantity") as string;
  const category = formData.get("category") as string;

  const { data: newItem, error } = await supabase
    .from("shopping_list")
    .insert([
      { name, quantity, category, house_id, user_id, is_checked: false },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
  }

  return newItem;
}

export async function updateItemStatus(item_id: string, status: boolean) {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("shopping_list")
    .update({ is_checked: !status })
    .eq("id", item_id);

  if (updateError) {
    console.error(updateError);
    return { error: updateError };
  }
  return { error: null };
}
