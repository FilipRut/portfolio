import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initHeroGallery(vh: number, isMobile: boolean) {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const heroW = hero.offsetWidth;
    const heroH = hero.offsetHeight;
    const padding = window.innerWidth >= 768 ? 64 : 24;
    const innerW = heroW - 2 * padding;
    const colGap = innerW / 5;

    const minW = colGap / 2;
    const maxW = colGap;
    const topSafe = 88;
    const bottomSafe = heroH * 0.75;

    const N = 12; // More elements for better fill
    const photoData: { w: number; h: number; y: number }[] = [];
    for (let i = 0; i < N; i++) {
        const w = minW + Math.random() * (maxW - minW);
        const h = w * (4 / 5);
        const yRange = bottomSafe - topSafe - h;
        photoData.push({ w, h, y: yRange > 0 ? topSafe + Math.random() * yRange : topSafe });
    }
    for (let i = photoData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [photoData[i], photoData[j]] = [photoData[j], photoData[i]];
    }

    let curX = 0;
    const positions = photoData.map(p => { 
        const r = { ...p, x: curX }; 
        curX += p.w + colGap; 
        return r; 
    });
    const totalW = curX;

    const gallery = document.createElement('div');
    gallery.style.cssText = 'position:absolute;inset:0;overflow:hidden;z-index:2;pointer-events:none;';

    const photoTls: gsap.core.Tween[] = [];
    const photoEls: HTMLElement[] = [];

    let heroPaused = false;

    positions.forEach(p => {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;left:0;top:${p.y}px;width:${p.w}px;height:${p.h}px;border-radius:8px;background:rgba(255,255,255,0.09);box-shadow:0 0 0 0.75px rgba(255,255,255,0.12),0 8px 24px rgba(0,0,0,0.18);pointer-events:auto;cursor:default;transition:box-shadow 0.25s;will-change:transform;transform:translateZ(0);`;
        const label = document.createElement('div');
        label.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:Inter Tight,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.08em;pointer-events:none;';
        label.textContent = '5 : 4';
        el.appendChild(label);
        gallery.appendChild(el);
        photoEls.push(el);

        // Start at calculated X
        const startX = p.x;
        gsap.set(el, { x: startX });

        // Move by totalW to the left, repeating infinitely
        const tl = gsap.to(el, {
            x: "-=" + totalW,
            duration: totalW / 50,
            ease: 'none',
            repeat: -1,
            modifiers: {
                x: (x: string) => {
                    const currentX = parseFloat(x);
                    // Wrapping logic: ensure the element wraps back to the right once it's fully off-screen to the left
                    // Range: [-p.w, totalW - p.w]
                    const wrappedX = ((currentX + p.w) % totalW + totalW) % totalW - p.w;
                    return wrappedX + "px";
                }
            },
        });

        el.addEventListener('mouseenter', () => {
            tl.pause();
            gsap.to(el, { scale: 1.06, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
            el.style.boxShadow = '0 0 0 0.75px rgba(255,255,255,0.22),0 12px 32px rgba(0,0,0,0.28)';
        });
        el.addEventListener('mouseleave', () => {
            el.style.boxShadow = '0 0 0 0.75px rgba(255,255,255,0.12),0 8px 24px rgba(0,0,0,0.18)';
            gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.in', overwrite: 'auto',
                onComplete: () => { if (!heroPaused) tl.play(); },
            });
        });

        photoTls.push(tl);
    });

    hero.appendChild(gallery);

    // Hero pause button
    const heroPauseBtn = document.getElementById('hero-pause-btn');
    const heroPauseIcon = document.getElementById('hero-pause-icon');
    const heroPlayIcon = document.getElementById('hero-play-icon');
    const heroFrost = document.querySelector<HTMLElement>('.hero-glass-frost');

    // Frost — seamless loop via modifier (no jump at repeat)
    let frostTl: gsap.core.Tween | null = null;
    if (heroFrost) {
        gsap.set(heroFrost, { scale: 2, xPercent: 0 });
        frostTl = gsap.to(heroFrost, {
            xPercent: -50,
            duration: 90,
            ease: 'none',
            repeat: -1,
            modifiers: {
                xPercent: (x: string) => String(parseFloat(x) % -50),
            },
        });
    }

    if (!isMobile) {
        // Unified scroll handler — time-slow + parallax in one ScrollTrigger per phase
        let lastSpeed = 1;

        function setSpeed(speed: number) {
            if (Math.abs(speed - lastSpeed) < 0.01) return; // skip tiny changes
            lastSpeed = speed;
            if (frostTl) frostTl.timeScale(speed);
            for (let i = 0; i < photoTls.length; i++) photoTls[i].timeScale(speed);
        }

        // Phase 1: prompter slides to center — gallery slows down
        ScrollTrigger.create({
            trigger: '#scroll-wrapper',
            start: '0px top',
            end: `${vh}px top`,
            onUpdate(self) {
                setSpeed(gsap.utils.interpolate(1, 0.1, self.progress));
            },
            onLeaveBack() { setSpeed(1); },
        });

        // Phase 2: prompter collapses + parallax — gallery speeds back up
        const parallaxTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-wrapper',
                start: `${vh}px top`,
                end: `${vh * 2}px top`,
                scrub: 0.3,
                onUpdate(self) {
                    setSpeed(gsap.utils.interpolate(0.1, 1, self.progress));
                },
                onLeaveBack() { setSpeed(0.1); },
            },
        });
        parallaxTl.to(photoEls, { y: -70, duration: 1 }, 0);
        parallaxTl.to('.hero-letter', { y: '12%', duration: 1 }, 0);
    }

    if (heroPauseBtn && heroPauseIcon && heroPlayIcon) {
        heroPauseBtn.addEventListener('click', () => {
            heroPaused = !heroPaused;
            if (heroPaused) { 
                if (frostTl) frostTl.pause(); 
                photoTls.forEach(tl => tl.pause()); 
            } else { 
                if (frostTl) frostTl.play(); 
                photoTls.forEach(tl => tl.play()); 
            }
            heroPauseIcon.style.display = heroPaused ? 'none' : 'block';
            heroPlayIcon.style.display = heroPaused ? 'block' : 'none';
        });
    }
}