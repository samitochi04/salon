function baseBookingSelect() {
  return `
    id,
    confirmation_code,
    public_token,
    status,
    start_time,
    end_time,
    customer_full_name,
    customer_email,
    customer_phone,
    customer_notes,
    created_at,
    updated_at,
    service:service_id (
      id,
      slug,
      name,
      duration_minutes,
      price_cents
    ),
    staff:staff_id (
      id,
      display_name
    )
  `;
}

async function createBooking(supabase, payload) {
  return supabase
    .from("salon.bookings")
    .insert(payload)
    .select(baseBookingSelect())
    .single();
}

async function listBookings(supabase, { status, from, to, limit = 50 } = {}) {
  let query = supabase
    .from("salon.bookings")
    .select(baseBookingSelect())
    .order("start_time", { ascending: true });

  if (status) {
    query = query.in("status", Array.isArray(status) ? status : [status]);
  }

  if (from) {
    query = query.gte("start_time", from);
  }

  if (to) {
    query = query.lte("start_time", to);
  }

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

async function getBookingById(supabase, bookingId) {
  return supabase
    .from("salon.bookings")
    .select(baseBookingSelect())
    .eq("id", bookingId)
    .maybeSingle();
}

async function updateBooking(supabase, bookingId, updates) {
  return supabase
    .from("salon.bookings")
    .update(updates)
    .eq("id", bookingId)
    .select(baseBookingSelect())
    .single();
}

async function addBookingNote(supabase, notePayload) {
  return supabase.from("salon.booking_notes").insert(notePayload);
}

async function logNotification(supabase, payload) {
  return supabase.from("salon.notification_log").insert(payload);
}

module.exports = {
  createBooking,
  listBookings,
  getBookingById,
  updateBooking,
  addBookingNote,
  logNotification,
};

