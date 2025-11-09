const { Router } = require("express");

const router = Router();
const publicController = require("../controllers/publicController");

router.get("/services", publicController.getServices);
router.get("/services/:serviceSlug/availability", publicController.getAvailability);
router.post("/bookings", publicController.createBooking);
router.post("/newsletter", publicController.subscribeNewsletter);

module.exports = router;

