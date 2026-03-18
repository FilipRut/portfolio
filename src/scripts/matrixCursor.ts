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
        const lineHeight = parseFloat(style.fontSize) * 1.6;
        const padTop = parseFloat(style.paddingTop);
        const padLeft = parseFloat(style.paddingLeft);

        matrixCursorEl!.style.height = Math.round(lineHeight * 0.85) + 'px';
        matrixCursorEl!.style.left = Math.round(padLeft + xOffset) + 'px';
        matrixCursorEl!.style.top = Math.round(padTop + linesBefore * lineHeight + lineHeight * 0.075 - ta.scrollTop) + 'px';
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
