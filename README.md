# Property Intelligence Skills for Claude

Three Claude skills that turn a street address into decision-ready documents for a home purchase. Give Claude an address, answer a short interview, and get a boardroom-quality deliverable built from public records, market data, and hazard intelligence.

| Skill | Question it answers | Output |
|---|---|---|
| **property-intel-report** | What am I buying and what could go wrong? | 16-slide PowerPoint: all-in monthly carry, normalized comps, 5-year cost projection, climate risk, inspection budget, red flags, offer strategy, question scripts |
| **property-appraisal** | What is it worth? | 9-slide valuation brief: comp grid, adjustment schedule, condition adjustments, reconciliation, AVM cross-check, value-vs-list verdict, plus an interactive comp explorer |
| **property-insurance-brief** | How do I insure it and what will it cost? | 11-slide coverage brief plus a one-page PDF quote spec sheet you hand to three agents so every quote prices the identical spec |

The three skills work as a family. `property-intel-report` is the front door; ask for "the full workup" and it runs all three in sequence, sharing research through a common `property_facts.json` cache so the same house is only researched once and the three documents never contradict each other.

## Install

**Easiest: download the packaged skills.** Grab the `.skill` files from the [latest release](../../releases/latest), then add them to Claude:

- **Claude.ai / Claude desktop:** Settings → Capabilities → Skills → upload the `.skill` file.
- **Claude Code:** unzip each `.skill` into `~/.claude/skills/` so you end up with `~/.claude/skills/property-intel-report/SKILL.md` (and siblings).

Install all three. They cross-reference each other; a solo install works but disables dossier mode and cross-skill routing.

**Requirements:** a Claude plan with skills, web search, and code execution enabled. The build scripts run inside Claude's environment; you don't need Node or Python locally.

## Use

Start a conversation and give Claude an address with intent:

- "Should I buy 123 Main St, Anytown TX? Full property report."
- "What would 123 Main St appraise for?"
- "What will insurance run on 123 Main St? Build the quote spec."
- "Give me everything on this house" → full dossier: all three documents plus a reconciliation note.

Each skill asks a short interview (condition details for the appraisal, coverage preferences for insurance). Skip it and the skill builds on documented defaults, labels every assumption, and lowers its stated confidence.

## What's in this repo

```
skills/
  property-intel-report/     front door: diligence + decision brief
  property-appraisal/        sales-comparison valuation
  property-insurance-brief/  coverage spec + premium brief
```

Each skill folder contains its `SKILL.md` (the instructions Claude follows), reference docs (methodology, data sources, schemas, dated rate anchors), a build script that renders and validates the deliverable, and a fully synthetic worked example.

## Honesty rules baked in

- Every rate and anchor carries an `as_of` date; anything older than six months is re-verified or labeled stale.
- No people-search aggregators, no AVM-sourced comps, no fabricated data to fill layouts.
- Examples are synthetic. Addresses, parcels, and MLS numbers are fabricated; every number recomputes from its own inputs.
- Build scripts validate arithmetic (comp averages, cut counts, carry totals) and fail loudly instead of shipping wrong math.

## Disclaimers

These skills produce decision-support documents, not professional services. The appraisal brief is not a licensed appraisal, the insurance brief is not insurance advice, and neither replaces an inspector, appraiser, agent, or attorney. Verify anything you'd sign against.

## License

MIT. See [LICENSE](LICENSE).
