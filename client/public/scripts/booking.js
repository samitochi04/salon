const SLOT_OPTIONS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];
const MAX_MONTH_OFFSET = 5;

const calendarState = new WeakMap();

function getRadiantState() {
  if (!window.RadiantData) {
    window.RadiantData = { services: [], dictionary: {} };
  }
  return window.RadiantData;
}

function getServiceDictionary() {
  return getRadiantState().dictionary || {};
}

function fallbackServicesFromDictionary() {
  const dictionary = getServiceDictionary();
  return Object.entries(dictionary).map(([slug, info]) => ({
    slug,
    name: info.title ?? info.name ?? slug,
    duration_minutes: info.duration ?? null,
  }));
}

function ensureCustomService(list) {
  const dictionary = getServiceDictionary();
  const customInfo = dictionary.custom || { title: "Soin sur-mesure", duration: null };
  const hasCustom = list.some((service) => service.slug === "custom");
  if (!hasCustom) {
    return [
      ...list,
      {
        slug: "custom",
        name: customInfo.title ?? "Soin sur-mesure",
        duration_minutes: customInfo.duration ?? null,
      },
    ];
  }
  return list;
}

function getServicesData() {
  const state = getRadiantState();
  const list =
    state.services && state.services.length > 0 ? state.services : fallbackServicesFromDictionary();
  return ensureCustomService(list);
}

function serviceDisplayLabel(service) {
  const dictionary = getServiceDictionary();
  const info = dictionary[service.slug] || {};
  const baseName = info.title ?? service.name ?? service.slug;
  const duration = service.duration_minutes ?? info.duration;
  if (duration) {
    return `${baseName} (${duration} min)`;
  }
  return baseName;
}

function populateServiceSelect(select) {
  if (!select) return;
  const services = getServicesData();
  select.innerHTML = '<option value="">Sélectionnez un soin…</option>';
  services.forEach((service) => {
    const option = document.createElement("option");
    option.value = service.slug;
    option.textContent = serviceDisplayLabel(service);
    select.appendChild(option);
  });
}

function formatDateLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatDateValue(date) {
  return date.toISOString().split("T")[0];
}

function getState(container) {
  if (!calendarState.has(container)) {
    const today = new Date();
    calendarState.set(container, {
      viewDate: new Date(today.getFullYear(), today.getMonth(), 1),
      selectedDate: null,
      selectedSlot: null,
    });
  }
  return calendarState.get(container);
}

function renderCalendar(container) {
  const state = getState(container);
  const grid = container.querySelector("[data-calendar-grid]");
  const monthLabel = container.querySelector("[data-calendar-month]");
  const prevBtn = container.querySelector("[data-calendar-prev]");
  const nextBtn = container.querySelector("[data-calendar-next]");

  const viewDate = state.viewDate;
  const today = new Date();
  const firstDayIndex = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();

  monthLabel.textContent = viewDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const dayButtons = [];
  grid.innerHTML = "";

  for (let i = 0; i < firstDayIndex; i += 1) {
    const spacer = document.createElement("div");
    grid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day.toString();
    button.className =
      "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

    const isPast =
      currentDate.setHours(0, 0, 0, 0) <
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).setHours(
        0,
        0,
        0,
        0,
      );

    if (isPast) {
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
      state.selectedDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        day,
      );
      renderCalendar(container);
      renderSlots(container);
    });

    dayButtons.push(button);
    grid.appendChild(button);
  }

  const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthsDiff =
    (viewDate.getFullYear() - baseMonth.getFullYear()) * 12 +
    (viewDate.getMonth() - baseMonth.getMonth());

  prevBtn.disabled = monthsDiff <= 0;
  nextBtn.disabled = monthsDiff >= MAX_MONTH_OFFSET;

  prevBtn.classList.toggle("opacity-40", prevBtn.disabled);
  nextBtn.classList.toggle("opacity-40", nextBtn.disabled);

  prevBtn.onclick = () => {
    if (prevBtn.disabled) return;
    state.viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar(container);
  };

  nextBtn.onclick = () => {
    if (nextBtn.disabled) return;
    state.viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar(container);
  };
}

function renderSlots(container) {
  const state = getState(container);
  const slotWrap = container.querySelector("[data-slot-list]");
  const summary = container.querySelector("[data-selection-summary]");
  const dateInput = container.querySelector('input[name="appointment_date"]');
  const timeInput = container.querySelector('input[name="appointment_time"]');

  slotWrap.innerHTML = "";

  if (!state.selectedDate) {
    summary.textContent = "Choisissez un jour pour afficher les horaires disponibles.";
    dateInput.value = "";
    timeInput.value = "";
    return;
  }

  summary.textContent = `Créneau sélectionné pour le ${formatDateLabel(
    state.selectedDate,
  )}. Choisissez l'horaire qui vous convient.`;
  dateInput.value = formatDateValue(state.selectedDate);

  SLOT_OPTIONS.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = slot;
    button.className =
      "rounded-full border border-brand-200 px-4 py-2 font-medium text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

    if (state.selectedSlot === slot) {
      button.classList.add("bg-brand-500", "text-white", "border-brand-500", "shadow-soft");
    }

    button.addEventListener("click", () => {
      state.selectedSlot = slot;
      timeInput.value = slot;
      renderSlots(container);
    });

    slotWrap.appendChild(button);
  });
}

function attachFormHandlers(modal) {
  const form = modal.querySelector("[data-booking-form]");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  populateServiceSelect(form.querySelector('[name="service"]'));

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
      const resp = await fetch("/api/public/bookings", {
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

  state.selectedDate = null;
  state.selectedSlot = null;

  renderCalendar(container);
  renderSlots(container);
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

document.addEventListener("radiant:services-ready", () => {
  const modal = document.querySelector("[data-booking-modal]");
  if (!modal) return;
  populateServiceSelect(modal.querySelector('[name="service"]'));
});

