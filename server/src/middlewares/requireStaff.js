const { createAnonSupabaseClient } = require("../config/supabase");
const { createHttpError } = require("../utils/httpError");
const { unwrap } = require("../utils/supabase");
const { findStaffByAuthUserId } = require("../repositories/staffRepository");

async function resolveUser(token) {
  if (!token) {
    throw createHttpError(401, "Authentication token missing");
  }
  const anonClient = createAnonSupabaseClient();
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user) {
    throw createHttpError(401, "Invalid authentication token");
  }
  return data.user;
}

async function requireStaff(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  const user = await resolveUser(token);
  const staffRecord = unwrap(
    await findStaffByAuthUserId(req.supabase, user.id),
    {
      notFoundMessage: "Staff membership required",
      notFoundStatus: 403,
    },
  );

  req.auth = {
    user,
    staff: staffRecord,
  };

  return next();
}

module.exports = { requireStaff };

