const { sendEmail } = require("../config/mailer");
const { env } = require("../config/env");
const { logNotification } = require("../repositories/bookingRepository");

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function safeSend({ supabase, emailPayload, logPayload }) {
  try {
    const response = await sendEmail(emailPayload);
    if (supabase && logPayload) {
      await logNotification(supabase, {
        ...logPayload,
        status: "sent",
        payload: {
          to: emailPayload.to,
          subject: emailPayload.subject,
        },
      });
    }
    return response;
  } catch (error) {
    if (supabase && logPayload) {
      await logNotification(supabase, {
        ...logPayload,
        status: "failed",
        payload: {
          to: emailPayload.to,
          subject: emailPayload.subject,
          error: error.message,
        },
      });
    }
    // eslint-disable-next-line no-console
    console.error("Email delivery failed", error);
  }
  return null;
}

async function notifyCustomerBookingReceived({ supabase, booking }) {
  const subject = "Radiant Bloom • Booking request received";
  const start = formatDateTime(booking.start_time);
  const html = `
  <p>Hello ${booking.customer_full_name},</p>
  <p>Thank you for choosing Radiant Bloom. Your booking request has been received and our concierge will confirm within two business hours.</p>
  <p><strong>Reservation summary:</strong></p>
  <ul>
    <li>Ritual: ${booking.service?.name ?? "Custom ritual"}</li>
    <li>Date &amp; time: ${start}</li>
    <li>Confirmation code: <strong>${booking.confirmation_code}</strong></li>
  </ul>
  <p>We will be in touch shortly with preparation details designed around your goals.</p>
  <p>With gratitude,<br/>The Radiant Bloom Collective</p>
`;

  return safeSend({
    supabase,
    emailPayload: {
      to: booking.customer_email,
      subject,
      html,
    },
    logPayload: {
      booking_id: booking.id,
      event_type: "booking_received_customer",
      recipient: booking.customer_email,
    },
  });
}

async function notifyAdminBookingReceived({ supabase, booking }) {
  if (!env.adminInbox) return null;
  const subject = `New booking request • ${booking.customer_full_name}`;
  const html = `
  <p>New booking submitted.</p>
  <ul>
    <li><strong>Client:</strong> ${booking.customer_full_name} (${booking.customer_email})</li>
    <li><strong>Service:</strong> ${booking.service?.name ?? booking.service_id}</li>
    <li><strong>Date:</strong> ${formatDateTime(booking.start_time)}</li>
    <li><strong>Confirmation code:</strong> ${booking.confirmation_code}</li>
    <li><strong>Status:</strong> ${booking.status}</li>
  </ul>
  ${booking.customer_notes ? `<p><strong>Client notes:</strong><br/>${booking.customer_notes}</p>` : ""}
`;

  return safeSend({
    supabase,
    emailPayload: {
      to: env.adminInbox,
      subject,
      html,
    },
    logPayload: {
      booking_id: booking.id,
      event_type: "booking_received_admin",
      recipient: env.adminInbox,
    },
  });
}

async function notifyCustomerStatusUpdate({ supabase, booking }) {
  const subject = `Radiant Bloom • Booking ${booking.status}`;
  const html = `
  <p>Hello ${booking.customer_full_name},</p>
  <p>Your booking <strong>${booking.confirmation_code}</strong> has been marked as <strong>${booking.status}</strong>.</p>
  <p>Date &amp; time: ${formatDateTime(booking.start_time)}<br/>
  Ritual: ${booking.service?.name ?? "Custom ritual"}</p>
  <p>If you have any questions, reply to this email or contact us at ${env.adminInbox}.</p>
  <p>Warmly,<br/>Radiant Bloom</p>
`;

  return safeSend({
    supabase,
    emailPayload: {
      to: booking.customer_email,
      subject,
      html,
    },
    logPayload: {
      booking_id: booking.id,
      event_type: "booking_status_update",
      recipient: booking.customer_email,
    },
  });
}

module.exports = {
  notifyCustomerBookingReceived,
  notifyAdminBookingReceived,
  notifyCustomerStatusUpdate,
};

