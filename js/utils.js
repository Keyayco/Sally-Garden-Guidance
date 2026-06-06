export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const clamp = (min, v, max) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const qs = (sel, root = document) => root.querySelector(sel);

export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const rafThrottle = (fn) => {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      fn(...args);
    });
  };
};

export const on = (el, evt, handler, opts) => el && el.addEventListener(evt, handler, opts);
