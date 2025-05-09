"use server";

import { createClient } from "@/lib/supabase/server";

export async function addNewExpense(
  formData: FormData,
  house_id: string | undefined,
) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paid_by = formData.get("paid_by") as string;
  const date = formData.get("date") as string;
  const split_between = JSON.parse(formData.get("split_between") as string);

  const trueDate = new Date(date);

  try {
    if (house_id === undefined) {
      throw new Error("User needs to be in a house!");
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        house_id,
        title,
        amount,
        paid_by,
        split_between,
        created_at: trueDate,
      })
      .select(); // Add select() to return the inserted data

    if (error || !data || data.length === 0)
      throw new Error(error?.message || "Failed to insert expense");

    const expenseData = data[0]; // Get the first item from the array

    const { error: contributionError } = await supabase
      .from("contributions")
      .insert({
        date: trueDate,
        expense_id: expenseData.id,
        user_id: paid_by,
        amount: amount / (split_between.length + 1),
        note: "Owner of expense: already paid",
      });

    if (contributionError) throw new Error(contributionError.message);

    return { success: true, expenseData, error: null };
  } catch (e) {
    console.error("Failed to add expense:", e);
    return { success: false, erorr: (e as Error).message };
  }
}

export async function addNewContribution(
  formData: FormData,
  expense_id: string | undefined,
) {
  const supabase = await createClient();

  const amount = parseFloat(formData.get("amount") as string);
  const paid_by = formData.get("paid_by") as string;
  const date = formData.get("date") as string;
  const note = formData.get("note") as string;

  const trueDate = new Date(date);

  try {
    if (expense_id === undefined) {
      throw new Error("Expense needs to be valid");
    }

    const { data, error } = await supabase.from("contributions").insert({
      expense_id,
      amount,
      user_id: paid_by,
      note,
      date: trueDate,
    });

    if (error) throw new Error(error.message);

    return { success: true, data, error: null };
  } catch (e) {
    console.error("Failed to add contribution:", e);
    return { success: false, erorr: (e as Error).message };
  }
}
