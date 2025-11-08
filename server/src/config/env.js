const path = require("path");
const dotenv = require("dotenv");

const defaults = {
  NODE_ENV: "development",
  PORT: "4000",
  CLIENT_ORIGIN: "http://localhost:5173",
};

const envFile =
  process.env.ENV_FILE ||
  (process.env.NODE_ENV === "test" ? ".env.test" : ".env");

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

const env = {
  nodeEnv: process.env.NODE_ENV || defaults.NODE_ENV,
  port: Number(process.env.PORT || defaults.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN || defaults.CLIENT_ORIGIN,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  emailFrom: process.env.EMAIL_FROM,
  adminInbox: process.env.ADMIN_INBOX,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpSecure: process.env.SMTP_SECURE,
};

const requiredAtRuntime = [
  "supabaseUrl",
  "supabaseServiceRoleKey",
  "supabaseAnonKey",
  "emailFrom",
  "adminInbox",
  "smtpHost",
  "smtpPort",
];

const missing = requiredAtRuntime.filter((key) => env[key] === undefined || env[key] === null || env[key] === "");
if (missing.length > 0 && env.nodeEnv !== "test") {
  // eslint-disable-next-line no-console
  console.warn(
    `⚠️  Missing environment variables: ${missing.join(
      ", ",
    )}. Ensure .env is populated before running the server.`,
  );
}

module.exports = { env };

