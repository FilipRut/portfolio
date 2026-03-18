import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initClock } from './clock';
import { initMatrixCursor } from './matrixCursor';
import { initPlaceholder } from './placeholder';
import { initHeroGallery } from './gallery';
import { initBuddy } from './buddy';
			gsap.registerPlugin(ScrollTrigger);

			// Prevent browsers from throttling rAF during scroll (Safari/Chrome optimisation).
			gsap.ticker.lagSmoothing(0);
			gsap.config({ force3D: true });
			window.addEventListener('scroll', () => gsap.ticker.tick(), { passive: true });

			function init() {
			initClock();

			/* ── HERO ENTRANCE ── */
			const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

			heroTl.fromTo('.hero-label',
				{ y: -20, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }
			);

			heroTl.from('.hero-line', {
				scaleY: 0, transformOrigin: 'top center',
				duration: 1, stagger: 0.08, ease: 'power2.inOut',
			}, '-=0.6');

			heroTl.fromTo('.hero-letter',
				{ y: '120%', opacity: 0 },
				{ y: '0%', opacity: 1, duration: 1.4, stagger: 0.12, ease: 'power4.out' },
			'-=0.8');

			/* ── FIXED PROMPTER ── */
			const prompterFixed = document.querySelector<HTMLElement>('#prompter-fixed')!;
			const glassContainer = document.querySelector<HTMLElement>('.glass-container')!;
			const textareaWrap = document.querySelector<HTMLElement>('.prompter-textarea-wrap')!;
			const overlayTop = document.querySelector<HTMLElement>('.glass-overlay-top')!;
			const overlayBottom = document.querySelector<HTMLElement>('.glass-overlay-bottom')!;
			const bubblesWrap = document.querySelector<HTMLElement>('.prompt-bubbles')!;
			const dropdownBtn = document.querySelector<HTMLButtonElement>('#dropdown-btn')!;
			const prompterColumn = document.querySelector<HTMLElement>('.prompter-column')!;

			const vh = window.innerHeight;
			const isMobile = window.innerWidth < 768;
			
			initHeroGallery(vh, isMobile);

			// Center based on glass container (the visible element), not full column
			const glassH = glassContainer.offsetHeight;
			const glassOffsetInCol = glassContainer.getBoundingClientRect().top - prompterColumn.getBoundingClientRect().top;
			const yOffScreen = vh * 1.5;
			const yCentered = (vh - glassH) / 2 - glassOffsetInCol;
			const yTop = 16;

			const sceneVignette = document.getElementById('scene-vignette')!;

			// Helper: build collapse animations (shared between mobile & desktop)
			function buildCollapse(tl: gsap.core.Timeline, withBubblesAndDropdown = true) {
				tl
					.to(glassContainer, { keyframes: [
						{ minHeight: '120px', padding: '3px', borderRadius: '16px', duration: 0.6 },
						{ minHeight: '40px', padding: '2px', borderRadius: '30px', duration: 0.4 },
					] }, 0)
					.to(textareaWrap, { keyframes: [
						{ minHeight: '100px', borderRadius: '12px', duration: 0.6 },
						{ minHeight: '36px', borderRadius: '30px', duration: 0.4 },
					] }, 0)
					.to('.prompter-textarea', {
						paddingTop: '0px', paddingBottom: '0px',
						height: '36px', lineHeight: '36px',
						duration: 1,
					}, 0)
					.to('#generate-btn', { width: '30px', height: '30px', duration: 1 }, 0)
					.to('#generate-btn svg', { width: '14px', height: '14px', duration: 1 }, 0)
					.to(overlayTop, { opacity: 0, duration: 0.3 }, 0)
					.to(overlayBottom, { height: '36px', padding: '3px', duration: 1 }, 0);

				if (withBubblesAndDropdown) {
					tl
						.to(bubblesWrap, { y: -20, opacity: 0, pointerEvents: 'none', duration: 0.4 }, 0)
						.to(dropdownBtn, { width: '36px', height: '36px', minWidth: '36px', duration: 1 }, 0)
						.to('#dropdown-btn svg', { width: '14px', height: '14px', duration: 1 }, 0)
						.to(dropdownBtn, {
							opacity: 1, pointerEvents: 'auto', duration: 0.4,
							onComplete: () => dropdownBtn.classList.add('is-visible'),
							onReverseComplete: () => {
								dropdownBtn.classList.remove('is-visible', 'is-open');
								bubblesOpen = false;
							},
						}, 0.5);
				}
			}

			// Declare early — needed by mobile section below
			const promptInput = document.querySelector<HTMLTextAreaElement>('#ai-prompt')!;
			
			initMatrixCursor(promptInput);
			initPlaceholder(promptInput);
			
			let chatMode = false;

			if (isMobile) {
				// ── MOBILE: composer starts collapsed (pill) at bottom ──
				gsap.set(prompterColumn, { y: 0 });
				gsap.set(glassContainer, { minHeight: '40px', padding: '2px', borderRadius: '30px' });
				gsap.set(textareaWrap, { minHeight: '36px', borderRadius: '30px' });
				gsap.set('.prompter-textarea', { paddingTop: '0px', paddingBottom: '0px', height: '36px', lineHeight: '36px' });
				gsap.set('#generate-btn', { width: '30px', height: '30px' });
				gsap.set('#generate-btn svg', { width: '14px', height: '14px' });
				gsap.set(overlayTop, { opacity: 0 });
				gsap.set(overlayBottom, { height: '36px', padding: '3px' });
				gsap.set(bubblesWrap, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
				gsap.set('.prompt-bubble', { y: 10, opacity: 0, scale: 0.9 });

				let mobileExpanded = false;

				// Tap on pill → focus textarea (overlay-bottom blocks direct textarea tap)
				glassContainer.addEventListener('click', () => {
					if (!mobileExpanded && !chatMode) {
						promptInput.focus();
					}
				});

				// Expand on focus → 50vh with bubbles inside
				promptInput.addEventListener('focus', () => {
					if (mobileExpanded || chatMode) return;
					mobileExpanded = true;
					const expandTl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power3.out' } });
					expandTl
						.to(glassContainer, { minHeight: '50vh', padding: 'clamp(0.4rem, 0.3rem + 0.2vw, 0.6rem)', borderRadius: 'clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem)' }, 0)
						.to(textareaWrap, { minHeight: 'calc(50vh - 2rem)', borderRadius: 'clamp(0.5rem, 0.35rem + 0.3vw, 0.85rem)' }, 0)
						.to('.prompter-textarea', { paddingTop: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)', paddingBottom: 'clamp(3.5rem, 3rem + 1vw, 5rem)', height: '100%', lineHeight: '1.6' }, 0)
						.to('#generate-btn', { width: '32px', height: '32px' }, 0)
						.to('#generate-btn svg', { width: '18px', height: '18px' }, 0)
						.to(overlayTop, { opacity: 1 }, 0)
						.to(overlayBottom, { height: 'auto', padding: 'clamp(0.75rem, 0.5rem + 0.4vw, 1.25rem)' }, 0)
						.to(bubblesWrap, { opacity: 1, visibility: 'visible', pointerEvents: 'auto', duration: 0.3 }, 0.15)
						.to('.prompt-bubble', { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.3, ease: 'back.out(1.7)' }, 0.2);
				});

				// Collapse on blur
				promptInput.addEventListener('blur', () => {
					if (!mobileExpanded || chatMode) return;
					mobileExpanded = false;
					const collapseTl = gsap.timeline({ defaults: { duration: 0.3, ease: 'power2.in' } });
					collapseTl
						.to(bubblesWrap, { opacity: 0, visibility: 'hidden', pointerEvents: 'none', duration: 0.15 }, 0)
						.to('.prompt-bubble', { y: 10, opacity: 0, scale: 0.9, duration: 0.15 }, 0)
						.to(glassContainer, { minHeight: '40px', padding: '2px', borderRadius: '30px' }, 0.1)
						.to(textareaWrap, { minHeight: '36px', borderRadius: '30px' }, 0.1)
						.to('.prompter-textarea', { paddingTop: '0px', paddingBottom: '0px', height: '36px', lineHeight: '36px' }, 0.1)
						.to('#generate-btn', { width: '30px', height: '30px' }, 0.1)
						.to('#generate-btn svg', { width: '14px', height: '14px' }, 0.1)
						.to(overlayTop, { opacity: 0, duration: 0.15 }, 0)
						.to(overlayBottom, { height: '36px', padding: '3px' }, 0.1);
				});
			} else {
				// ── DESKTOP: slide from bottom, then collapse ──
				gsap.set(prompterColumn, { y: yOffScreen });
				gsap.set('.prompt-bubble', { y: 20, opacity: 0, scale: 0.9 });

				// ── Vignette: driven directly by scroll position (no scrub lag) ──
				// Fade in during 30%-100% of phase 1, fade out during 0%-50% of phase 2.
				const vignetteInStart = vh * 0.30;
				const vignetteInEnd = vh;
				const vignetteOutStart = vh;
				const vignetteOutEnd = vh * 1.5;

				window.addEventListener('scroll', () => {
					const y = window.scrollY;
					let opacity = 0;
					if (y <= vignetteInStart) {
						opacity = 0;
					} else if (y <= vignetteInEnd) {
						opacity = (y - vignetteInStart) / (vignetteInEnd - vignetteInStart);
					} else if (y <= vignetteOutStart) {
						opacity = 1;
					} else if (y <= vignetteOutEnd) {
						opacity = 1 - (y - vignetteOutStart) / (vignetteOutEnd - vignetteOutStart);
					}
					sceneVignette.style.opacity = String(opacity);
				}, { passive: true });

				// Phase 1: Slide up from below to center
				const slideTl = gsap.timeline({
					scrollTrigger: {
						trigger: '#scroll-wrapper',
						start: '0px top',
						end: `${vh}px top`,
						scrub: 0.3,
					},
				});

				slideTl
					.to(prompterColumn, {
						y: yCentered,
						duration: 1,
						ease: 'power2.out',
					})
					.to('.prompt-bubble', {
						y: 0, opacity: 1, scale: 1,
						stagger: 0.05,
						duration: 0.4,
						ease: 'back.out(1.7)',
					}, 0.5);

				// Phase 2: Collapse to pill + move to top
				const collapseTl = gsap.timeline({
					defaults: { duration: 1, ease: 'none' },
					scrollTrigger: {
						trigger: '#scroll-wrapper',
						start: `${vh}px top`,
						end: `${vh * 2}px top`,
						scrub: 0.3,
					},
				});

				collapseTl
					.to(prompterColumn, { y: yTop, duration: 1 }, 0);
				buildCollapse(collapseTl);
			}

			/* ── INTRO SECTION ── */
			gsap.fromTo('.intro-el',
				{ y: 40, opacity: 0 },
				{
					y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
					scrollTrigger: { trigger: '#intro', start: 'top 80%', once: true },
				}
			);

			/* ── DROPDOWN TOGGLE ── */
			let bubblesOpen = false;

			dropdownBtn.addEventListener('click', () => {
				bubblesOpen = !bubblesOpen;
				dropdownBtn.classList.toggle('is-open', bubblesOpen);

				if (bubblesOpen) {
					gsap.to(bubblesWrap, {
						y: 0, opacity: 1, pointerEvents: 'auto',
						duration: 0.4, ease: 'back.out(1.7)',
					});
				} else {
					gsap.to(bubblesWrap, {
						y: -20, opacity: 0, pointerEvents: 'none',
						duration: 0.3, ease: 'power2.in',
					});
				}
			});

			/* ── AI CHAT SYSTEM ── */
			const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

			const generateBtn = document.querySelector<HTMLButtonElement>('#generate-btn')!;
			const responseTitle = document.querySelector<HTMLElement>('#ai-response-title')!;
			const responseText = document.querySelector<HTMLElement>('#ai-response-text')!;
			const triggers = document.querySelectorAll<HTMLButtonElement>('.prompt-bubble');
			const chatOverlay = document.getElementById('chat-overlay')!;
			const chatDim = document.getElementById('chat-dim')!;
			const chatModal = document.getElementById('chat-modal')!;
			const chatMessages = document.getElementById('chat-messages')!;
			const chatCloseBtn = document.getElementById('chat-close')!;
			const chatSpinner = document.getElementById('chat-spinner')!;

			let chatHistory: { role: 'user' | 'bot'; text: string }[] = [];
			let isSending = false;
			let prompterState: 'offscreen' | 'centered' | 'collapsed' | 'chat' = 'offscreen';

			// Track prompter state via ScrollTrigger progress (desktop only)
			if (!isMobile) {
				ScrollTrigger.create({
					trigger: '#scroll-wrapper',
					start: '0px top',
					end: `${vh}px top`,
					onLeave: () => { if (prompterState !== 'chat') prompterState = 'centered'; },
					onEnterBack: () => { if (prompterState !== 'chat') prompterState = 'offscreen'; },
				});
				ScrollTrigger.create({
					trigger: '#scroll-wrapper',
					start: `${vh}px top`,
					end: `${vh * 2}px top`,
					onLeave: () => { if (prompterState !== 'chat') prompterState = 'collapsed'; },
					onEnterBack: () => { if (prompterState !== 'chat') prompterState = 'centered'; },
				});
			} else {
				prompterState = 'collapsed';
			}

			// localStorage
			function saveChat() {
				try { localStorage.setItem('portfolio-chat', JSON.stringify(chatHistory)); } catch {}
			}
			function loadChat() {
				try {
					const saved = localStorage.getItem('portfolio-chat');
					if (saved) chatHistory = JSON.parse(saved);
				} catch {}
			}
			loadChat();

			function appendBubble(role: 'user' | 'bot', text: string) {
				const bubble = document.createElement('div');
				bubble.className = `chat-bubble chat-bubble--${role}`;
				bubble.textContent = text;
				chatMessages.appendChild(bubble);
				chatMessages.scrollTop = chatMessages.scrollHeight;
			}

			function restoreHistory() {
				chatMessages.innerHTML = '';
				chatHistory.forEach(msg => appendBubble(msg.role, msg.text));
			}

			function showSpinner() {
				chatSpinner.classList.add('is-active');
			}
			function hideSpinner() {
				chatSpinner.classList.remove('is-active');
			}

			// Save original collapsed values for restoration
			const collapsedGlassValues = { minHeight: '40px', padding: '2px', borderRadius: '30px' };
			const collapsedTextareaWrapValues = { minHeight: '36px', borderRadius: '30px' };
			const collapsedTextareaValues = { paddingTop: '0px', paddingBottom: '0px', height: '36px', lineHeight: '36px' };
			const collapsedBtnValues = { width: '30px', height: '30px' };
			const collapsedBtnSvgValues = { width: '14px', height: '14px' };
			const collapsedOverlayTopValues = { opacity: 0 };
			const collapsedOverlayBottomValues = { height: '36px', padding: '3px' };

			// Expand prompter to center (from collapsed pill)
			function expandToCenter(): gsap.core.Timeline {
				const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power3.out' } });

				// Move to center
				if (!isMobile) {
					const glassH_now = 40; // collapsed height
					const yCenter = (vh - glassH_now) / 2;
					tl.to(prompterColumn, { y: yCenter, duration: 0.6, ease: 'power3.inOut' }, 0);
				}

				// Expand glass
				tl.to(glassContainer, {
					minHeight: 'clamp(16rem, 12rem + 8vw, 24rem)',
					padding: 'clamp(0.4rem, 0.3rem + 0.2vw, 0.6rem)',
					borderRadius: 'clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem)',
				}, 0);
				tl.to(textareaWrap, {
					minHeight: 'clamp(14rem, 10rem + 7vw, 22rem)',
					borderRadius: 'clamp(0.5rem, 0.35rem + 0.3vw, 0.85rem)',
				}, 0);
				tl.to('.prompter-textarea', {
					paddingTop: 'clamp(1rem, 0.75rem + 0.5vw, 1.5rem)',
					paddingBottom: 'clamp(3.5rem, 3rem + 1vw, 5rem)',
					height: '100%', lineHeight: '1.6',
				}, 0);
				tl.to('#generate-btn', { width: '48px', height: '48px' }, 0);
				tl.to('#generate-btn svg', { width: '20px', height: '20px' }, 0);
				tl.to(overlayTop, { opacity: 1 }, 0);
				tl.to(overlayBottom, { height: 'auto', padding: 'clamp(0.75rem, 0.5rem + 0.4vw, 1.25rem)' }, 0);

				// Show bubbles
				if (!isMobile) {
					tl.to(bubblesWrap, { y: 0, opacity: 1, pointerEvents: 'auto', duration: 0.4 }, 0.2);
					tl.to('.prompt-bubble', { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.3, ease: 'back.out(1.7)' }, 0.25);
					tl.to(sceneVignette, { opacity: 1, duration: 0.4 }, 0);
					// Hide dropdown
					tl.to(dropdownBtn, { opacity: 0, pointerEvents: 'none', duration: 0.2 }, 0);
				}

				return tl;
			}

			// Collapse prompter back to pill
			function collapseToOriginal(): gsap.core.Timeline {
				const tl = gsap.timeline({ defaults: { duration: 0.4, ease: 'power3.inOut' } });

				if (!isMobile) {
					tl.to(prompterColumn, { y: yTop, duration: 0.5 }, 0);
					tl.to(sceneVignette, { opacity: 0, duration: 0.3 }, 0);
				}

				tl.to(glassContainer, collapsedGlassValues, 0);
				tl.to(textareaWrap, collapsedTextareaWrapValues, 0);
				tl.to('.prompter-textarea', collapsedTextareaValues, 0);
				tl.to('#generate-btn', collapsedBtnValues, 0);
				tl.to('#generate-btn svg', collapsedBtnSvgValues, 0);
				tl.to(overlayTop, collapsedOverlayTopValues, 0);
				tl.to(overlayBottom, collapsedOverlayBottomValues, 0);

				if (!isMobile) {
					tl.to(bubblesWrap, { y: -20, opacity: 0, pointerEvents: 'none', duration: 0.3 }, 0);
					tl.to(dropdownBtn, {
						opacity: 1, pointerEvents: 'auto', duration: 0.3,
						onComplete: () => dropdownBtn.classList.add('is-visible'),
					}, 0.2);
				}

				return tl;
			}

			// Chat input elements
			const chatInput = document.getElementById('chat-input') as HTMLInputElement;
			const chatSendBtn = document.getElementById('chat-send')!;

			// Enter chat mode
			async function enterChatMode(firstMessage: string) {
				chatMode = true;
				prompterState = 'chat';
				hideBuddy();

				// Restore existing history + add new message
				restoreHistory();
				chatHistory.push({ role: 'user', text: firstMessage });
				saveChat();
				appendBubble('user', firstMessage);

				const tl = gsap.timeline();

				// Collapse prompter → pill while simultaneously opening modal
				const collTl = collapseToOriginal();
				tl.add(collTl, 0);

				// Fade out prompter as it collapses
				tl.to(prompterFixed, { opacity: 0, pointerEvents: 'none', duration: 0.35 }, 0.15);

				// Show chat overlay with modal (overlaps with collapse)
				tl.call(() => {
					chatOverlay.classList.add('is-active');
					chatInput.value = '';
				}, undefined, 0.2);

				gsap.set(chatModal, { y: 30, opacity: 0 });
				tl.to(chatModal, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, 0.25);

				await tl;

				chatInput.focus();

				// Show spinner and simulate response
				showSpinner();
				await wait(1500);
				hideSpinner();

				const botResponse = 'Już ci odpowiadam...';
				chatHistory.push({ role: 'bot', text: botResponse });
				saveChat();
				appendBubble('bot', botResponse);
			}

			// Exit chat mode
			async function exitChatMode() {
				if (!chatMode) return;
				chatMode = false;
				isSending = false;

				const tl = gsap.timeline();

				// Fade out modal
				tl.to(chatModal, { y: 30, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
				tl.call(() => {
					chatOverlay.classList.remove('is-active');
				}, undefined, 0.3);

				// Show original prompter again (as collapsed pill)
				const collTl = collapseToOriginal();
				tl.add(collTl, 0.15);
				tl.to(prompterFixed, { opacity: 1, pointerEvents: '', duration: 0.3 }, 0.2);
				tl.call(() => {
					prompterFixed.style.pointerEvents = '';
					prompterState = 'collapsed';
				});

				await tl;
			}

			// Send from chat modal input
			async function handleChatSend() {
				const query = chatInput.value.trim();
				if (!query || isSending) return;
				isSending = true;

				chatHistory.push({ role: 'user', text: query });
				saveChat();
				appendBubble('user', query);
				chatInput.value = '';

				showSpinner();
				await wait(1500);
				hideSpinner();

				const botResponse = 'Już ci odpowiadam...';
				chatHistory.push({ role: 'bot', text: botResponse });
				saveChat();
				appendBubble('bot', botResponse);

				isSending = false;
			}

			// Main send handler (from original prompter — first message opens chat)
			async function handleSend() {
				const query = promptInput.value.trim();
				if (!query || isSending) return;
				isSending = true;

				// First message → enter chat mode
				await enterChatMode(query);

				isSending = false;
			}

			// Chat modal input handlers
			chatSendBtn.addEventListener('click', () => handleChatSend());
			chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					handleChatSend();
				}
			});

			// Predefined question: typewriter → auto submit
			let isTypingBubble = false;
			triggers.forEach((tag) => {
				tag.addEventListener('click', async () => {
					if (isTypingBubble || isSending) return;
					isTypingBubble = true;

					const text = tag.dataset.prompt ?? '';

					// If collapsed, expand first
					if (prompterState === 'collapsed' && !isMobile) {
						await expandToCenter();
						prompterState = 'centered';
						await wait(200);
					}

					promptInput.focus();
					promptInput.value = '';

					// Typewriter into textarea
					for (let i = 0; i < text.length; i++) {
						promptInput.value = text.slice(0, i + 1);
						await wait(30);
					}

					await wait(400);
					isTypingBubble = false;

					// Auto-submit
					await handleSend();
				});
			});

			// Click send button
			generateBtn.addEventListener('click', () => { handleSend(); });

			// Enter to send
			promptInput.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					handleSend();
				}
			});

			// Click collapsed pill to expand (desktop)
			if (!isMobile) {
				glassContainer.addEventListener('click', async (e) => {
					if (prompterState !== 'collapsed' || chatMode) return;
					if ((e.target as HTMLElement).closest('.prompter-send')) return;
					e.stopPropagation();

					if (chatHistory.length > 0) {
						// Has conversation history → go straight to chat modal
						chatMode = true;
						prompterState = 'chat';
						hideBuddy();
						restoreHistory();

						const tl = gsap.timeline();
						tl.to(prompterFixed, { opacity: 0, pointerEvents: 'none', duration: 0.3 }, 0);

						tl.call(() => {
							chatOverlay.classList.add('is-active');
							chatInput.value = '';
						}, undefined, 0.15);

						gsap.set(chatModal, { y: 30, opacity: 0 });
						tl.to(chatModal, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, 0.2);

						await tl;
						chatInput.focus();
					} else {
						// No history → expand to centered state with bubbles
						await expandToCenter();
						prompterState = 'centered';
						promptInput.focus();
					}
				});
			}

			// Close chat
			chatCloseBtn.addEventListener('click', () => exitChatMode());
			chatDim.addEventListener('click', () => exitChatMode());

			/* ── AUTO DETECT BACKGROUND → SWITCH COLORS ── */
			const lightSections = document.querySelectorAll<HTMLElement>('#intro');

			const checkBackground = () => {
				const col = prompterColumn.getBoundingClientRect();
				const colMid = col.top + col.height / 2;
				let isLight = false;

				lightSections.forEach((sec) => {
					const rect = sec.getBoundingClientRect();
					if (colMid >= rect.top && colMid <= rect.bottom) {
						isLight = true;
					}
				});

				prompterFixed.classList.toggle('on-light', isLight);
			};

			ScrollTrigger.addEventListener('refresh', checkBackground);
			window.addEventListener('scroll', checkBackground, { passive: true });
			checkBackground();

			
			const buddyStore = initBuddy({
				promptInput,
				prompterFixed,
				generateBtn,
				glassWrap: glassContainer,
				getChatMode: () => chatMode
			});

			function hideBuddy() {
				if (buddyStore) buddyStore.hideBuddy();
			}

		} // end init()

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', init);
			} else {
				init();
			}