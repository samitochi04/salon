import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchServices } from '../services/apiClient.js';

const pillars = [
  {
    title: 'Rituels sur-mesure',
    description: 'Un diagnostic holistique, des textures haute couture et des protocoles personnalisés pour chaque peau.',
  },
  {
    title: 'Équipe d’artisans',
    description: 'Esthéticiennes formées aux thérapies douces, massages énergétiques et soins ciblés haute technologie.',
  },
  {
    title: 'Sérénité totale',
    description: 'Cabines privatisées, musique vibratoire, tisanerie ayurvédique et suivi avant/après le soin.',
  },
];

const testimonials = [
  {
    quote:
      'Une expérience sensorielle incroyable. Trois jours plus tard, ma peau rayonne encore. Merci pour votre douceur !',
    author: 'Camille, Paris 11ᵉ',
  },
  {
    quote:
      'L’équipe a pris le temps d’écouter mes besoins et m’a concocté un rituel complet. Je recommande les yeux fermés.',
    author: 'Stéphanie, Vincennes',
  },
  {
    quote:
      'J’ai retrouvé une peau apaisée après des mois de stress. Le + : les conseils nutrition & sommeil inclus.',
    author: 'Inès, Montreuil',
  },
];

export function HomePage() {
  const { data: services = [] } = useQuery({ queryKey: ['services-highlight'], queryFn: fetchServices });

  const featured = services.slice(0, 3);

  return (
    <div className="space-y-24">
      <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-rb-pink/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rb-brown">
            Maison de beauté intuitive
          </p>
          <h1 className="font-display text-5xl text-rb-brown sm:text-6xl">
            Rayonnez de l’intérieur comme de l’extérieur.
          </h1>
          <p className="text-lg text-slate-600">
            Radiant Bloom imagine des rituels de beauté et de bien-être qui harmonisent peau, corps et esprit.
            Nous associons technologie régénérante et soin énergétique pour révéler votre éclat naturel.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/reservation"
              className="inline-flex items-center justify-center rounded-full bg-rb-brown px-6 py-3 text-sm font-semibold text-rb-cream transition hover:bg-rb-gold hover:text-rb-brown"
            >
              Je réserve mon rituel
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-full border border-rb-brown/20 px-6 py-3 text-sm font-semibold text-rb-brown transition hover:border-rb-gold hover:text-rb-gold"
            >
              Découvrir les rituels
            </Link>
          </div>
        </div>
        <div className="relative h-96 overflow-hidden rounded-3xl bg-[url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-br from-rb-brown/30 via-rb-pink/20 to-transparent" />
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl bg-white/70 px-8 py-12 shadow-soft sm:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">{pillar.title}</p>
            <p className="text-sm text-slate-600">{pillar.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">Rituels signatures</p>
            <h2 className="font-display text-4xl text-rb-brown">Pensés pour votre peau et votre énergie</h2>
          </div>
          <Link to="/services" className="text-sm font-semibold text-rb-brown hover:text-rb-gold">
            Voir toute la carte
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((service) => (
            <article key={service.id} className="flex h-full flex-col justify-between rounded-3xl bg-white/80 p-6 shadow-soft">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">{service.duration_minutes} minutes</p>
                <h3 className="font-display text-2xl text-rb-brown">{service.name}</h3>
                <p className="text-sm text-slate-600 line-clamp-4">{service.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-rb-brown">
                  {(Number(service.price_cents) / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>
                <Link to={`/reservation?service=${service.slug}`} className="text-sm font-semibold text-rb-gold">
                  Réserver →
                </Link>
              </div>
            </article>
          ))}
          {featured.length === 0 && (
            <p className="text-sm text-slate-600">
              Le catalogue est en cours de chargement. Rendez-vous sur la page Rituels pour tout découvrir.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">Ce qu’elles en disent</p>
          <h2 className="font-display text-4xl text-rb-brown">Des visages apaisés, des esprits inspirés</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote key={testimonial.author} className="rounded-3xl bg-white/70 p-6 shadow-soft">
              <p className="text-sm text-slate-600">“{testimonial.quote}”</p>
              <footer className="mt-4 text-xs uppercase tracking-[0.2em] text-rb-gold">
                {testimonial.author}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-rb-brown py-16 text-rb-cream shadow-soft">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
          <p className="font-display text-4xl">Prêtes pour une nouvelle énergie ?</p>
          <p className="text-sm text-rb-pink/80">
            Notre concierge vous accompagne avant, pendant et après votre rituel pour prolonger les bienfaits chez vous.
          </p>
          <Link
            to="/reservation"
            className="rounded-full bg-rb-gold px-8 py-3 text-sm font-semibold text-rb-brown transition hover:bg-rb-pink"
          >
            Réserver ma parenthèse lumineuse
          </Link>
        </div>
      </section>
    </div>
  );
}
