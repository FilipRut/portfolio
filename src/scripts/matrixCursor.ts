export function initMatrixCursor(promptInput: HTMLTextAreaElement) {
    const matrixCursorEl = document.getElementById('matrix-cursor');
    if (!matrixCursorEl || !promptInput) return;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) return;

    function updateMatrixCursor() {
        if (document.activeElement !== promptInput) {
            matrixCursorEl!.style.display = 'none';
            return;
        }
        const ta = promptInput;
        const pos = ta.selectionStart ?? 0;
        const text = ta.value ?? '';
        const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
        const lineText = text.slice(lineStart, pos);
        const linesBefore = (text.slice(0, lineStart).match(/\n/g) || []).length;

        const style = window.getComputedStyle(ta);
        measureCtx!.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const xOffset = measureCtx!.measureText(lineText).width;
        const spaceWidth = measureCtx!.measureText('\u00A0').width;
        const charWidth = measureCtx!.measureText('M').width;
        const fontSize = parseFloat(style.fontSize);
        const rawLH = style.lineHeight === 'normal'
            ? fontSize * 1.6
            : parseFloat(style.lineHeight);
        const lineHeight = rawLH;
        const cursorH = fontSize * 1.35;            // cursor height based on font, not line-height
        const cursorY = (lineHeight - cursorH) / 2;  // vertically center in line
        const padTop = parseFloat(style.paddingTop);
        const padLeft = parseFloat(style.paddingLeft);

        matrixCursorEl!.style.width = Math.round(charWidth * 0.55) + 'px';
        matrixCursorEl!.style.height = Math.round(cursorH) + 'px';
        matrixCursorEl!.style.left = Math.round(padLeft + xOffset + spaceWidth) + 'px';
        matrixCursorEl!.style.top = Math.round(padTop + linesBefore * lineHeight + cursorY - ta.scrollTop) + 'px';
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
