/**
 * src/scripts/animations.js
 * Master animation controller — GSAP + ScrollTrigger + Lenis.
 * FIXED: Proper cleanup for View Transitions, corrected horizontal scroll targeting,
 *        robust counter initialization, ticker callback management.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;
let tickerCallback = null;

/* ━━━ Main Initialization ━━━ */
export function initAnimations() {
  cleanup();

  initLenis();
  initFadeAnimations();
  initStaggerAnimations();
  initCounterAnimations();
  initParallax();
  initMagneticButtons();
  initHorizontalScroll();

  // Give DOM a moment to settle, then refresh
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

/* ━━━ Cleanup (called before re-init on View Transitions) ━━━ */
function cleanup() {
  ScrollTrigger.getAll().forEach((st) => st.kill());

  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }

  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}

/* ━━━ Lenis Smooth Scroll ━━━ */
function initLenis() {
  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false,
  });

  lenisInstance.on('scroll', ScrollTrigger.update);

  tickerCallback = (time) => {
    lenisInstance?.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);
}

/* ━━━ Fade-In Animations ━━━ */
function initFadeAnimations() {
  const elements = document.querySelectorAll('[data-animate]');

  elements.forEach((el) => {
    const type = el.getAttribute('data-animate');
    const delay = parseFloat(el.getAttribute('data-delay') || '0');

    const fromVars = {
      opacity: 0,
      duration: 0.9,
      delay,
      ease: 'power3.out',
    };

    switch (type) {
      case 'fade-up':    fromVars.y = 50;       break;
      case 'fade-down':  fromVars.y = -50;      break;
      case 'fade-left':  fromVars.x = -50;      break;
      case 'fade-right': fromVars.x = 50;       break;
      case 'scale':      fromVars.scale = 0.92;  break;
      case 'fade-in':
      default:
        break;
    }

    gsap.from(el, {
      ...fromVars,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/* ━━━ Stagger Children ━━━ */
function initStaggerAnimations() {
  const parents = document.querySelectorAll('[data-stagger]');

  parents.forEach((parent) => {
    const children = parent.children;
    if (!children.length) return;

    const staggerDelay = parseFloat(parent.getAttribute('data-stagger') || '0.12');

    gsap.from(children, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: staggerDelay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: parent,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/* ━━━ Number Counter ━━━ */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');

  counters.forEach((el) => {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    if (isNaN(target)) return;

    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const obj = { value: 0 };

    // Set initial display
    el.textContent = prefix + '0' + suffix;

    gsap.to(obj, {
      value: target,
      duration: 2.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        el.textContent = prefix + Math.floor(obj.value).toLocaleString() + suffix;
      },
      onComplete: () => {
        el.textContent = prefix + target.toLocaleString() + suffix;
      },
    });
  });
}

/* ━━━ Parallax ━━━ */
function initParallax() {
  const elements = document.querySelectorAll('[data-parallax]');

  elements.forEach((el) => {
    const speed = parseFloat(el.getAttribute('data-parallax') || '0.3');

    gsap.to(el, {
      yPercent: speed * 25,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}

/* ━━━ Magnetic Buttons ━━━ */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('[data-magnetic]');

  buttons.forEach((btn) => {
    const handleMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: 'power2.out' });
    };

    const handleLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    };

    btn.addEventListener('mousemove', handleMove);
    btn.addEventListener('mouseleave', handleLeave);
  });
}

/* ━━━ Horizontal Scroll (Process Section — Desktop Only) ━━━ */
function initHorizontalScroll() {
  const section = document.querySelector('[data-horizontal-scroll]');
  const track = document.querySelector('[data-horizontal-track]');

  if (!section || !track) return;
  if (window.innerWidth < 1024) return;

  // Calculate how far the track needs to translate
  const totalScroll = track.scrollWidth - window.innerWidth;
  if (totalScroll <= 0) return;

  gsap.to(track, {
    x: -totalScroll,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${totalScroll}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
}