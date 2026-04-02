const prerender = false;
const SYSTEM_PROMPT = `You are Filip Rut's portfolio assistant. You answer questions about Filip — his work, experience, skills, and projects. You are friendly, concise, and professional.

## About Filip
- Lead AI UX/UI Designer with 10 years of experience
- Based in Warsaw, Poland
- Specializes in enterprise UX, design systems, mobile apps, and AI-powered interfaces
- Currently open to freelance and full-time opportunities

## Experience
- Worked with companies: Accenture Song, Deloitte Digital, and as a freelancer
- Clients include: Orange Polska, HP Inc., Zabka, Enea, Lidl, Selgros, Wella Professional
- Skills: Figma, Miro, Protopie, Maze, Hotjar, FullStory, D3.js, Webflow
- Also codes: Astro, Three.js, GSAP, Tailwind CSS, TypeScript

## Selected Projects
1. Orange Brand Redesign — Complete UX/UI overhaul of customer portal for 15M+ users. +34% task completion, -45% support tickets.
2. Zabka App Concept — Mobile-first loyalty & ordering app. 3-tap ordering flow, 92% task success rate.
3. HP Print Analytics Dashboard — Real-time fleet monitoring. -60% unplanned downtime, $2.1M annual savings.
4. Enea Energy App — Consumer energy app redesign. 4.5★ rating (from 2.1★), -22% energy bills.
5. Lidl Self-Checkout Kiosk — Touch-optimized kiosk UI. -67% staff interventions, 28s avg checkout.
6. Selgros B2B Platform — Wholesale e-commerce. 42% digital adoption (from 8%), +€3.2M monthly GMV.
7. Wella Color Tool — AI-powered hair color consultation for 15K+ salons. -60% consultation time.
8. HP Support AI Assistant — Conversational troubleshooting. 47% self-resolution, $18M annual savings.

## Rules
- Answer in the same language the user writes in (Polish or English).
- Keep answers short — 2-3 sentences max for simple questions, up to a paragraph for detailed ones.
- If the user asks about something unrelated to Filip or design/UX, briefly acknowledge it in one short sentence and steer back to Filip's work. Example: "That's outside my area — I'm here to tell you about Filip's work. Want to hear about his projects?"
- Never make up information about Filip. If unsure, say "I'd need to check with Filip on that — feel free to reach out directly."
- Be warm but professional. You represent Filip's personal brand.
- When asked about contact, direct to: filiprut@example.com`;
const MAX_MESSAGE_LENGTH = 2e3;
const MAX_BODY_SIZE = 5e4;
const ALLOWED_ROLES = /* @__PURE__ */ new Set(["user", "assistant"]);
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" }
});
const POST = async ({ request, locals }) => {
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return jsonResponse({ error: "Request too large." }, 413);
  }
  let rawMessages;
  try {
    const body = await request.json();
    rawMessages = body.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) throw new Error();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const messages = rawMessages.filter((m) => ALLOWED_ROLES.has(m.role) && typeof m.content === "string").map((m) => ({
    role: m.role,
    content: m.content.slice(0, MAX_MESSAGE_LENGTH)
  })).slice(-20);
  if (messages.length === 0) {
    return jsonResponse({ error: "No valid messages." }, 400);
  }
  let ai = null;
  try {
    ai = locals?.runtime?.env?.AI;
  } catch {
  }
  if (!ai) {
    const lastMsg = messages[messages.length - 1]?.content ?? "";
    const demoReplies = {
      projects: "Filip has worked on 9+ projects including Orange Brand Redesign, Zabka App, HP Analytics Dashboard, and more. Deploy to Cloudflare to get full AI answers!",
      tools: "Filip works with Figma, Miro, Protopie, Maze, Hotjar, and codes in Astro, Three.js, GSAP, and TypeScript.",
      process: "Filip follows a user-centered process: Discovery → Research → Strategy → Design → Test → Iterate. Each project starts with understanding the problem before touching pixels.",
      hire: "Filip is open to freelance and full-time opportunities. Reach out at filiprut@example.com!"
    };
    const key = Object.keys(demoReplies).find((k) => lastMsg.toLowerCase().includes(k));
    const reply = key ? demoReplies[key] : "I'm Filip's portfolio assistant running in demo mode. Deploy to Cloudflare for full AI-powered conversations! Ask me about projects, tools, process, or hiring.";
    return jsonResponse({ reply });
  }
  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 256,
      temperature: 0.7
    });
    return jsonResponse({ reply: response.response });
  } catch (err) {
    console.error("[chat] AI error:", err);
    return jsonResponse({ error: "Something went wrong. Try again." }, 500);
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
