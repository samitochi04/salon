async function loadServices(force = false) {
  if (servicesLoaded && !force) {
    renderServiceCards();
    return;
  }
  if (servicesLoading) return;
  servicesLoading = true;
  try {
    const response = await fetch(`${API_BASE}/api/public/services`);
    if (!response.ok) throw new Error("failed to fetch services");
    const payload = await response.json();
    if (payload?.data) {
      storeServices(payload.data);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Impossible de charger les services depuis l’API.", error);
    renderServiceCards();
  } finally {
    servicesLoading = false;
  }
}

const NEWSLETTER_STORAGE_KEY = "rbNewsletterDismissed";
const NEWSLETTER_DELAY = 10000;
const API_BASE = (window.__RB_CONFIG?.apiBase ?? "").replace(/\/$/, "");

function markNewsletterSeen() {
  sessionStorage.setItem(NEWSLETTER_STORAGE_KEY, "true");
}

function closeNewsletterModal(wrapper, persist = true) {
  if (!wrapper) return;
  wrapper.classList.add("opacity-0");
  document.body.classList.remove("overflow-hidden");
  document.body.dataset.newsletterOpen = "false";
  if (persist) {
    markNewsletterSeen();
  }
  setTimeout(() => {
    wrapper.remove();
  }, 220);
}

async function submitNewsletter(form, feedback) {
  const formData = new FormData(form);
  const email = formData.get("email");
  if (!email) {
    feedback.innerHTML =
      '<p class="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-500">Merci d’indiquer une adresse e-mail.</p>';
    return;
  }
  feedback.innerHTML =
    '<div class="flex items-center gap-3 rounded-xl bg-white/70 p-3 text-sm text-slate-600 shadow-sm backdrop-blur"><div class="h-5 w-5 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500"></div><span>Inscription en cours…</span></div>';
  try {
    const response = await fetch(`${API_BASE}/api/public/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error("Newsletter API error");
    const payload = await response.json();
    feedback.innerHTML = `<p class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">${payload?.message ?? "Merci ! Nous vous écrivons très vite."}</p>`;
    markNewsletterSeen();
  } catch (error) {
    feedback.innerHTML =
      '<p class="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-500">Impossible d’enregistrer votre e-mail pour le moment. Merci de réessayer plus tard.</p>';
    // eslint-disable-next-line no-console
    console.warn("Newsletter subscription failed", error);
  }
}

function openNewsletterModal() {
  if (document.body.dataset.newsletterOpen === "true") return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-sm transition duration-200" data-newsletter-modal>
      <div class="relative w-[92vw] max-w-xl translate-y-4 rounded-[2.25rem] bg-white px-8 py-9 opacity-0 shadow-[0_45px_100px_-40px_rgba(22,20,40,0.55)] transition duration-200 ease-out" data-newsletter-card>
        <button type="button" class="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-200 hover:text-brand-600" data-newsletter-close aria-label="Fermer la fenêtre">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="space-y-4">
          <span class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Newsletter</span>
          <h2 class="font-display text-3xl text-slate-900">Une dose de lumière dans votre boîte mail.</h2>
          <p class="text-sm text-slate-600">Conseils de préparation, offres privées et invitations ateliers : nous partageons uniquement l’essentiel pour prolonger votre éclat.</p>
        </div>
        <form class="mt-6 space-y-4" data-newsletter-form>
          <label class="block text-sm text-slate-600">
            Adresse e-mail
            <input type="email" name="email" required placeholder="vous@example.com" class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200" />
          </label>
          <button type="submit" class="btn-primary w-full justify-center">
            Je m’inscris
          </button>
        </form>
        <div class="mt-4 text-xs text-slate-400">En vous inscrivant, vous acceptez de recevoir les actualités Radiant Bloom. Vous pouvez vous désabonner à tout moment.</div>
        <div class="mt-4" data-newsletter-feedback></div>
      </div>
    </div>
  `;

  const modal = wrapper.firstElementChild;
  const card = modal.querySelector("[data-newsletter-card]");
  const closeButton = modal.querySelector("[data-newsletter-close]");
  const form = modal.querySelector("[data-newsletter-form]");
  const feedback = modal.querySelector("[data-newsletter-feedback]");

  closeButton.addEventListener("click", () => closeNewsletterModal(wrapper));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeNewsletterModal(wrapper);
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitNewsletter(form, feedback);
  });

  document.body.appendChild(wrapper);
  document.body.dataset.newsletterOpen = "true";
  document.body.classList.add("overflow-hidden");

  requestAnimationFrame(() => {
    modal.classList.remove("opacity-0");
    card.classList.remove("translate-y-4", "opacity-0");
  });
}

function maybeShowNewsletter() {
  if (sessionStorage.getItem(NEWSLETTER_STORAGE_KEY) === "true") return;
  if (document.querySelector("[data-booking-modal]")) {
    setTimeout(maybeShowNewsletter, 6000);
    return;
  }
  openNewsletterModal();
}

function scheduleNewsletterPrompt() {
  if (sessionStorage.getItem(NEWSLETTER_STORAGE_KEY) === "true") return;
  setTimeout(maybeShowNewsletter, NEWSLETTER_DELAY);
}

const SERVICE_DICTIONARY = {
  "sculpt-illuminate": {
    title: "Sculpt & Glow",
    badge: "best-seller",
    description:
      "Remodelage par micro-courants, drainage lymphatique et resurfaçage actif pour sublimer votre silhouette.",
    duration: 75,
  },
  "barrier-restore": {
    title: "Polish Barrière Sublime",
    badge: "nouveauté",
    description:
      "Enzymes douces et céramides régénérants pour révéler une peau veloutée en une séance.",
    duration: 60,
  },
  "prenatal-reset": {
    title: "Reset Prénatal Lumineux",
    badge: "exclusif studio",
    description:
      "Compression enveloppante, brumes minérales et relâchement fascial pour apaiser le corps et l’esprit.",
    duration: 80,
  },
  custom: {
    title: "Soin sur-mesure",
    badge: "personnalisé",
    description:
      "Un rituel créé exclusivement pour vos besoins après diagnostic avec notre facialiste.",
  },
};

const RadiantData = window.RadiantData || {};
RadiantData.dictionary = { ...SERVICE_DICTIONARY, ...(RadiantData.dictionary || {}) };
if (!Array.isArray(RadiantData.services)) {
  RadiantData.services = [];
}
window.RadiantData = RadiantData;

let servicesLoaded = Array.isArray(RadiantData.services) && RadiantData.services.length > 0;
let servicesLoading = false;

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("opacity-100", "translate-y-0");
        entry.target.classList.remove("opacity-0", "translate-y-4");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  },
);

function hydrateFadeIns(root = document) {
  root.querySelectorAll("[data-fade]").forEach((el) => {
    if (el.dataset.faded === "true") return;
    el.dataset.faded = "true";
    el.classList.add("opacity-0", "translate-y-4", "transition-all", "duration-700");
    fadeObserver.observe(el);
  });
}

function hydrateNav(root = document) {
  const header = root.querySelector("[data-site-header]");
  if (header && !header.dataset.boundScroll) {
    header.dataset.boundScroll = "true";
    const handler = () => {
      if (window.scrollY > 16) {
        header.classList.add("backdrop-blur-xl", "bg-white/85", "shadow-lg");
      } else {
        header.classList.remove("backdrop-blur-xl", "bg-white/85", "shadow-lg");
      }
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
  }

  const toggler = root.querySelector("[data-nav-toggle]");
  const menu = root.querySelector("[data-nav-menu]");
  if (toggler && menu && !toggler.dataset.boundToggle) {
    toggler.dataset.boundToggle = "true";
    toggler.addEventListener("click", () => {
      menu.classList.toggle("translate-x-full");
      document.body.classList.toggle("overflow-hidden", !menu.classList.contains("translate-x-full"));
    });
  }
}

function applyCurrentYear(root = document) {
  root.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function formatPrice(priceCents) {
  if (typeof priceCents !== "number") return null;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceCents / 100);
  } catch (error) {
    return `${priceCents / 100} €`;
  }
}

function renderServiceCards(root = document) {
  const container = root.querySelector("[data-service-card-list]");
  if (!container) return;

  const { services = [], dictionary = {} } = window.RadiantData;
  const list =
    services && services.length > 0
      ? services.filter((service) => service.slug !== "custom")
      : Object.entries(dictionary)
          .filter(([slug]) => slug !== "custom")
          .map(([slug, info]) => ({
            slug,
            name: info.title,
            description: info.description,
            badge: info.badge,
            duration_minutes: info.duration,
            price_cents: info.price_cents ?? null,
          }));

  const markup = list
    .map((service) => {
      const meta = dictionary[service.slug] || {};
      const duration = service.duration_minutes ?? meta.duration;
      const badge = meta.badge ?? service.badge;
      const description = meta.description ?? service.description ?? "";
      const price = formatPrice(service.price_cents ?? meta.price_cents);
      return `
        <article class="card group">
          ${badge ? `<span class="text-xs uppercase tracking-[0.25em] text-brand-500">${badge}</span>` : ""}
          <h3 class="mt-4 font-display text-2xl text-slate-900">${meta.title ?? service.name}</h3>
          <p class="mt-3 text-sm text-slate-600">${description}</p>
          <ul class="mt-6 space-y-2 text-sm text-slate-500">
            ${duration ? `<li>• ${duration} minutes de rituel corps</li>` : ""}
            ${price ? `<li>• ${price}</li>` : ""}
            <li>• Prescription personnalisée offerte</li>
          </ul>
          <button
            class="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition group-hover:gap-3"
            hx-get="/partials/booking-modal.html"
            hx-target="#modal-root"
            hx-swap="innerHTML"
          >
            Réserver
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 12h12M12 6l6 6-6 6" />
            </svg>
          </button>
        </article>
      `;
    })
    .join("");

  container.innerHTML = markup;
}

function broadcastServicesReady() {
  document.dispatchEvent(new Event("radiant:services-ready"));
}

function storeServices(data) {
  if (!Array.isArray(data)) return;
  window.RadiantData.services = data;
  servicesLoaded = data.length > 0;
  renderServiceCards();
  broadcastServicesReady();
}

document.addEventListener("DOMContentLoaded", () => {
  hydrateFadeIns();
  hydrateNav();
  applyCurrentYear();
  renderServiceCards();
  loadServices();
  scheduleNewsletterPrompt();
});

document.addEventListener("htmx:afterSwap", (event) => {
  hydrateFadeIns(event.target);
  hydrateNav(event.target);
  applyCurrentYear(event.target);
  renderServiceCards(event.target);
  if (!servicesLoaded) {
    loadServices();
  }
  if (window.RadiantAdmin && typeof window.RadiantAdmin.scan === "function") {
    window.RadiantAdmin.scan(event.target);
  }
});
