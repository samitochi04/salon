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

module.exports = {
  findStaffByAuthUserId,
  listStaffForService,
};

