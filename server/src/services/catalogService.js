const { z } = require("zod");

const { createService } = require("../repositories/serviceRepository");
const {
  listActiveStaff,
  linkStaffToService,
} = require("../repositories/staffRepository");
const { unwrap } = require("../utils/supabase");
const { createHttpError } = require("../utils/httpError");

const servicePayloadSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  duration_minutes: z.coerce.number().int().positive(),
  price_cents: z.coerce.number().int().nonnegative(),
  active: z.coerce.boolean().optional(),
});

async function createCatalogService(supabase, payload) {
  const input = servicePayloadSchema.parse(payload);

  const inserted = unwrap(
    await createService(supabase, {
      name: input.name,
      description: input.description,
      duration_minutes: input.duration_minutes,
      price_cents: input.price_cents,
      active: typeof input.active === "boolean" ? input.active : true,
    }),
    {
      notFoundMessage: "Unable to create service.",
    },
  );

  const staffRows = unwrap(await listActiveStaff(supabase));
  const activeStaff = staffRows.filter((staff) => staff?.id);

  if (activeStaff.length === 0) {
    throw createHttpError(
      409,
      "Le service a été créé mais aucun membre actif n'est enregistré. Ajoutez votre équipe avant de publier des rituels.",
    );
  }

  const linkResult = await linkStaffToService(
    supabase,
    activeStaff.map((staff) => ({
      staff_id: staff.id,
      service_id: inserted.id,
    })),
  );
  if (linkResult.error) {
    throw createHttpError(500, linkResult.error.message, {
      details: linkResult.error.details,
      hint: linkResult.error.hint,
    });
  }

  return {
    ...inserted,
    staff_count: activeStaff.length,
  };
}

module.exports = {
  createCatalogService,
};


