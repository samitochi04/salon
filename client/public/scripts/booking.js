const API_BASE = (window.__RB_CONFIG?.apiBase ?? "").replace(/\/$/, "");
const calendarState = new WeakMap();

function formatDateLabel(date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatDateValue(date) {
  return date.toLocaleDateString("en-CA");
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatTimeLabel(date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function resolveServiceMeta(slug) {
  if (!slug) return null;
  const data = window.RadiantData || {};
  const services = Array.isArray(data.services) ? data.services : [];
  const dictionary = data.dictionary || {};
  const direct = services.find((service) => service.slug === slug);
  if (direct) return direct;
  const fallback = dictionary[slug];
  if (!fallback) return null;
  return {
    slug,
    name: fallback.title ?? slug,
    description: fallback.description ?? "",
    duration_minutes: fallback.duration ?? null,
    price_cents: fallback.price_cents ?? null,
  };
}

function getServiceCatalog() {
  const data = window.RadiantData || {};
  const services = Array.isArray(data.services) ? data.services : [];
  if (services.length > 0) {
    return services.filter((service) => service && service.slug);
  }
  const dictionary = data.dictionary || {};
  return Object.entries(dictionary)
    .filter(([slug]) => slug && slug !== "custom")
    .map(([slug, info]) => ({
      slug,
      name: info.title ?? slug,
      description: info.description ?? "",
      duration_minutes: info.duration ?? null,
      price_cents: info.price_cents ?? null,
    }));
}

function populateServiceSelect(select, preferredValue) {
  if (!select) return "";
  const placeholder = select.dataset.placeholder ??
    select.querySelector('option[value=""]')?.textContent?.trim() ??
    "Sélectionnez un soin…";
  select.dataset.placeholder = placeholder;

  const services = getServiceCatalog();
  const options = services
    .map((service) => {
      const label = service.duration_minutes
        ? `${service.name} (${service.duration_minutes} min)`
        : service.name;
      return `<option value="${service.slug}">${label}</option>`;
    })
    .join("");

  select.innerHTML = `<option value="">${placeholder}</option>${options}`;
  select.disabled = services.length === 0;

  const candidate = preferredValue && services.some((service) => service.slug === preferredValue)
    ? preferredValue
    : services.length > 0
      ? services[0].slug
      : "";

  select.value = candidate;
  return candidate;
}

function setSummary(summary, message, tone = "muted") {
  if (!summary) return;
  const tones = {
    muted: "bg-brand-50/70 text-brand-700",
    info: "bg-white/80 text-slate-600",
    warn: "bg-rose-50 text-rose-600",
    success: "bg-emerald-50 text-emerald-700",
  };
  summary.className = `mt-6 rounded-2xl p-4 text-sm ${tones[tone] ?? tones.muted}`;
  summary.innerHTML = message;
}

function getState(container) {
  if (!calendarState.has(container)) {
    calendarState.set(container, {
      viewDate: null,
      selectedDate: null,
      selectedSlot: null,
      availability: {},
      range: null,
      serviceSlug: null,
      serviceMeta: null,
      loading: false,
      error: null,
      form: null,
      summary: null,
      hiddenDate: null,
      hiddenTime: null,
      serviceSelect: null,
    });
  }
  return calendarState.get(container);
}

function resetSelection(state) {
  state.selectedDate = null;
  state.selectedSlot = null;
  if (state.hiddenDate) state.hiddenDate.value = "";
  if (state.hiddenTime) state.hiddenTime.value = "";
}

function applySelectedSlot(state) {
  if (!state.form || !state.hiddenDate || !state.hiddenTime) return;
  if (state.selectedDate && state.selectedSlot) {
    state.hiddenDate.value = formatDateValue(state.selectedDate);
    state.hiddenTime.value = state.selectedSlot;
  } else {
    state.hiddenDate.value = "";
    state.hiddenTime.value = "";
  }
}

function availableTimesForDate(state, date) {
  if (!state.availability) return null;
  const key = formatDateValue(date);
  return state.availability[key] ?? null;
}

function renderCalendar(container) {
  const state = getState(container);
  const grid = container.querySelector("[data-calendar-grid]");
  const monthLabel = container.querySelector("[data-calendar-month]");
  const prevBtn = container.querySelector("[data-calendar-prev]");
  const nextBtn = container.querySelector("[data-calendar-next]");

  if (!state.viewDate) {
    const base = state.range ? new Date(state.range.from) : new Date();
    state.viewDate = startOfMonth(base);
  }

  const viewDate = new Date(state.viewDate);
  const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  monthLabel.textContent = viewDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  grid.innerHTML = "";

  for (let i = 0; i < firstDayIndex; i += 1) {
    grid.appendChild(document.createElement("div"));
  }

  const range = state.range;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day.toString();
    button.className =
      "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

    let disabled = state.loading;

    if (!disabled && range) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const rangeFrom = new Date(range.from);
      const rangeTo = new Date(range.to);
      disabled = dayStart < rangeFrom || dayStart >= rangeTo;
    }

    if (!disabled) {
      const availabilityForDay = availableTimesForDate(state, currentDate);
      const times = availabilityForDay
        ? Object.entries(availabilityForDay).filter(([, staffIds]) => staffIds.length > 0)
        : [];
      disabled = times.length === 0;
    }

    if (disabled) {
      button.disabled = true;
      button.classList.add("text-slate-300", "cursor-not-allowed");
    }

    if (
      state.selectedDate &&
      currentDate.toDateString() === state.selectedDate.toDateString()
    ) {
      button.classList.add("bg-brand-500", "text-white", "shadow-soft");
    }

    button.addEventListener("click", () => {
      if (button.disabled) return;
      state.selectedDate = new Date(currentDate);
      state.selectedSlot = null;
      renderCalendar(container);
      renderSlots(container);
      applySelectedSlot(state);
    });

    grid.appendChild(button);
  }

  if (!range) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    const monthStart = startOfMonth(viewDate);
    const rangeStartMonth = startOfMonth(new Date(range.from));
    const rangeEndMonth = startOfMonth(new Date(range.to));

    prevBtn.disabled = monthStart <= rangeStartMonth;
    nextBtn.disabled = monthStart >= rangeEndMonth;
  }

  prevBtn.classList.toggle("opacity-40", prevBtn.disabled);
  nextBtn.classList.toggle("opacity-40", nextBtn.disabled);

  prevBtn.onclick = () => {
    if (prevBtn.disabled) return;
    state.viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar(container);
    renderSlots(container);
  };

  nextBtn.onclick = () => {
    if (nextBtn.disabled) return;
    state.viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar(container);
    renderSlots(container);
  };

  if (state.loading) {
    setSummary(state.summary, "Chargement des disponibilités…");
  } else if (!Object.keys(state.availability || {}).length) {
    setSummary(
      state.summary,
      "Aucune disponibilité n’a été publiée pour le moment. Merci de revenir plus tard ou de nous contacter.",
      "warn",
    );
  }
}

function renderSlots(container) {
  const state = getState(container);
  const slotWrap = container.querySelector("[data-slot-list]");

  slotWrap.innerHTML = "";

  if (!state.serviceSlug) {
    setSummary(state.summary, "Sélectionnez un rituel pour afficher les créneaux disponibles.");
    return;
  }

  if (state.loading) {
    setSummary(state.summary, "Chargement des créneaux…");
    slotWrap.innerHTML =
      '<div class="flex h-24 items-center justify-center"><div class="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500"></div></div>';
    return;
  }

  if (!state.selectedDate) {
    setSummary(state.summary, "Sélectionnez une journée pour afficher les horaires disponibles.");
    return;
  }

  const availabilityForDay = availableTimesForDate(state, state.selectedDate);
  const entries = availabilityForDay
    ? Object.entries(availabilityForDay).filter(([, staffIds]) => staffIds.length > 0)
    : [];

  if (!entries.length) {
    setSummary(
      state.summary,
      `Aucun créneau disponible pour le ${formatDateLabel(state.selectedDate)}. Merci de choisir un autre jour.`,
      "warn",
    );
    return;
  }

  setSummary(
    state.summary,
    `Créneaux disponibles pour le ${formatDateLabel(state.selectedDate)} (${state.serviceMeta?.duration_minutes ?? "—"} minutes).`,
    "info",
  );

  entries
    .sort(([timeA], [timeB]) => (timeA < timeB ? -1 : 1))
    .forEach(([time, staffIds]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${time} · ${staffIds.length} praticien${staffIds.length > 1 ? "s" : ""}`;
      button.className =
        "w-full rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

      if (state.selectedSlot === time) {
        button.classList.add("bg-brand-500", "text-white", "border-brand-500", "shadow-soft");
      }

      button.addEventListener("click", () => {
        state.selectedSlot = time;
        applySelectedSlot(state);
        renderSlots(container);
      });

      slotWrap.appendChild(button);
    });
}

async function loadAvailability(container) {
  const state = getState(container);
  if (!state.serviceSlug) {
    state.availability = {};
    state.range = null;
    state.serviceMeta = null;
    state.loading = false;
    state.error = null;
    resetSelection(state);
    renderCalendar(container);
    renderSlots(container);
    return;
  }

  state.serviceMeta = resolveServiceMeta(state.serviceSlug) ?? state.serviceMeta;
  state.loading = true;
  state.error = null;
  renderCalendar(container);
  renderSlots(container);

  try {
    const response = await fetch(
      `${API_BASE}/api/public/services/${encodeURIComponent(state.serviceSlug)}/availability`,
    );
    if (!response.ok) {
      throw new Error("Unable to fetch availability.");
    }
    const data = await response.json();
    state.availability = data.availability ?? {};
    state.range = {
      from: data.window?.from ? new Date(data.window.from) : null,
      to: data.window?.to ? new Date(data.window.to) : null,
    };
    state.serviceMeta = data.service ?? state.serviceMeta;
    state.loading = false;
    resetSelection(state);
    if (state.range?.from) {
      state.viewDate = startOfMonth(new Date(state.range.from));
    }
    renderCalendar(container);
    renderSlots(container);
  } catch (error) {
    state.loading = false;
    state.error = error;
    state.availability = {};
    setSummary(
      state.summary,
      "Impossible de récupérer les disponibilités pour le moment. Merci de réessayer dans quelques instants ou de nous contacter.",
      "warn",
    );
    // eslint-disable-next-line no-console
    console.error("Failed to load availability", error);
  }
}

function attachFormHandlers(modal) {
  const form = modal.querySelector("[data-booking-form]");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const responseTarget = modal.querySelector("[data-booking-response]");
  const dismiss = () => {
    const root = document.getElementById("modal-root");
    if (!root) return;
    root.classList.add("opacity-0");
    setTimeout(() => {
      root.innerHTML = "";
    }, 220);
  };

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    dismiss();
  });

  form.addEventListener("submit", async (event) => {
    if (!form.checkValidity()) {
      return;
    }
    const container = modal.querySelector("[data-calendar-root]");
    const state = container ? getState(container) : null;
    if (!state?.selectedDate || !state?.selectedSlot) {
      event.preventDefault();
      responseTarget.innerHTML =
        '<p class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-500">Merci de sélectionner une date et un horaire avant de confirmer.</p>';
      return;
    }

    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    ResponseTargetAnimation(responseTarget);

    try {
      const resp = await fetch(`${API_BASE}/api/public/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error("Server returned an error");
      }

      const message = await resp.json();
      responseTarget.innerHTML = `<p class="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"><strong>Réservation envoyée !</strong> ${message?.message ?? "Nous revenons vers vous très prochainement."}</p>`;
      setTimeout(dismiss, 1600);
    } catch (error) {
      try {
        const fallback = await fetch("/partials/booking-confirmation.html");
        responseTarget.innerHTML = await fallback.text();
        setTimeout(dismiss, 1800);
      } catch (fallbackError) {
        responseTarget.innerHTML =
          '<p class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-500">Une erreur est survenue. Merci de réessayer dans quelques instants.</p>';
        // eslint-disable-next-line no-console
        console.error("Échec de l’envoi de la réservation", fallbackError);
      }
    }
  });
}

function ResponseTargetAnimation(target) {
  target.innerHTML =
    '<div class="flex items-center gap-3 rounded-xl bg-white/70 p-4 text-sm text-slate-600 shadow-sm backdrop-blur"><div class="h-5 w-5 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500"></div><span>Nous verrouillons votre rituel…</span></div>';
}

function initCalendar(container) {
  const state = getState(container);
  if (container.dataset.bound === "true") {
    renderCalendar(container);
    renderSlots(container);
    return;
  }
  container.dataset.bound = "true";

  const form = container.closest("[data-booking-form]");
  state.form = form;
  state.summary = container.querySelector("[data-selection-summary]");
  state.hiddenDate = form?.querySelector('input[name="appointment_date"]') ?? null;
  state.hiddenTime = form?.querySelector('input[name="appointment_time"]') ?? null;
  state.serviceSelect = form?.querySelector('select[name="service"]') ?? null;

  if (state.serviceSelect) {
    const nextValue = populateServiceSelect(state.serviceSelect, state.serviceSelect.value);
    state.serviceSlug = nextValue || state.serviceSelect.value || null;
    state.serviceMeta = resolveServiceMeta(state.serviceSlug);
    if (!state.serviceSelect.dataset.boundChange) {
      state.serviceSelect.dataset.boundChange = "true";
      state.serviceSelect.addEventListener("change", () => {
        state.serviceSlug = state.serviceSelect.value || null;
        state.serviceMeta = resolveServiceMeta(state.serviceSlug);
        resetSelection(state);
        applySelectedSlot(state);
        loadAvailability(container);
      });
    }
  } else {
    state.serviceSlug = null;
    state.serviceMeta = null;
  }

  resetSelection(state);
  applySelectedSlot(state);
  loadAvailability(container);
}

function bindModalLifecycle(root) {
  const modal = root.querySelector("[data-booking-modal]");
  if (!modal || modal.dataset.lifecycleBound === "true") return;
  modal.dataset.lifecycleBound = "true";

  const dialog = modal.querySelector("[data-modal-card]");
  requestAnimationFrame(() => {
    modal.classList.remove("opacity-0");
    dialog.classList.remove("translate-y-6", "opacity-0", "scale-95");
  });

  const dismiss = () => {
    dialog.classList.add("translate-y-6", "opacity-0", "scale-95");
    modal.classList.add("opacity-0");
    setTimeout(() => {
      const modalRoot = document.getElementById("modal-root");
      if (modalRoot) {
        modalRoot.innerHTML = "";
        document.body.classList.remove("overflow-hidden");
      }
    }, 220);
  };

  modal.addEventListener("click", (event) => {
    if (event.target.dataset.modalBackdrop === "true") {
      dismiss();
    }
  });

  modal.querySelectorAll("[data-modal-dismiss]").forEach((btn) => {
    btn.addEventListener("click", dismiss);
  });
}

document.addEventListener("radiant:services-ready", () => {
  document.querySelectorAll("[data-booking-modal]").forEach((modal) => {
    const calendar = modal.querySelector("[data-calendar-root]");
    if (!calendar) return;
    const state = getState(calendar);
    if (!state.serviceSelect) return;
    const previous = state.serviceSlug || state.serviceSelect.value;
    const next = populateServiceSelect(state.serviceSelect, previous);
    if (next === previous) return;
    state.serviceSlug = next || null;
    state.serviceMeta = resolveServiceMeta(state.serviceSlug);
    resetSelection(state);
    applySelectedSlot(state);
    loadAvailability(calendar);
  });
});

document.addEventListener("htmx:afterSwap", (event) => {
  if (!event.target.closest("#modal-root")) return;
  const root = event.target;
  bindModalLifecycle(root);
  const calendarContainer = root.querySelector("[data-calendar-root]");
  if (calendarContainer) {
    initCalendar(calendarContainer);
  }
  attachFormHandlers(root);
  document.body.classList.add("overflow-hidden");
});
