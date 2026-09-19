// Integer-distribution audit across all 171 normalized stored prompt bodies.
//
// Hardening §11 (validation rule 14): percentage/ratio targets in topic
// instructions must convert to exact INTEGER counts summing to the required
// total; topic coverage, difficulty, cognitive and question-type allocations
// must each sum to that total and must not conflict; rule 13 enforces the exact
// total. This probe audits the LITERAL bytes the consolidated migration stores
// (the same sanitized text) by checking, per body:
//   1. Question-count consistency: an explicit "Generate exactly N MCQs" /
//      "Total → N Questions" target must equal the sum of any integer coverage
//      matrix (e.g. Topic Coverage Matrix, Unit Coverage, Layer Distribution).
//   2. Percentage blocks (Difficulty, Cognitive, Question Type Distribution,
//      Place/Subtopic Coverage, etc.) must each sum to 100% where present.
//   3. All allocations must be non-empty integers and non-zero.
//
// The audit is tolerant: a body missing a section is fine; a body with a
// section that sums wrong is reported. Exit code 0 = no violations.
//
// Run:  node --experimental-strip-types scripts/integer_distribution_audit.mts

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  sanitizeLegacyApplicationFormat,
  ensureSingleContractMarker,
} from '../src/lib/prompts/promptContentSanitizer.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const SEED = join(ROOT, 'scripts', 'data', 'prompt_templates_live_v1.jsonl')

interface Block {
  heading: string
  items: { label: string; value: number }[]
}

interface Row {
  label: string
  value: number
  kind: 'percent' | 'integer'
}

interface Block {
  heading: string
  intro: string
  items: Row[]
}

const HEADING_RE = /^#{1,4}\s+(.+)$/
const DISTRIBUTION_HEADING_RE = /\b(Distribution|Coverage|Context|Focus|Scope)\b/i
// Percent row: "Label → 30%" with optional trailing parenthetical.
const PCT_ROW_RE = /^\s*[-*•]?\s*(.+?)\s*[→\-–:]\s*(\d{1,3})\s*%\s*(?:\(.*\))?\s*$/
// Integer coverage row: "Label → 5 Questions" | "→ 5 Qs" | "Total → 8 Questions"
const INT_ROW_RE = /^\s*[-*•]?\s*(.+?)\s*[→\-–:]\s*(\d{1,3})\s*Q(?:uestions?|s\.?)\s*$/i
// Nested-breakdown intros: rows under these are sub-splits of a parent
// allocation and are NOT required to sum to 100% / the question total.
const NESTED_INTRO_RE = /within these|among these|of these|within each|more specifically|breakdown/i

function parseBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/)
  const blocks: Block[] = []
  let current: Block | null = null
  let pendingIntro = ''

  const startBlock = (heading: string, intro: string): void => {
    current = { heading, intro, items: [] }
    blocks.push(current)
  }

  for (const raw of lines) {
    const headingMatch = HEADING_RE.exec(raw)
    if (headingMatch && DISTRIBUTION_HEADING_RE.test(headingMatch[1])) {
      startBlock(headingMatch[1].trim(), '')
      pendingIntro = ''
      continue
    }

    const pct = PCT_ROW_RE.exec(raw)
    const intRow = INT_ROW_RE.exec(raw)

    if (current) {
      if (pct || intRow) {
        const m = (pct ?? intRow)!
        if (current.items.length === 0 && pendingIntro) current.intro = pendingIntro
        current.items.push({
          label: m[1].trim(),
          value: Number(m[2]),
          kind: pct ? 'percent' : 'integer',
        })
        pendingIntro = ''
      } else if (raw.trim() !== '') {
        // Non-row, non-blank text line closes the current sub-block and becomes
        // the intro of the next one, e.g. "Within these include:".
        if (current.items.length > 0) {
          startBlock(current.heading, raw.trim())
        }
        pendingIntro = raw.trim()
      }
    }
  }
  return blocks.filter(b => b.items.length > 0)
}

function extractQuestionCount(text: string): number | null {
  const explicit = /Generate\s+exactly\s+\*{0,2}(\d{1,3})\*{0,2}\s*(?:MCQs?|Questions?)/i.exec(text)
  if (explicit) return Number(explicit[1])
  const total = /^Total\s*[→\-–:]\s*[*\s]*(\d{1,3})[*\s]*Q(?:uestions?)/im.exec(text)
  if (total) return Number(total[1])
  return null
}

interface Violation {
  id: string
  body: string
  bodyLine?: number
  detail: string
}

async function main(): Promise<void> {
  const lines = readFileSync(SEED, 'utf8').split('\n').filter(Boolean)
  const rows = lines.map(line => JSON.parse(line) as { id: string; prompt_text: string })

  const bodyOffset = (text: string, index: number): number =>
    text.slice(0, index).split(/\r?\n/).length

  const violations: Violation[] = []
  let examined = 0
  let totalBlocks = 0
  let bodiesWithBlocks = 0

  for (const row of rows) {
    // The exact stored body the migration holds.
    const stored = ensureSingleContractMarker(sanitizeLegacyApplicationFormat(row.prompt_text)).trimEnd() + '\n'
    const blocks = parseBlocks(stored)
    examined++
    if (blocks.length > 0) {
      bodiesWithBlocks++
      totalBlocks += blocks.length
    }

    const qCount = extractQuestionCount(stored)

    for (const block of blocks) {
      const percentRows = block.items.filter(i => i.kind === 'percent')
      const intRows = block.items.filter(i => i.kind === 'integer')
      const nested = NESTED_INTRO_RE.test(block.intro)

      // Integer coverage matrix: sum of allocations must equal the total (either
      // the question count, or an explicit "Total → N Questions" row). Percent
      // rows inside an integer matrix are ignored for the integer sum.
      if (intRows.length > 0 && !nested) {
        const totalRow = intRows.find(i => /^\s*Total\b/i.test(i.label))
        const allocRows = intRows.filter(i => i !== totalRow)
        const allocSum = allocRows.reduce((a, b) => a + b.value, 0)
        const expected = totalRow?.value ?? qCount
        if (expected !== null && allocSum !== expected) {
          violations.push({
            id: row.id,
            body: block.heading,
            detail: `integer allocation sums to ${allocSum}; total${totalRow ? ' row' : ''} is ${expected}`,
          })
        }
      }

      // Percent block: each independent "→ N%" group must sum to 100%.
      if (percentRows.length > 0 && !nested) {
        const sum = percentRows.reduce((a, b) => a + b.value, 0)
        if (sum !== 100) {
          violations.push({
            id: row.id,
            body: block.heading,
            detail: `percentage group sums to ${sum}% (expected 100%)`,
          })
        }
      }

      for (const item of block.items) {
        if (!Number.isInteger(item.value) || item.value <= 0) {
          violations.push({
            id: row.id,
            body: block.heading,
            detail: `invalid allocation value ${item.value} for "${item.label}"`,
          })
        }
      }
    }
  }

  console.log(`integer-distribution audit over ${examined} normalized stored bodies`)
  console.log(`coverage: ${bodiesWithBlocks}/${examined} bodies carry >=1 distribution block; ${totalBlocks} blocks parsed`)
  if (violations.length === 0) {
    console.log('RESULT: PASS — 0 violations')
    return
  }
  console.log(`RESULT: ${violations.length} violation(s)`)
  for (const v of violations) {
    console.log(`  [${v.id}] ${v.body}: ${v.detail}`)
  }
  process.exitCode = 1
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})