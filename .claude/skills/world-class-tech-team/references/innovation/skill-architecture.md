# Skill Architecture Deep Reference

Everything needed to design, build, optimize, and ship world-class Claude Code skills.

---

## 1. Skill anatomy — complete reference

```
skill-name/
├── SKILL.md                    ← Required. Frontmatter + orchestration logic
└── references/                 ← Optional but essential for deep skills
    ├── domain-1.md             ← Deep content, loaded when relevant
    ├── domain-2.md
    ├── examples.md             ← Output templates and quality bar
    └── subdomain/              ← Nested structure for complex skills
        ├── topic-a.md
        └── topic-b.md
```

---

## 2. Frontmatter — complete field reference

```yaml
---
name: skill-name                     # Directory name. Lowercase, hyphens only, max 64 chars
description: >                       # PRIMARY TRIGGER MECHANISM — design carefully
  [What it does] + [Task types] + [Trigger phrases] + [Push instruction]
when_to_use: >                       # Additional trigger context, appended to description
  [More trigger phrases] + [Examples of when to use]
argument-hint: "[argument]"          # Shows in autocomplete: /skill-name [argument]
arguments: [arg1, arg2]              # Named positional args for $name substitution
disable-model-invocation: true       # Prevent Claude from auto-triggering (manual only)
user-invocable: false                # Hide from / menu (Claude-only triggering)
allowed-tools: Read Grep Bash        # Pre-approve tools, no per-use confirmation
model: claude-opus-4-5               # Override model for this skill
effort: high                         # Override effort: low/medium/high/xhigh/max
context: fork                        # Run in isolated subagent context
agent: Explore                       # Which subagent type (with context: fork)
paths: "src/**/*.ts,api/**/*.js"     # Only trigger when working with these files
---
```

---

## 3. Description engineering — the most critical skill

The description is the triggering mechanism. Claude reads it to decide whether to consult the skill. Design it like a precision instrument.

### The 4-part description formula

**Part 1 — What it does (10–20 words)**
Clear, specific statement of the skill's purpose.

**Part 2 — Task types (20–40 words)**
Specific list of tasks this skill handles. More specific = more reliable triggering.

**Part 3 — Trigger phrases (20–40 words)**
Natural language phrases users might say. Include synonyms and variations.

**Part 4 — Push instruction (10–20 words)**
Explicit instruction to Claude to lean in and trigger early.

### Example — well-engineered description
```yaml
description: >
  Channels a Staff Engineer, Principal Designer, and Senior PM for any software 
  building, designing, or reviewing task. Use for: code review, architecture 
  decisions, UI/UX design, product specs, prioritization, API design, security 
  audits, accessibility. Trigger on: "build me", "review this", "help me design", 
  "what's the best way to", "is this good code", "critique this". Also trigger 
  when the user shares code or a design without an explicit command — treat it 
  as an invitation for expert eyes.
```

### Triggering failure modes and fixes

**Undertriggering (skill doesn't fire when it should):**
- Description too vague — make task types more specific
- Missing trigger phrases — add more natural language variations
- No push instruction — add explicit "trigger even when..." language

**Overtriggering (skill fires when it shouldn't):**
- Description too broad — narrow the task type list
- Missing exclusions — add "do NOT use for: [list]"
- Overlapping with another skill — differentiate clearly

### Optimization process
1. Write 20 prompts that SHOULD trigger the skill
2. Write 10 prompts that should NOT trigger it
3. Test against the current description mentally
4. Refine until classification is correct for all 30
5. In Claude Code, use the description optimization loop script

---

## 4. SKILL.md body design

The body is loaded every time the skill triggers. Keep it lean — routing + principles + references only. Deep content goes in reference files.

### Ideal SKILL.md structure
```markdown
# Skill Name

[One sentence: what this skill is and its core purpose]

---

## How to route

[Routing table: task → reference file mapping]

**Reference files:**
- `references/file-1.md` — [what it covers, when to load]
- `references/file-2.md` — [what it covers, when to load]

---

## Core principles

[5–10 principles that guide all responses, specific to this skill]

---

## Output standards

[What excellent output looks like for each task type]

---

## Tensions to surface

[Named disagreements between expertise areas, how to resolve them]
```

**Target length:** 80–150 lines for the SKILL.md body. If approaching 500 lines, move content to reference files.

---

## 5. Reference file design

### File organization patterns

**By domain (most common):**
```
references/
├── engineer.md     ← engineering domain
├── designer.md     ← design domain
├── pm.md           ← product domain
└── examples.md     ← output templates
```

**By task type:**
```
references/
├── code-review.md
├── architecture.md
├── product-spec.md
└── examples.md
```

**By nested domain (for complex skills):**
```
references/
├── languages/
│   ├── english.md
│   ├── arabic.md
│   └── turkish.md
└── innovation/
    ├── ai-agents.md
    └── trends.md
```

### Reference file structure
```markdown
# [Domain] Reference

[Opening: who this expert is, their credentials, their philosophy]

---

## Table of contents
1. [Section 1]
2. [Section 2]
...

---

## 1. [Section 1]

[Deep content with examples, specific guidance, concrete patterns]

---

## N. Anti-patterns

[Common mistakes to avoid — named, explained]
```

### Reference file length guidelines
- Under 200 lines: include a simple table of contents
- 200–400 lines: detailed table of contents, consider splitting
- Over 400 lines: split into sub-files with a navigation file

---

## 6. Advanced patterns

### Dynamic context injection
Inject live data into skill content before Claude sees it:
```yaml
## Current environment
```!
node --version && git status --short && echo "Branch: $(git branch --show-current)"
```
```
The `` !`command` `` syntax runs shell commands before the skill is sent to Claude. Output replaces the placeholder. This is preprocessing, not something Claude executes.

### Argument substitution
```yaml
---
name: review-file
arguments: [filename, depth]
---
Review `$filename` at `$depth` depth.
```
Usage: `/review-file src/auth.js deep`

### Subagent execution
```yaml
---
name: deep-research
context: fork
agent: Explore
---
Research $ARGUMENTS thoroughly using Glob, Grep, and Read tools.
Return findings with specific file references.
```
Runs in isolated context — no access to conversation history. Use for tasks that should be fully self-contained.

### Path-scoped skills
```yaml
---
paths: "src/api/**/*.js,api/**/*.js"
---
```
Claude only auto-loads this skill when working with files matching these patterns. Prevents irrelevant triggering.

### Skill hooks
```yaml
---
hooks:
  PostToolUse:
    - matcher: "Bash(npm test *)"
      hooks:
        - type: command
          command: "echo 'Tests completed' >> .claude/test-log.txt"
---
```

---

## 7. Skill quality checklist

Before shipping any skill:

**Frontmatter:**
- [ ] Name is specific, lowercase, hyphenated
- [ ] Description uses the 4-part formula
- [ ] `when_to_use` adds meaningful trigger phrases
- [ ] `allowed-tools` pre-approves safe tools
- [ ] `disable-model-invocation` set correctly for manual-only skills

**SKILL.md body:**
- [ ] Under 150 lines (body only, not counting frontmatter)
- [ ] Routing table covers all task types
- [ ] All reference files listed with load guidance
- [ ] Core principles are specific to this skill (not generic)
- [ ] Output standards show what excellent looks like

**Reference files:**
- [ ] Each file has a table of contents
- [ ] Each file opens with the expert's credentials and philosophy
- [ ] Deep content with specific examples, not just principles
- [ ] Anti-patterns section in each file
- [ ] No file exceeds 450 lines (split if needed)

**Quality:**
- [ ] Would this produce noticeably better output than Claude without it?
- [ ] Does the description correctly classify 20 positive and 10 negative test cases?
- [ ] Is the routing logic complete — every task type has a destination?
- [ ] Do the reference files go deep enough to be genuinely useful?
