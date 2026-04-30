# Technology & AI Trends Reference

Current as of April 2025. This specialist follows trends hour by hour. Load this when trend analysis, technology strategy, or innovation direction is needed.

---

## AI / LLM landscape (April 2025)

### Frontier models
- **Anthropic Claude:** claude-opus-4, claude-sonnet-4 — leading on reasoning, safety, long context, tool use. Claude Code for agentic development.
- **OpenAI GPT-4o / o3:** Strong on multimodal, code. o3 leading on math/reasoning benchmarks.
- **Google Gemini 2.0:** Strong on multimodal, search integration, long context (1M+ tokens).
- **Meta Llama 3.x:** Open source leader, enabling on-device and private deployments.
- **Mistral:** European open-source, strong on efficiency.

### Key capability trends
- **Extended thinking / reasoning models:** Models that "think before answering" are dramatically better on complex problems. Design prompts and systems that leverage this.
- **Multimodal becoming standard:** Vision, audio, video input now available in most frontier models. Design systems that can handle non-text inputs natively.
- **Long context windows:** 200k–1M+ token windows enable processing entire codebases, books, legal documents in single calls.
- **Tool use / function calling:** Mature and reliable. Agents with tools are the new applications.
- **Computer use:** Claude and others can now control browsers and desktops. Automation category that didn't exist 18 months ago.
- **Real-time voice:** Low-latency voice conversation with frontier models is production-ready.

### What's coming in 2025–2026
- On-device frontier models (Apple, Google, Qualcomm partnerships)
- AI video generation reaching production quality (Sora, Runway, Kling)
- Autonomous agents completing multi-day tasks without human input
- AI-to-AI communication protocols standardizing (MCP is early version)
- Embodied AI (robotics) getting foundation model intelligence

---

## Software development trends (2025)

### AI-assisted development
- **Vibe coding:** Non-developers shipping products with AI assistance. Claude Code, Cursor, Windsurf leading.
- **Agentic development:** AI agents that plan, write, test, and deploy code with minimal human input.
- **AI code review:** Automated review catching security issues, performance problems, style violations.

### Tech stack trends
- **TypeScript everywhere:** Full-stack TypeScript (Next.js, tRPC, Zod) is the dominant pattern for new projects.
- **React 19 + Server Components:** The React model is maturing. Server components changing architecture patterns.
- **Edge computing:** Vercel Edge, Cloudflare Workers — moving compute closer to users.
- **Supabase:** Postgres + Auth + Realtime + Storage as managed service. Dominant BaaS choice.
- **Bun:** Replacing Node.js for build tooling and runtime in performance-sensitive contexts.

### Architecture patterns
- **Modular monolith > microservices** for early-stage products. Premature microservices remain the #1 overengineering mistake.
- **HTMX resurgence:** Server-rendered HTML with minimal JavaScript. Strong counter-trend to SPA complexity.
- **AI-native architecture:** Applications designed around LLM calls, structured outputs, and agent workflows from day one.

---

## Design & product trends (2025)

### UI/UX
- **Spatial computing design:** Apple Vision Pro driving new interaction paradigms — glanceable UI, hand gestures, eye tracking.
- **AI-generated UI:** Tools like V0 (Vercel), Galileo AI generating UI from prompts. Designers shifting to refinement and strategy.
- **Motion as communication:** Micro-interactions and transitions carrying semantic meaning, not just decoration.
- **Dark mode as default:** Many new products launching dark-first.
- **Ultra-minimal navigation:** Command palettes (Cmd+K), AI search replacing traditional navigation in complex tools.

### Product
- **AI features as core, not add-on:** AI integrated into the core workflow, not as a sidebar chatbot.
- **Ambient intelligence:** AI working in the background, surfacing insights without being asked.
- **Personalization at scale:** AI-driven personalization of content, UI, and workflows per user.

---

## Architecture & built environment trends (2025)

### Design
- **AI-assisted conceptual design:** Midjourney, SD, Spline used in concept phases. Competitive advantage for firms that master it.
- **Mass timber boom:** Cross-laminated timber (CLT) and glulam replacing steel and concrete in mid-rise construction. Lower embodied carbon, biophilic quality, speed of construction.
- **Adaptive reuse surge:** Converting offices to residential, retail to mixed-use. More sustainable than new build, often more architecturally interesting.
- **Parametric facade systems:** Custom facades now economically accessible via digital fabrication.

### Sustainability
- **Embodied carbon now as important as operational carbon.** Whole-life carbon assessment becoming mandatory in many jurisdictions.
- **Net-zero by 2030 commitments:** Major architecture firms and clients committed. Drives material and systems choices.
- **Nature-based solutions:** Green roofs, living walls, urban forests as standard infrastructure.
- **Circular economy design:** Designing for disassembly and material recovery.

### Urban
- **15-minute city policies** being adopted in Paris, Melbourne, Melbourne, and others. Changes zoning, retail mix, transport investment.
- **Post-pandemic office reinvention:** Office space shrinking, quality rising. Hospitality-influenced design.
- **Climate adaptation infrastructure:** Flood defenses, urban cooling, heat resilience becoming major public investment area.
- **Micro-mobility infrastructure:** Protected bike lanes, e-bike charging, scooter parking changing street design.

---

## How to apply trend awareness

For any decision, run this framework:

```
1. What is this trend? (strip the hype — what is technically real right now)
2. What does it enable that wasn't possible 12 months ago?
3. What does it make obsolete or less valuable?
4. What is the 12-month implication for this specific project/product?
5. What is the 3-year implication?
6. What should we build/decide NOW to be ahead of this trend?
```

**The goal is not to follow every trend.** It's to identify the 2–3 trends that are directly relevant to the current work and build for where they are going, not where they are today.

**Trend traps to avoid:**
- Building for today's trend that will be obsolete in 18 months
- Ignoring a trend because it "doesn't apply to us" — it usually does
- Mistaking hype for capability (check what actually works in production, not what's announced)
- Over-investing in a trend before the tooling matures
