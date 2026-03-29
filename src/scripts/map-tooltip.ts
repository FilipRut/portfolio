import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export function initMapTooltip() {
    const trigger = document.getElementById('location-trigger');
    const tooltip = document.getElementById('map-tooltip');
    const container = document.getElementById('map-container');
    if (!trigger || !tooltip || !container) return;

    let map: maplibregl.Map | null = null;
    let hideTimeout: ReturnType<typeof setTimeout>;

    function openTooltip() {
        clearTimeout(hideTimeout);
        tooltip.classList.add('is-visible');

        if (!map) {
            map = new maplibregl.Map({
                container,
                style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
                center: [16.9252, 52.4064],
                zoom: 11,
                attributionControl: false,
                interactive: false,
            });

            const markerEl = document.createElement('div');
            markerEl.style.cssText = 'width:12px;height:12px;background:#E53E3E;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(229,62,62,0.6);';
            new maplibregl.Marker({ element: markerEl })
                .setLngLat([16.9252, 52.4064])
                .addTo(map);

            // Zoom controls
            const zoomIn = document.getElementById('map-zoom-in');
            const zoomOut = document.getElementById('map-zoom-out');
            zoomIn?.addEventListener('click', (e) => {
                e.stopPropagation();
                map?.zoomIn({ duration: 300 });
            });
            zoomOut?.addEventListener('click', (e) => {
                e.stopPropagation();
                map?.zoomOut({ duration: 300 });
            });
        }
    }

    function closeTooltip() {
        hideTimeout = setTimeout(() => {
            tooltip.classList.remove('is-visible');
        }, 150);
    }

    trigger.addEventListener('mouseenter', openTooltip);
    trigger.addEventListener('mouseleave', closeTooltip);
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    tooltip.addEventListener('mouseleave', closeTooltip);
}
