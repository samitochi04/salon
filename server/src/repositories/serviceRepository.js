const salon = (supabase) => supabase.schema("salon");

async function listActiveServices(supabase) {
  return salon(supabase)
    .from("services")
    .select(
      `
        id,
        slug,
        name,
        description,
        duration_minutes,
        price_cents
      `,
    )
    .eq("active", true)
    .order("name", { ascending: true });
}

async function getServiceBySlug(supabase, slug) {
  return salon(supabase)
    .from("services")
    .select(
      `
        id,
        slug,
        name,
        description,
        duration_minutes,
        price_cents,
        active
      `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
}

async function createService(supabase, payload) {
  return salon(supabase)
    .from("services")
    .insert(payload)
    .select(
      `
        id,
        slug,
        name,
        description,
        duration_minutes,
        price_cents,
        active
      `,
    )
    .maybeSingle();
}

module.exports = {
  listActiveServices,
  getServiceBySlug,
  createService,
};

