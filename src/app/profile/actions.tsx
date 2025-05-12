"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData, user_id: string) {
  const name = formData.get("name") as string;

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ display_name: name })
      .eq("id", user_id);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unknown error occurred";
    console.error(message);
    return { success: false, error: message };
  }
}

export async function updatePassword(formData: FormData) {
  const current_password = formData.get("current_password") as string;
  const new_password = formData.get("new_password") as string;
  const confirm_password = formData.get("confirm_password") as string;

  try {
    const supabase = await createClient();

    // Validate current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || "",
      password: current_password,
    });

    if (signInError) throw new Error("Current password is incorrect");

    // Check if new password matches confirmation
    if (new_password !== confirm_password) {
      throw new Error("New passwords do not match");
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unknown error occurred";
    console.error(message);
    return { success: false, error: message };
  }
}

export async function joinExistingHouse(formData: FormData) {
  const inviteCode = formData.get("invite-code") as string;

  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    //get profile

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Check if invite code exists and is valid
    const { data: houseData, error: houseError } = await supabase
      .from("houses")
      .select("id")
      .eq("code", inviteCode)
      .single();

    if (houseError) throw new Error("Invalid invite code");

    // Check if user belongs to an existing house
    const { data: memberData, error: memberError } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id);

    if (memberError) throw new Error("Failed to check membership");

    // If the user belongs to a house, remove them first
    if (memberData && memberData.length > 0) {
      const { error: deleteError } = await supabase
        .from("house_members")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw new Error("Failed to leave current house");
    }

    // Join the new house
    const { error: joinError } = await supabase.from("house_members").insert({
      user_id: user.id,
      house_id: houseData.id,
      role: "member",
      name: userData.display_name,
    });

    if (joinError) throw new Error("Failed to join house");

    //update user

    const { error: updateError } = await supabase
      .from("users")
      .update({
        house_id: houseData.id,
      })
      .eq("id", user.id);

    if (updateError) throw new Error("Failed to update user");

    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unknown error occurred";
    console.error(message);
    return { success: false, error: message };
  }
}

export async function createNewHouse(formData: FormData) {
  const house_name = formData.get("house-name") as string;
  const supabase = await createClient();

  try {
    //get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      throw new Error("Failed to get user");
    }

    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id);

    if (!userData || userDataError) {
      throw new Error("Failed to fetch user data");
    }

    //check if user belongs to a house

    const { data: memberData, error: memberDataError } = await supabase
      .from("house_members")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (memberDataError) {
      throw new Error("Failed to fetch house membership");
    }

    if (!memberData) {
      //if the user is not currently in a house...

      //generate a join code

      const response = await supabase.functions.invoke("generate-join-code", {
        body: { name: "Functions" },
      });

      if (!response) {
        throw new Error("Failed to generate join code");
      }

      console.log("creating house with code:", response.data.code);
      console.log("with user: ", userData[0].display_name);

      const { data: houseData, error: houseDataError } = await supabase
        .from("houses")
        .insert({
          name: house_name,
          created_by: user.id,
          code: response.data.code,
        })
        .select();

      if (!houseData || houseDataError) {
        throw new Error("Failed to create house");
      }

      //join house

      const { error: joinHouseError } = await supabase
        .from("house_members")
        .insert({
          house_id: houseData[0].id,
          user_id: user.id,
          name: userData[0].display_name,
          role: "admin",
        });

      if (joinHouseError) {
        throw new Error("Failed to join house");
      }

      //update user
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ house_id: houseData[0].id })
        .eq("id", user.id);

      if (updateUserError) {
        throw new Error("Failed to update user");
      }

      return { success: true };
    } else {
      //if the user is in a house

      //generate new house

      const response = await supabase.functions.invoke("generate-join-code", {
        body: { name: "Functions" },
      });

      if (!response) {
        throw new Error("Failed to generate join code");
      }

      console.log("creating house with code:", response.data.code);

      const { data: houseData, error: houseDataError } = await supabase
        .from("houses")
        .insert({
          name: house_name,
          created_by: user.id,
          code: response.data.code,
        })
        .select();

      if (!houseData || houseDataError) {
        throw new Error("Failed to create house");
      }

      // change user membership

      const { error: updateMemberError } = await supabase
        .from("house_members")
        .update({ house_id: houseData[0].id })
        .eq("user_id", user.id);

      if (updateMemberError) {
        throw new Error("Failed to update user membership");
      }

      //update user

      const { error: updateUserError } = await supabase
        .from("users")
        .update({ house_id: houseData[0].id })
        .eq("id", user.id);

      if (updateUserError) {
        throw new Error("Failed to update user");
      }

      return { success: true };
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unknown error occurred";
    console.error(message);
    return { success: false, error: message };
  }
}

export async function leaveHouse() {
  const supabase = await createClient();

  try {
    //get user_id
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      throw new Error("Failed to get user");
    }

    //remove row from members
    const { error: removeMemberError } = await supabase
      .from("house_members")
      .delete()
      .eq("user_id", user.id);

    if (removeMemberError) {
      throw new Error("Failed to remove user from house");
    }

    //update user

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ house_id: null })
      .eq("id", user.id);

    if (updateUserError) {
      throw new Error("Failed to update user");
    }

    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unknown error occurred";
    console.error(message);
    return { success: false, error: message };
  }
}
