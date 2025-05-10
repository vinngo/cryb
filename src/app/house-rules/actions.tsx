"use server";

import { createClient } from "@/lib/supabase/server";
import { HouseRule } from "../../../types/database";

export async function saveHouseRules(
  formData: FormData,
  user_id: string,
  house_id: string,
) {
  const supabase = await createClient();

  const markdown_content = formData.get("rules") as string;
  const now = new Date();

  try {
    if (!house_id) {
      throw new Error("User needs to be in a house!");
    }

    // Check if rules already exist for this house
    const { data: existingRules, error: checkError } = await supabase
      .from("house_rules")
      .select("*")
      .eq("house_id", house_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is the code for "no rows returned" which is fine in this case
      throw new Error(checkError.message);
    }

    let result;

    if (existingRules) {
      // Update existing rules
      result = await supabase
        .from("house_rules")
        .update({
          markdown_content,
          updated_at: now,
          last_updated_by: user_id,
        })
        .eq("house_id", house_id)
        .select();
    } else {
      // Create new rules
      result = await supabase
        .from("house_rules")
        .insert({
          house_id,
          last_updated_by: user_id,
          markdown_content,
          created_at: now,
          updated_at: now,
        })
        .select();
    }

    if (result.error) throw new Error(result.error.message);

    return {
      success: true,
      data: result.data?.[0] as HouseRule,
      error: null,
    };
  } catch (e) {
    console.error("Failed to save house rules:", e);
    return {
      success: false,
      data: null,
      error: (e as Error).message,
    };
  }
}
