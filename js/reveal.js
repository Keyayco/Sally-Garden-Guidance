import { prefersReducedMotion, qsa } from "./utils.js";

const splitWords = (el) => {
  const text = (el.textContent || "").trim().replace(/\s+/g, " ");
  if (!text) return;
  el.textContent = "";
  const frag = document.createDocumentFragment();
  const words = text.split(" ");

  words.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "split-word";
    span.style.setProperty("--i", String(i));
    span.textContent = w;
    frag.appendChild(span);
    if (i !== words.length - 1) frag.appendChild(document.createTextNode(" "));
  });

  el.appendChild(frag);
  el.classList.add("is-split");
};

const animateSplitIn = (el) => {
  if (prefersReducedMotion() || !el.animate) {
    el.classList.add("is-in");
    return;
  }

  const spans = Array.from(el.querySelectorAll(".split-word"));
  spans.forEach((span, idx) => {
    span.animate(
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      {
        duration: 820,
        delay: idx * 32,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      },
    );
  });
  el.classList.add("is-in");
};

export const initReveals = () => {
  const splitTargets = qsa("[data-split='words']");
  splitTargets.forEach(splitWords);

  const targets = qsa("[data-reveal]");
  const reduced = prefersReducedMotion();

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => {
      el.classList.add("is-in");
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-in");

        if (el.matches("[data-split='words']")) animateSplitIn(el);

        io.unobserve(el);
      });
    },
    { threshold: reduced ? 0.01 : 0.2, rootMargin: "0px 0px -10% 0px" },
  );

  targets.forEach((el) => io.observe(el));
};
