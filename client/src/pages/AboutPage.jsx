import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const teamMembers = [
  {
    name: 'Léa Martin',
    role: 'Fondatrice & Facialiste holistique',
    photo:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    bio: 'Spécialiste des rituels sur-mesure et des massages sculptants, Léa accompagne chaque cliente avec une vision globale de la beauté.',
  },
  {
    name: 'Maya Dupont',
    role: 'Experte cils & maquillage lumière',
    photo:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e2?auto=format&fit=crop&w=600&q=80',
    bio: 'Passionnée par le regard, Maya magnifie les traits et sublime les lignes avec précision et douceur.',
  },
  {
    name: 'Anaïs Bonnet',
    role: 'Maître manucure & soins mains-pieds',
    photo:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    bio: 'Anaïs signe des réalisations haute couture pour les mains et les pieds, mêlant design, nutrition et relaxation.',
  },
];

const testimonials = [
  {
    quote:
      'Un voyage sensoriel hors du temps. Mon teint est rayonnant et mon esprit totalement apaisé. Merci pour cette parenthèse précieuse.',
    author: 'Nina, Paris 03',
  },
  {
    quote:
      'La manucure sur mesure a transformé mes mains. Les détails, l’écoute, la douceur… une expérience incomparable.',
    author: 'Sarah, Vincennes',
  },
  {
    quote:
      'J’ai adoré le rituel cils : naturel, sophistiqué et adapté à mon visage. L’équipe a un vrai sens artistique.',
    author: 'Inès, Saint-Mandé',
  },
];

const realizations = [
  {
    title: 'Manucure nacrée',
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
    description: 'Capsule lumineuse inspirée des pierres fines, finition miroir et massage revisité.',
  },
  {
    title: 'Rituel visage “Éclat Lunaire”',
    image:
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80',
    description: 'Un soin régénérant intégrant cryothérapie douce, gua sha et luminothérapie ciblée.',
  },
  {
    title: 'Extensions cils velours',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653f2?auto=format&fit=crop&w=900&q=80',
    description: 'Courbures aériennes, densité progressive : un regard couture pensé pour le quotidien.',
  },
  {
    title: 'Spa pédicure minérale',
    image:
      'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=900&q=80',
    description: 'Rituel revitalisant avec bain au quartz rose, gommage enzymatique et modelage réflexe.',
  },
  {
    title: 'Maquillage lumière',
    image:
      'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=900&q=80',
    description: 'Palette solaire, reflets or rose et teint de soie pour un shooting éditorial.',
  },
  {
    title: 'Rituel apaisant dos',
    image:
      'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=900&q=80',
    description: 'Massage signatures, pierres chaudes et enveloppement reminéralisant aux algues.',
  },
];

export function AboutPage() {
  const gallery = useMemo(() => realizations, []);

  return (
    <div className="space-y-20">
      <section className="rounded-3xl bg-white/80 p-8 shadow-soft sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rb-gold">Notre vision</p>
        <h1 className="mt-3 font-display text-5xl text-rb-brown">
          Une maison de beauté où chaque détail rayonne
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-600">
          Radiant Bloom imagine des expériences sensorielles complètes : diagnostics intuitifs, gestuelles
          expertes, matières précieuses et attentions délicates. Notre équipe se forme continuellement aux
          techniques les plus pointues pour offrir des résultats visibles et durables, tout en honorant les
          rythmes naturels du corps.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/reservation"
            className="inline-flex items-center justify-center rounded-full bg-rb-brown px-6 py-3 text-sm font-semibold text-rb-cream transition hover:bg-rb-gold hover:text-rb-brown"
          >
            Découvrir nos rituels
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center justify-center rounded-full border border-rb-brown/20 px-6 py-3 text-sm font-semibold text-rb-brown transition hover:border-rb-gold hover:text-rb-gold"
          >
            Parcourir la carte
          </Link>
        </div>
      </section>

      <section id="equipe" className="space-y-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rb-gold">Notre équipe</p>
          <h2 className="font-display text-4xl text-rb-brown">Les artisans du glow</h2>
          <p className="text-sm text-slate-600">
            Des personnalités sensibles, créatives et attentives qui unissent leurs talents pour magnifier votre
            énergie.
          </p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="flex h-full flex-col overflow-hidden rounded-3xl bg-white/80 shadow-soft transition hover:-translate-y-1"
            >
              <div
                className="h-56 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${member.photo})` }}
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col space-y-3 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rb-gold">
                    {member.role}
                  </p>
                  <h3 className="font-display text-xl text-rb-brown">{member.name}</h3>
                </div>
                <p className="text-sm text-slate-600">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="goal" className="rounded-3xl bg-rb-brown/95 px-8 py-12 text-rb-cream shadow-soft sm:px-12">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 sm:items-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rb-gold">Notre ambition</p>
            <h2 className="font-display text-4xl">Réinventer le temps pour soi</h2>
          </div>
          <p className="text-sm text-rb-cream/90">
            Nous créons des parenthèses qui alignent corps, esprit et émotions. Chaque séance est conçue comme
            un rituel personnel : une écoute active, une posture respectueuse, une narration sensorielle. Nous
            tissons des liens durables avec nos clientes pour que la transformation lumineuse se prolonge bien
            au-delà du salon.
          </p>
        </div>
      </section>

      <section id="realisations" className="space-y-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rb-gold">Réalisations</p>
          <h2 className="font-display text-4xl text-rb-brown">Nos vitrines de beauté intuitive</h2>
          <p className="text-sm text-slate-600">
            Une sélection de looks et de rituels capturés en studio et en cabine privée. Des textures, des
            matières et des gestes pensés pour émerveiller.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {gallery.map((item) => (
            <article
              key={item.title}
              className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/80 shadow-soft transition hover:-translate-y-1"
            >
              <div
                className="relative h-60 w-full overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="space-y-2 p-6">
                <h3 className="font-display text-2xl text-rb-brown">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="temoignages" className="space-y-8 rounded-3xl bg-white/80 p-8 shadow-soft sm:p-12">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rb-gold">Témoignages</p>
          <h2 className="font-display text-4xl text-rb-brown">Elles témoignent de leur glow</h2>
          <p className="text-sm text-slate-600">
            Des voix qui racontent la douceur de l’accueil, la précision des soins et l’impact durable de nos
            programmes personnalisés.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.author}
              className="flex h-full flex-col justify-between rounded-3xl bg-white/90 p-6 text-sm text-slate-600 shadow-soft"
            >
              <p className="italic">“{testimonial.quote}”</p>
              <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-rb-gold">
                {testimonial.author}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}


