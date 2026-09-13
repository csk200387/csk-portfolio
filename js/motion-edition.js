import { animate, createTimeline, stagger } from "./vendor/anime.esm.min.js";

export function initMotionEdition(isMotionOff) {
  const active = new Set();
  const track = animation => {
    active.add(animation);
    animation.then(() => active.delete(animation));
    return animation;
  };

  // Text stays readable before enhancement and when scripting is unavailable.
  document.querySelectorAll(".hero-word").forEach(word => {
    const letters = [...word.textContent].map(character => {
      const span = document.createElement("span");
      span.className = character === "." ? "letter type-period" : "letter";
      span.textContent = character;
      return span;
    });
    word.replaceChildren(...letters);
  });

  if (!isMotionOff()) {
    const intro = createTimeline({ defaults: { ease: "outExpo" } });
    intro.add(".hero-word .letter", {
      y: [90, 0], rotate: [7, 0], opacity: [0, 1],
      duration: 1150, delay: stagger(32),
    }, 0).add(".hero .eyebrow, .hero-sub, .hero-actions, .hero-stats", {
      y: [18, 0], opacity: [0, 1], duration: 900, delay: stagger(100),
    }, 120).add(".signal-lab", {
      y: [32, 0], opacity: [0, 1], duration: 1300,
    }, 200);
    track(intro);
  }

  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveals.unobserve(entry.target);
      if (isMotionOff()) return;
      const items = entry.target.querySelectorAll("h2, .section-lede, .section-note, .focus-list li, .stack-group, .contact-eyebrow, .contact-links");
      if (items.length) track(animate(items, {
        y: [26, 0], opacity: [0, 1], duration: 850,
        delay: stagger(75), ease: "outExpo",
      }));
    });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(section => reveals.observe(section));

  const ticker = document.querySelector(".signal-ticker");
  let tickerVisible = false;
  const syncTicker = () => ticker.classList.toggle("motion-suspended", document.hidden || !tickerVisible);
  new IntersectionObserver(([entry]) => {
    tickerVisible = entry.isIntersecting;
    syncTicker();
  }).observe(ticker);
  document.addEventListener("visibilitychange", syncTicker);
  syncTicker();

  return {
    onMotionChange() {
      if (isMotionOff()) {
        [...active].forEach(animation => animation.complete());
        active.clear();
      }
    },
  };
}
