const { Router } = require("express");

const router = Router();
const publicController = require("../controllers/publicController");

router.get("/services", publicController.getServices);
router.post("/bookings", publicController.createBooking);

module.exports = router;

