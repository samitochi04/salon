const { Router } = require("express");

const router = Router();

router.get("/services", (_req, res) => {
  res.status(501).json({
    status: "pending",
    message: "Service catalog endpoint not implemented yet.",
  });
});

router.post("/bookings", (_req, res) => {
  res.status(501).json({
    status: "pending",
    message: "Booking submission endpoint not implemented yet.",
  });
});

module.exports = router;

