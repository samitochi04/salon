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

document.addEventListener("DOMContentLoaded", () => {
  hydrateFadeIns();
  hydrateNav();
  applyCurrentYear();
});

document.addEventListener("htmx:afterSwap", (event) => {
  hydrateFadeIns(event.target);
  hydrateNav(event.target);
  applyCurrentYear(event.target);
});
