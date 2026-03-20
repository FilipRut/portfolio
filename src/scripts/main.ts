import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initClock } from './clock';
import { initMatrixCursor } from './matrixCursor';
import { initPlaceholder } from './placeholder';
import { initHeroGallery } from './gallery';
import { initBuddy } from './buddy';

gsap.registerPlugin(ScrollTrigger);

gsap.ticker.lagSmoothing(0);
gsap.config({ force3D: true });

function init() {
    initClock();

    /* ── HERO ENTRANCE ── */
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
        tl
            .to(glassContainer, { keyframes: [
                { minHeight: '120px', padding: '6px 8px', borderRadius: '16px', duration: 0.6 },
                { minHeight: '52px', padding: '4px', borderRadius: '30px', duration: 0.4 },
            ] }, 0)
            .to(textareaWrap, { keyframes: [
                { minHeight: '100px', borderRadius: '12px', duration: 0.6 },
                { minHeight: '44px', borderRadius: '26px', duration: 0.4 },
            ] }, 0)
            .to('.prompter-textarea', {
                paddingTop: '0px', paddingBottom: '0px',
                paddingLeft: '16px', paddingRight: '16px',
                height: '44px', lineHeight: '44px',
                duration: 1,
            }, 0)
            .to('#generate-btn', { width: '36px', height: '36px', duration: 1 }, 0)
            .to('#generate-btn svg', { width: '16px', height: '16px', duration: 1 }, 0)
            .to(overlayTop, { opacity: 0, duration: 0.3 }, 0)
            .to(overlayBottom, { height: '44px', padding: '4px 6px', duration: 1 }, 0)
            .to('.prompt-bubble', { height: '32px', paddingTop: '0px', paddingBottom: '0px', duration: 1 }, 0);
    }

    const promptInput = document.querySelector<HTMLTextAreaElement>('#ai-prompt')!;

    initMatrixCursor(promptInput);
    initPlaceholder(promptInput);

    // In collapsed mode, scroll textarea so the last word is always visible
    promptInput.addEventListener('input', () => {
        promptInput.scrollLeft = promptInput.scrollWidth;
    });

    let chatMode = false;

    if (isMobile) {
        gsap.set(prompterColumn, { y: 0 });
        gsap.set(glassContainer, { minHeight: '52px', padding: '4px', borderRadius: '30px' });
        gsap.set(textareaWrap, { minHeight: '44px', borderRadius: '26px' });
        gsap.set('.prompter-textarea', { paddingTop: '0px', paddingBottom: '0px', paddingLeft: '16px', paddingRight: '16px', height: '44px', lineHeight: '44px' });
        gsap.set('#generate-btn', { width: '36px', height: '36px' });
        gsap.set('#generate-btn svg', { width: '16px', height: '16px' });
        gsap.set(overlayTop, { opacity: 0 });
        gsap.set(overlayBottom, { height: '44px', padding: '4px 6px' });
        gsap.set('.prompt-bubble', { paddingTop: '0px', paddingBottom: '0px', lineHeight: '30px' });

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
                .to(glassContainer, { minHeight: '50vh', padding: 'clamp(0.4rem, 0.3rem + 0.2vw, 0.6rem)', borderRadius: 'clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem)' }, 0)
                .to(textareaWrap, { minHeight: 'calc(50vh - 2rem)', borderRadius: 'clamp(0.5rem, 0.35rem + 0.3vw, 0.85rem)' }, 0)
                .to('.prompter-textarea', { paddingTop: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)', paddingBottom: 'clamp(4.5rem, 3.5rem + 1.5vw, 6rem)', paddingLeft: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)', paddingRight: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)', height: '100%', lineHeight: '1.6' }, 0)
                .to('#generate-btn', { width: '32px', height: '32px' }, 0)
                .to('#generate-btn svg', { width: '18px', height: '18px' }, 0)
                .to(overlayTop, { opacity: 1 }, 0)
                .to(overlayBottom, { height: 'auto', padding: 'clamp(0.75rem, 0.5rem + 0.4vw, 1.25rem)' }, 0)
                .to('.prompt-bubble', { paddingTop: '', paddingBottom: '', lineHeight: '', clearProps: 'paddingTop,paddingBottom,lineHeight' }, 0);
        });

        promptInput.addEventListener('blur', () => {
            if (!mobileExpanded || chatMode) return;
            mobileExpanded = false;
            const collapseTl = gsap.timeline({ defaults: { duration: 0.3, ease: 'power2.in' } });
            collapseTl
                .to(glassContainer, { minHeight: '52px', padding: '4px', borderRadius: '30px' }, 0.1)
                .to(textareaWrap, { minHeight: '44px', borderRadius: '26px' }, 0.1)
                .to('.prompter-textarea', { paddingTop: '0px', paddingBottom: '0px', paddingLeft: '16px', paddingRight: '16px', height: '44px', lineHeight: '44px' }, 0.1)
                .to('#generate-btn', { width: '36px', height: '36px' }, 0.1)
                .to('#generate-btn svg', { width: '16px', height: '16px' }, 0.1)
                .to(overlayTop, { opacity: 0, duration: 0.15 }, 0)
                .to(overlayBottom, { height: '44px', padding: '4px 6px' }, 0.1)
                .to('.prompt-bubble', { paddingTop: '0px', paddingBottom: '0px', lineHeight: '32px' }, 0.1);
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

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
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

    // Collapsed state — WCAG: min 44px touch targets, readable text
    const collapsedGlassValues = { minHeight: '52px', padding: '4px', borderRadius: '30px' };
    const collapsedTextareaWrapValues = { minHeight: '44px', borderRadius: '26px' };
    // paddingRight clears the buttons area; direction:rtl shows end of text (last word visible)
    const collapsedTextareaValues = { paddingTop: '0px', paddingBottom: '0px', paddingLeft: '16px', paddingRight: '50%', height: '44px', lineHeight: '44px' };
    const collapsedBtnValues = { width: '36px', height: '36px' };
    const collapsedBtnSvgValues = { width: '16px', height: '16px' };
    const collapsedOverlayTopValues = { opacity: 0 };
    const collapsedOverlayBottomValues = { height: '44px', padding: '4px 6px' };
    const collapsedBubbleValues = {
        height: '32px',
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: '14px',
        paddingRight: '14px',
        fontSize: '0.8rem'
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

    // Chat panel geometry — bottom-anchored
    const chatPanelH = Math.min(vh * 0.5, 500);
    const chatBottomPad = 100; // space for buddy character
    const yPillAtBottom = vh - chatBottomPad - 52;   // pill bottom sits at vh - pad
    const yPanelExpanded = vh - chatBottomPad - chatPanelH; // expanded panel top edge

    // Whether the chat input area has been shrunk to compact bar after first response
    let chatInputCompacted = false;

    function openChatTransition(compact: boolean): gsap.core.Timeline {
        const tl = gsap.timeline();

        // Prepare chat elements (hidden, ready to fade in)
        chatMessagesInline.style.display = 'flex';
        chatCloseInline.style.display = 'grid';
        gsap.set([chatMessagesInline, chatCloseInline], { opacity: 0 });

        if (compact) {
            // Returning with history — compact input bar at bottom
            tl.to(textareaWrap, { flex: 'none', minHeight: '52px', borderRadius: '26px', duration: 0.25, ease: 'power2.out' }, 0);
            tl.to('.prompter-textarea', { ...collapsedTextareaValues, duration: 0.25 }, 0);
            tl.to('#generate-btn', collapsedBtnValues, 0);
            tl.to('#generate-btn svg', collapsedBtnSvgValues, 0);
            tl.to(overlayTop, { opacity: 0, duration: 0.15 }, 0);
            tl.to(overlayBottom, collapsedOverlayBottomValues, 0);
            tl.to('.prompt-bubble', { ...collapsedBubbleValues, opacity: 0, duration: 0.25 }, 0);
            chatInputCompacted = true;
        } else {
            // Fresh open — keep hero-style expanded textarea with bubbles visible
            tl.to(textareaWrap, {
                flex: 'none',
                minHeight: 'clamp(14rem, 10rem + 7vw, 22rem)',
                borderRadius: 'clamp(0.5rem, 0.35rem + 0.3vw, 0.85rem)',
                duration: 0.5, ease: 'power2.out',
            }, 0);
            tl.to('.prompter-textarea', {
                paddingTop: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)',
                paddingBottom: 'clamp(4.5rem, 3.5rem + 1.5vw, 6rem)',
                paddingLeft: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)',
                paddingRight: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)',
                height: '100%', lineHeight: '1.6',
                duration: 0.5,
            }, 0);
            tl.to('#generate-btn', { width: '48px', height: '48px', duration: 0.4 }, 0);
            tl.to('#generate-btn svg', { width: '20px', height: '20px', duration: 0.4 }, 0);
            tl.to(overlayTop, { opacity: 1, duration: 0.3 }, 0);
            tl.to(overlayBottom, { height: 'auto', padding: 'clamp(0.75rem, 0.5rem + 0.4vw, 1.25rem)', duration: 0.4 }, 0);
            tl.to('.prompt-bubble', {
                height: '32px', paddingTop: '0px', paddingBottom: '0px',
                paddingLeft: '18px', paddingRight: '18px', fontSize: '0.875rem',
                opacity: 1, duration: 0.4,
            }, 0);
            chatInputCompacted = false;
        }

        if (!isMobile) {
            // Single continuous y motion via keyframes — no seam between phases
            tl.to(prompterColumn, { keyframes: [
                { y: yPillAtBottom, duration: 0.38, ease: 'power2.in' },    // slide down
                { y: yPanelExpanded, duration: 0.48, ease: 'power2.out' },  // expand up
            ] }, 0);
        }

        // Glass expansion — starts when pill nears bottom, overlaps with y phase 2
        const expandAt = isMobile ? 0.08 : 0.28;
        tl.to(glassContainer, {
            minHeight: chatPanelH,
            borderRadius: '1.25rem',
            padding: 'clamp(0.4rem, 0.3rem + 0.2vw, 0.6rem)',
            duration: 0.5,
            ease: 'power2.out',
        }, expandAt);

        // Chat-mode class for bg/shadow — add slightly early so CSS transition blends in
        tl.call(() => glassContainer.classList.add('chat-mode'), undefined, expandAt - 0.05);

        // Dim behind — start immediately, slow fade
        tl.call(() => { chatOverlay.classList.add('is-active'); }, undefined, 0);
        gsap.set(chatDim, { opacity: 0 });
        tl.to(chatDim, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.05);

        // Messages & close fade in once panel is mostly expanded
        tl.to(chatMessagesInline, { opacity: 1, duration: 0.35, ease: 'power1.out' }, expandAt + 0.25);
        tl.to(chatCloseInline, { opacity: 1, duration: 0.3, ease: 'power1.out' }, expandAt + 0.3);

        // Vignette off (desktop)
        if (!isMobile) tl.to(sceneVignette, { opacity: 0, duration: 0.4 }, 0);

        return tl;
    }

    // Shrink textarea-wrap to compact input bar and hide bubbles after first response
    function compactChatInput() {
        if (chatInputCompacted) return;
        chatInputCompacted = true;
        const tl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power2.inOut' } });
        tl.to(textareaWrap, { minHeight: '52px', borderRadius: '26px' }, 0);
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
        showSpinner(); await wait(1500); hideSpinner();
        compactChatInput();
        const botResponse = 'Już ci odpowiadam...';
        chatHistory.push({ role: 'bot', text: botResponse }); saveChat(); appendBubble('bot', botResponse);
    }

    async function exitChatMode() {
        if (!chatMode) return; chatMode = false; isSending = false;
        const tl = gsap.timeline();

        // 1. Content fades out fast
        tl.to([chatMessagesInline, chatCloseInline], { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0);

        // Remove chat-mode class early so CSS bg transition starts fading
        tl.call(() => glassContainer.classList.remove('chat-mode'), undefined, 0.08);

        // Dim fades out
        tl.to(chatDim, { opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.05);

        // 2. Shrink panel (bottom-anchored) then slide pill up — single keyframe motion
        const shrinkAt = 0.12;
        tl.to(glassContainer, { ...collapsedGlassValues, duration: 0.38, ease: 'power2.inOut' }, shrinkAt);
        tl.to(textareaWrap, { ...collapsedTextareaWrapValues, duration: 0.38 }, shrinkAt);
        tl.to('.prompter-textarea', { ...collapsedTextareaValues, duration: 0.3 }, shrinkAt);
        tl.to('#generate-btn', { ...collapsedBtnValues, duration: 0.3 }, shrinkAt);
        tl.to('#generate-btn svg', { ...collapsedBtnSvgValues, duration: 0.3 }, shrinkAt);
        tl.to(overlayTop, { ...collapsedOverlayTopValues, duration: 0.2 }, shrinkAt);
        tl.to(overlayBottom, { ...collapsedOverlayBottomValues, duration: 0.3 }, shrinkAt);
        tl.to('.prompt-bubble', { ...collapsedBubbleValues, duration: 0.3 }, shrinkAt);

        if (!isMobile) {
            // Continuous y motion: shrink down (bottom anchored) → fly up to top
            tl.to(prompterColumn, { keyframes: [
                { y: yPillAtBottom, duration: 0.38, ease: 'power2.in' },    // shrink down
                { y: yTop, duration: 0.48, ease: 'power2.out' },           // fly up
            ] }, shrinkAt);
        }

        // Cleanup after all animation completes
        tl.call(() => {
            chatOverlay.classList.remove('is-active');
            chatMessagesInline.style.display = 'none';
            chatCloseInline.style.display = 'none';
            textareaWrap.style.flex = '';
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
            showSpinner(); await wait(1500); hideSpinner();
            const botResponse = 'Już ci odpowiadam...';
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
            showSpinner(); await wait(1500); hideSpinner();
            const botResponse = 'Już ci odpowiadam...';
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
