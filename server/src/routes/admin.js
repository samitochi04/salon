const { Router } = require("express");

const router = Router();
const adminController = require("../controllers/adminController");
const { requireStaff } = require("../middlewares/requireStaff");

router.use(requireStaff);

router.get("/bookings", adminController.listBookings);
router.patch("/bookings/:bookingId", adminController.updateBooking);
router.get("/schedule", adminController.getSchedule);
router.put("/schedule", adminController.updateSchedule);
router.get("/closures", adminController.listClosures);
router.post("/closures", adminController.createClosure);
router.delete("/closures/:closureId", adminController.deleteClosure);

module.exports = router;

