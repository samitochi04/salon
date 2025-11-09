import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  addDays,
  addMonths,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  differenceInCalendarMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchAvailability, fetchServices, createBooking } from '../services/apiClient.js';

const RANGE_DAYS = 365;
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function buildRange(from = new Date()) {
  const start = startOfDay(from);
  const end = addDays(start, RANGE_DAYS);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function ReservationPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('service');

  const [selectedServiceSlug, setSelectedServiceSlug] = useState(preselected ?? '');
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

  const selectedService = useMemo(
    () => services.find((service) => service.slug === selectedServiceSlug) ?? null,
    [selectedServiceSlug, services],
  );

  useEffect(() => {
    if (services.length > 0 && !selectedService && !preselected) {
      setSelectedServiceSlug(services[0].slug);
    }
  }, [preselected, selectedService, services]);

  const range = useMemo(() => buildRange(), []);

  const availabilityQuery = useQuery({
    queryKey: ['availability', selectedService?.slug, range.from, range.to],
    queryFn: () =>
      fetchAvailability({
        serviceSlug: selectedService.slug,
        from: range.from,
        to: range.to,
      }),
    enabled: Boolean(selectedService),
  });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', selectedService?.slug] });
      setSelectedTime(null);
      setSelectedDateKey(null);
      setForm({ full_name: '', email: '', phone: '', notes: '' });
    },
  });

  const availability = availabilityQuery.data?.availability ?? {};
  const windowInfo = availabilityQuery.data?.window ?? {};

  const availableDates = Object.keys(availability).sort();
  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates],
  );

  const monthsInRange = useMemo(() => {
    if (!windowInfo.from || !windowInfo.to) return [];
    const start = startOfMonth(parseISO(windowInfo.from));
    const end = startOfMonth(parseISO(windowInfo.to));
    return eachMonthOfInterval({ start, end });
  }, [windowInfo.from, windowInfo.to]);

  useEffect(() => {
    if (monthsInRange.length === 0) return;
    const firstMonth = monthsInRange[0];
    const lastMonth = monthsInRange[monthsInRange.length - 1];
    if (differenceInCalendarMonths(visibleMonth, firstMonth) < 0) {
      setVisibleMonth(firstMonth);
    } else if (differenceInCalendarMonths(visibleMonth, lastMonth) > 0) {
      setVisibleMonth(lastMonth);
    }
  }, [monthsInRange, visibleMonth]);

  const calendarWeeks = useMemo(() => {
    if (!windowInfo.from || !windowInfo.to) return [];
    const rangeStart = startOfDay(parseISO(windowInfo.from));
    const rangeEnd = parseISO(windowInfo.to);
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const weeks = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      const week = [];
      for (let index = 0; index < 7; index += 1) {
        const date = addDays(cursor, index);
        const dateKey = format(date, 'yyyy-MM-dd');
        const isWithinRange = date >= rangeStart && date < rangeEnd;
        week.push({
          date,
          dateKey,
          isWithinRange,
          isCurrentMonth: isSameMonth(date, visibleMonth),
          isAvailable: isWithinRange && availableDateSet.has(dateKey),
        });
      }
      weeks.push(week);
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }, [availableDateSet, visibleMonth, windowInfo.from, windowInfo.to]);

  const canGoPreviousMonth = useMemo(() => {
    if (monthsInRange.length === 0) return false;
    return differenceInCalendarMonths(visibleMonth, monthsInRange[0]) > 0;
  }, [monthsInRange, visibleMonth]);

  const canGoNextMonth = useMemo(() => {
    if (monthsInRange.length === 0) return false;
    return differenceInCalendarMonths(monthsInRange[monthsInRange.length - 1], visibleMonth) > 0;
  }, [monthsInRange, visibleMonth]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDateKey(null);
      setSelectedTime(null);
      return;
    }
    if (!selectedDateKey || !availableDateSet.has(selectedDateKey)) {
      setSelectedDateKey(availableDates[0]);
      setSelectedTime(null);
    }
  }, [availableDates, availableDateSet, selectedDateKey]);

  useEffect(() => {
    if (!selectedDateKey) return;
    const selectedMonth = startOfMonth(parseISO(selectedDateKey));
    if (differenceInCalendarMonths(selectedMonth, visibleMonth) !== 0) {
      setVisibleMonth(selectedMonth);
    }
  }, [selectedDateKey, visibleMonth]);

  function handleSlotSelection(dateKey, timeLabel) {
    setSelectedDateKey(dateKey);
    setSelectedTime(timeLabel);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedService || !selectedDateKey || !selectedTime) return;

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
      service: selectedService.slug,
      appointment_date: selectedDateKey,
      appointment_time: selectedTime,
    };
    mutation.mutate(payload);
  }

  const bookingEnabled = Boolean(
    selectedService && selectedDateKey && selectedTime && form.full_name && form.email,
  );

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rb-gold">Réservation en 3 étapes</p>
        <h1 className="font-display text-5xl text-rb-brown">Choisissez votre moment de lumière</h1>
        <p className="text-sm text-slate-600 sm:max-w-2xl">
          Sélectionnez votre rituel, une date disponible et complétez vos informations. Vous recevrez un e-mail de
          confirmation dès validation par notre concierge — sous deux heures ouvrées.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setSelectedServiceSlug(service.slug);
                setSelectedDateKey(null);
                setSelectedTime(null);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                selectedService?.slug === service.slug
                  ? 'border-rb-gold bg-rb-gold text-rb-brown'
                  : 'border-rb-brown/20 bg-white/80 text-rb-brown hover:border-rb-gold'
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>
        {selectedService && (
          <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-rb-gold">
              {selectedService.duration_minutes} minutes
            </p>
            <h2 className="mt-1 font-display text-3xl text-rb-brown">{selectedService.name}</h2>
            <p className="mt-3 text-sm text-slate-600">{selectedService.description}</p>
            <p className="mt-4 text-sm font-semibold text-rb-brown">
              {(Number(selectedService.price_cents) / 100).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-3xl text-rb-brown">2. Sélectionnez une date</h2>
          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
              disabled={!canGoPreviousMonth}
              className="rounded-full border border-rb-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rb-brown hover:border-rb-gold hover:text-rb-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {format(visibleMonth, 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              disabled={!canGoNextMonth}
              className="rounded-full border border-rb-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rb-brown hover:border-rb-gold hover:text-rb-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
        {monthsInRange.length > 0 && (
          <div className="sm:hidden">
            <select
              value={format(visibleMonth, 'yyyy-MM')}
              onChange={(event) => {
                const [year, month] = event.target.value.split('-').map(Number);
                setVisibleMonth(new Date(year, month - 1, 1));
              }}
              className="w-full rounded-full border border-rb-brown/20 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rb-brown"
            >
              {monthsInRange.map((monthDate) => (
                <option key={monthDate.toISOString()} value={format(monthDate, 'yyyy-MM')}>
                  {format(monthDate, 'MMMM yyyy', { locale: fr })}
                </option>
              ))}
            </select>
          </div>
        )}
        {availabilityQuery.isLoading && (
          <p className="text-sm text-slate-600">Recherche des créneaux disponibles…</p>
        )}
        {availabilityQuery.isError && (
          <p className="rounded-3xl bg-rb-pink/20 p-6 text-sm text-rb-pink">
            {availabilityQuery.error?.message ?? 'Impossible de charger les disponibilités. Veuillez réessayer dans quelques instants.'}
          </p>
        )}
        {!availabilityQuery.isLoading &&
          !availabilityQuery.isError &&
          availableDates.length === 0 && (
            <p className="rounded-3xl bg-white/70 p-6 text-sm text-slate-600">
              Aucun créneau n’est disponible sur l’année à venir. Contactez notre concierge pour une disponibilité sur
              mesure.
            </p>
          )}
        {!availabilityQuery.isError && calendarWeeks.length > 0 && (
          <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
            <div className="grid grid-cols-7 gap-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="mt-2 space-y-2">
              {calendarWeeks.map((week) => (
                <div key={week[0].dateKey} className="grid grid-cols-7 gap-2">
                  {week.map((day) => {
                    const isSelected = selectedDateKey === day.dateKey;
                    const isDisabled = !day.isWithinRange || !day.isAvailable;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedDateKey(day.dateKey);
                            setSelectedTime(null);
                          }
                        }}
                        disabled={isDisabled}
                        className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-sm transition ${
                          !day.isWithinRange
                            ? 'cursor-default bg-transparent text-slate-300'
                            : isDisabled
                              ? 'cursor-not-allowed bg-white/40 text-slate-400'
                              : isSelected
                                ? 'border border-rb-brown bg-rb-brown text-rb-cream'
                                : day.isCurrentMonth
                                  ? 'border border-transparent bg-white text-rb-brown hover:border-rb-gold'
                                  : 'border border-transparent bg-white/60 text-slate-400'
                        }`}
                      >
                        <span className="text-[0.65rem] uppercase tracking-[0.3em]">
                          {format(day.date, 'EE', { locale: fr })}
                        </span>
                        <span className="text-base font-semibold">{format(day.date, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {!availabilityQuery.isError && selectedDateKey && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Créneaux pour {format(parseISO(selectedDateKey), 'EEEE d MMMM', { locale: fr })}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(availability[selectedDateKey] ?? {})
                .sort()
                .map((timeLabel) => {
                  const isTimeSelected = selectedTime === timeLabel;
                  return (
                    <button
                      key={timeLabel}
                      type="button"
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        isTimeSelected ? 'bg-rb-brown text-rb-cream' : 'bg-rb-pink/40 text-rb-brown hover:bg-rb-gold'
                      }`}
                      onClick={() => handleSlotSelection(selectedDateKey, timeLabel)}
                    >
                      {timeLabel}
                    </button>
                  );
                })}
            </div>
            {Object.keys(availability[selectedDateKey] ?? {}).length === 0 && (
              <p className="text-sm text-slate-600">
                Tous les créneaux de cette journée ont été réservés. Sélectionnez une autre date pour voir les
                disponibilités.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-3xl text-rb-brown">3. Vos informations</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl bg-white/80 p-8 shadow-soft">
          <div className="grid gap-2">
            <label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Nom et prénom
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              value={form.full_name}
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
              className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-4 py-3 text-sm text-rb-brown placeholder:text-rb-brown/40"
              placeholder="Ex. Clara Martin"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-4 py-3 text-sm text-rb-brown placeholder:text-rb-brown/40"
              placeholder="Ex. clara@exemple.fr"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Téléphone (optionnel)
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-4 py-3 text-sm text-rb-brown placeholder:text-rb-brown/40"
              placeholder="06 00 00 00 00"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Notes ou objectifs
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="rounded-2xl border border-rb-brown/20 bg-rb-cream px-4 py-3 text-sm text-rb-brown placeholder:text-rb-brown/40"
              placeholder="Indiquez vos envies, sensibilités ou préférences."
            />
          </div>

          <button
            type="submit"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-rb-brown px-6 py-3 text-sm font-semibold text-rb-cream transition hover:bg-rb-gold hover:text-rb-brown disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!bookingEnabled || mutation.isPending}
          >
            {mutation.isPending ? 'Transmission en cours…' : 'Valider ma demande'}
          </button>

          {mutation.isSuccess && (
            <p className="text-sm text-rb-gold">
              Merci ! Votre demande a été transmise. Nous confirmons votre rendez-vous par e-mail très prochainement.
            </p>
          )}
          {mutation.isError && (
            <p className="text-sm text-rb-pink">
              {mutation.error?.message ?? 'Une erreur est survenue. Merci de réessayer dans quelques instants.'}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
