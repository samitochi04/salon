const ADMIN_STORAGE_KEY = "rb_admin_session";

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmée",
  completed: "Effectuée",
  cancelled: "Annulée",
};

const API_BASE = (window.__RB_CONFIG?.apiBase ?? "").replace(/\/$/, "");

function parseStoredSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function storeSession(session) {
  const payload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
  };
  sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

function clearStoredSession() {
  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
}

const RadiantAdmin = {
  client: null,
  session: null,
  loading: false,
  currentFilters: {},

  init() {
    if (this.client) return;
    const config = window.__RB_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
      // eslint-disable-next-line no-console
      console.warn("Supabase n’est pas correctement configuré pour l’espace admin.");
      return;
    }
    this.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const stored = parseStoredSession();
    if (stored) {
      this.session = stored;
    }
  },

  isAuthenticated() {
    return Boolean(this.session?.access_token);
  },

  authorizationHeaders() {
    if (!this.isAuthenticated()) return {};
    return {
      Authorization: `Bearer ${this.session.access_token}`,
    };
  },

  scan(root = document) {
    const loginNode = root.querySelector("[data-admin-login]");
    if (loginNode) {
      this.attachLogin(loginNode);
    }
    const dashboardNode = root.querySelector("[data-admin-dashboard]");
    if (dashboardNode) {
      this.attachDashboard(dashboardNode);
    }
  },

  attachLogin(container) {
    const form = container.querySelector("[data-admin-login-form]");
    const feedback = container.querySelector("[data-admin-login-feedback]");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    if (!this.client) {
      this.init();
    }

    if (this.isAuthenticated()) {
      feedback.innerHTML =
        '<p class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Connexion déjà active. Redirection…</p>';
      setTimeout(() => {
        this.openDashboard();
      }, 800);
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!this.client) {
        feedback.innerHTML =
          '<p class="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-500">Configuration Supabase manquante. Veuillez renseigner les identifiants dans window.__RB_CONFIG.</p>';
        return;
      }

      const formData = new FormData(form);
      const email = formData.get("email");
      const password = formData.get("password");
      if (!email || !password) {
        feedback.innerHTML =
          '<p class="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-500">Merci de renseigner une adresse e-mail et un mot de passe.</p>';
        return;
      }

      feedback.innerHTML =
        '<div class="flex items-center gap-3 rounded-xl bg-white/70 p-3 text-sm text-slate-600 shadow-sm backdrop-blur"><div class="h-5 w-5 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500"></div><span>Connexion en cours…</span></div>';
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        this.session = storeSession(data.session);
        feedback.innerHTML =
          '<p class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Connexion réussie, redirection…</p>';
        setTimeout(() => {
          this.openDashboard();
        }, 600);
      } catch (error) {
        feedback.innerHTML =
          '<p class="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-500">Identifiants invalides ou accès refusé.</p>';
        // eslint-disable-next-line no-console
        console.error("Admin login failed", error);
      }
    });
  },

  openDashboard() {
    if (window.htmx) {
      window.htmx.ajax("GET", "/partials/admin-dashboard.html", "#app");
    }
  },

  attachDashboard(container) {
    const logoutBtn = document.querySelector("[data-admin-logout]");
    const refreshBtn = container.querySelector("[data-admin-refresh]");
    const filterForm = container.querySelector("[data-admin-filter-form]");
    const bookingsBody = container.querySelector("[data-admin-bookings]");
    const statsContainer = container.querySelector("[data-admin-stats]");
    const lastSyncNode = container.querySelector("[data-admin-last-sync]");

    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.dataset.bound = "true";
      logoutBtn.addEventListener("click", () => this.signOut());
    }

    if (refreshBtn && !refreshBtn.dataset.bound) {
      refreshBtn.dataset.bound = "true";
      refreshBtn.addEventListener("click", () => this.refreshBookings());
    }

    if (filterForm && !filterForm.dataset.bound) {
      filterForm.dataset.bound = "true";
      filterForm.addEventListener("change", () => {
        const formData = new FormData(filterForm);
        this.currentFilters.status = formData.get("status") || undefined;
        this.refreshBookings();
      });
    }

    if (bookingsBody) {
      bookingsBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Chargement des réservations…</td></tr>';
    }

    this.refreshBookings({ bookingsBody, statsContainer, lastSyncNode });
  },

  async refreshBookings(context = {}) {
    if (!this.isAuthenticated()) {
      this.openLogin();
      return;
    }
    const bookingsBody =
      context.bookingsBody || document.querySelector("[data-admin-bookings]");
    const statsContainer =
      context.statsContainer || document.querySelector("[data-admin-stats]");
    const lastSyncNode =
      context.lastSyncNode || document.querySelector("[data-admin-last-sync]");

    if (bookingsBody) {
      bookingsBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Chargement des réservations…</td></tr>';
    }

    try {
      const bookings = await this.fetchBookings(this.currentFilters);
      this.renderBookings(bookings, bookingsBody);
      this.updateStats(bookings, statsContainer);
      if (lastSyncNode) {
        const now = new Date();
        lastSyncNode.textContent = `Dernière synchronisation : ${now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    } catch (error) {
      if (bookingsBody) {
        bookingsBody.innerHTML =
          '<tr><td colspan="4" class="px-6 py-8 text-center text-rose-500">Impossible de récupérer les réservations. Merci de réessayer.</td></tr>';
      }
      // eslint-disable-next-line no-console
      console.error("Impossible de charger les réservations", error);
    }
  },

  openLogin() {
    if (window.htmx) {
      window.htmx.ajax("GET", "/partials/admin-login.html", "#app");
    }
  },

  async fetchBookings(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) {
      params.set("status", filters.status);
    }
    const url = `/api/admin/bookings${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...this.authorizationHeaders(),
      },
    });
    if (response.status === 401 || response.status === 403) {
      this.signOut();
      throw new Error("Session expirée");
    }
    if (!response.ok) {
      throw new Error("Admin bookings request failed");
    }
    const payload = await response.json();
    return payload.data ?? payload;
  },

  formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  renderBookings(bookings = [], tableBody = document.querySelector("[data-admin-bookings]")) {
    if (!tableBody) return;
    if (!Array.isArray(bookings) || bookings.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Aucune réservation pour le moment.</td></tr>';
      return;
    }

    tableBody.innerHTML = bookings
      .map((booking) => {
        const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
        const customerNotes = booking.customer_notes
          ? `<div class="mt-3 rounded-xl bg-brand-50/60 p-3 text-xs text-brand-700">${booking.customer_notes}</div>`
          : "";
        return `
          <tr class="odd:bg-white even:bg-slate-50" data-booking-row data-booking-id="${booking.id}">
            <td class="align-top px-6 py-5">
              <p class="font-semibold text-slate-900">${booking.customer_full_name}</p>
              <p class="mt-1 text-xs text-slate-500">${booking.customer_email}</p>
              ${booking.customer_phone ? `<p class="mt-1 text-xs text-slate-400">${booking.customer_phone}</p>` : ""}
              <p class="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-300">Code ${booking.confirmation_code}</p>
            </td>
            <td class="align-top px-6 py-5">
              <p class="text-sm font-semibold text-slate-800">${booking.service?.name ?? booking.service_id}</p>
              <p class="mt-1 text-xs text-slate-500">${this.formatDateTime(booking.start_time)}</p>
              ${customerNotes}
            </td>
            <td class="align-top px-6 py-5">
              <span class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
                ${statusLabel}
              </span>
              <select
                class="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                data-booking-status
              >
                ${Object.entries(STATUS_LABELS)
                  .map(
                    ([value, label]) =>
                      `<option value="${value}" ${value === booking.status ? "selected" : ""}>${label}</option>`,
                  )
                  .join("")}
              </select>
            </td>
            <td class="align-top px-6 py-5">
              <label class="block text-xs uppercase tracking-[0.25em] text-slate-400">Note interne</label>
              <textarea
                class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                rows="3"
                placeholder="Ajouter une note interne…"
                data-booking-note
              ></textarea>
              <div class="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-brand-200 hover:text-brand-600"
                  data-booking-save
                >
                  Mettre à jour
                </button>
                <span class="text-xs text-slate-400" data-booking-feedback></span>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    tableBody.querySelectorAll("[data-booking-save]").forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", async (event) => {
        const row = event.target.closest("[data-booking-row]");
        if (!row) return;
        await this.updateBookingFromRow(row);
      });
    });
  },

  async updateBookingFromRow(row) {
    const bookingId = row.dataset.bookingId;
    const statusSelect = row.querySelector("[data-booking-status]");
    const noteField = row.querySelector("[data-booking-note]");
    const feedback = row.querySelector("[data-booking-feedback]");
    if (!bookingId || !statusSelect || !noteField) return;

    const payload = {};
    const selectedStatus = statusSelect.value;
    if (selectedStatus) {
      payload.status = selectedStatus;
    }
    const note = noteField.value.trim();
    if (note) {
      payload.internal_note = note;
    }

    if (!payload.status && !payload.internal_note) {
      feedback.textContent = "Aucun changement à enregistrer.";
      return;
    }

    feedback.textContent = "Mise à jour…";
    try {
      await this.updateBooking(bookingId, payload);
      feedback.textContent = "Enregistré.";
      noteField.value = "";
      setTimeout(() => {
        feedback.textContent = "";
      }, 2000);
      this.refreshBookings();
    } catch (error) {
      feedback.textContent = "Erreur lors de l’enregistrement.";
      // eslint-disable-next-line no-console
      console.error("Update booking failed", error);
    }
  },

  async updateBooking(bookingId, payload) {
    const response = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...this.authorizationHeaders(),
      },
      body: JSON.stringify(payload),
    });
    if (response.status === 401 || response.status === 403) {
      this.signOut();
      throw new Error("Session expirée");
    }
    if (!response.ok) {
      throw new Error("Admin booking update failed");
    }
    return response.json();
  },

  updateStats(bookings = [], container = document.querySelector("[data-admin-stats]")) {
    if (!container) return;
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const upcoming = bookings.filter((b) => {
      const start = new Date(b.start_time).getTime();
      return start >= now && start <= weekFromNow;
    }).length;

    container.innerHTML = `
      <div class="rounded-2xl bg-brand-50 p-5 text-sm text-brand-700">
        <p class="text-xs uppercase tracking-[0.3em] text-brand-500">Total demandes</p>
        <p class="mt-2 text-3xl font-semibold text-brand-700">${total}</p>
      </div>
      <div class="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">En attente</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">${pending}</p>
      </div>
      <div class="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Confirmées</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">${confirmed}</p>
      </div>
      <div class="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">7 prochains jours</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">${upcoming}</p>
      </div>
    `;
  },

  async signOut() {
    clearStoredSession();
    this.session = null;
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.openLogin();
  },
};

window.RadiantAdmin = RadiantAdmin;

document.addEventListener("DOMContentLoaded", () => {
  RadiantAdmin.init();
  if (RadiantAdmin.isAuthenticated()) {
    RadiantAdmin.openDashboard();
  }
  RadiantAdmin.scan();
});

