"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    if (error.message === "Invalid login credentials") {
      redirect("/login?error=invalid");
    }
    console.log(error.message);
    redirect("/error");
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    display_name: formData.get("display-name") as string,
  };

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  const user = signUpData.user;

  if (!user || error) {
    redirect("/error");
  }

  const { error: displayNameError } = await supabase.from("users").insert({
    id: user.id,
    display_name: data.display_name,
  });

  if (displayNameError) {
    console.error(displayNameError.message);
  }

  const inviteCode = formData.get("invite-code") as string;

  const { data: success, error: houseError } = await supabase
    .from("houses")
    .select("id")
    .eq("code", inviteCode)
    .single();

  if (!success) {
    // Invalid invite code — still let them into dashboard without house
    console.log(houseError.message);
    redirect("/dashboard");
  }

  const { error: joinHouseError } = await supabase
    .from("house_members")
    .insert([
      { user_id: user.id, house_id: success.id, name: data.display_name },
    ]);

  if (joinHouseError) {
    console.log(joinHouseError.message);
    redirect("/error");
  }

  const { error: updateUserError } = await supabase
    .from("users")
    .update({ house_id: success.id })
    .eq("id", user.id);

  if (updateUserError) {
    console.error(updateUserError.message);
    redirect("/error");
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
