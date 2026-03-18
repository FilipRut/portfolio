export function initPlaceholder(promptInput: HTMLTextAreaElement) {
    if (!promptInput) return;

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
    const DEFAULT_PLACEHOLDER = 'Ask AI about me...';

    function typePlaceholder() {
        if (document.activeElement === promptInput) {
            phTimer = setTimeout(typePlaceholder, 800);
            return;
        }
        const q = PLACEHOLDER_QUESTIONS[phIdx];
        let i = 0;

        function typeChar() {
            if (document.activeElement === promptInput) {
                promptInput.placeholder = DEFAULT_PLACEHOLDER;
                phTimer = setTimeout(typePlaceholder, 800);
                return;
            }
            promptInput.placeholder = q.slice(0, i++);
            if (i <= q.length) {
                phTimer = setTimeout(typeChar, 52);
            } else {
                phTimer = setTimeout(deleteChar, 2800);
            }
        }

        function deleteChar() {
            if (document.activeElement === promptInput) {
                promptInput.placeholder = DEFAULT_PLACEHOLDER;
                phTimer = setTimeout(typePlaceholder, 800);
                return;
            }
            const cur = promptInput.placeholder;
            if (cur.length > 0) {
                promptInput.placeholder = cur.slice(0, -1);
                phTimer = setTimeout(deleteChar, 28);
            } else {
                phIdx = (phIdx + 1) % PLACEHOLDER_QUESTIONS.length;
                phTimer = setTimeout(typePlaceholder, 450);
            }
        }

        typeChar();
    }

    promptInput.addEventListener('blur', () => {
        clearTimeout(phTimer);
        promptInput.placeholder = DEFAULT_PLACEHOLDER;
        phTimer = setTimeout(typePlaceholder, 1200);
    });

    phTimer = setTimeout(typePlaceholder, 1800);
}