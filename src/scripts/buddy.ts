import gsap from 'gsap';

export interface BuddyConfig {
    promptInput: HTMLTextAreaElement;
    prompterFixed: HTMLElement;
    generateBtn: HTMLButtonElement;
    glassWrap: HTMLElement;
    getChatMode: () => boolean;
}

export function initBuddy(config: BuddyConfig) {
    const { promptInput, prompterFixed, generateBtn, glassWrap, getChatMode } = config;

    const buddyCanvas = document.getElementById('pixel-buddy') as HTMLCanvasElement;
    const ctx = buddyCanvas.getContext('2d');
    const buddyWrap = document.getElementById('pixel-buddy-wrap');

    if (!buddyCanvas || !ctx || !buddyWrap) return;

    const PX = 9;

    // Claude Code mascot — wzór 12×8 (exact)
    const T = null;
    const O = '#CB6A4F';
    const E = '#1A1A1A';

    const FRAME_IDLE: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  E,  O,  O,  O,  O,  E,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
    ];

    const FRAME_IDLE_ARM_UP: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  E,  O,  O,  O,  O,  E,  O,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
    ];

    const FRAME_BLINK: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
    ];

    const FRAME_CROUCH: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  E,  O,  O,  O,  O,  E,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  T,  T,  T,  T,  T,  T,  T,  T,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
    ];

    const FRAME_JUMP_FALL: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [O,  O,  O,  E,  O,  O,  O,  O,  E,  O,  O,  O],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
        [T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T],
    ];

    const FRAME_WALK_L: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  E,  O,  O,  O,  O,  E,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T,  T],
        [T,  O,  T,  O,  T,  T,  O,  T,  O,  T,  T,  T],
    ];

    const FRAME_WALK_R: (string | null)[][] = [
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  E,  O,  O,  O,  O,  E,  O,  O,  T,  T],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [T,  T,  O,  O,  O,  O,  O,  O,  O,  O,  O,  O],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [O,  O,  O,  O,  O,  O,  O,  O,  O,  O,  T,  T],
        [T,  T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T],
        [T,  T,  T,  O,  T,  O,  T,  T,  O,  T,  O,  T],
    ];

    function drawFrame(frame: (string | null)[][]) {
        ctx!.imageSmoothingEnabled = false;
        ctx!.clearRect(0, 0, buddyCanvas.width, buddyCanvas.height);
        for (let row = 0; row < frame.length; row++) {
            for (let col = 0; col < frame[row].length; col++) {
                const color = frame[row][col];
                if (color) {
                    ctx!.fillStyle = color;
                    ctx!.fillRect(col * PX, row * PX, PX, PX);
                }
            }
        }
    }

    drawFrame(FRAME_IDLE);

    let blinkTimer: ReturnType<typeof setTimeout>;
    let blinkActive = false;
    let isBlinkingNow = false;

    function scheduleBlink() {
        blinkTimer = setTimeout(() => {
            isBlinkingNow = true;
            drawFrame(FRAME_BLINK);
            setTimeout(() => {
                isBlinkingNow = false;
                drawFrame(armBobStep === 1 ? FRAME_IDLE_ARM_UP : FRAME_IDLE);
                scheduleBlink();
            }, 120);
        }, Math.random() * 2500 + 1500);
    }

    function startBlink() {
        if (blinkActive) return;
        blinkActive = true;
        scheduleBlink();
    }

    function stopBlink() {
        blinkActive = false;
        isBlinkingNow = false;
        clearTimeout(blinkTimer);
        drawFrame(FRAME_IDLE);
    }

    let armBobInterval: ReturnType<typeof setInterval> | null = null;
    let armBobStep = 0;

    function startArmBob() {
        if (armBobInterval) return;
        armBobStep = 0;
        armBobInterval = setInterval(() => {
            if (walkInterval || isBlinkingNow) return;
            armBobStep = (armBobStep + 1) % 2;
            drawFrame(armBobStep === 1 ? FRAME_IDLE_ARM_UP : FRAME_IDLE);
        }, 520);
    }

    function stopArmBob() {
        if (armBobInterval) { clearInterval(armBobInterval); armBobInterval = null; }
        armBobStep = 0;
    }

    function getHideY(): number {
        return glassWrap.offsetHeight + buddyWrap!.offsetHeight + 8;
    }

    gsap.set(buddyWrap, { y: () => getHideY(), opacity: 0 });

    const STAND_Y = 0;

    function showBuddy() {
        buddyWrap!.classList.add('is-active');
        startBlink();
        startArmBob();
        gsap.to(buddyWrap, {
            y: STAND_Y,
            opacity: 1,
            duration: 0.65,
            ease: 'elastic.out(1, 0.45)',
            overwrite: true,
        });
    }

    function hideBuddy() {
        buddyWrap!.classList.remove('is-active');
        stopBlink();
        stopArmBob();
        if (walkInterval) { clearInterval(walkInterval); walkInterval = null; }
        if (walkStopTimer) { clearTimeout(walkStopTimer); walkStopTimer = null; }
        drawFrame(FRAME_IDLE);
        lastBuddyX = 0;
        gsap.timeline({ overwrite: true })
            .to(buddyWrap, { y: -24, duration: 0.13, ease: 'power2.out' })
            .to(buddyWrap, { y: () => getHideY(), opacity: 0, duration: 0.38, ease: 'power2.in' });
    }

    let walkInterval: ReturnType<typeof setInterval> | null = null;
    let walkStopTimer: ReturnType<typeof setTimeout> | null = null;
    let walkStep = 0;
    let walkDir = 0;
    let lastBuddyX = 0;

    function startWalking(dir: number) {
        if (walkInterval && walkDir === dir) return;
        if (walkInterval) clearInterval(walkInterval);
        blinkActive = false;
        isBlinkingNow = false;
        clearTimeout(blinkTimer);
        stopArmBob();
        walkDir = dir;
        const altFrame = dir > 0 ? FRAME_WALK_L : FRAME_WALK_R;
        walkStep = 0;
        drawFrame(altFrame);
        walkInterval = setInterval(() => {
            walkStep = (walkStep + 1) % 2;
            drawFrame(walkStep === 0 ? FRAME_IDLE : altFrame);
        }, 90);
    }

    function stopWalking() {
        if (walkInterval) { clearInterval(walkInterval); walkInterval = null; }
        if (walkStopTimer) { clearTimeout(walkStopTimer); walkStopTimer = null; }
        walkStep = 0;
        walkDir = 0;
        drawFrame(FRAME_IDLE);
        if (buddyWrap!.classList.contains('is-active')) {
            if (!blinkActive) startBlink();
            startArmBob();
        }
    }

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d')!;

    function getCursorPct(): number {
        const ta = promptInput;
        if (!ta) return 0;
        const pos = ta.selectionStart ?? 0;
        const text = ta.value ?? '';
        const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
        const lineText = text.slice(lineStart, pos);
        const fullLine = text.slice(lineStart, text.indexOf('\n', pos) === -1 ? text.length : text.indexOf('\n', pos));
        
        const style = window.getComputedStyle(ta);
        measureCtx.font = `${style.fontSize} ${style.fontFamily}`;
        const cursorPx = measureCtx.measureText(lineText).width;
        const fullPx = measureCtx.measureText(fullLine || 'W').width;
        const taWidth = ta.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const maxPx = Math.max(taWidth, fullPx);
        return Math.min(cursorPx / maxPx, 1);
    }

    function getBuddyX(pct: number): number {
        const wrapWidth = glassWrap.offsetWidth;
        const buddyW = buddyWrap!.offsetWidth;
        return pct * (wrapWidth - buddyW);
    }

    function moveBuddy() {
        if (!buddyWrap!.classList.contains('is-active')) return;
        if (isLaunching) return;
        const pct = getCursorPct();
        const targetX = getBuddyX(pct);
        const dx = targetX - lastBuddyX;
        if (Math.abs(dx) < 2) return;
        const dir = dx > 0 ? 1 : -1;
        startWalking(dir);
        if (walkStopTimer) clearTimeout(walkStopTimer);
        walkStopTimer = setTimeout(stopWalking, 300);
        lastBuddyX = targetX;
        gsap.to(buddyWrap, {
            x: targetX,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    }

    let preventHide = false;
    let isLaunching = false;
    let isJumping = false;

    prompterFixed.addEventListener('focusin', (e) => {
        if ((e.target as HTMLElement).id === 'ai-prompt') showBuddy();
    });

    prompterFixed.addEventListener('focusout', (e) => {
        if ((e.target as HTMLElement).id !== 'ai-prompt') return;
        if (preventHide || isLaunching) { preventHide = false; return; }
        hideBuddy();
    });

    (['input', 'keyup', 'click', 'mouseup'] as const).forEach(evt => {
        promptInput.addEventListener(evt, moveBuddy);
    });

    function spawnConfetti() {
        const colors = ['#FF6B6B','#FFE66D','#4ECDC4','#A78BFA','#F472B6','#34D399','#FFA500','#60A5FA'];
        const rect = buddyWrap!.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.bottom;
        for (let i = 0; i < 28; i++) {
            const el = document.createElement('div');
            const size = Math.random() * 7 + 4;
            el.style.cssText = `position:fixed;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${cx}px;top:${cy}px;z-index:9999;pointer-events:none;image-rendering:pixelated;border-radius:${Math.random() > 0.5 ? '50%' : '0'};`;
            document.body.appendChild(el);
            const angle = (Math.random() * 140 + 20) * (Math.PI / 180);
            const speed = Math.random() * 220 + 80;
            gsap.to(el, {
                x: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                y: Math.sin(angle) * speed + 100,
                rotation: Math.random() * 720 - 360,
                opacity: 0,
                duration: Math.random() * 0.7 + 0.5,
                ease: 'power2.out',
                onComplete: () => el.remove(),
            });
        }
    }

    function rocketBuddy() {
        if (!buddyWrap!.classList.contains('is-active')) return;
        if (isLaunching) return;
        isLaunching = true;
        stopWalking();
        stopBlink();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        gsap.timeline({ overwrite: true })
            .set(buddyWrap, { transformOrigin: '50% 100%' })
            .to(buddyWrap, { scaleX: 1.55, scaleY: 0.42, duration: 0.13, ease: 'power2.out' })
            .to(buddyWrap, { scaleX: 1.55, scaleY: 0.42, duration: 0.06 })
            .to(buddyWrap, { scaleX: 0.62, scaleY: 1.75, duration: 0.11, ease: 'power2.in' })
            .call(() => spawnConfetti())
            .to(buddyWrap, { scaleX: 1, scaleY: 1, duration: 0.07, ease: 'none' })
            .to(buddyWrap, {
                x: '+=' + (vw * 0.55),
                y: -(vh + buddyWrap!.offsetHeight + 120),
                rotation: 55,
                duration: 0.72,
                ease: 'power3.in',
            })
            .call(() => {
                isLaunching = false;
                buddyWrap!.classList.remove('is-active');
                gsap.set(buddyWrap, { y: () => getHideY(), x: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 0 });
                lastBuddyX = 0;
            });
    }

    function jumpBuddy() {
        if (!buddyWrap!.classList.contains('is-active')) return;
        if (isJumping || isLaunching) return;
        isJumping = true;
        stopBlink();
        stopArmBob();

        drawFrame(FRAME_CROUCH);

        gsap.timeline({ overwrite: 'auto' })
            .to(buddyWrap, { y: STAND_Y + 3, duration: 0.08, ease: 'power2.out' })
            .call(() => drawFrame(FRAME_IDLE))
            .to(buddyWrap, { y: STAND_Y - 22, duration: 0.20, ease: 'power2.out' })
            .call(() => drawFrame(FRAME_JUMP_FALL))
            .to(buddyWrap, { y: STAND_Y, duration: 0.17, ease: 'power3.in' })
            .to(buddyWrap, { y: STAND_Y - 5, duration: 0.06, ease: 'power2.out' })
            .to(buddyWrap, { y: STAND_Y, duration: 0.09, ease: 'power2.in' })
            .call(() => {
                drawFrame(FRAME_IDLE);
                isJumping = false;
                if (buddyWrap!.classList.contains('is-active')) {
                    startBlink();
                    startArmBob();
                }
            });
    }

    generateBtn.addEventListener('mousedown', () => { preventHide = true; });
    generateBtn.addEventListener('click', () => { if (!getChatMode()) rocketBuddy(); });
    promptInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === ' ' && !getChatMode()) jumpBuddy();
    });

    return {
        hideBuddy
    };
}