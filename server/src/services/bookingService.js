const crypto = require("crypto");
const { z } = require("zod");
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
const { createHttpError } = require("../utils/httpError");
const { unwrap } = require("../utils/supabase");

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

async function getPublicServices(supabase) {
  const data = unwrap(await listActiveServices(supabase));
  return data;
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

  const bookingPayload = {
    confirmation_code: generateConfirmationCode(),
    service_id: service.id,
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
  createPublicBooking,
  fetchBookings,
  updateBookingAdmin,
};

