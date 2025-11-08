async function listActiveServices(supabase) {
  return supabase
    .from("salon.services")
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
  return supabase
    .from("salon.services")
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

