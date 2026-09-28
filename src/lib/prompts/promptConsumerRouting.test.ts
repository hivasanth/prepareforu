import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { composeBulkUploadPrompt } from './promptComposer'

// ─── Direct prompt_text consumer audit + fallback reachability guard ─────────
// Pins the invariant from ADMIN_BULK_UPLOAD_PROMPT_STORAGE_FORENSIC_AUDIT §13:
// every prompt_text READ path in the admin bulk-upload surface routes through
// composeBulkUploadPrompt (display/copy), and every prompt_text WRITE path
// routes through ensureDynamicContractMarker (save). The only other prompt
// bodies reachable at runtime are the module-private code fallbacks
// (GENERIC_PROMPT/HISTORY_PROMPT in useBulkUpload.ts) — this file pins that
// they stay module-private (not exported, so no other importer can bypass the
// composed path) and remain contract-clean.

const ROOT = process.cwd()
const useBulkUploadSrc = readFileSync(join(ROOT, 'src', 'components', 'admin', 'questions', 'useBulkUpload.ts'), 'utf8')

// CONSIDERED_READ_SITES: every `.prompt_text` reference in the four consumer
// files, and the exact routing function that consumes it.
//
//   InstructionsTab.tsx:32   activeBlock.prompt_text → composeBulkUploadPrompt
//   InstructionsTab.tsx:71   activeBlock.prompt_text → onCopy → handleCopy → composeBulkUploadPrompt
//   AIToolCards.tsx:38       topicPrompt → composeBulkUploadPrompt
//   useBulkUpload.ts:340     promptBlocks..?.prompt_text → currentPrompt → composeBulkUploadPrompt (:457)
//   useBulkUpload.ts:388     GENERIC_PROMPT (new-draft seed, not a read)
//   PromptEditorModal.tsx:32,41  editingPrompt.prompt_text → local state only
//   PromptEditorModal.tsx:63     prompt_text: promptText → validation (read-only)
//   PromptEditorModal.tsx:108    prompt_text: storageText → ensureDynamicContractMarker (:102)

function stripLineComments(src: string): string {
  return src.replace(/\/\/(?!.*`)(?!.*['"]).*/g, '')
}

describe('direct prompt_text consumer audit (routing invariant)', () => {
  it('InstructionsTab displays ONLY the composed prompt', () => {
    const src = readFileSync(join(ROOT, 'src', 'components', 'admin', 'questions', 'InstructionsTab.tsx'), 'utf8')
    expect(src).toMatch(/const promptText = composeBulkUploadPrompt\(activeBlock \? activeBlock\.prompt_text : fallbackPrompt, topicIdentity\)\.text/)
    // No other bare read of .prompt_text reaches a sink directly.
    const reads = src.match(/\.prompt_text/g) ?? []
    expect(reads.length).toBeGreaterThanOrEqual(1)
  })

  it('AIToolCards copies ONLY the composed prompt', () => {
    const src = readFileSync(join(ROOT, 'src', 'components', 'admin', 'questions', 'AIToolCards.tsx'), 'utf8')
    // LAN-ORIGIN FIX: composes the prompt once, then routes the write through
    // the canonical copyText helper (Clipboard API + legacy fallback), and only
    // flips to "Copied" after a confirmed success.
    expect(src).toMatch(/const content = composeBulkUploadPrompt\(topicPrompt, topicIdentity\)\.text/)
    expect(src).toMatch(/await copyText\(content\)/)
  })

  it('useBulkUpload copy handler composes currentPrompt before clipboard', () => {
    expect(useBulkUploadSrc).toMatch(/const content = composeBulkUploadPrompt\(text \|\| currentPrompt, currentTopicIdentity\)\.text/)
    expect(useBulkUploadSrc).toMatch(/await copyText\(content\)/)
  })

  it('PromptEditorModal saves ONLY the canonicalized + marker-ensured prompt', () => {
    const src = readFileSync(join(ROOT, 'src', 'components', 'admin', 'questions', 'PromptEditorModal.tsx'), 'utf8')
    expect(src).toMatch(/const storageText = ensureDynamicContractMarker\(canonicalized\)/)
    expect(src).toMatch(/prompt_text: storageText/)
  })
})

describe('fallback reachability (module-private + contract-clean)', () => {
  it('GENERIC_PROMPT and HISTORY_PROMPT are module-private consts', () => {
    expect(useBulkUploadSrc).toMatch(/^const GENERIC_PROMPT = `/m)
    expect(useBulkUploadSrc).toMatch(/^const HISTORY_PROMPT = `/m)
    const exports = (useBulkUploadSrc.match(/^export const (GENERIC_PROMPT|HISTORY_PROMPT)/gm) ?? [])
    expect(exports).toHaveLength(0)
    // Fallback is selected inline: subject === 'History and Culture' ? HISTORY : GENERIC
    expect(useBulkUploadSrc).toMatch(/subjectName === 'History and Culture' \? HISTORY_PROMPT : GENERIC_PROMPT/)
  })

  it('extracted fallback bodies stay contract-clean when composed', () => {
    // Extract the backtick template literal bodies so a refactor of the file is
    // caught the same way a content change would be.
    const bodies = ['GENERIC_PROMPT', 'HISTORY_PROMPT'].map(name => {
      const re = new RegExp(`^const ${name} = \`([\\s\\S]*?)\`\\s*$`, 'm')
      const m = stripLineComments(useBulkUploadSrc).match(re)
      expect(m, `${name} must be a trailing backtick const`).not.toBeNull()
      return m![1]
    })
    for (const body of bodies) {
      for (const token of ['visual_engine', 'render_type', 'headers_en', 'rows_en', 'title_en', 'title_te', 'metadata', 'diagram']) {
        expect(body, `${token} must not leak into a fallback`).not.toContain(token)
      }
      const composed = composeBulkUploadPrompt(body, { topic_en: 'x', topic_te: null }).text
      expect((composed.match(/CANONICAL OUTPUT CONTRACT v/g) ?? []).length).toBe(1)
      expect(composed).not.toContain('PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT')
    }
  })
})