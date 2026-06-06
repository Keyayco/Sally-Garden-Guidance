import { clamp, prefersReducedMotion, qsa, rafThrottle } from "./utils.js";

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
      scrollTo: (y) =>
        window.scrollTo({
          top: y,
          behavior: reduced ? "auto" : "smooth",
        }),
      stop: () => {
        window.removeEventListener("scroll", onScroll);
      },
    };
  }

  let target = window.scrollY;
  let current = window.scrollY;
  let velocity = 0;

  let running = true;
  let isLocked = false;

  let lastTime = performance.now();

  const maxScroll = () =>
    Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );

  const tick = (time) => {
    if (!running) return;

    const dt = Math.min((time - lastTime) / 16.667, 2);
    lastTime = time;

    if (!isLocked) {
      target = clamp(0, target, maxScroll());

      const force = (target - current) * 0.08;

      velocity += force * dt;
      velocity *= Math.pow(0.82, dt);

      current += velocity;

      if (
        Math.abs(target - current) < 0.1 &&
        Math.abs(velocity) < 0.1
      ) {
        current = target;
        velocity = 0;
      }

      window.scrollTo(0, current);

      updateParallax(current);
    }

    requestAnimationFrame(tick);
  };

  const onWheel = (e) => {
    if (isLocked) return;

    const path = e.composedPath ? e.composedPath() : [];

    const inScrollable = path.some((node) => {
      if (!(node instanceof HTMLElement)) return false;

      const style = getComputedStyle(node);
      const overflowY = style.overflowY;

      if (overflowY !== "auto" && overflowY !== "scroll") {
        return false;
      }

      return node.scrollHeight > node.clientHeight + 1;
    });

    if (inScrollable) return;

    e.preventDefault();

    const delta =
      Math.sign(e.deltaY) *
      Math.min(Math.abs(e.deltaY), 80);

    target += delta * 1.2;
  };

  const onResize = rafThrottle(() => {
    target = clamp(0, target, maxScroll());
  });

  const lock = () => {
    isLocked = true;
  };

  const unlock = () => {
    isLocked = false;

    current = window.scrollY;
    target = current;
    velocity = 0;
  };

  window.addEventListener("wheel", onWheel, {
    passive: false,
  });

  window.addEventListener("resize", onResize, {
    passive: true,
  });

  requestAnimationFrame(tick);

  return {
    enabled: true,

    lock,

    unlock,

    scrollTo: (y) => {
      target = clamp(0, y, maxScroll());
    },

    stop: () => {
      running = false;

      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    },
  };
};

let parallaxEls = [];

export const initParallax = () => {
  parallaxEls = qsa("[data-parallax]").map((el) => {
    const speed = Number(
      el.getAttribute("data-speed") || "0.08"
    );

    return {
      el,
      speed: clamp(-0.4, speed, 0.4),
    };
  });
};

export const updateParallax = (scrollY) => {
  if (!parallaxEls.length) return;

  parallaxEls.forEach(({ el, speed }) => {
    el.style.transform = `translate3d(0, ${
      -scrollY * speed
    }px, 0)`;
  });
};

export const initMagnetic = (root = document) => {
  if (prefersReducedMotion()) return;

  const els = qsa("[data-magnetic]", root);

  els.forEach((el) => {
    const strength = Number(
      el.getAttribute("data-magnetic") || "10"
    );

    let rect = null;

    const onEnter = () => {
      rect = el.getBoundingClientRect();
    };

    const onMove = (e) => {
      if (!rect) {
        rect = el.getBoundingClientRect();
      }

      const x =
        e.clientX - rect.left - rect.width / 2;

      const y =
        e.clientY - rect.top - rect.height / 2;

      el.style.transform = `translate3d(
        ${(x / rect.width) * strength}px,
        ${(y / rect.height) * strength}px,
        0
      )`;
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
