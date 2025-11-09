import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { subscribeNewsletter } from '../services/apiClient.js';

export function NewsletterCallout() {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState(null);

  const mutation = useMutation({
    mutationFn: subscribeNewsletter,
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Merci ! Votre inscription est confirmée.' });
      setEmail('');
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: error.message ?? 'Impossible de vous inscrire pour le moment.',
      });
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);
    mutation.mutate({ email });
  }

  return (
    <section className="bg-rb-brown text-rb-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="font-display text-2xl">Recevez nos rituels en avant-première</p>
          <p className="mt-2 text-sm text-rb-pink/80">
            Une fois par mois, des conseils beauté, des méditations guidées et des invitations privées.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="Votre adresse e-mail"
            className="flex-1 rounded-full border border-rb-gold/40 bg-rb-cream px-4 py-2 text-sm text-rb-brown placeholder:text-rb-brown/60 focus-visible:ring-rb-gold"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-full bg-rb-gold px-5 py-2 text-sm font-semibold text-rb-brown shadow-soft transition hover:bg-rb-pink"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Envoi…' : 'Je m’inscris'}
          </button>
        </form>
        {feedback && (
          <p
            className={`text-xs ${
              feedback.type === 'success' ? 'text-rb-sage' : 'text-rb-pink'
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  );
}
