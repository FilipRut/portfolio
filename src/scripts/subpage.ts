import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Logo draw animation (instant on subpages — no scroll trigger) ── */
const siteLogo = document.getElementById('site-logo');
if (siteLogo) {
    const drawPaths = siteLogo.querySelectorAll<SVGPathElement>('[class^="draw-"]');
    drawPaths.forEach(p => {
        const len = p.getTotalLength();
        gsap.set(p, { attr: { 'stroke-dasharray': len + 1, 'stroke-dashoffset': len + 1 } });
    });

    if (prefersReducedMotion) {
        drawPaths.forEach(p => gsap.set(p, { attr: { 'stroke-dashoffset': 0 } }));
    } else {
        const drawTl = gsap.timeline({ delay: 0.2 });
        drawTl.to('.draw-r1', { attr: { 'stroke-dashoffset': 0 }, duration: 0.35, ease: 'power2.inOut' }, 0);
        drawTl.to('.draw-r2', { attr: { 'stroke-dashoffset': 0 }, duration: 0.4, ease: 'power2.inOut' }, 0.18);
        drawTl.to('.draw-r3', { attr: { 'stroke-dashoffset': 0 }, duration: 0.22, ease: 'power2.out' }, 0.48);
        drawTl.to('.draw-u', { attr: { 'stroke-dashoffset': 0 }, duration: 0.55, ease: 'power2.inOut' }, 0.1);
        drawTl.to('.draw-t1', { attr: { 'stroke-dashoffset': 0 }, duration: 0.28, ease: 'power2.inOut' }, 0.25);
        drawTl.to('.draw-t2', { attr: { 'stroke-dashoffset': 0 }, duration: 0.32, ease: 'power2.inOut' }, 0.42);
    }

    /* ── Logo dark/light toggle based on dark sections ── */
    const darkSections = document.querySelectorAll<HTMLElement>('[data-section-dark]');
    if (darkSections.length > 0) {
        const checkDark = () => {
            const logoBottom = 80; // logo sits ~80px from top
            let anyDark = false;
            darkSections.forEach(s => {
                const rect = s.getBoundingClientRect();
                if (rect.top < logoBottom && rect.bottom > 0) anyDark = true;
            });
            siteLogo.classList.toggle('is-dark', anyDark);
        };

        ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: checkDark,
        });
        checkDark();
    }
}

/* ── Scroll reveal animations ── */
if (!prefersReducedMotion) {
    // Hero elements — immediate staggered entrance
    gsap.fromTo('.reveal-hero',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
    );

    // Content elements — scroll-triggered reveals
    document.querySelectorAll('.reveal-scroll').forEach(el => {
        gsap.fromTo(el,
            { y: 40, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }
        );
    });

    // Staggered groups (cards, gallery items)
    document.querySelectorAll('[data-reveal-stagger]').forEach(container => {
        const children = container.children;
        if (children.length === 0) return;
        gsap.fromTo(children,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out',
                scrollTrigger: { trigger: container, start: 'top 85%', once: true },
            }
        );
    });
}
