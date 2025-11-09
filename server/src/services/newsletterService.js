const { z } = require("zod");
const { notifyAdminNewsletterSignup } = require("./notificationService");

const subscriptionSchema = z.object({
  email: z.string().email(),
});

async function subscribe(supabase, payload) {
  const input = subscriptionSchema.parse(payload);
  await notifyAdminNewsletterSignup({ supabase, email: input.email });
  return input;
}

module.exports = {
  subscribe,
};

