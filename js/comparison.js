import { clamp, prefersReducedMotion, qs, on } from "./utils.js";

export const initComparison = () => {
  const root = qs("[data-compare]");
  if (!root) return;

  const viewport = qs(".compare__viewport", root);
  const after = qs(".compare__after", root);
  const handle = qs(".compare__handle", root);
  if (!viewport || !after || !handle) return;

  let pct = 50;
  let dragging = false;
  const reduced = prefersReducedMotion();

  const render = () => {
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = `${pct}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(pct)));
  };

  const pointerPct = (clientX) => {
    const r = viewport.getBoundingClientRect();
    return clamp(0, ((clientX - r.left) / r.width) * 100, 100);
  };

  const start = (e) => {
    dragging = true;
    if (handle.setPointerCapture && e.pointerId != null) handle.setPointerCapture(e.pointerId);
    pct = pointerPct(e.clientX);
    render();
  };

  const move = (e) => {
    if (!dragging) return;
    pct = pointerPct(e.clientX);
    render();
  };

  const end = () => {
    dragging = false;
  };

  on(handle, "pointerdown", (e) => {
    if (reduced) return;
    start(e);
  });
  on(window, "pointermove", (e) => {
    if (reduced) return;
    move(e);
  });
  on(window, "pointerup", (e) => {
    if (reduced) return;
    end(e);
  });

  on(handle, "keydown", (e) => {
    const step = e.shiftKey ? 5 : 2;
    if (e.key === "ArrowLeft") {
      pct = clamp(0, pct - step, 100);
      render();
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      pct = clamp(0, pct + step, 100);
      render();
      e.preventDefault();
    }
  });

  render();
};

