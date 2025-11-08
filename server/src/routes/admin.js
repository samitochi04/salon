const { Router } = require("express");

const router = Router();

router.get("/bookings", (_req, res) => {
  res.status(501).json({
    status: "pending",
    message: "Admin bookings feed not implemented yet.",
  });
});

router.patch("/bookings/:bookingId", (_req, res) => {
  res.status(501).json({
    status: "pending",
    message: "Update booking endpoint not implemented yet.",
  });
});

module.exports = router;

