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
        price_cents
      `,
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
}

module.exports = {
  listActiveServices,
  getServiceBySlug,
};

