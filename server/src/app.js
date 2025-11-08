const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const { createSupabaseClient } = require("./config/supabase");
const systemRouter = require("./routes/system");
const publicRouter = require("./routes/public");
const adminRouter = require("./routes/admin");
const { notFoundHandler } = require("./middlewares/notFoundHandler");
const { errorHandler } = require("./middlewares/errorHandler");

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const STATIC_ROOT = path.resolve(__dirname, "..", "..", "client", "public");

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: () => process.env.NODE_ENV === "test",
  }),
);

app.use((req, res, next) => {
  req.supabase = createSupabaseClient();
  next();
});

app.use(express.static(STATIC_ROOT));

app.use("/api/system", systemRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

