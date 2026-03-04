/**
 * src/scripts/animations.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Master animation controller using GSAP + Lenis.
 * Auto-detects elements via data attributes and animates them.
 *
 * Data attributes:
 *   data-animate="fade-up|fade-down|fade-left|fade-right|fade-in|scale"
 *   data-delay="0.2"          (optional delay in seconds)
 *   data-stagger              (parent: staggers children)
 *   data-counter="300000"     (number counter target)
 *   data-suffix="+"           (appended to counter, e.g. "300,000+")
 *   data-prefix=""            (prepended to counter)
 *   data-parallax="0.3"       (parallax speed)
 *   data-magnetic              (magnetic hover effect)
 */

 import { gsap } from 'gsap';
 import { ScrollTrigger } from 'gsap/ScrollTrigger';
 import Lenis from 'lenis';
 
 gsap.registerPlugin(ScrollTrigger);
 
 let lenisInstance = null;
 
 /* ━━━ Initialization ━━━ */
 export function initAnimations() {
   // Cleanup previous instances (for View Transitions)
   ScrollTrigger.getAll().forEach(st => st.kill());
   if (lenisInstance) {
     lenisInstance.destroy();
     lenisInstance = null;
   }
 
   initLenis();
   initFadeAnimations();
   initStaggerAnimations();
   initCounterAnimations();
   initParallax();
   initMagneticButtons();
   initHorizontalScroll();
 
   // Refresh ScrollTrigger after all animations are set up
   ScrollTrigger.refresh();
 }
 
 /* ━━━ Lenis Smooth Scroll ━━━ */
 function initLenis() {
   lenisInstance = new Lenis({
     duration: 1.2,
     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
     touchMultiplier: 2,
     infinite: false,
   });
 
   // Sync Lenis with GSAP's ticker for buttery scrolling
   lenisInstance.on('scroll', ScrollTrigger.update);
   gsap.ticker.add((time) => {
     lenisInstance.raf(time * 1000);
   });
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
       case 'fade-up':
         fromVars.y = 50;
         break;
       case 'fade-down':
         fromVars.y = -50;
         break;
       case 'fade-left':
         fromVars.x = -50;
         break;
       case 'fade-right':
         fromVars.x = 50;
         break;
       case 'scale':
         fromVars.scale = 0.92;
         break;
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
     const suffix = el.getAttribute('data-suffix') || '';
     const prefix = el.getAttribute('data-prefix') || '';
 
     // Object to animate
     const obj = { value: 0 };
 
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
     btn.addEventListener('mousemove', (e) => {
       const rect = btn.getBoundingClientRect();
       const x = e.clientX - rect.left - rect.width / 2;
       const y = e.clientY - rect.top - rect.height / 2;
       gsap.to(btn, {
         x: x * 0.25,
         y: y * 0.25,
         duration: 0.3,
         ease: 'power2.out',
       });
     });
 
     btn.addEventListener('mouseleave', () => {
       gsap.to(btn, {
         x: 0,
         y: 0,
         duration: 0.6,
         ease: 'elastic.out(1, 0.4)',
       });
     });
   });
 }
 
 /* ━━━ Horizontal Scroll (Process Section) ━━━ */
 function initHorizontalScroll() {
   const section = document.querySelector('[data-horizontal-scroll]');
   const track = document.querySelector('[data-horizontal-track]');
 
   if (!section || !track) return;
 
   // Only apply GSAP horizontal scroll on desktop
   if (window.innerWidth < 1024) return;
 
   const totalScroll = track.scrollWidth - section.offsetWidth;
 
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