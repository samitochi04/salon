const { Router } = require("express");
const { env } = require("../config/env");

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "radiant-bloom-api",
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

module.exports = router;

