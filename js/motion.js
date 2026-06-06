import { clamp, lerp, prefersReducedMotion, qsa, rafThrottle } from "./utils.js";

export const createSmoothScroll = () => {
  const reduced = prefersReducedMotion();
  const can =
    !reduced &&
    "requestAnimationFrame" in window &&
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!can) {
    const onScroll = rafThrottle(() => {
      updateParallax(window.scrollY);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return {
      enabled: false,
      scrollTo: (y) => window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }),
      stop: () => window.removeEventListener("scroll", onScroll),
    };
  }

  let target = window.scrollY;
  let current = window.scrollY;
  let running = true;
  let isLocked = false;

  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const tick = () => {
    if (!running) return;
    if (!isLocked) {
      target = clamp(0, target, maxScroll());
      current = lerp(current, target, 0.12);
      if (Math.abs(current - target) < 0.5) current = target;
      window.scrollTo(0, current);
      updateParallax(current);
    }
    requestAnimationFrame(tick);
  };

  const onWheel = (e) => {
    if (isLocked) return;
    const path = e.composedPath ? e.composedPath() : [];
    const inScrollable = path.some((n) => {
      if (!(n instanceof HTMLElement)) return false;
      const oy = getComputedStyle(n).overflowY;
      if (oy !== "auto" && oy !== "scroll") return false;
      return n.scrollHeight > n.clientHeight + 1;
    });
    if (inScrollable) return;

    e.preventDefault();
    target += e.deltaY;
  };

  const onResize = rafThrottle(() => {
    target = window.scrollY;
    current = window.scrollY;
  });

  const lock = () => {
    isLocked = true;
  };

  const unlock = () => {
    isLocked = false;
    target = window.scrollY;
    current = window.scrollY;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", onResize, { passive: true });
  requestAnimationFrame(tick);

  const api = {
    enabled: true,
    lock,
    unlock,
    scrollTo: (y) => {
      target = y;
    },
    stop: () => {
      running = false;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    },
  };

  return api;
};

let parallaxEls = [];

export const initParallax = () => {
  parallaxEls = qsa("[data-parallax]").map((el) => {
    const s = Number(el.getAttribute("data-speed") || "0.08");
    return { el, s: clamp(-0.4, s, 0.4) };
  });
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
