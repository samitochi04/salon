const { sendEmail } = require("../config/mailer");
const { env } = require("../config/env");
const { logNotification } = require("../repositories/bookingRepository");

const STATUS_LABELS = {
  pending: "en attente",
  confirmed: "confirmée",
  completed: "effectuée",
  cancelled: "annulée",
};

function translateStatus(status) {
  return STATUS_LABELS[status] ?? status;
}

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
  const subject = "Radiant Bloom • Demande de réservation reçue";
  const start = formatDateTime(booking.start_time);
  const html = `
  <p>Bonjour ${booking.customer_full_name},</p>
  <p>Merci d’avoir choisi Radiant Bloom. Votre demande de réservation a bien été enregistrée et notre concierge vous confirmera le rendez-vous sous deux heures ouvrées.</p>
  <p><strong>Récapitulatif :</strong></p>
  <ul>
    <li>Soin : ${booking.service?.name ?? "Soin personnalisé"}</li>
    <li>Date et heure : ${start}</li>
    <li>Code de confirmation : <strong>${booking.confirmation_code}</strong></li>
  </ul>
  <p>Nous reviendrons très vite vers vous avec les conseils de préparation adaptés à vos objectifs.</p>
  <p>Avec gratitude,<br/>L’équipe Radiant Bloom</p>
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
  const subject = `Nouvelle demande de réservation • ${booking.customer_full_name}`;
  const html = `
  <p>Une nouvelle demande de réservation vient d’être reçue.</p>
  <ul>
    <li><strong>Client :</strong> ${booking.customer_full_name} (${booking.customer_email})</li>
    <li><strong>Soin :</strong> ${booking.service?.name ?? booking.service_id}</li>
    <li><strong>Date :</strong> ${formatDateTime(booking.start_time)}</li>
    <li><strong>Code :</strong> ${booking.confirmation_code}</li>
    <li><strong>Statut :</strong> ${translateStatus(booking.status)}</li>
  </ul>
  ${booking.customer_notes ? `<p><strong>Notes client :</strong><br/>${booking.customer_notes}</p>` : ""}
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
  const subject = `Radiant Bloom • Statut de réservation : ${translateStatus(booking.status)}`;
  const html = `
  <p>Bonjour ${booking.customer_full_name},</p>
  <p>Votre réservation <strong>${booking.confirmation_code}</strong> est désormais marquée comme <strong>${translateStatus(booking.status)}</strong>.</p>
  <p>Date &amp; heure : ${formatDateTime(booking.start_time)}<br/>
  Soin : ${booking.service?.name ?? "Soin personnalisé"}</p>
  <p>Pour toute question, il vous suffit de répondre à ce message ou de nous écrire à ${env.adminInbox}.</p>
  <p>À très vite,<br/>Radiant Bloom</p>
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

async function notifyAdminNewsletterSignup({ supabase, email }) {
  if (!env.adminInbox) return null;
  const subject = "Nouvelle inscription à la newsletter";
  const html = `
  <p>Une nouvelle adresse vient de s’inscrire à la newsletter Radiant Bloom :</p>
  <p><strong>${email}</strong></p>
  `;

  return safeSend({
    supabase,
    emailPayload: {
      to: env.adminInbox,
      subject,
      html,
    },
    logPayload: {
      event_type: "newsletter_signup",
      recipient: email,
    },
  });
}

module.exports = {
  notifyCustomerBookingReceived,
  notifyAdminBookingReceived,
  notifyCustomerStatusUpdate,
  notifyAdminNewsletterSignup,
  translateStatus,
};

