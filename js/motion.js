import { clamp, prefersReducedMotion, qsa, rafThrottle } from "./utils.js";

export const createSmoothScroll = () => {
  const reduced = prefersReducedMotion();
  return {
    enabled: false,
    lock() {},
    unlock() {},
    stop() {},
    scrollTo: (y) => {
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    },
  };
};

let parallaxEls = [];
let parallaxBound = false;

export const initParallax = () => {
  parallaxEls = qsa("[data-parallax]").map((el) => {
    const s = Number(el.getAttribute("data-speed") || "0.08");
    return { el, s: clamp(-0.4, s, 0.4) };
  });

  if (!parallaxBound) {
    parallaxBound = true;

    const onScroll = rafThrottle(() => {
      updateParallax(window.scrollY);
    });

    const onResize = rafThrottle(() => {
      updateParallax(window.scrollY);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
  }

  updateParallax(window.scrollY);
};

export const updateParallax = (scrollY) => {
  if (!parallaxEls.length) return;
  parallaxEls.forEach(({ el, s }) => {
    el.style.transform = `translate3d(0, ${-scrollY * s}px, 0)`;
  });
};

export const initMagnetic = (root = document) => {
  const reduced = prefersReducedMotion();
  if (reduced) return;
  const els = qsa("[data-magnetic]", root);
  els.forEach((el) => {
    const strength = Number(el.getAttribute("data-magnetic") || "10");
    let rect = null;

    const onEnter = () => {
      rect = el.getBoundingClientRect();
    };

    const onMove = (e) => {
      if (!rect) rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate3d(${(x / rect.width) * strength}px, ${(y / rect.height) * strength}px, 0)`;
    };

    const onLeave = () => {
      rect = null;
      el.style.transform = "";
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  });
};
