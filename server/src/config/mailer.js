const { Resend } = require("resend");
const { env } = require("./env");

let cached;

function getMailClient() {
  if (!env.resendApiKey) {
    throw new Error("Resend API key missing");
  }

  if (!cached) {
    cached = new Resend(env.resendApiKey);
  }

  return cached;
}

async function sendEmail({ to, subject, html }) {
  const client = getMailClient();
  const from = env.emailFrom;

  if (!from) {
    throw new Error("EMAIL_FROM not configured");
  }

  return client.emails.send({
    from,
    to,
    subject,
    html,
  });
}

module.exports = {
  getMailClient,
  sendEmail,
};

