const salon = (supabase) => supabase.schema("salon");

async function listShiftBlocks(supabase, staffIds, from, to) {
  if (!staffIds || staffIds.length === 0) return { data: [], error: null };
  return salon(supabase)
    .from("availability_blocks")
    .select(
      `
        id,
        staff_id,
        starts_at,
        ends_at,
        kind,
        notes
      `,
    )
    .in("staff_id", staffIds)
    .eq("kind", "shift")
    .gte("starts_at", from)
    .lte("ends_at", to);
}

async function listBusyBlocks(supabase, staffIds, from, to) {
  if (!staffIds || staffIds.length === 0) return { data: [], error: null };
  return salon(supabase)
    .from("availability_blocks")
    .select(
      `
        id,
        staff_id,
        starts_at,
        ends_at,
        kind,
        notes
      `,
    )
    .in("staff_id", staffIds)
    .in("kind", ["break", "away"])
    .gte("starts_at", from)
    .lte("ends_at", to);
}

async function listBookingsForStaff(supabase, staffIds, from, to) {
  if (!staffIds || staffIds.length === 0) return { data: [], error: null };
  return salon(supabase)
    .from("bookings")
    .select(
      `
        id,
        staff_id,
        service_id,
        status,
        start_time,
        end_time
      `,
    )
    .in("staff_id", staffIds)
    .neq("status", "cancelled")
    .gte("start_time", from)
    .lte("end_time", to);
}

module.exports = {
  listShiftBlocks,
  listBusyBlocks,
  listBookingsForStaff,
};

