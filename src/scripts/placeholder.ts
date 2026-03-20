export function initPlaceholder(promptInput: HTMLTextAreaElement) {
    if (!promptInput) return;

    const track = document.getElementById('placeholder-track');
    const textEl = document.getElementById('placeholder-text');
    const cursorEl = document.getElementById('placeholder-cursor');
    const overlay = textEl?.closest('.placeholder-overlay') as HTMLElement | null;
    const overlayBottom = document.querySelector('.glass-overlay-bottom') as HTMLElement | null;
    if (!track || !textEl || !cursorEl || !overlay) return;

    const PLACEHOLDER_QUESTIONS = [
        'How did you get into UX design?',
        "What's your proudest project?",
        'Do you prefer designing alone or with a team?',
        "Have you ever shipped something you disagreed with?",
        "What's the hardest problem you've ever designed around?",
        'How do you handle conflicting feedback?',
        'What does good design mean to you?',
        'Are you open to freelance work?',
        'What inspires your design decisions?',
        "What's something most designers get wrong?",
    ];

    let phIdx = 0;
    let phTimer: ReturnType<typeof setTimeout>;
    let isAnimating = false;

    function syncPosition() {
        // Match textarea's computed styles so text aligns with where user types
        const style = window.getComputedStyle(promptInput);
        const padTop = style.paddingTop;
        const padLeft = style.paddingLeft;
        const fontSize = style.fontSize;
        const taLineHeight = style.lineHeight;

        // Use textarea's actual line-height (e.g. '44px' in pill, or ratio in expanded)
        const numericLH = taLineHeight.endsWith('px')
            ? parseFloat(taLineHeight)
            : parseFloat(fontSize) * 1.6;

        track.style.padding = `${padTop} 0 0 ${padLeft}`;
        textEl.style.fontSize = fontSize;
        textEl.style.lineHeight = `${numericLH}px`;
        cursorEl.style.height = `${Math.round(numericLH * 0.55)}px`;

        // Clip overlay only in collapsed pill mode (single-line, buttons inline).
        // In expanded mode the buttons sit in a separate row below — text can use full width.
        const isCollapsed = parseFloat(style.height) < 60;
        if (overlayBottom && isCollapsed) {
            const bubbles = overlayBottom.querySelector('.prompt-bubbles') as HTMLElement | null;
            const sendBtn = overlayBottom.querySelector('.prompter-send') as HTMLElement | null;
            const gap = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const contentWidth = (bubbles?.offsetWidth ?? 0) + (sendBtn?.offsetWidth ?? 0) + gap * 2;
            overlay.style.right = `${contentWidth}px`;
        } else {
            overlay.style.right = '0px';
        }
    }

    function updateShift() {
        // overlay.clientWidth is already clipped by syncPosition (right = buttons width)
        // so it represents the actual available space for placeholder text
        const availableWidth = overlay.clientWidth;
        const trackWidth = track.scrollWidth;

        if (trackWidth > availableWidth && availableWidth > 0) {
            // Shift track left so the end (currently typed word) stays visible
            const overflow = trackWidth - availableWidth;
            track.style.transform = `translateX(-${overflow}px)`;
        } else {
            track.style.transform = '';
        }
    }

    function showText(text: string) {
        textEl.textContent = text;
        cursorEl.style.display = text ? 'inline-block' : 'none';
        syncPosition();
        updateShift();
    }

    function hideAll() {
        textEl.textContent = '';
        cursorEl.style.display = 'none';
        track.style.transform = '';
    }

    // Recalculate on GSAP layout changes (collapse/expand transitions)
    // Using ResizeObserver instead of scroll listener — fires only when textarea actually changes size
    const resObs = new ResizeObserver(() => { if (isAnimating) { syncPosition(); updateShift(); } });
    resObs.observe(promptInput);

    function typePlaceholder() {
        // If user has typed anything, stop the animation and clear placeholder
        if (promptInput.value.trim().length > 0) {
            promptInput.placeholder = '';
            phTimer = setTimeout(typePlaceholder, 1000);
            return;
        }

        if (document.activeElement === promptInput) {
            phTimer = setTimeout(typePlaceholder, 800);
            return;
        }

        const q = PLACEHOLDER_QUESTIONS[phIdx];
        let i = 0;
        isAnimating = true;

        function typeChar() {
            if (document.activeElement === promptInput) {
                hideAll();
                isAnimating = false;
                phTimer = setTimeout(typePlaceholder, 800);
                return;
            }
            showText(q.slice(0, i++));
            if (i <= q.length) {
                phTimer = setTimeout(typeChar, 52);
            } else {
                phTimer = setTimeout(deleteChar, 2800);
            }
        }

        function deleteChar() {
            if (document.activeElement === promptInput) {
                hideAll();
                isAnimating = false;
                phTimer = setTimeout(typePlaceholder, 800);
                return;
            }
            const cur = textEl.textContent || '';
            if (cur.length > 0) {
                showText(cur.slice(0, -1));
                phTimer = setTimeout(deleteChar, 28);
            } else {
                hideAll();
                isAnimating = false;
                phIdx = (phIdx + 1) % PLACEHOLDER_QUESTIONS.length;
                phTimer = setTimeout(typePlaceholder, 450);
            }
        }

        typeChar();
    }

    promptInput.addEventListener('focus', () => {
        clearTimeout(phTimer);
        isAnimating = false;
        hideAll();
    });

    promptInput.addEventListener('blur', () => {
        clearTimeout(phTimer);
        hideAll();
        isAnimating = false;
        phTimer = setTimeout(typePlaceholder, 1200);
    });

    phTimer = setTimeout(typePlaceholder, 1800);
}
