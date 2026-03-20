import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface HeroProject {
    id: string;
    title: string;
    client: string;
    heroImage: string;
}

export function initHeroGallery(vh: number, isMobile: boolean) {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // Project data injected from Astro via window.__heroProjects
    const projects: HeroProject[] = (window as any).__heroProjects ?? [];

    // Each project gets max 2 cards; minimum 4 cards for visual density
    const N = Math.max(4, projects.length * 2);

    // Randomised ratios (0–1) — generated once, stable across resizes
    // wRatio: how far between minW..maxW, yRatio: where in vertical safe zone
    const cardRatioW: number[] = [];
    const cardRatioY: number[] = [];
    for (let i = 0; i < N; i++) {
        cardRatioW.push(Math.random());
        cardRatioY.push(Math.random());
    }
    // Shuffle order (stable across resizes)
    const order: number[] = Array.from({ length: N }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(cardRatioW[i] * (i + 1)); // deterministic from same random
        [order[i], order[j]] = [order[j], order[i]];
    }

    // Computed layout values — recalculated on resize
    let totalW = 0;
    const cardW = new Float64Array(N);
    const cardH = new Float64Array(N);
    const cardTopY = new Float64Array(N);    // CSS top offset
    const cardStartX = new Float64Array(N);  // initial X position in the loop

    function computeLayout() {
        const heroW = hero!.offsetWidth;
        const heroH = hero!.offsetHeight;
        // Responsive padding: scales from 1.5rem (24px) to 4rem (64px)
        const vw = window.innerWidth;
        const padding = Math.max(24, Math.min(64, vw * 0.04));
        const innerW = heroW - 2 * padding;
        const colGap = innerW / 5;

        // Scale cards with hero height — taller viewport = bigger cards
        // Baseline: 700px hero height → scale 1.0, clamp between 0.6–1.5
        const heightScale = Math.min(Math.max(heroH / 700, 0.6), 1.5);
        const minW = (colGap / 2) * heightScale;
        const maxW = colGap * heightScale;
        // Responsive top safe zone: scales with hero height
        const topSafe = Math.max(48, heroH * 0.1);
        const bottomSafe = heroH * 0.75;

        let curX = 0;
        for (let idx = 0; idx < N; idx++) {
            const i = order[idx];
            const w = minW + cardRatioW[i] * (maxW - minW);
            const h = w * (4 / 5);
            const yRange = bottomSafe - topSafe - h;
            const y = yRange > 0 ? topSafe + cardRatioY[i] * yRange : topSafe;

            cardW[idx] = w;
            cardH[idx] = h;
            cardTopY[idx] = y;
            cardStartX[idx] = curX;
            curX += w + colGap;
        }
        totalW = curX;
    }

    computeLayout();

    const gallery = document.createElement('div');
    gallery.style.cssText = 'position:absolute;inset:0;overflow:hidden;z-index:2;pointer-events:none;';

    const photoEls: HTMLElement[] = [];
    const cardX = new Float64Array(N);
    const cardParallaxY = new Float64Array(N);
    const cardHovered = new Uint8Array(N);
    const cardScale = new Float64Array(N).fill(1);

    for (let i = 0; i < N; i++) {
        // Assign project to card (cycle through projects if fewer than N)
        const proj = projects.length > 0 ? projects[i % projects.length] : null;
        const hasProject = proj && proj.heroImage;

        const el = document.createElement(hasProject ? 'a' : 'div') as HTMLElement;
        if (hasProject) (el as HTMLAnchorElement).href = `/projects/${proj.id}`;
        el.style.cssText = `position:absolute;left:0;border-radius:clamp(0.375rem, 0.25rem + 0.25vw, 0.5rem);background:rgba(255,255,255,0.09);box-shadow:0 0 0 0.75px rgba(255,255,255,0.12),0 0.5rem 1.5rem rgba(0,0,0,0.18);pointer-events:auto;will-change:transform;contain:layout style paint;overflow:hidden;text-decoration:none;display:block;cursor:${hasProject ? 'pointer' : 'default'};`;

        if (hasProject) {
            // Project image
            const img = document.createElement('img');
            img.src = proj.heroImage;
            img.alt = proj.title;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;pointer-events:none;display:block;';
            el.appendChild(img);

            // Overlay with project title on hover
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(0.4rem, 0.3rem + 0.2vw, 0.6rem);background:linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%);opacity:0;transition:opacity 0.25s;pointer-events:none;';
            const titleEl = document.createElement('span');
            titleEl.style.cssText = 'font-family:Inter Tight,sans-serif;font-size:clamp(0.55rem, 0.45rem + 0.2vw, 0.75rem);color:#fff;font-weight:500;line-height:1.2;';
            titleEl.textContent = proj.title;
            overlay.appendChild(titleEl);
            if (proj.client) {
                const clientEl = document.createElement('span');
                clientEl.style.cssText = 'font-family:Inter Tight,sans-serif;font-size:clamp(0.45rem, 0.4rem + 0.1vw, 0.6rem);color:rgba(255,255,255,0.6);margin-top:0.15rem;';
                clientEl.textContent = proj.client;
                overlay.appendChild(clientEl);
            }
            el.appendChild(overlay);
            // Show overlay on hover
            el.addEventListener('mouseenter', () => { overlay.style.opacity = '1'; });
            el.addEventListener('mouseleave', () => { overlay.style.opacity = '0'; });
        } else {
            // Fallback placeholder
            const label = document.createElement('div');
            label.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:Inter Tight,sans-serif;font-size:clamp(0.6rem, 0.5rem + 0.15vw, 0.75rem);color:rgba(255,255,255,0.25);letter-spacing:0.08em;pointer-events:none;';
            label.textContent = '5 : 4';
            el.appendChild(label);
        }

        gallery.appendChild(el);
        photoEls.push(el);

        // Set initial size + position
        el.style.top = cardTopY[i] + 'px';
        el.style.width = cardW[i] + 'px';
        el.style.height = cardH[i] + 'px';
        cardX[i] = cardStartX[i];

        el.addEventListener('mouseenter', () => {
            cardHovered[i] = 1;
            gsap.to(cardScale, { [i]: 1.06, duration: 0.25, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', () => {
            cardHovered[i] = 0;
            gsap.to(cardScale, { [i]: 1.0, duration: 0.2, ease: 'power2.in' });
        });
    }

    hero.appendChild(gallery);

    // Apply layout to DOM elements and rescale X positions proportionally
    function applyLayout(oldTotalW: number) {
        const scale = oldTotalW > 0 ? totalW / oldTotalW : 1;
        for (let i = 0; i < N; i++) {
            photoEls[i].style.top = cardTopY[i] + 'px';
            photoEls[i].style.width = cardW[i] + 'px';
            photoEls[i].style.height = cardH[i] + 'px';
            // Scale current X position proportionally so cards don't jump
            cardX[i] *= scale;
        }
    }

    // Resize handler — debounced
    let resizeTimer: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const oldTotalW = totalW;
            computeLayout();
            applyLayout(oldTotalW);
        }, 100);
    });

    // Frost animation
    const heroFrost = document.querySelector<HTMLElement>('.hero-glass-frost');
    let frostTl: gsap.core.Tween | null = null;
    if (heroFrost) {
        gsap.set(heroFrost, { scale: 2, xPercent: 0 });
        frostTl = gsap.to(heroFrost, {
            xPercent: -50,
            duration: 90,
            ease: 'none',
            repeat: -1,
            modifiers: {
                xPercent: (x: string) => String((+x) % -50),
            },
        });
    }

    // Global speed multiplier (scroll-driven slowdown)
    let globalSpeed = 1;
    let heroPaused = false;
    let lastTime = 0;
    const speed = 50; // px per second (base)

    function tick(now: number) {
        requestAnimationFrame(tick);
        if (heroPaused) { lastTime = now; return; }

        const dt = lastTime ? Math.min(now - lastTime, 50) : 16.67;
        lastTime = now;

        const dx = speed * globalSpeed * (dt / 1000);

        for (let i = 0; i < N; i++) {
            if (!cardHovered[i]) {
                cardX[i] -= dx;
            }
            // Wrap
            if (cardX[i] < -cardW[i]) {
                cardX[i] = ((cardX[i] + cardW[i]) % totalW + totalW) % totalW - cardW[i];
            }

            const s = cardScale[i];
            const py = cardParallaxY[i];
            photoEls[i].style.transform = `translate3d(${cardX[i]}px,${py}px,0)${s !== 1 ? ` scale(${s})` : ''}`;
        }
    }

    requestAnimationFrame(tick);

    // Scroll-driven speed + parallax (desktop only)
    if (!isMobile) {
        let lastSetSpeed = 1;

        function setSpeed(s: number) {
            if (Math.abs(s - lastSetSpeed) < 0.01) return;
            lastSetSpeed = s;
            globalSpeed = s;
            if (frostTl) frostTl.timeScale(s);
        }

        ScrollTrigger.create({
            trigger: '#scroll-wrapper',
            start: '0px top',
            end: `${vh}px top`,
            onUpdate(self) {
                setSpeed(gsap.utils.interpolate(1, 0.1, self.progress));
            },
            onLeaveBack() { setSpeed(1); },
        });

        ScrollTrigger.create({
            trigger: '#scroll-wrapper',
            start: `${vh}px top`,
            end: `${vh * 2}px top`,
            scrub: 0.3,
            onUpdate(self) {
                setSpeed(gsap.utils.interpolate(0.1, 1, self.progress));
                // Responsive parallax: scales with viewport height
                const py = -(vh * 0.08) * self.progress;
                for (let i = 0; i < N; i++) cardParallaxY[i] = py;
            },
            onLeaveBack() { setSpeed(0.1); },
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-wrapper',
                start: `${vh}px top`,
                end: `${vh * 2}px top`,
                scrub: 0.3,
            },
        }).to('.hero-letter', { y: '12%', duration: 1 }, 0);
    }

    // Pause button
    const heroPauseBtn = document.getElementById('hero-pause-btn');
    const heroPauseIcon = document.getElementById('hero-pause-icon');
    const heroPlayIcon = document.getElementById('hero-play-icon');

    if (heroPauseBtn && heroPauseIcon && heroPlayIcon) {
        heroPauseBtn.addEventListener('click', () => {
            heroPaused = !heroPaused;
            if (heroPaused) {
                if (frostTl) frostTl.pause();
            } else {
                if (frostTl) frostTl.play();
            }
            heroPauseIcon.style.display = heroPaused ? 'none' : 'block';
            heroPlayIcon.style.display = heroPaused ? 'block' : 'none';
        });
    }
}
