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

        // Use textarea's actual line-height (e.g. '36px' in pill, or ratio in expanded)
        const numericLH = taLineHeight.endsWith('px')
            ? parseFloat(taLineHeight)
            : parseFloat(fontSize) * 1.6;

        track.style.padding = `${padTop} 0 0 ${padLeft}`;
        textEl.style.fontSize = fontSize;
        textEl.style.lineHeight = `${numericLH}px`;
        cursorEl.style.height = `${Math.round(numericLH * 0.55)}px`;
    }

    function updateShift() {
        if (!overlayBottom) return;
        const availableWidth = overlay.clientWidth - overlayBottom.clientWidth;
        const trackWidth = track.scrollWidth;
        const padLeft = parseFloat(window.getComputedStyle(promptInput).paddingLeft);

        if (trackWidth > availableWidth && availableWidth > 0) {
            const overflow = trackWidth - availableWidth + padLeft;
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

    // Recalculate shift on scroll (GSAP changes padding during animations)
    window.addEventListener('scroll', () => {
        if (isAnimating) {
            syncPosition();
            updateShift();
        }
    }, { passive: true });

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
