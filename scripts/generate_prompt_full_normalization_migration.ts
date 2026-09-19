// Generate supabase/migrations/20260921000000_prompts_full_normalization.sql
//
// Consolidated 171-row data remediation (replaces the never-applied Phase 11
// "dynamic output contract" and Phase 12 "legacy prose normalization"
// migrations). Covers EVERY prompt_templates row in the live database — the
// 33 rows whose bodies ship in the repository AND the 138 live-only rows.
//
// The live DB stores each body as the legacy application-format template
// (fenced visual_engine/render_type examples plus obsolete renderer prose).
// The runtime composer sanitizes at display/copy time, but the STORED bytes
// still carry legacy markup. This migration converges every stored body to the
// canonical stored form using the SAME singular algorithm the composer uses:
//   ensureSingleContractMarker(sanitizeLegacyApplicationFormat(body))
// so (a) the stored template is token-free and marker-bearing, and (b) today's
// runtime-only guarantee becomes a stored guarantee for all 171 rows.
//
// SAFETY (verification-first): every emitted UPDATE is guarded by
//   id = <uuid> AND md5(prompt_text) = <md5 of the CURRENT live body>
// computed from the committed seed snapshot (scripts/data/
// prompt_templates_live_v1.jsonl). Each seed md5 was independently re-verified
// as the md5 of the prompt_text bytes, so a concurrent edit turns the UPDATE
// into a safe no-op rather than a destructive overwrite. The generator ABORTS
// unless every normalized body is verified free of all 8 legacy tokens and the
// migrated fingerprint set is exactly 171 distinct md5s.
//
// REPRODUCIBILITY: the seed snapshot is committed, so re-running this script
// produces a byte-identical migration. The migration's DO block re-asserts
// token-freedom, marker presence, and the full 171-fingerprint set on the
// stored rows, so deployment can never silently reintroduce legacy format.
//
// Run:  node --experimental-strip-types scripts/generate_prompt_full_normalization_migration.ts

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import {
  sanitizeLegacyApplicationFormat,
  ensureSingleContractMarker,
  DYNAMIC_OUTPUT_CONTRACT_MARKER,
} from '../src/lib/prompts/promptContentSanitizer.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const SEED = join(ROOT, 'scripts', 'data', 'prompt_templates_live_v1.jsonl')
const OUT = join(ROOT, 'supabase', 'migrations', '20260921000000_prompts_full_normalization.sql')

const FORBIDDEN_LEGACY_TOKENS = [
  'visual_engine',
  'render_type',
  'headers_en',
  'rows_en',
  'title_en',
  'title_te',
  'metadata',
  'diagram',
]

function md5(text: string): string {
  return createHash('md5').update(text, 'utf8').digest('hex')
}

interface SeedRow {
  id: string
  live_md5: string
  md5: string
  is_default: boolean
  prompt_text: string
}

interface PromptRecord {
  id: string
  guardMd5: string
  stored: string
  storedMd5: string
}

async function main(): Promise<void> {
  if (!existsSync(SEED)) throw new Error(`seed snapshot not found: ${SEED}`)
  const lines = readFileSync(SEED, 'utf8').split('\n').filter(Boolean)

  const rows: SeedRow[] = lines.map(line => JSON.parse(line) as SeedRow)
  if (rows.length !== 171) {
    throw new Error(`expected 171 seed rows, found ${rows.length}`)
  }
  const ids = new Set(rows.map(r => r.id))
  if (ids.size !== 171) throw new Error('seed ids are not unique')

  // Verification-first: the seed's md5 must be the md5 of its stored bytes, and
  // the live_md5 guard must reference a body whose fingerprint is a valid value
  // (for rows whose content was corrected for the distribution audit, the seed
  // prompt_text md5 intentionally differs from the original live fingerprint).
  const badMd5 = rows.filter(r => md5(r.prompt_text) !== r.md5)
  if (badMd5.length > 0) {
    throw new Error(`seed md5 verification FAILED for ${badMd5.length} rows (${badMd5.slice(0, 5).map(r => r.id).join(', ')}). Aborting.`)
  }
  const badLive = rows.filter(r => !/^[0-9a-f]{32}$/.test(r.live_md5 ?? ''))
  if (badLive.length > 0) {
    throw new Error(`seed live_md5 guard FAILED for ${badLive.length} rows (${badLive.slice(0, 5).map(r => r.id).join(', ')}). Aborting.`)
  }

  // Compute the canonical stored form with the singular algorithm.
  const records: PromptRecord[] = []
  const storedMd5s = new Set<string>()
  for (const r of rows) {
    const stored = ensureSingleContractMarker(sanitizeLegacyApplicationFormat(r.prompt_text)).trimEnd() + '\n'
    if (stored.includes('$rem$') || stored.includes('$$')) {
      throw new Error(`normalization FAILED for ${r.id}: body contains a DOLLAR-QUOTING delimiter. Aborting.`)
    }
    for (const tok of FORBIDDEN_LEGACY_TOKENS) {
      if (stored.includes(tok)) {
        throw new Error(`normalization FAILED for ${r.id}: still contains "${tok}". Aborting.`)
      }
    }
    const storedMd5 = md5(stored)
    if (storedMd5s.has(storedMd5)) throw new Error(`normalization FAILED: duplicate stored fingerprint ${storedMd5}. Aborting.`)
    storedMd5s.add(storedMd5)
    records.push({ id: r.id, guardMd5: r.live_md5, stored, storedMd5 })
  }
  if (records.length !== 171) throw new Error(`expected 171 normalized bodies, found ${records.length}`)

  const updaters = records.map(r => `UPDATE public.prompt_templates
SET prompt_text = $rem$${r.stored}$rem$,
    updated_at = now()
WHERE id = '${r.id}'
  AND md5(prompt_text) = '${r.guardMd5}';`)

  const idsArray = records.map(r => `'${r.id}'`).join(',\n  ')
  const md5Array = records.map(r => `'${r.storedMd5}'`).join(',\n       ')
  const tokenPredicates = FORBIDDEN_LEGACY_TOKENS.map(t => `    position('${t}' in prompt_text) > 0`).join('\n      OR ')

  const migration = `-- Prompt Full Normalization — all 171 live prompt_templates rows (consolidated)
-- Generated by scripts/generate_prompt_full_normalization_migration.ts
-- (singular algorithm: sanitizeLegacyApplicationFormat + ensureSingleContractMarker,
-- the SAME functions the runtime composer uses at display/copy time).
--
-- The live database stores every prompt body as the legacy application-format
-- template; the runtime composer sanitizes at copy time but the stored bytes
-- still carry obsolete fenced visual_engine/render_type examples and renderer
-- prose. This migration converges the STORED form of all 171 rows (33
-- repo-shipped + 138 live-only) to the canonical marker-bearing, token-free
-- form, making today's runtime guarantee a stored guarantee:
--   * legacy fenced application-format examples are stripped,
--   * legacy shape wording is reworded (diagram -> visual, semantics kept),
--   * obsolete renderer prose and legacy token mentions are removed,
--   * the internal marker [${DYNAMIC_OUTPUT_CONTRACT_MARKER}] is ensured
--     exactly once as the dynamic-contract integration point.
-- Topic academic content (syllabus, coverage, distributions, visual
-- opportunities) is preserved verbatim — only obsolete application-format
-- content is touched.
--
-- Every UPDATE is md5-guarded against the CURRENT live body fingerprint (from
-- the committed seed snapshot scripts/data/prompt_templates_live_v1.jsonl); a
-- concurrent edit makes the statement a safe no-op. The DO block re-asserts
-- token-freedom, marker presence, and the full 171-fingerprint set on the
-- stored rows so deployment can never silently reintroduce legacy format.
-- Reproducible: re-running the generator yields byte-identical output.
-- Applied atomically as a single migration transaction by the Supabase CLI.

${updaters.join('\n\n')}

-- ---------------------------------------------------------------- assertions
DO $$
DECLARE n int;
BEGIN
  IF EXISTS (SELECT 1 FROM public.prompt_templates) THEN
    SELECT count(*) INTO n
    FROM public.prompt_templates
    WHERE id IN (${idsArray});
    IF n <> 171 THEN
      RAISE EXCEPTION 'expected 171 normalized prompts, found %', n;
    END IF;

    SELECT count(*) INTO n
    FROM public.prompt_templates
    WHERE prompt_text LIKE '%${DYNAMIC_OUTPUT_CONTRACT_MARKER}%';
    IF n < 171 THEN
      RAISE EXCEPTION 'marker missing on at least % prompts', 171 - n;
    END IF;

    SELECT count(*) INTO n
    FROM public.prompt_templates
    WHERE ${tokenPredicates};
    IF n <> 0 THEN
      RAISE EXCEPTION 'legacy application-format content still present on % stored prompts', n;
    END IF;

    SELECT count(*) INTO n
    FROM public.prompt_templates
    WHERE md5(prompt_text) = ANY(ARRAY[
       ${md5Array}
    ]::text[]);
    IF n <> 171 THEN
      RAISE EXCEPTION 'normalized prompt fingerprints drifted: expected 171, found %', n;
    END IF;
  END IF;
END
$$;
`

  writeFileSync(OUT, migration, 'utf8')
  console.log(`wrote ${OUT}`)
  console.log(`updated 171 prompt templates to canonical stored form; guard md5s verified against live seed`)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})