import { qs, qsa, rafThrottle, prefersReducedMotion } from "./utils.js";
import { initReveals } from "./reveal.js";
import { createSmoothScroll, initParallax, initMagnetic } from "./motion.js";
import { initComparison } from "./comparison.js";

const initNav = (smooth) => {
  const header = qs("[data-header]");
  const nav = qs("[data-nav]");
  const toggle = qs("[data-nav-toggle]");
  const links = qsa("[data-nav] a[href^='#']");

  if (!nav) return;

  const setCompact = rafThrottle(() => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-compact", y > 24);
  });

  window.addEventListener("scroll", setCompact, { passive: true });
  setCompact();

  const close = () => nav.classList.remove("nav--open");
  const open = () => nav.classList.add("nav--open");
  const isOpen = () => nav.classList.contains("nav--open");

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (isOpen()) close();
      else open();
      toggle.setAttribute("aria-expanded", isOpen() ? "true" : "false");
    });
  }

  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (nav.contains(t)) return;
    close();
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      close();
      if (toggle) toggle.setAttribute("aria-expanded", "false");

      const r = target.getBoundingClientRect();
      const y = window.scrollY + r.top - 92;
      smooth.scrollTo(Math.max(0, y));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!isOpen()) return;
    close();
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
};

const initActiveSections = () => {
  const linkById = new Map();
  qsa("[data-nav] a[href^='#']").forEach((a) => {
    const id = (a.getAttribute("href") || "").slice(1);
    if (!id) return;
    linkById.set(id, a);
  });

  const sections = qsa("section[id]").filter((s) => linkById.has(s.id));
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        linkById.forEach((a) => a.removeAttribute("aria-current"));
        const a = linkById.get(e.target.id);
        if (a) a.setAttribute("aria-current", "true");
      });
    },
    { threshold: 0.3, rootMargin: "-20% 0px -55% 0px" },
  );

  sections.forEach((s) => io.observe(s));
};

const initTimelineProgress = () => {
  const fill = qs("[data-timeline-fill]");
  const steps = qsa("[data-step]");
  if (!fill || !steps.length) return;

  const update = rafThrottle(() => {
    const tops = steps.map((s) => s.getBoundingClientRect().top);
    const idx = tops.findIndex((t) => t > window.innerHeight * 0.35);
    const current = idx === -1 ? steps.length : Math.max(1, idx);
    const pct = (current / steps.length) * 100;
    fill.style.width = `${pct}%`;
  });

  window.addEventListener("scroll", update, { passive: true });
  update();
};

const initForm = () => {
  const form = qs("[data-inquiry-form]");
  const status = qs("[data-form-status]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const ok = name && (phone || email) && message;
    if (!ok) {
      if (status) status.textContent = "Please add your name, a phone or email, and a short message.";
      return;
    }

    const subject = encodeURIComponent("New landscaping inquiry");
    const body = encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\n\nProject:\n${message}\n`,
    );

    if (status) status.textContent = "Opening your email app to send the inquiry...";
    const to = "hello@verdureatelier.com";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
};

const initIntro = () => {
  const reduced = prefersReducedMotion();
  if (reduced) return;
  const hero = qs("[data-hero]");
  if (!hero) return;

  const items = qsa("[data-intro]", hero);
  if (!items.length || !items[0].animate) return;

  items.forEach((el, idx) => {
    el.animate(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 900,
        delay: 120 + idx * 120,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      },
    );
  });
};

const boot = () => {
  initReveals();

  const smooth = createSmoothScroll();
  initParallax();
  initMagnetic(document);

  initNav(smooth);
  initActiveSections();
  initTimelineProgress();
  initForm();
  initComparison();
  initIntro();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
