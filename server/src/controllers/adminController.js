const bookingService = require("../services/bookingService");
const { asyncHandler } = require("../utils/asyncHandler");

const listBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.fetchBookings(req.supabase, req.query);
  res.json({ data: bookings });
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingAdmin(
    req.supabase,
    req.params.bookingId,
    req.body,
    req.auth.staff,
  );
  res.json({ data: booking });
});

module.exports = {
  listBookings,
  updateBooking,
};

