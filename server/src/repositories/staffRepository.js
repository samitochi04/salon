const salon = (supabase) => supabase.schema("salon");

async function findStaffByAuthUserId(supabase, authUserId) {
  return salon(supabase)
    .from("staff")
    .select(
      `
        id,
        display_name,
        auth_user_id
      `,
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();
}

async function listStaffForService(supabase, serviceId) {
  return salon(supabase)
    .from("staff_services")
    .select(
      `
        staff:staff_id (
          id,
          display_name
        )
      `,
    )
    .eq("service_id", serviceId);
}

async function listActiveStaff(supabase) {
  return salon(supabase)
    .from("staff")
    .select(
      `
        id,
        display_name,
        active
      `,
    )
    .eq("active", true)
    .order("display_name", { ascending: true });
}

async function linkStaffToService(supabase, assignments) {
  if (!assignments || assignments.length === 0) {
    return { data: [], error: null };
  }

  return salon(supabase)
    .from("staff_services")
    .upsert(assignments, {
      onConflict: "staff_id,service_id",
      ignoreDuplicates: true,
    });
}

module.exports = {
  findStaffByAuthUserId,
  listStaffForService,
  listActiveStaff,
  linkStaffToService,
};

