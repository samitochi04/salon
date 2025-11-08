const bookingService = require("../services/bookingService");
const { asyncHandler } = require("../utils/asyncHandler");

const getServices = asyncHandler(async (req, res) => {
  const services = await bookingService.getPublicServices(req.supabase);
  res.json({ data: services });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createPublicBooking(req.supabase, req.body);
  res.status(201).json({
    message: "Booking submitted. We will confirm shortly.",
    data: booking,
  });
});

module.exports = {
  getServices,
  createBooking,
};

