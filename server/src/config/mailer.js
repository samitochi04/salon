const nodemailer = require("nodemailer");
const { env } = require("./env");

let cachedTransporter;

function resolveSecure(port, flag) {
  if (typeof flag === "string") {
    return flag.toLowerCase() === "true";
  }
  if (typeof flag === "boolean") {
    return flag;
  }
  return Number(port) === 465;
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  if (!env.smtpHost || !env.smtpPort) {
    throw new Error("SMTP credentials are missing");
  }

  const secure = resolveSecure(env.smtpPort, env.smtpSecure);

  cachedTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort),
    secure,
    auth:
      env.smtpUser && env.smtpPass
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
  });

  return cachedTransporter;
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const from = env.emailFrom;

  if (!from) {
    throw new Error("EMAIL_FROM not configured");
  }

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
}

module.exports = {
  getTransporter,
  sendEmail,
};

