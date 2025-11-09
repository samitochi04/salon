const { z } = require("zod");
const { createHttpError } = require("../utils/httpError");
const { unwrap } = require("../utils/supabase");
const {
  getOperatingSettings,
  upsertOperatingSettings,
  listClosedDays,
  addClosedDay,
  removeClosedDay,
} = require("../repositories/scheduleRepository");

const DEFAULT_OPERATING_SETTINGS = Object.freeze({
  open_time: "09:00",
  close_time: "19:00",
  timezone: "Europe/Paris",
});

const scheduleUpdateSchema = z.object({
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(3).max(70).optional(),
});

const closurePayloadSchema = z.object({
  closed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional().nullable(),
});

const closureIdSchema = z.string().uuid();
const closureQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function normalizeTimeValue(value) {
  if (!value) return null;
  const str = String(value);
  return str.length >= 5 ? str.slice(0, 5) : str.padStart(5, "0");
}

async function ensureOperatingSettingsRecord(supabase) {
  const result = await getOperatingSettings(supabase);
  if (result.error) {
    throw createHttpError(500, result.error.message, {
      details: result.error.details,
      hint: result.error.hint,
    });
  }
  return result.data;
}

async function fetchOperatingSchedule(supabase) {
  const record = await ensureOperatingSettingsRecord(supabase);

  if (!record) {
    return {
      ...DEFAULT_OPERATING_SETTINGS,
      updated_at: null,
    };
  }

  return {
    open_time: normalizeTimeValue(record.open_time) ?? DEFAULT_OPERATING_SETTINGS.open_time,
    close_time: normalizeTimeValue(record.close_time) ?? DEFAULT_OPERATING_SETTINGS.close_time,
    timezone: record.timezone ?? DEFAULT_OPERATING_SETTINGS.timezone,
    updated_at: record.updated_at ?? null,
  };
}

async function updateOperatingSchedule(supabase, payload) {
  const input = scheduleUpdateSchema.parse(payload);

  if (input.open_time >= input.close_time) {
    throw createHttpError(400, "La fermeture doit être postérieure à l'ouverture.");
  }

  const updatePayload = {
    open_time: `${input.open_time}:00`,
    close_time: `${input.close_time}:00`,
  };

  if (input.timezone) {
    updatePayload.timezone = input.timezone;
  }

  const result = await upsertOperatingSettings(supabase, updatePayload);
  if (result.error) {
    throw createHttpError(500, result.error.message, {
      details: result.error.details,
      hint: result.error.hint,
    });
  }

  const record = result.data;

  return {
    open_time: normalizeTimeValue(record.open_time),
    close_time: normalizeTimeValue(record.close_time),
    timezone: record.timezone,
    updated_at: record.updated_at ?? null,
  };
}

async function fetchClosedDays(supabase, params = {}) {
  const input = closureQuerySchema.parse(params ?? {});
  const result = await listClosedDays(supabase, input.from, input.to);
  return unwrap(result);
}

async function createClosedDay(supabase, payload) {
  const input = closurePayloadSchema.parse(payload);
  const result = await addClosedDay(supabase, {
    closed_on: input.closed_on,
    reason: input.reason ?? null,
  });
  return unwrap(result, {
    notFoundMessage: "Impossible d'enregistrer cette fermeture.",
  });
}

async function deleteClosedDay(supabase, closureId) {
  const id = closureIdSchema.parse(closureId);
  const result = await removeClosedDay(supabase, id);
  return unwrap(result, {
    notFoundMessage: "Fermeture introuvable.",
  });
}

module.exports = {
  DEFAULT_OPERATING_SETTINGS,
  fetchOperatingSchedule,
  updateOperatingSchedule,
  fetchClosedDays,
  createClosedDay,
  deleteClosedDay,
};


