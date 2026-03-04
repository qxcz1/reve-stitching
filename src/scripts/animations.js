/**
 * src/scripts/animations.js
 * COMPLETE REWRITE — fixes invisible content bug.
 *
 * Root cause: gsap.from() sets opacity:0 immediately, but if ScrollTrigger
 * never fires (scroll position issues with Lenis, timing race conditions),
 * elements stay invisible forever.
 *
 * Fix: Use gsap.fromTo() with explicit start/end states, wrap everything
 * in try/catch, and ensure elements are always visible if anything fails.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;
let tickerCallback = null;

/* ━━━ Main Initialization ━━━ */
export function initAnimations() {
  try {
    cleanup();
    initLenis();

    // Mark that GSAP is ready
    document.documentElement.classList.add('gsap-ready');

    // Small delay to let DOM fully paint before measuring
    requestAnimationFrame(() => {
      try {
        initFadeAnimations();
        initStaggerAnimations();
        initCounterAnimations();
        initParallax();
        initMagneticButtons();
        initHorizontalScroll();
        ScrollTrigger.refresh();
      } catch (e) {
        console.warn('Animation init error:', e);
        makeEverythingVisible();
      }
    });
  } catch (e) {
    console.warn('GSAP init error:', e);
    makeEverythingVisible();
  }
}

/* ━━━ Fallback: Force everything visible ━━━ */
function makeEverythingVisible() {
  document.querySelectorAll('[data-animate], [data-stagger] > *').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
}

/* ━━━ Cleanup ━━━ */
function cleanup() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  ScrollTrigger.clearMatchMedia();

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
  // Dynamic import to prevent Lenis from breaking everything if it fails
  try {
    const Lenis = window.Lenis || null;

    // If Lenis isn't available as a global, try the module approach
    if (!Lenis) {
      import('lenis').then((module) => {
        const LenisClass = module.default || module.Lenis;
        setupLenis(LenisClass);
      }).catch(() => {
        console.warn('Lenis not available, using native scroll');
      });
    } else {
      setupLenis(Lenis);
    }
  } catch (e) {
    console.warn('Lenis init skipped:', e);
  }
}

function setupLenis(LenisClass) {
  if (!LenisClass) return;

  lenisInstance = new LenisClass({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false,
  });

  lenisInstance.on('scroll', ScrollTrigger.update);

  tickerCallback = (time) => {
    if (lenisInstance) lenisInstance.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);
}

/* ━━━ Fade-In Animations ━━━ */
function initFadeAnimations() {
  const elements = document.querySelectorAll('[data-animate]');

  elements.forEach((el) => {
    // Skip elements inside [data-stagger] — those are handled separately
    if (el.closest('[data-stagger]') && !el.hasAttribute('data-stagger')) return;

    const type = el.getAttribute('data-animate');
    const delay = parseFloat(el.getAttribute('data-delay') || '0');

    // Build the FROM state
    const fromState = { opacity: 0 };
    // Build the TO state
    const toState = {
      opacity: 1,
      duration: 0.9,
      delay,
      ease: 'power3.out',
      clearProps: 'transform',
    };

    switch (type) {
      case 'fade-up':
        fromState.y = 40;
        toState.y = 0;
        break;
      case 'fade-down':
        fromState.y = -40;
        toState.y = 0;
        break;
      case 'fade-left':
        fromState.x = -40;
        toState.x = 0;
        break;
      case 'fade-right':
        fromState.x = 40;
        toState.x = 0;
        break;
      case 'scale':
        fromState.scale = 0.92;
        toState.scale = 1;
        break;
      case 'fade-in':
      default:
        break;
    }

    gsap.fromTo(el, fromState, {
      ...toState,
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        end: 'top 60%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/* ━━━ Stagger Children ━━━ */
function initStaggerAnimations() {
  const parents = document.querySelectorAll('[data-stagger]');

  parents.forEach((parent) => {
    const children = Array.from(parent.children);
    if (!children.length) return;

    const staggerDelay = parseFloat(parent.getAttribute('data-stagger') || '0.12');

    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: staggerDelay,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: {
          trigger: parent,
          start: 'top 88%',
          end: 'top 50%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/* ━━━ Number Counter ━━━ */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');

  counters.forEach((el) => {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    if (isNaN(target) || target === 0) return;

    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const obj = { value: 0 };

    el.textContent = prefix + '0' + suffix;

    gsap.to(obj, {
      value: target,
      duration: 2.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 92%',
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
  // Only on desktop — touch devices don't benefit from magnetic hover
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const buttons = document.querySelectorAll('[data-magnetic]');

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: 'power2.out' });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ━━━ Horizontal Scroll (Desktop Only) ━━━ */
function initHorizontalScroll() {
  const section = document.querySelector('[data-horizontal-scroll]');
  const track = document.querySelector('[data-horizontal-track]');

  if (!section || !track) return;
  if (window.innerWidth < 1024) return;

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