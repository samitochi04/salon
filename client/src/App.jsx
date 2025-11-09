import { Route, Routes, NavLink } from 'react-router-dom';
import { HomePage } from './pages/HomePage.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';
import { ReservationPage } from './pages/ReservationPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { useAuth } from './providers/AuthProvider.jsx';
import { NewsletterCallout } from './components/NewsletterCallout.jsx';

const navigation = [
  { to: '/', label: 'Accueil' },
  { to: '/services', label: 'Rituels' },
  { to: '/reservation', label: 'Réserver' },
  { to: '/dashboard', label: 'Espace équipe' },
];

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-rb-cream text-slate-900">
      <Announcement />
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-rb-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="group inline-flex items-center gap-2">
            <div className="rounded-full bg-rb-gold/20 p-2 text-rb-brown shadow-soft transition transform group-hover:-translate-y-0.5">
              RB
            </div>
            <div>
              <p className="font-display text-xl tracking-wide text-rb-brown">
                Radiant Bloom
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Maison de beauté holistique
              </p>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative transition-colors hover:text-rb-gold ${
                    isActive ? 'text-rb-brown' : 'text-slate-600'
                  }`
                }
              >
                {item.label}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 bg-rb-gold transition-transform duration-200 group-hover:scale-x-100" />
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/reservation"
            className="hidden rounded-full bg-rb-brown px-5 py-2 text-sm font-semibold text-rb-cream transition hover:bg-rb-gold md:inline-flex"
          >
            Réserver un rituel
          </NavLink>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="*"
            element={
              <div className="text-center">
                <p className="font-display text-4xl text-rb-brown">Page introuvable</p>
                <p className="mt-4 text-slate-600">
                  Désolés, la page que vous cherchez a été déplacée ou n’existe pas.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
      <NewsletterCallout />
      <Footer isAuthenticated={Boolean(user)} />
    </div>
  );
}

function Announcement() {
  return (
    <div className="bg-rb-brown/95 text-rb-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-3 text-sm sm:flex-row sm:px-6 lg:px-8">
        <p className="font-medium tracking-wide uppercase">Nouveau rituel "Éclat Lunaire" — ouverture des réservations de novembre</p>
        <NavLink
          to="/reservation"
          className="rounded-full bg-rb-gold px-4 py-1 text-xs font-semibold uppercase tracking-wider text-rb-brown"
        >
          Je réserve
        </NavLink>
      </div>
    </div>
  );
}

function Footer({ isAuthenticated }) {
  return (
    <footer className="border-t border-slate-200/60 bg-rb-cream/90">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-xl text-rb-brown">Radiant Bloom</p>
          <p className="mt-3 text-sm text-slate-600">
            12 rue des Lys, 75003 Paris
            <br />
            Du mardi au samedi, 10h – 20h
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Contact
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>+33 1 23 45 67 89</li>
            <li>concierge@radiantbloom.fr</li>
            <li>@radiantbloom.paris</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Navigation
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className="hover:text-rb-gold">
                  {item.label}
                </NavLink>
              </li>
            ))}
            {!isAuthenticated && (
              <li>
                <NavLink to="/dashboard" className="hover:text-rb-gold">
                  Espace équipe
                </NavLink>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Mentions
          </p>
          <p className="mt-3 text-sm text-slate-600">
            © {new Date().getFullYear()} Radiant Bloom. Tous droits réservés. Numéro SIRET : 912 345 678 00024.
          </p>
        </div>
      </div>
    </footer>
  );
}
