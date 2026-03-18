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
        const tz = now.toLocaleTimeString('en-GB', {
            timeZone: 'Europe/Warsaw', timeZoneName: 'short',
        }).split(' ').pop() ?? 'CET';
        heroClock!.textContent = `${time} ${tz}`;
    }

    updateHeroClock();
    setInterval(updateHeroClock, 1000);
}
