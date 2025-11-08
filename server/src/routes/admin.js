const { Router } = require("express");

const router = Router();
const adminController = require("../controllers/adminController");
const { requireStaff } = require("../middlewares/requireStaff");

router.use(requireStaff);

router.get("/bookings", adminController.listBookings);
router.patch("/bookings/:bookingId", adminController.updateBooking);

module.exports = router;

