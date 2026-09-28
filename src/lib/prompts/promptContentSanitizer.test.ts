import { describe, it, expect } from 'vitest'
import { stripLegacyVisualQualitySection, stripGenericVisualTeaching } from './promptContentSanitizer'

// Unit coverage for the opt-in generator strip that removes the duplicated
// `# VISUAL QUALITY EXAMPLES` section (through its closing `# VISUAL
// VALIDATION` checklist) so the dynamic contract owns that teaching exactly
// once, while preserving topic-specific sections that sat inside the span.

const SIMPLE_BODY = `# Prompt
Generate exactly 50 MCQs.

# VISUAL OPPORTUNITY MATRIX
Maps may be useful for empire extent questions.

---


# VISUAL QUALITY EXAMPLES

Always follow GOOD examples.

Never generate BAD examples.

---

# TABLE

Generate tables only for comparison.

---

# CHART

Charts must have meaningful labels.

---

# VISUAL VALIDATION

✓ The question cannot be answered without the visual.

✓ The question explicitly refers to the visual.

---

# F — FORMAT

Return ONLY JSON.
`

const INTERLEAVED_BODY = `# Prompt
Generate exactly 10 MCQs.

# VISUAL QUALITY EXAMPLES

Always follow GOOD examples.

---

# TABLE

## GOOD TABLE

## BAD TABLE

---

# CHART

Generate charts for trends.

---

# CURRENT AFFAIRS VALIDATION RULE

Every question must satisfy all of the following:

✓ Not speculative.

✓ Not politically biased.

---

# VISUAL VALIDATION

✓ Uses accurate current affairs data.

✓ The visual is essential.

---

# F — FORMAT

Return ONLY JSON.
`

describe('stripLegacyVisualQualitySection', () => {
  it('is a no-op when the header is absent', () => {
    const text = '# Prompt\nGenerate exactly 50 MCQs.\n# TOPIC\nContent.'
    expect(stripLegacyVisualQualitySection(text)).toBe(text)
  })

  it('removes the whole section from the header through its closing checklist and divider', () => {
    const out = stripLegacyVisualQualitySection(SIMPLE_BODY)
    expect(out).not.toContain('# VISUAL QUALITY EXAMPLES')
    expect(out).not.toContain('# TABLE')
    expect(out).not.toContain('# CHART')
    expect(out).not.toContain('# VISUAL VALIDATION')
    expect(out).not.toContain('Always follow GOOD examples.')
    expect(out).not.toContain('Generate tables only for comparison.')
    expect(out).toContain('# VISUAL OPPORTUNITY MATRIX')
    expect(out).toContain('Maps may be useful for empire extent questions.')
    expect(out).toContain('# F — FORMAT')
    expect(out).toContain('Return ONLY JSON.')
  })

  it('preserves a topic-specific section interleaved inside the span and drops the trailing checklist', () => {
    const out = stripLegacyVisualQualitySection(INTERLEAVED_BODY)
    expect(out).not.toContain('# VISUAL QUALITY EXAMPLES')
    expect(out).not.toContain('# TABLE')
    expect(out).not.toContain('## GOOD TABLE')
    expect(out).not.toContain('# VISUAL VALIDATION')
    expect(out).toContain('# CURRENT AFFAIRS VALIDATION RULE')
    expect(out).toContain('✓ Not politically biased.')
    expect(out).toContain('# F — FORMAT')
  })

  it('is idempotent for bodies that already lack the section', () => {
    const once = stripLegacyVisualQualitySection(INTERLEAVED_BODY)
    expect(stripLegacyVisualQualitySection(once)).toBe(once)
  })

  it('removes through EOF when no later section follows', () => {
    const body = `# Prompt

# VISUAL QUALITY EXAMPLES

Use the examples.

# CHART

Charts only where interpretation is needed.

# VISUAL VALIDATION

✓ Essential.
`
    const out = stripLegacyVisualQualitySection(body)
    expect(out).toBe('# Prompt\n')
  })
})

describe('stripGenericVisualTeaching', () => {
  const REMOVE_BODY = `# Prompt
Generate exactly 50 MCQs.

# VISUAL QUALITY RULES

Every visual must:
* Clean.
* Minimal.
* Bilingual.

Avoid:
* Decorative graphics.

---

# ✅ GOOD VISUAL EXAMPLES

## Good Visual Example 1

Why Good
✓ Complete data

---

# ❌ BAD VISUAL EXAMPLES

Why Bad
✗ Invalid schema

---

# VISUAL OPPORTUNITY MATRIX

## Indian Federal Structure

Suitable Visuals

* Union List vs State List Table

---

# VISUAL DECISION RULES

Generate visuals when the question involves federal structure.

---

# MAP USAGE RULES

Use maps for empire extent.

---

# CURRENT AFFAIRS VALIDATION RULE

Event falls within the latest rolling 12–18 months.
`

  it('removes the generic-quality and GOOD/BAD exemplar sections wholesale', () => {
    const out = stripGenericVisualTeaching(REMOVE_BODY)
    expect(out).not.toContain('# VISUAL QUALITY RULES')
    expect(out).not.toContain('# ✅ GOOD VISUAL EXAMPLES')
    expect(out).not.toContain('# ❌ BAD VISUAL EXAMPLES')
    expect(out).not.toContain('# Clean.')
    expect(out).not.toContain('Why Good')
    expect(out).not.toContain('✗ Invalid schema')
    // preserved topic sections survive verbatim
    expect(out).toContain('# VISUAL OPPORTUNITY MATRIX')
    expect(out).toContain('* Union List vs State List Table')
    expect(out).toContain('# VISUAL DECISION RULES')
    expect(out).toContain('# MAP USAGE RULES')
    expect(out).toContain('# CURRENT AFFAIRS VALIDATION RULE')
    expect(out).toContain('Event falls within the latest rolling 12–18 months')
    expect(out).toContain('# Prompt')
    expect(out).toContain('Generate exactly 50 MCQs.')
  })

  it('is a no-op when no generic visual teaching is present', () => {
    const body = '# Prompt\nGenerate exactly 50 MCQs.\n# VISUAL DECISION RULES\nUse visuals only when the question involves maps.\n'
    expect(stripGenericVisualTeaching(body)).toBe(body)
  })

  const SUPPORTED_BODY = `# Prompt
Generate exactly 50 MCQs.

# SUPPORTED VISUAL TYPES

## 1. Table

Use for:

* Population Statistics
* Census Data

Example:

---

## 2. Pie Chart

Use for:

* Budget Allocation

Supported chart type:

\`\`\`json
"chartType":"pie"
\`\`\`

Example:

Questions should require percentage reasoning instead of direct observation.

---

# TOPIC
Keep me.
`

  it('renames # SUPPORTED VISUAL TYPES and prunes app scaffolding while keeping topic opportunities', () => {
    const out = stripGenericVisualTeaching(SUPPORTED_BODY)
    expect(out).toContain('# VISUAL OPPORTUNITIES FOR THIS TOPIC')
    expect(out).not.toContain('# SUPPORTED VISUAL TYPES')
    expect(out).not.toContain('Example:')
    expect(out).not.toContain('Supported chart type:')
    expect(out).not.toContain('"chartType"')
    expect(out).toContain('## 1. Table')
    expect(out).toContain('* Population Statistics')
    expect(out).toContain('* Census Data')
    expect(out).toContain('* Budget Allocation')
    expect(out).toContain('Questions should require percentage reasoning instead of direct observation.')
    expect(out).toContain('# TOPIC')
    expect(out).toContain('Keep me.')
  })

  const GEN_BODY = `# Prompt

# VISUAL GENERATION REQUIREMENT

The AI must intelligently determine whether a visual is required for each question.

A visual should be generated **only when it significantly improves understanding of federal structure, Centre–State relations, or constitutional bodies**.

The objective of visuals is to strengthen constitutional understanding rather than decorate the question.

Maintain approximately:

* **20%–30%** of the total 50 questions should contain visuals.
* Remaining questions must **omit the \`visual\` field** completely.

Only **one visual** is permitted per question.

The visual must always correspond exactly to the constitutional institution presented in the question.

---
`

  it('refactors # VISUAL GENERATION REQUIREMENT into a coverage-target section', () => {
    const out = stripGenericVisualTeaching(GEN_BODY)
    expect(out).toContain('# VISUAL COVERAGE TARGET')
    expect(out).not.toContain('# VISUAL GENERATION REQUIREMENT')
    expect(out).not.toContain('The AI must intelligently determine')
    expect(out).not.toContain('The objective of visuals is')
    expect(out).not.toContain('Maintain approximately:')
    expect(out).not.toContain('Remaining questions')
    expect(out).not.toContain('Only **one visual** is permitted')
    expect(out).toContain('understanding of federal structure, Centre–State relations, or constitutional bodies')
    expect(out).toContain('* **20%–30%** of the total 50 questions should contain visuals.')
    expect(out).toContain('The visual must always correspond exactly to the constitutional institution presented in the question.')
  })

  const GEN_MANDATORY_BODY = `# Prompt

# VISUAL GENERATION REQUIREMENT (MANDATORY)

Every generated question **MUST contain exactly one visual**.

Unlike other Mental Ability topics, **Data Interpretation is inherently visual**. Therefore, a question **without a visual is invalid**.

The objective of the visual is to provide meaningful quantitative information.

---

# TOPIC
X.
`

  it('preserves a fully topic-specific GENERATION REQUIREMENT (MANDATORY) verbatim', () => {
    const out = stripGenericVisualTeaching(GEN_MANDATORY_BODY)
    expect(out).toContain('# VISUAL GENERATION REQUIREMENT (MANDATORY)')
    expect(out).toContain('**Data Interpretation is inherently visual**')
    expect(out).toContain('The objective of the visual is to provide meaningful quantitative information.')
    expect(out).toContain('# TOPIC')
    expect(out).toContain('X.')
  })

  const ENGINE_SUIT_BODY = `# Prompt

# 🖼 VISUAL ENGINE RULES

Generate a visual **ONLY** when it genuinely improves understanding.

If a visual is unnecessary, always generate:

Suitable visual questions include:

* RBI organizational hierarchy
* Monetary policy comparison

Do **NOT** force visuals.

---
`

  it('refactors a MIXED engine-rules section into usage guidance', () => {
    const out = stripGenericVisualTeaching(ENGINE_SUIT_BODY)
    expect(out).toContain('# VISUAL USAGE GUIDANCE FOR THIS TOPIC')
    expect(out).not.toContain('# 🖼 VISUAL ENGINE RULES')
    expect(out).not.toContain('Generate a visual **ONLY** when it genuinely improves understanding.')
    expect(out).not.toContain('If a visual is unnecessary, always generate:')
    expect(out).not.toContain('Do **NOT** force visuals.')
    expect(out).toContain('Suitable visual questions include:')
    expect(out).toContain('* RBI organizational hierarchy')
    expect(out).toContain('* Monetary policy comparison')
  })

  const ENGINE_BAN_BODY = `# Prompt

# ⚙️ VISUAL ENGINE RULES

క్రింది వాటిని ఎప్పటికీ రూపొందించకూడదు.

* Images
* URLs
* SVG

---

# TOPIC
Keep me.
`

  it('removes a pure legacy renderer-ban engine section', () => {
    const out = stripGenericVisualTeaching(ENGINE_BAN_BODY)
    expect(out).not.toContain('# ⚙️ VISUAL ENGINE RULES')
    expect(out).not.toContain('Images')
    expect(out).toContain('# TOPIC')
    expect(out).toContain('Keep me.')
  })

  const ENGINE_COV_BODY = `# Prompt

# VISUAL ENGINE RULES

The AI must intelligently decide whether a visual is necessary.

Use visuals **only when they improve logical understanding**.

Approximately **10%–20%** of the 50 questions should contain visuals.

The remaining questions **must not include the \`visual\` field**.

---
`

  it('refactors a coverage engine-rules section into a coverage target', () => {
    const out = stripGenericVisualTeaching(ENGINE_COV_BODY)
    expect(out).toContain('# VISUAL COVERAGE TARGET')
    expect(out).toContain('Use visuals **only when they improve logical understanding**.')
    expect(out).toContain('Approximately **10%–20%** of the 50 questions should contain visuals.')
    expect(out).not.toContain('The AI must intelligently decide')
    expect(out).not.toContain('The remaining questions')
  })

  it('is idempotent on a realistic mixed body', () => {
    const once = stripGenericVisualTeaching(GEN_BODY + '\n' + SUPPORTED_BODY)
    expect(stripGenericVisualTeaching(once)).toBe(once)
  })
})