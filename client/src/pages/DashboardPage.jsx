import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  fetchAdminBookings,
  updateAdminBooking,
  fetchOperatingSchedule,
  updateOperatingSchedule,
  fetchClosedDays,
  createClosedDay,
  deleteClosedDay,
  createAdminService,
} from '../services/apiClient.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useStaffProfile } from '../hooks/useStaffProfile.js';
import { supabaseClient } from '../services/supabaseClient.js';

const statusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'completed', label: 'Effectuée' },
  { value: 'cancelled', label: 'Annulée' },
];

const dashboardTabs = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'bookings', label: 'Réservations' },
  { id: 'availability', label: 'Disponibilités' },
  { id: 'services', label: 'Catalogue' },
];

export function DashboardPage() {
  const { user, session, signIn, signOut, loading } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const staffProfileQuery = useStaffProfile(user);

  if (!user) {
    return <DashboardLogin loading={loading} onSignIn={signIn} error={authError} setError={setAuthError} />;
  }

  if (staffProfileQuery.isLoading) {
    return <DashboardShell title="Espace équipe"><p className="text-sm text-slate-600">Chargement de votre profil…</p></DashboardShell>;
  }

  if (staffProfileQuery.isError) {
    return (
      <DashboardShell title="Espace équipe">
        <p className="text-sm text-rb-pink">{staffProfileQuery.error.message}</p>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-6 inline-flex items-center rounded-full bg-rb-brown px-4 py-2 text-sm font-semibold text-rb-cream"
        >
          Se déconnecter
        </button>
      </DashboardShell>
    );
  }

  const staff = staffProfileQuery.data;
  const token = session?.access_token;

  return (
    <DashboardShell title="Espace équipe">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-rb-gold">Bienvenue</p>
          <p className="font-display text-3xl text-rb-brown">{staff.display_name}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-full border border-rb-brown/20 px-4 py-2 text-sm font-semibold text-rb-brown hover:border-rb-gold hover:text-rb-gold"
        >
          Se déconnecter
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {dashboardTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              activeTab === tab.id
                ? 'bg-rb-brown text-rb-cream'
                : 'border border-rb-brown/20 bg-white/70 text-rb-brown hover:border-rb-gold'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'overview' && <OverviewSection staff={staff} token={token} />}
        {activeTab === 'bookings' && <BookingsSection token={token} />}
        {activeTab === 'availability' && <AvailabilitySection staff={staff} token={token} />}
        {activeTab === 'services' && <ServicesSection token={token} />}
      </div>
    </DashboardShell>
  );
}

function DashboardShell({ title, children }) {
  return (
    <section className="space-y-6 rounded-3xl bg-white/80 p-8 shadow-soft">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">{title}</p>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function DashboardLogin({ loading, onSignIn, error, setError }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => onSignIn({ email, password }),
    onError: (err) => {
      setError(err.message ?? 'Connexion impossible.');
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ email: form.email, password: form.password });
  }

  return (
    <DashboardShell title="Espace équipe">
      <p className="text-lg text-slate-600">
        Connectez-vous avec vos identifiants Supabase pour accéder aux réservations, disponibilités et au catalogue.
      </p>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">E-mail professionnel</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-4 py-3 text-sm text-rb-brown"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Mot de passe</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-4 py-3 text-sm text-rb-brown"
          />
        </div>
        <button
          type="submit"
          disabled={loading || loginMutation.isPending}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-rb-brown px-6 py-3 text-sm font-semibold text-rb-cream hover:bg-rb-gold hover:text-rb-brown disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
        </button>
        {error && <p className="text-sm text-rb-pink">{error}</p>}
      </form>
    </DashboardShell>
  );
}

function OverviewSection({ staff, token }) {
  const params = useMemo(
    () => ({
      status: ['pending', 'confirmed'],
      from: new Date().toISOString(),
      limit: 20,
    }),
    [],
  );

  const { data: upcoming = [], isLoading } = useQuery({
    queryKey: ['admin-bookings', 'overview', params],
    queryFn: () => fetchAdminBookings({ token, filters: params }),
    enabled: Boolean(token),
  });

  const metrics = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0 };
    upcoming.forEach((booking) => {
      if (booking.status in counts) counts[booking.status] += 1;
    });
    return counts;
  }, [upcoming]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Demandes en attente" value={metrics.pending} />
        <MetricCard title="Confirmations" value={metrics.confirmed} />
        <MetricCard title="Soins terminés" value={metrics.completed} />
      </div>
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">À venir pour {staff.display_name}</p>
        {isLoading && <p className="text-sm text-slate-600">Chargement…</p>}
        <div className="space-y-3">
          {upcoming
            .filter((booking) => booking.staff?.id === staff.id)
            .map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          {!isLoading &&
            upcoming.filter((booking) => booking.staff?.id === staff.id).length === 0 && (
              <p className="text-sm text-slate-600">Aucun soin planifié sur les prochains jours.</p>
            )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white/70 p-6 shadow-soft">
      <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-rb-brown">{value}</p>
    </div>
  );
}

function BookingCard({ booking }) {
  const start = parseISO(booking.start_time);
  return (
    <article className="rounded-3xl bg-white/70 p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">
        {format(start, 'EEEE d MMMM • HH:mm', { locale: fr })}
      </p>
      <p className="mt-2 font-display text-2xl text-rb-brown">{booking.service?.name}</p>
      <p className="text-sm text-slate-600">{booking.customer_full_name}</p>
    </article>
  );
}

function BookingsSection({ token }) {
  const [statusFilter, setStatusFilter] = useState('pending');
  const queryClient = useQueryClient();

  const filters = useMemo(() => ({
    status: statusFilter === 'all' ? undefined : statusFilter,
    from: undefined,
    limit: 100,
  }), [statusFilter]);

  const bookingsQuery = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => fetchAdminBookings({ token, filters }),
    enabled: Boolean(token),
  });

  const staffListQuery = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .schema('salon')
        .from('staff')
        .select('id, display_name')
        .order('display_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: ({ bookingId, updates }) =>
      updateAdminBooking({ token, bookingId, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Filtrer par statut
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-full border border-rb-brown/20 bg-rb-cream px-4 py-2 text-xs uppercase tracking-[0.2em] text-rb-brown"
        >
          <option value="all">Tous</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {bookingsQuery.isLoading && <p className="text-sm text-slate-600">Chargement des réservations…</p>}
      <div className="space-y-4">
        {(bookingsQuery.data ?? []).map((booking) => (
          <div key={booking.id} className="grid gap-4 rounded-3xl bg-white/70 p-6 shadow-soft md:grid-cols-[2fr,1fr]">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">
                {format(parseISO(booking.start_time), 'EEEE d MMMM • HH:mm', { locale: fr })}
              </p>
              <p className="font-display text-xl text-rb-brown">{booking.service?.name}</p>
              <p className="text-sm text-slate-600">
                {booking.customer_full_name} — {booking.customer_email}
              </p>
              {booking.customer_phone && <p className="text-sm text-slate-600">{booking.customer_phone}</p>}
              {booking.customer_notes && (
                <p className="text-sm text-slate-500">Note cliente : {booking.customer_notes}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Statut
                </label>
                <select
                  defaultValue={booking.status}
                  onChange={(event) =>
                    mutation.mutate({ bookingId: booking.id, updates: { status: event.target.value } })
                  }
                  className="rounded-full border border-rb-brown/20 bg-rb-cream px-3 py-2 text-xs uppercase tracking-[0.2em] text-rb-brown"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Assignation</label>
                <select
                  defaultValue={booking.staff?.id ?? ''}
                  onChange={(event) =>
                    mutation.mutate({
                      bookingId: booking.id,
                      updates: { staff_id: event.target.value || null },
                    })
                  }
                  className="rounded-full border border-rb-brown/20 bg-rb-cream px-3 py-2 text-xs uppercase tracking-[0.2em] text-rb-brown"
                >
                  <option value="">Non assigné</option>
                  {(staffListQuery.data ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const note = event.currentTarget.elements.note.value;
                  if (!note) return;
                  mutation.mutate({
                    bookingId: booking.id,
                    updates: { internal_note: note },
                  });
                  event.currentTarget.reset();
                }}
                className="grid gap-2"
              >
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Ajouter une note interne
                </label>
                <textarea
                  name="note"
                  rows={2}
                  className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-full bg-rb-brown px-3 py-2 text-xs font-semibold text-rb-cream hover:bg-rb-gold hover:text-rb-brown"
                >
                  Enregistrer
                </button>
              </form>
            </div>
          </div>
        ))}
        {!bookingsQuery.isLoading && (bookingsQuery.data ?? []).length === 0 && (
          <p className="text-sm text-slate-600">Aucune réservation pour ce filtre.</p>
        )}
        {mutation.isError && (
          <p className="text-sm text-rb-pink">
            {mutation.error?.message ?? 'Échec de la mise à jour. Réessayez.'}
          </p>
        )}
      </div>
    </div>
  );
}

function AvailabilitySection({ staff, token }) {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [hoursForm, setHoursForm] = useState({
    open_time: '09:00',
    close_time: '19:00',
  });
  const [closureForm, setClosureForm] = useState({
    closed_on: '',
    reason: '',
  });

  const scheduleQuery = useQuery({
    queryKey: ['operating-schedule'],
    queryFn: () => fetchOperatingSchedule({ token }),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (scheduleQuery.data) {
      setHoursForm({
        open_time: scheduleQuery.data.open_time ?? '09:00',
        close_time: scheduleQuery.data.close_time ?? '19:00',
      });
    }
  }, [scheduleQuery.data]);

  const closuresQuery = useQuery({
    queryKey: ['closed-days'],
    queryFn: () => fetchClosedDays({ token, params: { from: today } }),
    enabled: Boolean(token),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (payload) => updateOperatingSchedule({ token, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-schedule'] });
    },
  });

  const createClosureMutation = useMutation({
    mutationFn: (payload) => createClosedDay({ token, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-days'] });
      setClosureForm({ closed_on: '', reason: '' });
    },
  });

  const deleteClosureMutation = useMutation({
    mutationFn: (closureId) => deleteClosedDay({ token, closureId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-days'] });
    },
  });

  const schedule = scheduleQuery.data ?? {
    open_time: hoursForm.open_time,
    close_time: hoursForm.close_time,
    timezone: 'Europe/Paris',
  };

  const closures = useMemo(
    () => [...(closuresQuery.data ?? [])].sort((a, b) => a.closed_on.localeCompare(b.closed_on)),
    [closuresQuery.data],
  );

  const previewDays = useMemo(
    () => buildPreviewDays(schedule, closures),
    [schedule.open_time, schedule.close_time, schedule.timezone, closures],
  );

  function handleScheduleSubmit(event) {
    event.preventDefault();
    updateScheduleMutation.mutate({
      open_time: hoursForm.open_time,
      close_time: hoursForm.close_time,
    });
  }

  function handleClosureSubmit(event) {
    event.preventDefault();
    if (!closureForm.closed_on) return;
    createClosureMutation.mutate({
      closed_on: closureForm.closed_on,
      reason: closureForm.reason || null,
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/70 p-6 shadow-soft">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">
            Horaires automatiques du salon
          </p>
          <p className="text-sm text-slate-600">
            Paramétrez les heures d’ouverture de Radiant Bloom du lundi au vendredi. Les week-ends et jours fériés
            français sont bloqués automatiquement. Utilisez les fermetures exceptionnelles pour indiquer les rares jours
            où {staff.display_name} et l’équipe ne reçoivent pas.
          </p>
        </div>

        <form onSubmit={handleScheduleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Ouverture (lun — ven)</label>
            <input
              type="time"
              required
              value={hoursForm.open_time}
              onChange={(event) => setHoursForm((prev) => ({ ...prev, open_time: event.target.value }))}
              className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Fermeture (lun — ven)</label>
            <input
              type="time"
              required
              value={hoursForm.close_time}
              onChange={(event) => setHoursForm((prev) => ({ ...prev, close_time: event.target.value }))}
              className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-rb-brown px-4 py-2 text-sm font-semibold text-rb-cream hover:bg-rb-gold hover:text-rb-brown disabled:opacity-60"
              disabled={updateScheduleMutation.isPending}
            >
              {updateScheduleMutation.isPending ? 'Enregistrement…' : 'Enregistrer les horaires'}
            </button>
            {updateScheduleMutation.isError && (
              <p className="mt-2 text-sm text-rb-pink">
                {updateScheduleMutation.error?.message ?? 'Impossible de mettre à jour les horaires.'}
              </p>
            )}
          </div>
        </form>
        {scheduleQuery.isLoading && <p className="mt-3 text-sm text-slate-600">Chargement des horaires…</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-soft">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">
              Fermetures exceptionnelles
            </p>
            <p className="text-xs text-slate-500">
              Ajoutez les jours où le salon sera fermé en dehors des week-ends ou jours fériés.
            </p>
          </div>
          <form onSubmit={handleClosureSubmit} className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Date</label>
              <input
                type="date"
                min={today}
                required
                value={closureForm.closed_on}
                onChange={(event) => setClosureForm((prev) => ({ ...prev, closed_on: event.target.value }))}
                className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Motif (optionnel)</label>
              <input
                type="text"
                value={closureForm.reason}
                onChange={(event) => setClosureForm((prev) => ({ ...prev, reason: event.target.value }))}
                className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
                placeholder="Ex. Inventaire, formation, travaux…"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-rb-brown px-4 py-2 text-sm font-semibold text-rb-cream hover:bg-rb-gold hover:text-rb-brown disabled:opacity-60"
              disabled={createClosureMutation.isPending}
            >
              {createClosureMutation.isPending ? 'Ajout…' : 'Bloquer cette journée'}
            </button>
            {createClosureMutation.isError && (
              <p className="text-sm text-rb-pink">
                {createClosureMutation.error?.message ?? 'Impossible d’ajouter cette fermeture.'}
              </p>
            )}
          </form>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Prochaines fermetures</p>
            {closuresQuery.isLoading && <p className="text-sm text-slate-600">Chargement…</p>}
            <div className="space-y-3">
              {closures.map((closure) => (
                <div key={closure.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">
                      {format(parseISO(`${closure.closed_on}T00:00:00`), 'EEEE d MMMM', { locale: fr })}
                    </p>
                    {closure.reason && <p className="text-xs text-slate-500">{closure.reason}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteClosureMutation.mutate(closure.id)}
                    className="rounded-full border border-rb-brown/20 px-3 py-1 text-xs font-semibold text-rb-brown hover:border-rb-gold hover:text-rb-gold disabled:opacity-60"
                    disabled={deleteClosureMutation.isPending}
                  >
                    Retirer
                  </button>
                </div>
              ))}
              {!closuresQuery.isLoading && closures.length === 0 && (
                <p className="text-sm text-slate-600">Aucune fermeture programmée — le salon reste ouvert.</p>
              )}
              {deleteClosureMutation.isError && (
                <p className="text-sm text-rb-pink">
                  {deleteClosureMutation.error?.message ?? 'Impossible de supprimer cette fermeture.'}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">
            Aperçu des 14 prochains jours
          </p>
          <ol className="space-y-2">
            {previewDays.map((day) => (
              <li
                key={day.dateKey}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-soft"
              >
                <div>
                  <p className="font-semibold text-rb-brown">{day.label}</p>
                  <p className="text-xs text-slate-500">{day.note}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    day.status === 'open'
                      ? 'bg-rb-sage/30 text-rb-sage'
                      : 'bg-rb-pink/30 text-rb-pink'
                  }`}
                >
                  {day.status === 'open' ? 'Ouvert' : 'Fermé'}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function ServicesSection({ token }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price_cents: 12000,
  });

  const servicesQuery = useQuery({
    queryKey: ['dashboard-services'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .schema('salon')
        .from('services')
        .select('id, name, slug, description, duration_minutes, price_cents, active')
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createAdminService({ token, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-services'] });
      setForm({ name: '', description: '', duration_minutes: 60, price_cents: 12000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabaseClient
        .schema('salon')
        .from('services')
        .update(updates)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-services'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabaseClient.schema('salon').from('services').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-services'] }),
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Gérez la carte des rituels. Les modifications appliquées ici sont visibles immédiatement sur le site public, sous réserve
        des règles de sécurité Supabase (RLS). En cas d’erreur d’autorisation, contactez l’administrateur pour ajuster les
        politiques.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate({
            name: form.name,
            description: form.description,
            duration_minutes: Number(form.duration_minutes),
            price_cents: Number(form.price_cents),
            active: true,
          });
        }}
        className="grid gap-4 rounded-3xl bg-white/70 p-6 shadow-soft"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">Ajouter un rituel</p>
        <input
          required
          placeholder="Nom du rituel"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
        />
        <p className="text-xs text-slate-500">
          L’identifiant (slug) est généré automatiquement à partir du nom. Il apparaîtra ci-dessous une fois enregistré.
        </p>
        <textarea
          required
          rows={3}
          placeholder="Description détaillée"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            required
            min={15}
            step={15}
            placeholder="Durée (minutes)"
            value={form.duration_minutes}
            onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
            className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
          />
          <input
            type="number"
            required
            min={0}
            step={500}
            placeholder="Tarif en centimes"
            value={form.price_cents}
            onChange={(event) => setForm((prev) => ({ ...prev, price_cents: event.target.value }))}
            className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-3 py-2 text-sm text-rb-brown"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-rb-brown px-4 py-2 text-sm font-semibold text-rb-cream hover:bg-rb-gold hover:text-rb-brown"
          disabled={createMutation.isPending || !token}
        >
          Ajouter à la carte
        </button>
        {createMutation.isError && <p className="text-sm text-rb-pink">{createMutation.error?.message}</p>}
      </form>

      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">Rituels existants</p>
        {servicesQuery.isLoading && <p className="text-sm text-slate-600">Chargement…</p>}
        <div className="space-y-4">
          {(servicesQuery.data ?? []).map((service) => (
            <div key={service.id} className="rounded-3xl bg-white/70 p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">
                    {service.duration_minutes} min • {(service.price_cents / 100).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                  <p className="font-display text-2xl text-rb-brown">{service.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Slug : {service.slug}</p>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{service.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateMutation.mutate({
                        id: service.id,
                        updates: { active: !service.active },
                      })
                    }
                    className="rounded-full border border-rb-brown/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rb-brown hover:border-rb-gold hover:text-rb-gold"
                  >
                    {service.active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(service.id)}
                    className="rounded-full bg-rb-pink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rb-brown hover:bg-rb-gold"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!servicesQuery.isLoading && (servicesQuery.data ?? []).length === 0 && (
            <p className="text-sm text-slate-600">Aucun rituel n’a encore été créé.</p>
          )}
          {(updateMutation.isError || deleteMutation.isError) && (
            <p className="text-sm text-rb-pink">
              {(updateMutation.error ?? deleteMutation.error)?.message ?? 'Impossible de modifier le service.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPreviewDays(schedule, closures) {
  const start = new Date();
  const closureLookup = new Map(
    closures.map((closure) => [closure.closed_on, closure.reason ?? 'Fermeture exceptionnelle']),
  );
  const holidaySet = computeFrenchHolidaySetForRange(start, 60);
  const days = [];

  for (let offset = 0; offset < 14; offset += 1) {
    const current = addDays(start, offset);
    const dateKey = format(current, 'yyyy-MM-dd');
    let status = 'open';
    let note = `${schedule.open_time} → ${schedule.close_time}`;

    const weekday = current.getDay();
    if (weekday === 0 || weekday === 6) {
      status = 'closed';
      note = 'Week-end';
    } else if (holidaySet.has(dateKey)) {
      status = 'closed';
      note = 'Jour férié';
    } else if (closureLookup.has(dateKey)) {
      status = 'closed';
      note = closureLookup.get(dateKey);
    }

    days.push({
      dateKey,
      label: format(current, "EEEE d MMMM", { locale: fr }),
      status,
      note,
    });
  }

  return days;
}

function computeFrenchHolidaySetForRange(startDate, daysAhead) {
  const endDate = addDays(startDate, daysAhead);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const set = new Set();

  for (let year = startYear - 1; year <= endYear + 1; year += 1) {
    const easterSunday = computeEasterSunday(year);
    const easterMonday = addDays(easterSunday, 1);
    const ascension = addDays(easterSunday, 39);
    const pentecostMonday = addDays(easterSunday, 50);

    [
      `${year}-01-01`,
      format(easterMonday, 'yyyy-MM-dd'),
      `${year}-05-01`,
      `${year}-05-08`,
      format(ascension, 'yyyy-MM-dd'),
      format(pentecostMonday, 'yyyy-MM-dd'),
      `${year}-07-14`,
      `${year}-08-15`,
      `${year}-11-01`,
      `${year}-11-11`,
      `${year}-12-25`,
    ].forEach((dateKey) => set.add(dateKey));
  }

  return set;
}

function computeEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 12));
}
