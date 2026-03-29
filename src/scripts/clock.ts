export function initClock() {
    const heroClock = document.getElementById('hero-clock');
    if (!heroClock) return;

    function updateHeroClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('pl-PL', {
            timeZone: 'Europe/Warsaw',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
        });
        heroClock!.textContent = time;
    }

    updateHeroClock();
    let clockId = setInterval(updateHeroClock, 1000);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { clearInterval(clockId); }
        else { updateHeroClock(); clockId = setInterval(updateHeroClock, 1000); }
    });
}
