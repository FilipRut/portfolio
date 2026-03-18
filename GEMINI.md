# Projekt: Filip Rut Portfolio

To jest nowoczesne portfolio oparte na Astro 6, Tailwind CSS 4 i GSAP. Poniżej znajdują się wytyczne dla agentów AI pracujących nad tym kodem.

## Stos Technologiczny
- **Framework:** Astro 6 (mode: static/hybrid)
- **Stylizacja:** Tailwind CSS 4 (używa @tailwindcss/vite)
- **Animacje:** GSAP 3 + ScrollTrigger
- **Typowanie:** TypeScript

## Architektura Komponentów
1. **Surgical Refactoring:** Dzielimy duże pliki na mniejsze komponenty w `src/components/`.
2. **Style:** Preferujemy style wewnątrz komponentów Astro (`<style>`) lub globalne w `src/styles/global.css`. Unikamy nadmiarowego `is:global`, jeśli to możliwe.
3. **Skrypty:** Logika interakcji powinna być izolowana w komponentach lub wydzielona do `src/scripts/`, jeśli jest współdzielona.
4. **Propsy:** Wszystkie komponenty powinny mieć zdefiniowane interfejsy dla `Props`.

## Zasady Pisania Kodu
- **Interakcje:** Wszystkie animacje scroll-driven muszą korzystać z `gsap` i `ScrollTrigger`.
- **Responsive Design:** Używamy nowoczesnych jednostek CSS (clamp, vh/vw, container queries) oraz natywnych breakpointów Tailwinda.
- **Dostępność (A11y):** Każdy przycisk i interaktywny element musi mieć `aria-label` i poprawne role.
- **Wydajność:** Skrypty GSAP powinny być optymalizowane (użycie `gsap.context()` lub `gsap.ticker.lagSmoothing(0)` tam, gdzie to konieczne).

## Struktura Katalogów
- `src/components/` - Komponenty UI.
- `src/layouts/` - Layouty stron.
- `src/styles/` - Globalne style CSS.
- `src/assets/` - Obrazy i inne zasoby.

## Instrukcje dla Agenta
- Zawsze weryfikuj zmiany za pomocą `npm run build` przed zakończeniem zadania.
- Przy dodawaniu nowych funkcjonalności, dbaj o spójność wizualną z efektem "glassmorphism" i "pixel-art buddy".
- Nie usuwaj komentarzy opisujących logikę animacji GSAP.
