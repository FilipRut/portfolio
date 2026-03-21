import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initClock } from './clock';
import { initMatrixCursor } from './matrixCursor';
import { initPlaceholder } from './placeholder';
import { initHeroGallery } from './gallery';
import { initBuddy } from './buddy';
import { initMapTooltip } from './map-tooltip';

gsap.registerPlugin(ScrollTrigger);

gsap.ticker.lagSmoothing(0);
gsap.config({ force3D: true });

/* ── Responsive design tokens ──
 * All layout sizes use clamp() so they scale fluidly between mobile (320px) and desktop (1920px).
 * WCAG touch target minimum: 2.75rem (44px at 16px base) */
const T = {
    // Collapsed pill
    pillH:        'clamp(2.75rem, 2.5rem + 0.5vw, 3.25rem)',   // 44–52px
    pillPad:      'clamp(0.25rem, 0.2rem + 0.1vw, 0.25rem)',     // ~4px uniform
    pillRadius:   'clamp(1.875rem, 1.75rem + 0.25vw, 1.875rem)', // ~30px (pill shape needs full rounding)
    // Textarea inside pill
    inputH:       'clamp(2.75rem, 2.5rem + 0.5vw, 3.25rem)',    // matches pill
    inputRadius:  'clamp(1.625rem, 1.5rem + 0.25vw, 1.625rem)',  // ~26px (inner pill rounding)
    inputPadX:    'clamp(0.75rem, 0.6rem + 0.3vw, 1rem)',       // 12–16px
    // Buttons
    btnSize:      'clamp(2rem, 1.75rem + 0.5vw, 2.25rem)',      // 32–36px
    btnIconSize:  'clamp(0.875rem, 0.75rem + 0.25vw, 1rem)',    // 14–16px
    btnSizeLg:    'clamp(2.5rem, 2.25rem + 0.5vw, 3rem)',       // 40–48px
    btnIconSizeLg:'clamp(1rem, 0.875rem + 0.25vw, 1.25rem)',    // 16–20px
    // Overlay bottom (bubbles bar)
    barH:         'clamp(2.75rem, 2.5rem + 0.5vw, 3.25rem)',    // matches pill
    barPadY:      'clamp(0.2rem, 0.15rem + 0.1vw, 0.25rem)',     // 3–4px (top/bottom)
    barPadX:      'clamp(0.3rem, 0.25rem + 0.15vw, 0.375rem)',   // 4–6px (left/right)
    // Bubbles
    bubbleH:      'clamp(1.75rem, 1.5rem + 0.5vw, 2rem)',       // 28–32px
    bubblePadX:   'clamp(0.625rem, 0.5rem + 0.25vw, 0.875rem)', // 10–14px
    bubbleFontSz: 'clamp(0.7rem, 0.65rem + 0.15vw, 0.8rem)',   // 11–13px
    // Intermediate collapse keyframe
    midH:         'clamp(5.5rem, 5rem + 1vw, 7.5rem)',          // 88–120px
    midPad:       'clamp(0.3rem, 0.25rem + 0.1vw, 0.5rem)',     // 4–8px
    midRadius:    'clamp(0.75rem, 0.6rem + 0.3vw, 1rem)',       // 12–16px
    midInputH:    'clamp(5rem, 4.5rem + 1vw, 6.25rem)',         // 72–100px
    // Top offset for collapsed pill
    topOffset:    'clamp(0.5rem, 0.25rem + 0.5vw, 1rem)',       // 8–16px
    // Expanded textarea (hero / chat open)
    expandedMinH: 'clamp(14rem, 10rem + 7vw, 22rem)',
    expandedRadius:'clamp(0.5rem, 0.35rem + 0.3vw, 0.85rem)',
    expandedPadT: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)',
    expandedPadB: 'clamp(4.5rem, 3.5rem + 1.5vw, 6rem)',
    expandedPadX: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)',
    barPadExpanded:'clamp(0.75rem, 0.5rem + 0.4vw, 1.25rem)',
    glassMinH:    'clamp(16rem, 12rem + 8vw, 24rem)',
    glassPad:     'clamp(0.4rem, 0.3rem + 0.2vw, 0.6rem)',
    glassRadius:  'clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem)',
};

function init() {
    initClock();
    initMapTooltip();

    /* ── HERO ENTRANCE ── */
    const alreadyScrolled = window.scrollY > 50;

    if (alreadyScrolled) {
        gsap.set('.hero-label', { y: 0, opacity: 1 });
        gsap.set('.hero-line', { scaleY: 1 });
        gsap.set('.hero-letter', { y: '0%', opacity: 1 });
    } else {
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        heroTl.fromTo('.hero-label',
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }
        );

        heroTl.from('.hero-line', {
            scaleY: 0, transformOrigin: 'top center',
            duration: 1, stagger: 0.08, ease: 'power2.inOut',
        }, '-=0.6');

        heroTl.fromTo('.hero-letter',
            { y: '120%', opacity: 0 },
            { y: '0%', opacity: 1, duration: 1.4, stagger: 0.12, ease: 'power4.out' },
        '-=0.8');
    }

    /* ── FIXED PROMPTER ── */
    const prompterFixed = document.querySelector<HTMLElement>('#prompter-fixed')!;
    const glassContainer = document.querySelector<HTMLElement>('.glass-container')!;
    const textareaWrap = document.querySelector<HTMLElement>('.prompter-textarea-wrap')!;
    const overlayTop = document.querySelector<HTMLElement>('.glass-overlay-top')!;
    const overlayBottom = document.querySelector<HTMLElement>('.glass-overlay-bottom')!;
    const prompterColumn = document.querySelector<HTMLElement>('.prompter-column')!;

    const vh = window.innerHeight;
    const isMobile = window.innerWidth < 768;

    initHeroGallery(vh, isMobile);

    const glassH = glassContainer.offsetHeight;
    const glassOffsetInCol = glassContainer.getBoundingClientRect().top - prompterColumn.getBoundingClientRect().top;
    const yOffScreen = vh * 1.5;
    const yCentered = (vh - glassH) / 2 - glassOffsetInCol;
    const yTop = 16;

    const sceneVignette = document.getElementById('scene-vignette')!;

    function buildCollapse(tl: gsap.core.Timeline) {
        // Single smooth collapse: expanded → pill. No intermediate keyframes.
        // Overlay fades out first (0–0.3), then container shrinks (0.1–1.0)
        tl.to(overlayTop, { opacity: 0, duration: 0.3 }, 0);

        // Container + textarea shrink together (0.1–1.0)
        tl.to(glassContainer, {
            minHeight: T.pillH,
            paddingTop: T.pillPad, paddingBottom: T.pillPad,
            paddingLeft: T.pillPad, paddingRight: T.pillPad,
            borderTopLeftRadius: T.pillRadius, borderTopRightRadius: T.pillRadius,
            borderBottomLeftRadius: T.pillRadius, borderBottomRightRadius: T.pillRadius,
            duration: 0.9, ease: 'power2.inOut',
        }, 0.1);

        tl.to(textareaWrap, {
            minHeight: T.inputH,
            borderTopLeftRadius: T.inputRadius, borderTopRightRadius: T.inputRadius,
            borderBottomLeftRadius: T.inputRadius, borderBottomRightRadius: T.inputRadius,
            duration: 0.9, ease: 'power2.inOut',
        }, 0.1);

        tl.to('.prompter-textarea', {
            paddingTop: '0px', paddingBottom: '0px',
            paddingLeft: T.inputPadX, paddingRight: T.inputPadX,
            height: T.inputH, lineHeight: T.inputH,
            duration: 0.9,
        }, 0.1);

        tl.to('#generate-btn', { width: T.btnSize, height: T.btnSize, duration: 0.9 }, 0.1);
        tl.to('#generate-btn svg', { width: T.btnIconSize, height: T.btnIconSize, duration: 0.9 }, 0.1);
        tl.to(overlayBottom, {
            height: T.barH,
            paddingTop: T.barPadY, paddingBottom: T.barPadY,
            paddingLeft: T.barPadX, paddingRight: T.barPadX,
            duration: 0.9,
        }, 0.1);
        tl.to('.prompt-bubble', { height: T.bubbleH, paddingTop: '0px', paddingBottom: '0px', duration: 0.9 }, 0.1);
    }

    const promptInput = document.querySelector<HTMLTextAreaElement>('#ai-prompt')!;

    initMatrixCursor(promptInput);
    initPlaceholder(promptInput);

    promptInput.addEventListener('input', () => {
        promptInput.scrollLeft = promptInput.scrollWidth;
    });

    let chatMode = false;

    if (isMobile) {
        gsap.set(prompterColumn, { y: 0 });
        gsap.set(glassContainer, { minHeight: T.pillH, paddingTop: T.pillPad, paddingBottom: T.pillPad, paddingLeft: T.pillPad, paddingRight: T.pillPad, borderTopLeftRadius: T.pillRadius, borderTopRightRadius: T.pillRadius, borderBottomLeftRadius: T.pillRadius, borderBottomRightRadius: T.pillRadius });
        gsap.set(textareaWrap, { minHeight: T.inputH, borderTopLeftRadius: T.inputRadius, borderTopRightRadius: T.inputRadius, borderBottomLeftRadius: T.inputRadius, borderBottomRightRadius: T.inputRadius });
        gsap.set('.prompter-textarea', { paddingTop: '0px', paddingBottom: '0px', paddingLeft: T.inputPadX, paddingRight: T.inputPadX, height: T.inputH, lineHeight: T.inputH });
        gsap.set('#generate-btn', { width: T.btnSize, height: T.btnSize });
        gsap.set('#generate-btn svg', { width: T.btnIconSize, height: T.btnIconSize });
        gsap.set(overlayTop, { opacity: 0 });
        gsap.set(overlayBottom, { height: T.barH, padding: T.barPad });
        gsap.set('.prompt-bubble', { paddingTop: '0px', paddingBottom: '0px', lineHeight: T.bubbleH });

        let mobileExpanded = false;
        glassContainer.addEventListener('click', () => {
            if (!mobileExpanded && !chatMode) {
                promptInput.focus();
            }
        });

        promptInput.addEventListener('focus', () => {
            if (mobileExpanded || chatMode) return;
            mobileExpanded = true;
            const expandTl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power3.out' } });
            expandTl
                .to(glassContainer, { minHeight: '50vh', padding: T.glassPad, borderTopLeftRadius: T.glassRadius, borderTopRightRadius: T.glassRadius, borderBottomLeftRadius: T.glassRadius, borderBottomRightRadius: T.glassRadius }, 0)
                .to(textareaWrap, { minHeight: 'calc(50vh - 2rem)', borderTopLeftRadius: T.expandedRadius, borderTopRightRadius: T.expandedRadius, borderBottomLeftRadius: T.expandedRadius, borderBottomRightRadius: T.expandedRadius }, 0)
                .to('.prompter-textarea', { paddingTop: T.expandedPadT, paddingBottom: T.expandedPadB, paddingLeft: T.expandedPadX, paddingRight: T.expandedPadX, height: '100%', lineHeight: '1.6' }, 0)
                .to('#generate-btn', { width: T.btnSize, height: T.btnSize }, 0)
                .to('#generate-btn svg', { width: T.btnIconSizeLg, height: T.btnIconSizeLg }, 0)
                .to(overlayTop, { opacity: 1 }, 0)
                .to(overlayBottom, { height: 'auto', padding: T.barPadExpanded }, 0)
                .to('.prompt-bubble', { paddingTop: '', paddingBottom: '', lineHeight: '', clearProps: 'paddingTop,paddingBottom,lineHeight' }, 0);
        });

        promptInput.addEventListener('blur', () => {
            if (!mobileExpanded || chatMode) return;
            mobileExpanded = false;
            const collapseTl = gsap.timeline({ defaults: { duration: 0.3, ease: 'power2.in' } });
            collapseTl
                .to(glassContainer, { minHeight: T.pillH, paddingTop: T.pillPad, paddingBottom: T.pillPad, paddingLeft: T.pillPad, paddingRight: T.pillPad, borderTopLeftRadius: T.pillRadius, borderTopRightRadius: T.pillRadius, borderBottomLeftRadius: T.pillRadius, borderBottomRightRadius: T.pillRadius }, 0.1)
                .to(textareaWrap, { minHeight: T.inputH, borderTopLeftRadius: T.inputRadius, borderTopRightRadius: T.inputRadius, borderBottomLeftRadius: T.inputRadius, borderBottomRightRadius: T.inputRadius }, 0.1)
                .to('.prompter-textarea', { paddingTop: '0px', paddingBottom: '0px', paddingLeft: T.inputPadX, paddingRight: T.inputPadX, height: T.inputH, lineHeight: T.inputH }, 0.1)
                .to('#generate-btn', { width: T.btnSize, height: T.btnSize }, 0.1)
                .to('#generate-btn svg', { width: T.btnIconSize, height: T.btnIconSize }, 0.1)
                .to(overlayTop, { opacity: 0, duration: 0.15 }, 0)
                .to(overlayBottom, { height: T.barH, padding: T.barPad }, 0.1)
                .to('.prompt-bubble', { paddingTop: '0px', paddingBottom: '0px', lineHeight: T.bubbleH }, 0.1);
        });
    } else {
        gsap.set(prompterColumn, { y: yOffScreen });
        const vignetteInStart = vh * 0.30;
        const vignetteInEnd = vh;
        const vignetteOutStart = vh;
        const vignetteOutEnd = vh * 1.5;

        // Vignette fade in/out via GSAP scrub (GPU-composited, no JS per scroll)
        gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-wrapper',
                start: `${vh * 0.30}px top`,
                end: `${vh}px top`,
                scrub: 0.3,
            },
        }).fromTo(sceneVignette, { opacity: 0 }, { opacity: 1, duration: 1 });

        gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-wrapper',
                start: `${vh}px top`,
                end: `${vh * 1.5}px top`,
                scrub: 0.3,
            },
        }).to(sceneVignette, { opacity: 0, duration: 1 });

        const slideTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-wrapper',
                start: '0px top',
                end: `${vh}px top`,
                scrub: 0.3,
            },
        });

        slideTl.to(prompterColumn, { y: yCentered, duration: 1, ease: 'power2.out' });

        const collapseTl = gsap.timeline({
            defaults: { duration: 1, ease: 'none' },
            scrollTrigger: {
                trigger: '#scroll-wrapper',
                start: `${vh}px top`,
                end: `${vh * 2}px top`,
                scrub: 0.3,
            },
        });

        collapseTl.to(prompterColumn, { y: yTop, duration: 1 }, 0);
        buildCollapse(collapseTl);
    }

    gsap.fromTo('.intro-el',
        { y: 40, opacity: 0 },
        {
            y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: '#intro', start: 'top 80%', once: true },
        }
    );

    /* ── Show more — seamless transition to /projects ── */
    const showMoreBtn = document.getElementById('show-more-btn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', async () => {
            showMoreBtn.style.pointerEvents = 'none';
            showMoreBtn.style.opacity = '0.4';

            // 1. Force keychain dramatic exit
            try {
                const { forceKeychainExit } = await import('./threeScene');
                await forceKeychainExit();
            } catch { /* 3D may not be loaded yet */ }

            // 2. Fade out tiles + divider
            const introProjects = document.getElementById('intro-projects');
            if (introProjects) {
                await gsap.to(introProjects, { opacity: 0, duration: 0.3, ease: 'power2.in' });
            }
            await gsap.to(showMoreBtn, { opacity: 0, duration: 0.15 });

            // 3. Switch to expanded grid
            const intro = document.getElementById('intro')!;
            intro.classList.add('intro--expanded');
            intro.style.minHeight = 'auto';

            // 4. Collapse sections above the grid so it sits at the top
            const scrollWrapper = document.getElementById('scroll-wrapper');
            const introRow = document.querySelector<HTMLElement>('.intro-row');
            const threeContainer = document.getElementById('global-three-container');
            const sceneVignette = document.getElementById('scene-vignette');
            const processSection = document.getElementById('process');

            // Hide hero, 3D canvas, vignette, intro header row, process
            [scrollWrapper, threeContainer, sceneVignette].forEach(el => {
                if (el) el.style.display = 'none';
            });
            if (introRow) introRow.style.display = 'none';
            if (processSection) processSection.style.display = 'none';

            // Reset intro padding top to leave room for the fixed prompter pill
            intro.style.paddingTop = 'clamp(4rem, 3rem + 2vw, 6rem)';

            // Scroll to top instantly (grid is now at the top of the page)
            window.scrollTo(0, 0);

            // 5. Staggered reveal of grid cards
            await gsap.fromTo('.grid-card',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: 'power3.out' }
            );

            // 6. Push URL to /projects (no reload, no scroll jump)
            history.pushState({ fromShowMore: true }, '', '/projects');

            // 7. Refresh scroll triggers for new layout
            ScrollTrigger.refresh();
        });
    }

    // Process section — staggered reveal
    gsap.fromTo('.process-el',
        { y: 30, opacity: 0 },
        {
            y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: '#process', start: 'top 75%', once: true },
        }
    );


    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function sendToAI(history: { role: string; text: string }[]): Promise<string> {
        try {
            const messages = history.map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.text,
            }));
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });
            const data = await res.json();
            if (data.error) return data.error;
            return data.reply || 'Sorry, I could not generate a response.';
        } catch {
            return 'Connection error — please try again.';
        }
    }
    const generateBtn = document.querySelector<HTMLButtonElement>('#generate-btn')!;
    const triggers = document.querySelectorAll<HTMLButtonElement>('.prompt-bubble');
    const chatOverlay = document.getElementById('chat-overlay')!;
    const chatDim = document.getElementById('chat-dim')!;
    const chatMessagesInline = document.getElementById('chat-messages-inline')!;
    const chatCloseInline = document.getElementById('chat-close-inline')!;
    const chatSpinner = document.getElementById('chat-spinner')!;

    let chatHistory: { role: 'user' | 'bot'; text: string }[] = [];
    let isSending = false;
    let prompterState: 'offscreen' | 'centered' | 'collapsed' | 'chat' = 'offscreen';

    if (!isMobile) {
        ScrollTrigger.create({
            trigger: '#scroll-wrapper',
            start: '0px top',
            end: `${vh}px top`,
            onLeave: () => { if (prompterState !== 'chat') prompterState = 'centered'; },
            onEnterBack: () => { if (prompterState !== 'chat') prompterState = 'offscreen'; },
        });
        ScrollTrigger.create({
            trigger: '#scroll-wrapper',
            start: `${vh}px top`,
            end: `${vh * 2}px top`,
            onLeave: () => { if (prompterState !== 'chat') prompterState = 'collapsed'; },
            onEnterBack: () => { if (prompterState !== 'chat') prompterState = 'centered'; },
        });
    } else {
        prompterState = 'collapsed';
    }

    function saveChat() { try { localStorage.setItem('portfolio-chat', JSON.stringify(chatHistory)); } catch {} }
    function loadChat() { try { const saved = localStorage.getItem('portfolio-chat'); if (saved) chatHistory = JSON.parse(saved); } catch {} }
    loadChat();

    function appendBubble(role: 'user' | 'bot', text: string) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble chat-bubble--${role}`;
        bubble.textContent = text;
        chatMessagesInline.appendChild(bubble);
        chatMessagesInline.scrollTop = chatMessagesInline.scrollHeight;
    }

    function restoreHistory() { chatMessagesInline.innerHTML = ''; chatHistory.forEach(msg => appendBubble(msg.role, msg.text)); }
    function showSpinner() { chatSpinner.classList.add('is-active'); }
    function hideSpinner() { chatSpinner.classList.remove('is-active'); }

    // Collapsed state — WCAG: min 2.75rem (44px) touch targets, all values responsive
    const collapsedGlassValues = { minHeight: T.pillH, paddingTop: T.pillPad, paddingBottom: T.pillPad, paddingLeft: T.pillPad, paddingRight: T.pillPad, borderTopLeftRadius: T.pillRadius, borderTopRightRadius: T.pillRadius, borderBottomLeftRadius: T.pillRadius, borderBottomRightRadius: T.pillRadius };
    const collapsedTextareaWrapValues = { minHeight: T.inputH, borderTopLeftRadius: T.inputRadius, borderTopRightRadius: T.inputRadius, borderBottomLeftRadius: T.inputRadius, borderBottomRightRadius: T.inputRadius };
    const collapsedTextareaValues = { paddingTop: '0px', paddingBottom: '0px', paddingLeft: T.inputPadX, paddingRight: '50%', height: T.inputH, lineHeight: T.inputH };
    const collapsedBtnValues = { width: T.btnSize, height: T.btnSize };
    const collapsedBtnSvgValues = { width: T.btnIconSize, height: T.btnIconSize };
    const collapsedOverlayTopValues = { opacity: 0 };
    const collapsedOverlayBottomValues = { height: T.barH, paddingTop: T.barPadY, paddingBottom: T.barPadY, paddingLeft: T.barPadX, paddingRight: T.barPadX };
    const collapsedBubbleValues = {
        height: T.bubbleH,
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: T.bubblePadX,
        paddingRight: T.bubblePadX,
        fontSize: T.bubbleFontSz,
    };

    function collapseToOriginal(): gsap.core.Timeline {
        const tl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power3.inOut' } });
        if (!isMobile) { tl.to(prompterColumn, { y: yTop, duration: 0.5 }, 0); tl.to(sceneVignette, { opacity: 0, duration: 0.3 }, 0); }
        tl.to(glassContainer, collapsedGlassValues, 0);
        tl.to(textareaWrap, collapsedTextareaWrapValues, 0);
        tl.to('.prompter-textarea', collapsedTextareaValues, 0);
        tl.to('#generate-btn', collapsedBtnValues, 0);
        tl.to('#generate-btn svg', collapsedBtnSvgValues, 0);
        tl.to(overlayTop, collapsedOverlayTopValues, 0);
        tl.to(overlayBottom, collapsedOverlayBottomValues, 0);
        tl.to('.prompt-bubble', collapsedBubbleValues, 0);
        return tl;
    }

    // Chat panel geometry — bottom-anchored, responsive
    const chatPanelH = vh * 0.8;
    const chatBottomPad = vh * 0.1;  // 10% of viewport for buddy character
    const pillCollapsedH = Math.max(44, Math.min(52, vh * 0.06)); // responsive pill height (px for calc)
    const yPillAtBottom = vh - chatBottomPad - pillCollapsedH;
    const yPanelExpanded = vh - chatBottomPad - chatPanelH; // expanded panel top edge

    // Whether the chat input area has been shrunk to compact bar after first response
    let chatInputCompacted = false;

    function openChatTransition(compact: boolean): gsap.core.Timeline {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        // Prepare chat elements (hidden, will fade in later)
        chatMessagesInline.style.display = 'flex';
        chatCloseInline.style.display = 'grid';
        gsap.set([chatMessagesInline, chatCloseInline], { opacity: 0 });
        chatInputCompacted = true;

        // Capture current pill height for smooth maxHeight animation
        const pillH = glassContainer.offsetHeight;

        // Phase 1 (0–0.15s): Hide bubbles, add chat-mode, start dim
        tl.to('.prompt-bubble', { opacity: 0, duration: 0.12 }, 0);
        tl.to(overlayTop, { opacity: 0, duration: 0.1 }, 0);
        tl.call(() => {
            chatOverlay.classList.add('is-active');
            glassContainer.classList.add('chat-mode');
        }, undefined, 0);
        gsap.set(chatDim, { opacity: 0 });
        tl.to(chatDim, { opacity: 1, duration: 0.5 }, 0);
        if (!isMobile) {
            tl.to(sceneVignette, { opacity: 0, duration: 0.3 }, 0);
        }

        // Phase 2 (0.05–0.55s): Grow glass from pill → panel using maxHeight
        // Column stays at yTop, glass grows downward. Then column slides to final Y.
        const growDur = 0.45;
        gsap.set(glassContainer, { maxHeight: pillH + 'px', overflow: 'hidden' });
        tl.to(glassContainer, {
            maxHeight: chatPanelH + 'px',
            minHeight: chatPanelH + 'px',
            borderTopLeftRadius: T.glassRadius, borderTopRightRadius: T.glassRadius,
            borderBottomLeftRadius: T.glassRadius, borderBottomRightRadius: T.glassRadius,
            paddingTop: T.glassPad, paddingBottom: T.glassPad,
            paddingLeft: T.glassPad, paddingRight: T.glassPad,
            duration: growDur,
            ease: 'power3.out',
        }, 0.05);

        // Compact the input bar alongside expansion
        tl.to(textareaWrap, { flex: 'none', minHeight: T.pillH, borderTopLeftRadius: T.inputRadius, borderTopRightRadius: T.inputRadius, borderBottomLeftRadius: T.inputRadius, borderBottomRightRadius: T.inputRadius, duration: 0.25 }, 0.05);
        tl.to('.prompter-textarea', { ...collapsedTextareaValues, duration: 0.25 }, 0.05);
        tl.to('#generate-btn', { ...collapsedBtnValues, duration: 0.25 }, 0.05);
        tl.to('#generate-btn svg', { ...collapsedBtnSvgValues, duration: 0.25 }, 0.05);
        tl.to(overlayBottom, { ...collapsedOverlayBottomValues, duration: 0.25 }, 0.05);

        // Slide column to chat position (slightly delayed so growth is visible first)
        if (!isMobile) {
            tl.to(prompterColumn, { y: yPanelExpanded, duration: 0.5, ease: 'power3.inOut' }, 0.1);
        }

        // Set column layout for chat (after glass is mostly grown)
        tl.call(() => {
            prompterColumn.style.justifyContent = 'flex-end';
            prompterColumn.style.height = chatPanelH + 'px';
            glassContainer.style.maxHeight = '';
            glassContainer.style.overflow = '';
        }, undefined, 0.05 + growDur);

        // Phase 3 (0.4–0.65s): Fade in chat content
        tl.to(chatMessagesInline, { opacity: 1, duration: 0.25 }, 0.35);
        tl.to(chatCloseInline, { opacity: 1, duration: 0.2 }, 0.4);

        return tl;
    }

    // Shrink textarea-wrap to compact input bar and hide bubbles after first response
    function compactChatInput() {
        if (chatInputCompacted) return;
        chatInputCompacted = true;
        const tl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power2.inOut' } });
        tl.to(textareaWrap, { minHeight: T.pillH, borderTopLeftRadius: T.inputRadius, borderTopRightRadius: T.inputRadius, borderBottomLeftRadius: T.inputRadius, borderBottomRightRadius: T.inputRadius }, 0);
        tl.to('.prompter-textarea', { ...collapsedTextareaValues }, 0);
        tl.to('#generate-btn', collapsedBtnValues, 0);
        tl.to('#generate-btn svg', collapsedBtnSvgValues, 0);
        tl.to(overlayTop, { opacity: 0, duration: 0.2 }, 0);
        tl.to(overlayBottom, collapsedOverlayBottomValues, 0);
        tl.to('.prompt-bubble', { ...collapsedBubbleValues, opacity: 0, duration: 0.3 }, 0);
    }

    async function enterChatMode(firstMessage: string) {
        chatMode = true; prompterState = 'chat'; hideBuddy();
        restoreHistory();
        chatHistory.push({ role: 'user', text: firstMessage }); saveChat(); appendBubble('user', firstMessage);
        const tl = openChatTransition(chatHistory.length > 1);
        await tl;
        promptInput.value = ''; promptInput.focus();
        showSpinner();
        compactChatInput();
        const botResponse = await sendToAI(chatHistory);
        hideSpinner();
        chatHistory.push({ role: 'bot', text: botResponse }); saveChat(); appendBubble('bot', botResponse);
    }

    async function exitChatMode() {
        if (!chatMode) return; chatMode = false; isSending = false;
        const tl = gsap.timeline();

        // Phase 1 (0–0.15s): Fade out chat content fast
        tl.to([chatMessagesInline, chatCloseInline], { opacity: 0, duration: 0.12, ease: 'power1.in' }, 0);

        // Phase 2 (0.1–0.5s): Shrink glass to pill + slide up simultaneously
        // Keep chat-mode (white bg) DURING shrink so it doesn't flash transparent mid-animation
        const s = 0.1;
        tl.to(chatDim, { opacity: 0, duration: 0.35, ease: 'power1.in' }, s);
        tl.set(prompterColumn, { justifyContent: '', height: '' }, s);

        // Hide chat messages container immediately so it doesn't hold height
        tl.set(chatMessagesInline, { display: 'none' }, s);

        // Shrink glass — set explicit maxHeight from current size, then animate down
        // This forces the glass to shrink even if content wants to stay tall
        const currentGlassH = glassContainer.offsetHeight;
        const shrinkDur = 0.4;
        tl.set(glassContainer, { maxHeight: currentGlassH + 'px', overflow: 'hidden' }, s);
        tl.to(glassContainer, {
            ...collapsedGlassValues,
            minHeight: T.pillH,
            maxHeight: '4rem',
            duration: shrinkDur,
            ease: 'power2.inOut',
        }, s);
        tl.to(textareaWrap, { ...collapsedTextareaWrapValues, duration: shrinkDur }, s);
        tl.to('.prompter-textarea', { ...collapsedTextareaValues, duration: shrinkDur * 0.85 }, s);
        tl.to('#generate-btn', { ...collapsedBtnValues, duration: shrinkDur * 0.85 }, s);
        tl.to('#generate-btn svg', { ...collapsedBtnSvgValues, duration: shrinkDur * 0.85 }, s);
        tl.to(overlayTop, { ...collapsedOverlayTopValues, duration: 0.15 }, s);
        tl.to(overlayBottom, { ...collapsedOverlayBottomValues, duration: shrinkDur * 0.85 }, s);
        tl.to('.prompt-bubble', { ...collapsedBubbleValues, duration: shrinkDur * 0.85 }, s);

        if (!isMobile) {
            tl.to(prompterColumn, { y: yTop, duration: 0.5, ease: 'power3.inOut' }, s);
        }

        // Remove chat-mode + maxHeight constraint when pill-sized
        tl.call(() => {
            glassContainer.classList.remove('chat-mode');
            glassContainer.style.maxHeight = '';
            glassContainer.style.overflow = '';
        }, undefined, s + shrinkDur);

        // Restore bubbles visibility
        tl.to('.prompt-bubble', { opacity: 1, duration: 0.2 }, s + shrinkDur);

        // Cleanup
        tl.call(() => {
            chatOverlay.classList.remove('is-active');
            chatMessagesInline.style.display = 'none';
            chatCloseInline.style.display = 'none';
            textareaWrap.style.flex = '';
            prompterColumn.style.justifyContent = '';
            prompterColumn.style.height = '';
            chatInputCompacted = false;
            prompterState = 'collapsed';
        });

        await tl;
    }

    async function handleSend() {
        const query = promptInput.value.trim(); if (!query || isSending) return;
        isSending = true;
        if (chatMode) {
            chatHistory.push({ role: 'user', text: query }); saveChat(); appendBubble('user', query);
            promptInput.value = '';
            compactChatInput();
            showSpinner();
            const botResponse = await sendToAI(chatHistory);
            hideSpinner();
            chatHistory.push({ role: 'bot', text: botResponse }); saveChat(); appendBubble('bot', botResponse);
        } else {
            await enterChatMode(query);
        }
        isSending = false;
    }

    triggers.forEach((tag) => { tag.addEventListener('click', async () => {
        if (isSending) return; const text = tag.dataset.prompt ?? ''; if (!text) return;
        if (chatMode) {
            isSending = true;
            chatHistory.push({ role: 'user', text }); saveChat(); appendBubble('user', text);
            promptInput.value = '';
            compactChatInput();
            showSpinner();
            const botResponse = await sendToAI(chatHistory);
            hideSpinner();
            chatHistory.push({ role: 'bot', text: botResponse }); saveChat(); appendBubble('bot', botResponse);
            isSending = false;
        } else { await enterChatMode(text); }
    }); });
    generateBtn.addEventListener('click', () => { handleSend(); });
    promptInput.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });

    if (!isMobile) {
        glassContainer.addEventListener('click', async (e) => {
            if (prompterState !== 'collapsed' || chatMode) return;
            if ((e.target as HTMLElement).closest('.prompter-send')) return; e.stopPropagation();
            chatMode = true; prompterState = 'chat'; hideBuddy();
            if (chatHistory.length > 0) restoreHistory();
            const hasHistory = chatHistory.length > 0;
            const tl = openChatTransition(hasHistory);
            await tl; promptInput.value = ''; promptInput.focus();
        });
    }

    chatCloseInline.addEventListener('click', () => exitChatMode());
    chatDim.addEventListener('click', () => exitChatMode());

    /* ── Fixed RUT logo — GSAP stroke-mask draw animation ── */
    const siteLogo = document.getElementById('site-logo');
    if (siteLogo) {
        // All mask skeleton strokes — hide them via full dashoffset
        const drawPaths = siteLogo.querySelectorAll<SVGPathElement>('[class^="draw-"]');
        drawPaths.forEach(p => {
            const len = p.getTotalLength();
            gsap.set(p, { attr: { 'stroke-dasharray': len + 1, 'stroke-dashoffset': len + 1 } });
        });

        const drawTl = gsap.timeline({ paused: true,
            onStart: () => siteLogo.classList.add('is-active'),
            onReverseComplete: () => siteLogo.classList.remove('is-active'),
        });

        // R — stem rises from bottom
        drawTl.to('.draw-r1', { attr: { 'stroke-dashoffset': 0 }, duration: 0.35, ease: 'power2.inOut' }, 0);
        // R — bowl traces clockwise from stem top
        drawTl.to('.draw-r2', { attr: { 'stroke-dashoffset': 0 }, duration: 0.4, ease: 'power2.inOut' }, 0.18);
        // R — diagonal leg snaps down
        drawTl.to('.draw-r3', { attr: { 'stroke-dashoffset': 0 }, duration: 0.22, ease: 'power2.out' }, 0.48);
        // U — single arc from top-left, down, around, up to top-right
        drawTl.to('.draw-u', { attr: { 'stroke-dashoffset': 0 }, duration: 0.55, ease: 'power2.inOut' }, 0.1);
        // T — horizontal bar sweeps left→right
        drawTl.to('.draw-t1', { attr: { 'stroke-dashoffset': 0 }, duration: 0.28, ease: 'power2.inOut' }, 0.25);
        // T — vertical stroke drops top→bottom
        drawTl.to('.draw-t2', { attr: { 'stroke-dashoffset': 0 }, duration: 0.32, ease: 'power2.inOut' }, 0.42);

        let logoVisible = false;

        ScrollTrigger.create({
            trigger: '#scroll-wrapper',
            start: 'bottom top',
            onEnter: () => {
                if (!logoVisible) { logoVisible = true; drawTl.play(); }
            },
            onLeaveBack: () => {
                if (logoVisible) { logoVisible = false; drawTl.reverse(); }
            },
        });

        // If already scrolled past hero on load — show fully drawn
        if (window.scrollY >= (document.getElementById('scroll-wrapper')?.offsetHeight ?? 0)) {
            drawPaths.forEach(p => gsap.set(p, { attr: { 'stroke-dashoffset': 0 } }));
            siteLogo.classList.add('is-active');
            drawTl.progress(1);
            logoVisible = true;
        }
    }

    // Background mode check — toggle light/dark prompter style
    const heroSection = document.getElementById('scroll-wrapper');
    const heroSectionHeight = heroSection ? heroSection.offsetHeight : 0;
    let lastIsLight = false;
    ScrollTrigger.create({
        trigger: '#scroll-wrapper',
        start: 'bottom top',
        onEnter: () => { if (!lastIsLight) { lastIsLight = true; prompterFixed.classList.add('on-light'); } },
        onLeaveBack: () => { if (lastIsLight) { lastIsLight = false; prompterFixed.classList.remove('on-light'); } },
    });
    // Init on load
    if (window.scrollY >= heroSectionHeight) { lastIsLight = true; prompterFixed.classList.add('on-light'); }

    const buddyStore = initBuddy({ promptInput, prompterFixed, generateBtn, glassWrap: glassContainer, getChatMode: () => chatMode });
    function hideBuddy() { if (buddyStore) buddyStore.hideBuddy(); }

    // Lazy load the heavy 3D scene (Three.js + Rapier WASM) only when approaching the intro section
    const introSection = document.getElementById('intro');
    if (introSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                // Load chunk dynamically
                import('./threeScene').then(module => {
                    // Small delay to ensure layout is settled
                    setTimeout(() => module.initThreeScene(), 150);
                }).catch(err => console.error("Failed to load 3D scene:", err));
            }
        }, { rootMargin: '600px 0px' }); // Trigger loading 600px before it enters viewport
        observer.observe(introSection);
    }

    // Handle browser back from pushState /projects → reload homepage cleanly
    window.addEventListener('popstate', (e) => {
        if (location.pathname === '/' || location.pathname === '') {
            location.reload();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
