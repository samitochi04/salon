const bookingService = require("../services/bookingService");
const scheduleService = require("../services/scheduleService");
const catalogService = require("../services/catalogService");
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

const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.fetchOperatingSchedule(req.supabase);
  res.json({ data: schedule });
});

const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateOperatingSchedule(req.supabase, req.body);
  res.json({ data: schedule });
});

const listClosures = asyncHandler(async (req, res) => {
  const closures = await scheduleService.fetchClosedDays(req.supabase, req.query);
  res.json({ data: closures });
});

const createClosure = asyncHandler(async (req, res) => {
  const closure = await scheduleService.createClosedDay(req.supabase, req.body);
  res.status(201).json({ data: closure });
});

const deleteClosure = asyncHandler(async (req, res) => {
  await scheduleService.deleteClosedDay(req.supabase, req.params.closureId);
  res.status(204).end();
});

const createService = asyncHandler(async (req, res) => {
  const service = await catalogService.createCatalogService(req.supabase, req.body);
  res.status(201).json({ data: service });
});

module.exports = {
  listBookings,
  updateBooking,
  getSchedule,
  updateSchedule,
  listClosures,
  createClosure,
  deleteClosure,
  createService,
};

