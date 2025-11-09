const crypto = require("crypto");
const { z } = require("zod");
const { format } = require("date-fns");
const { fromZonedTime, toZonedTime } = require("date-fns-tz");
const {
  listActiveServices,
  getServiceBySlug,
} = require("../repositories/serviceRepository");
const {
  createBooking,
  listBookings,
  getBookingById,
  updateBooking,
  addBookingNote,
} = require("../repositories/bookingRepository");
const { notifyCustomerBookingReceived, notifyAdminBookingReceived, notifyCustomerStatusUpdate } = require("./notificationService");
const { DEFAULT_OPERATING_SETTINGS } = require("./scheduleService");
const { createHttpError } = require("../utils/httpError");
const { unwrap } = require("../utils/supabase");
const {
  listStaffForService,
  listActiveStaff,
  linkStaffToService,
} = require("../repositories/staffRepository");
const {
  listBusyBlocks,
  listBookingsForStaff,
} = require("../repositories/availabilityRepository");
const {
  getOperatingSettings,
  listClosedDays,
} = require("../repositories/scheduleRepository");

const SCHEDULING_WINDOW_DAYS = 42;

const bookingRequestSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  service: z.string().min(1),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(2000).optional(),
});

const bookingQuerySchema = z.object({
  status: z
    .union([
      z.enum(["pending", "confirmed", "completed", "cancelled"]),
      z.array(z.enum(["pending", "confirmed", "completed", "cancelled"])),
    ])
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

const bookingUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  staff_id: z.string().uuid().nullable().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  internal_note: z.string().max(1000).optional(),
});

function buildDateTime(date, time) {
  const composed = new Date(`${date}T${time}`);
  if (Number.isNaN(composed.getTime())) {
    throw createHttpError(400, "Invalid appointment date or time.");
  }
  return composed;
}

function generateConfirmationCode() {
  return `RB-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function addDays(date, days) {
  const clone = new Date(date.getTime());
  clone.setDate(clone.getDate() + days);
  return clone;
}

function startOfDay(date) {
  const clone = new Date(date.getTime());
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function formatDateKey(date, timeZone = DEFAULT_OPERATING_SETTINGS.timezone) {
  const zoned = toZonedTime(date, timeZone);
  return format(zoned, "yyyy-MM-dd");
}

function formatTimeLabel(date, timeZone = DEFAULT_OPERATING_SETTINGS.timezone) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}

function normalizeRange(range = {}) {
  const now = startOfDay(new Date());
  const from =
    range.from instanceof Date
      ? startOfDay(range.from)
      : range.from
        ? startOfDay(new Date(range.from))
        : now;

  const toCandidate =
    range.to instanceof Date ? new Date(range.to) : range.to ? new Date(range.to) : addDays(from, SCHEDULING_WINDOW_DAYS);

  const to = toCandidate <= from ? addDays(from, 1) : toCandidate;

  return {
    from,
    to,
    fromISO: from.toISOString(),
    toISO: to.toISOString(),
  };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

async function getStaffIdsForService(supabase, serviceId) {
  const rows = unwrap(await listStaffForService(supabase, serviceId));
  return rows
    .map((row) => row.staff?.id ?? row.staff_id ?? null)
    .filter((id) => typeof id === "string");
}

async function loadSchedulingArtifacts(supabase, staffIds, range) {
  if (!staffIds.length) {
    return {
      busy: [],
      bookings: [],
    };
  }

  const [busyRaw, bookingsRaw] = await Promise.all([
    listBusyBlocks(supabase, staffIds, range.fromISO, range.toISO),
    listBookingsForStaff(supabase, staffIds, range.fromISO, range.toISO),
  ]);

  const busy = unwrap(busyRaw);
  const bookings = unwrap(bookingsRaw);

  return { busy, bookings };
}

function normalizeTimeValue(value) {
  if (!value) return null;
  const str = String(value);
  return str.length >= 5 ? str.slice(0, 5) : str.padStart(5, "0");
}

async function resolveOperatingSettings(supabase) {
  const result = await getOperatingSettings(supabase);
  if (result.error) {
    throw createHttpError(500, result.error.message, {
      details: result.error.details,
      hint: result.error.hint,
    });
  }

  const record = result.data ?? {};
  const openTime = normalizeTimeValue(record.open_time) ?? DEFAULT_OPERATING_SETTINGS.open_time;
  const closeTime = normalizeTimeValue(record.close_time) ?? DEFAULT_OPERATING_SETTINGS.close_time;
  const timezone = record.timezone ?? DEFAULT_OPERATING_SETTINGS.timezone;

  if (openTime >= closeTime) {
    throw createHttpError(500, "Operating hours misconfigured. Closing time must be after opening time.");
  }

  return {
    openTime,
    closeTime,
    timezone,
  };
}

async function fetchClosedDatesSet(supabase, range) {
  const fromDate = range.fromISO.slice(0, 10);
  const toDate = range.toISO.slice(0, 10);
  const closedDays = unwrap(await listClosedDays(supabase, fromDate, toDate));
  const set = new Set();
  closedDays.forEach((row) => {
    if (row?.closed_on) {
      set.add(String(row.closed_on));
    }
  });
  return set;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function isoDateFromParts(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addUtcDays(date, days) {
  const clone = new Date(date.getTime());
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
}

function computeEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function computeFrenchHolidaySet(range, timeZone) {
  const set = new Set();
  const startYear = toZonedTime(range.from, timeZone).getFullYear();
  const endYear = toZonedTime(range.to, timeZone).getFullYear();

  for (let year = startYear - 1; year <= endYear + 1; year += 1) {
    const easterSunday = computeEasterSunday(year);
    const easterMonday = addUtcDays(easterSunday, 1);
    const ascension = addUtcDays(easterSunday, 39);
    const pentecostMonday = addUtcDays(easterSunday, 50);

    [
      isoDateFromParts(year, 1, 1), // Jour de l'An
      easterMonday.toISOString().slice(0, 10),
      isoDateFromParts(year, 5, 1), // Fête du Travail
      isoDateFromParts(year, 5, 8), // Victoire 1945
      ascension.toISOString().slice(0, 10),
      pentecostMonday.toISOString().slice(0, 10),
      isoDateFromParts(year, 7, 14), // Fête Nationale
      isoDateFromParts(year, 8, 15), // Assomption
      isoDateFromParts(year, 11, 1), // Toussaint
      isoDateFromParts(year, 11, 11), // Armistice
      isoDateFromParts(year, 12, 25), // Noël
    ].forEach((dateKey) => set.add(dateKey));
  }

  return set;
}

function shouldSkipBusinessDay(zonedDate, dateKey, closureSet, holidaySet) {
  const weekday = zonedDate.getDay();
  if (weekday === 0 || weekday === 6) return true;
  if (holidaySet.has(dateKey)) return true;
  if (closureSet.has(dateKey)) return true;
  return false;
}

function buildBusyLookup(staffIds, busyBlocks, bookings) {
  const busyByStaff = new Map();
  staffIds.forEach((id) => busyByStaff.set(id, []));

  const register = (staffId, start, end) => {
    if (!busyByStaff.has(staffId)) busyByStaff.set(staffId, []);
    busyByStaff.get(staffId).push({ start, end });
  };

  busyBlocks.forEach((block) => {
    const start = new Date(block.starts_at);
    const end = new Date(block.ends_at);
    register(block.staff_id, start, end);
  });

  bookings.forEach((booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    register(booking.staff_id, start, end);
  });

  return busyByStaff;
}

function generateSlotsForShift(shift, durationMs, busyByStaff, range) {
  const slots = [];
  const blockStart = new Date(shift.starts_at);
  const blockEnd = new Date(shift.ends_at);

  const windowStart = blockStart < range.from ? range.from : blockStart;
  const windowEnd = blockEnd > range.to ? range.to : blockEnd;

  let cursor = new Date(windowStart);
  const staffBusy = busyByStaff.get(shift.staff_id) ?? [];

  while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMs);
    const hasConflict = staffBusy.some((entry) =>
      overlaps(cursor, slotEnd, entry.start, entry.end),
    );
    if (!hasConflict) {
      slots.push({
        staff_id: shift.staff_id,
        start: new Date(cursor),
        end: slotEnd,
      });
    }
    cursor = new Date(cursor.getTime() + durationMs);
  }

  return slots;
}

async function buildAvailabilityMatrix(supabase, service, rangeInput) {
  const range = normalizeRange(rangeInput);
  let staffIds = await getStaffIdsForService(supabase, service.id);

  if (!staffIds.length) {
    const activeStaff = unwrap(await listActiveStaff(supabase));
    const activeStaffIds = activeStaff
      .map((staff) => staff?.id)
      .filter((id) => typeof id === "string");

    if (activeStaffIds.length) {
      const linkResult = await linkStaffToService(
        supabase,
        activeStaffIds.map((staffId) => ({
          staff_id: staffId,
          service_id: service.id,
        })),
      );
      if (linkResult.error) {
        throw createHttpError(500, linkResult.error.message, {
          details: linkResult.error.details,
          hint: linkResult.error.hint,
        });
      }
    }

    staffIds = activeStaffIds;
  }

  if (!staffIds.length) {
    return {
      availability: {},
      staffIds,
      range,
    };
  }

  const [artifacts, schedule, closureSet] = await Promise.all([
    loadSchedulingArtifacts(supabase, staffIds, range),
    resolveOperatingSettings(supabase),
    fetchClosedDatesSet(supabase, range),
  ]);

  const busyLookup = buildBusyLookup(staffIds, artifacts.busy, artifacts.bookings);
  const durationMs = Number(service.duration_minutes) * 60000;
  const holidaySet = computeFrenchHolidaySet(range, schedule.timezone);
  const availabilityMap = new Map();

  let cursor = startOfDay(range.from);
  while (cursor < range.to) {
    const zonedDate = toZonedTime(cursor, schedule.timezone);
    const dateKey = format(zonedDate, "yyyy-MM-dd");

    if (!shouldSkipBusinessDay(zonedDate, dateKey, closureSet, holidaySet)) {
      const openUtc = fromZonedTime(`${dateKey}T${schedule.openTime}`, schedule.timezone);
      const closeUtc = fromZonedTime(`${dateKey}T${schedule.closeTime}`, schedule.timezone);

      if (closeUtc > openUtc) {
        staffIds.forEach((staffId) => {
          const virtualShift = {
            staff_id: staffId,
            starts_at: openUtc.toISOString(),
            ends_at: closeUtc.toISOString(),
          };

          const slots = generateSlotsForShift(virtualShift, durationMs, busyLookup, range);
          slots.forEach((slot) => {
            const slotDateKey = formatDateKey(slot.start, schedule.timezone);
            if (!availabilityMap.has(slotDateKey)) {
              availabilityMap.set(slotDateKey, new Map());
            }
            const timeMap = availabilityMap.get(slotDateKey);
            const timeKey = formatTimeLabel(slot.start, schedule.timezone);
            if (!timeMap.has(timeKey)) {
              timeMap.set(timeKey, new Set());
            }
            timeMap.get(timeKey).add(slot.staff_id);
          });
        });
      }
    }

    cursor = addDays(cursor, 1);
  }

  const availability = {};
  availabilityMap.forEach((timeMap, dateKey) => {
    const sortedTimes = Array.from(timeMap.keys()).sort();
    availability[dateKey] = {};
    sortedTimes.forEach((timeKey) => {
      availability[dateKey][timeKey] = Array.from(timeMap.get(timeKey));
    });
  });

  return {
    availability,
    staffIds,
    range,
  };
}

async function getPublicServices(supabase) {
  const data = unwrap(await listActiveServices(supabase));
  return data;
}

async function getServiceAvailability(supabase, { serviceSlug, from, to } = {}) {
  const service = unwrap(
    await getServiceBySlug(supabase, serviceSlug),
    {
      notFoundMessage: "Service introuvable.",
    },
  );

  const availabilityMatrix = await buildAvailabilityMatrix(supabase, service, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  return {
    service: {
      id: service.id,
      slug: service.slug,
      name: service.name,
      duration_minutes: service.duration_minutes,
      description: service.description,
    },
    availability: availabilityMatrix.availability,
    window: {
      from: availabilityMatrix.range.fromISO,
      to: availabilityMatrix.range.toISO,
    },
  };
}

async function createPublicBooking(supabase, payload) {
  const input = bookingRequestSchema.parse(payload);

  const service = unwrap(
    await getServiceBySlug(supabase, input.service),
    {
      notFoundMessage: "Selected ritual is unavailable.",
    },
  );

  const start = buildDateTime(input.appointment_date, `${input.appointment_time}`);
  const end = new Date(start.getTime() + Number(service.duration_minutes) * 60000);

  const schedule = await resolveOperatingSettings(supabase);
  const dayRange = {
    from: startOfDay(start),
    to: addDays(startOfDay(start), 1),
  };
  const dailyAvailability = await buildAvailabilityMatrix(supabase, service, dayRange);
  const dateKey = formatDateKey(start, schedule.timezone);
  const timeKey = formatTimeLabel(start, schedule.timezone);
  const availableStaff = dailyAvailability.availability[dateKey]?.[timeKey];

  if (!availableStaff || availableStaff.length === 0) {
    throw createHttpError(
      409,
      "Le créneau sélectionné n’est plus disponible. Merci de choisir un autre horaire.",
    );
  }

  const bookingPayload = {
    confirmation_code: generateConfirmationCode(),
    service_id: service.id,
    staff_id: availableStaff[0],
    customer_full_name: input.full_name,
    customer_email: input.email,
    customer_phone: input.phone ?? null,
    customer_notes: input.notes ?? null,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };

  const booking = unwrap(await createBooking(supabase, bookingPayload));

  await Promise.all([
    notifyCustomerBookingReceived({ supabase, booking }),
    notifyAdminBookingReceived({ supabase, booking }),
  ]);

  return booking;
}

async function fetchBookings(supabase, queryParams) {
  const filters = bookingQuerySchema.parse(queryParams ?? {});
  const data = unwrap(await listBookings(supabase, filters));
  return data;
}

async function updateBookingAdmin(supabase, bookingId, body, staff) {
  const updates = bookingUpdateSchema.parse(body);
  const hasUpdates =
    typeof updates.status !== "undefined" ||
    typeof updates.staff_id !== "undefined" ||
    typeof updates.start_time !== "undefined" ||
    typeof updates.end_time !== "undefined";

  if (!hasUpdates && !updates.internal_note) {
    throw createHttpError(400, "Nothing to update.");
  }

  let updatedBooking = unwrap(await getBookingById(supabase, bookingId), {
    notFoundMessage: "Booking not found.",
  });

  if (hasUpdates) {
    const patch = {};
    if (updates.status) patch.status = updates.status;
    if (typeof updates.staff_id !== "undefined") patch.staff_id = updates.staff_id;
    if (updates.start_time) {
      patch.start_time = updates.start_time;
      if (!updates.end_time && updatedBooking.service?.duration_minutes) {
        const startDate = new Date(updates.start_time);
        if (!Number.isNaN(startDate.getTime())) {
          patch.end_time = new Date(
            startDate.getTime() + updatedBooking.service.duration_minutes * 60000,
          ).toISOString();
        }
      }
    }
    if (updates.end_time) patch.end_time = updates.end_time;

    if (Object.keys(patch).length > 0) {
      updatedBooking = unwrap(await updateBooking(supabase, bookingId, patch));
    }
  }

  if (updates.internal_note) {
    await addBookingNote(supabase, {
      booking_id: bookingId,
      author_id: staff.id,
      note: updates.internal_note,
    });
  }

  if (updates.status && updates.status !== "pending") {
    await notifyCustomerStatusUpdate({ supabase, booking: updatedBooking });
  }

  return updatedBooking;
}

module.exports = {
  getPublicServices,
  getServiceAvailability,
  createPublicBooking,
  fetchBookings,
  updateBookingAdmin,
};

