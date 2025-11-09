const bookingService = require("../services/bookingService");
const newsletterService = require("../services/newsletterService");
const { asyncHandler } = require("../utils/asyncHandler");

const getServices = asyncHandler(async (req, res) => {
  const services = await bookingService.getPublicServices(req.supabase);
  res.json({ data: services });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createPublicBooking(req.supabase, req.body);
  res.status(201).json({
    message: "Votre demande a été transmise. Nous revenons vers vous très vite.",
    data: booking,
  });
});

const subscribeNewsletter = asyncHandler(async (req, res) => {
  const subscription = await newsletterService.subscribe(req.supabase, req.body);
  res.status(201).json({
    message: "Merci ! Votre inscription à la newsletter est confirmée.",
    data: subscription,
  });
});

module.exports = {
  getServices,
  createBooking,
  subscribeNewsletter,
};
