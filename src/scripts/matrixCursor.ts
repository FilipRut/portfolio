export function initMatrixCursor(promptInput: HTMLTextAreaElement) {
    const matrixCursorEl = document.getElementById('matrix-cursor');
    if (!matrixCursorEl || !promptInput) return;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) return;

    // Cache computed style values — only recalculate on resize/font changes
    let cachedFont = '';
    let cachedFontSize = 0;
    let cachedLineHeight = 0;
    let cachedCursorH = 0;
    let cachedCursorY = 0;
    let cachedPadTop = 0;
    let cachedPadLeft = 0;
    let cachedCharW = 0;
    let cachedSpaceW = 0;

    function refreshStyleCache() {
        const style = window.getComputedStyle(promptInput);
        const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        if (font === cachedFont) return;
        cachedFont = font;
        measureCtx!.font = font;
        cachedFontSize = parseFloat(style.fontSize);
        const rawLH = style.lineHeight === 'normal'
            ? cachedFontSize * 1.6
            : parseFloat(style.lineHeight);
        cachedLineHeight = rawLH;
        cachedCursorH = cachedFontSize * 1.35;
        cachedCursorY = (rawLH - cachedCursorH) / 2;
        cachedPadTop = parseFloat(style.paddingTop);
        cachedPadLeft = parseFloat(style.paddingLeft);
        cachedCharW = measureCtx!.measureText('M').width;
        cachedSpaceW = measureCtx!.measureText('\u00A0').width;
    }

    // Refresh cache when textarea resizes (GSAP collapse/expand)
    const styleObs = new ResizeObserver(() => { cachedFont = ''; });
    styleObs.observe(promptInput);

    function updateMatrixCursor() {
        if (document.activeElement !== promptInput) {
            matrixCursorEl!.style.display = 'none';
            return;
        }
        refreshStyleCache();

        const ta = promptInput;
        const pos = ta.selectionStart ?? 0;
        const text = ta.value ?? '';
        const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
        const lineText = text.slice(lineStart, pos);
        const linesBefore = (text.slice(0, lineStart).match(/\n/g) || []).length;

        const xOffset = measureCtx!.measureText(lineText).width;

        matrixCursorEl!.style.width = Math.round(cachedCharW * 0.55) + 'px';
        matrixCursorEl!.style.height = Math.round(cachedCursorH) + 'px';
        matrixCursorEl!.style.left = Math.round(cachedPadLeft + xOffset + cachedSpaceW) + 'px';
        matrixCursorEl!.style.top = Math.round(cachedPadTop + linesBefore * cachedLineHeight + cachedCursorY - ta.scrollTop) + 'px';
        matrixCursorEl!.style.display = 'block';
    }

    promptInput.addEventListener('focus', () => {
        matrixCursorEl!.style.display = 'block';
        updateMatrixCursor();
    });
    promptInput.addEventListener('blur', () => {
        matrixCursorEl!.style.display = 'none';
    });

    (['input', 'keyup', 'keydown', 'click', 'mouseup'] as const).forEach(evt => {
        promptInput.addEventListener(evt, updateMatrixCursor);
    });
}
