const salon = (supabase) => supabase.schema("salon");

async function getOperatingSettings(supabase) {
  return salon(supabase)
    .from("operating_settings")
    .select(
      `
        singleton,
        open_time,
        close_time,
        timezone,
        updated_at
      `,
    )
    .maybeSingle();
}

async function upsertOperatingSettings(supabase, payload) {
  return salon(supabase)
    .from("operating_settings")
    .upsert(
      {
        singleton: true,
        ...payload,
      },
      {
        onConflict: "singleton",
      },
    )
    .select(
      `
        singleton,
        open_time,
        close_time,
        timezone,
        updated_at
      `,
    )
    .maybeSingle();
}

async function listClosedDays(supabase, from, to) {
  let query = salon(supabase)
    .from("closed_days")
    .select(
      `
        id,
        closed_on,
        reason
      `,
    )
    .order("closed_on", { ascending: true });

  if (from) query = query.gte("closed_on", from);
  if (to) query = query.lte("closed_on", to);

  return query;
}

async function addClosedDay(supabase, payload) {
  return salon(supabase)
    .from("closed_days")
    .insert(payload)
    .select(
      `
        id,
        closed_on,
        reason
      `,
    )
    .maybeSingle();
}

async function removeClosedDay(supabase, id) {
  return salon(supabase)
    .from("closed_days")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
}

module.exports = {
  getOperatingSettings,
  upsertOperatingSettings,
  listClosedDays,
  addClosedDay,
  removeClosedDay,
};


