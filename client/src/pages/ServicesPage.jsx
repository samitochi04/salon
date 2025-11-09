import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchServices } from '../services/apiClient.js';

const durations = [
  { label: 'Tous', value: 'all' },
  { label: '≤ 60 min', value: 'short' },
  { label: '75 – 90 min', value: 'medium' },
  { label: '≥ 105 min', value: 'long' },
];

export function ServicesPage() {
  const [durationFilter, setDurationFilter] = useState('all');
  const { data: services = [], isLoading } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

  const filtered = useMemo(() => {
    if (durationFilter === 'all') return services;
    return services.filter((service) => {
      const duration = Number(service.duration_minutes);
      if (durationFilter === 'short') return duration <= 60;
      if (durationFilter === 'medium') return duration >= 75 && duration <= 90;
      return duration >= 105;
    });
  }, [durationFilter, services]);

  return (
    <div className="space-y-12">
      <header className="space-y-4 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">La carte Radiant Bloom</p>
        <h1 className="font-display text-5xl text-rb-brown">Des rituels pour restaurer votre lumière</h1>
        <p className="text-sm text-slate-600 sm:max-w-2xl">
          Chaque soin commence par une consultation intuitive puis se déroule dans une cabine privatisée. Nous utilisons des
          actifs botaniques, des pierres énergétiques et des techniques de remodelage facial pour des résultats visibles et durables.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {durations.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              durationFilter === option.value
                ? 'border-rb-gold bg-rb-gold text-rb-brown'
                : 'border-rb-brown/20 bg-white/80 text-rb-brown hover:border-rb-gold'
            }`}
            onClick={() => setDurationFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-600">Chargement des rituels…</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((service) => (
          <article key={service.id} className="flex h-full flex-col justify-between rounded-3xl bg-white/80 p-8 shadow-soft">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">{service.duration_minutes} minutes</p>
              <h2 className="font-display text-3xl text-rb-brown">{service.name}</h2>
              <p className="text-sm text-slate-600 whitespace-pre-line">{service.description}</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold text-rb-brown">
                {(Number(service.price_cents) / 100).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </span>
              <a
                href={`/reservation?service=${service.slug}`}
                className="text-sm font-semibold text-rb-gold hover:text-rb-brown"
              >
                Réserver ce rituel →
              </a>
            </div>
          </article>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="rounded-3xl bg-white/70 p-6 text-sm text-slate-600">
            Aucun rituel ne correspond à ce filtre pour le moment. Essayez une autre durée ou contactez notre concierge.
          </p>
        )}
      </div>
    </div>
  );
}
