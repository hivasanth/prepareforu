import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { BulkQuestionSchema } from './validations/questionSchema'

const BACKFILL = 'C:/Users/Vasanth/AppData/Local/Temp/opencode/backfill'

const files = {
  constitution: ['g1_gs_constitution.json', [
    'Indian Constitution - Evolution & Core Features',
    'Federal Structure - Union, States & Legislature',
    'Constitutional Bodies & Governance',
    'Governance Reforms, LPG & Institutions',
    'Rights Issues & Social Justice',
    "India's Foreign Policy & Government Programmes",
  ]],
  economy: ['g1_gs_economy.json', [
    'Basic Characteristics of Indian Economy',
    'National Income',
    'Indian Agriculture',
    'Financial Institutions',
    'Andhra Pradesh Economy after Bifurcation',
    'A.P. Reorganisation Act, 2014',
  ]],
  geography: ['g1_gs_geography.json', [
    'General Geography',
    'Physical Geography',
    'Social Geography',
    'Economic Geography',
  ]],
} as Record<string, [string, string[]]>

describe('g1 gs backfill content validation', () => {
  for (const [name, [fileName, topics]] of Object.entries(files)) {
    it(`${name}: 30 items, all pass BulkQuestionSchema, topic_en in exam_topics whitelist`, () => {
      const data = JSON.parse(fs.readFileSync(`${BACKFILL}/${fileName}`, 'utf8'))
      expect(data.length).toBe(30)
      const errors: string[] = []
      data.forEach((item: any, i: number) => {
        const r = BulkQuestionSchema.safeParse(item)
        if (!r.success) {
          errors.push(`row ${i + 1}: ${r.error.issues.map(x => `${x.path.join('.')} ${x.message}`).join('; ')}`)
          return
        }
        if (!r.data.topic_en || !topics.includes(r.data.topic_en)) {
          errors.push(`row ${i + 1}: topic_en '${r.data.topic_en}' not in whitelist`)
        }
        if (r.data.explanation_en && r.data.explanation_en.length < 10) {
          errors.push(`row ${i + 1}: explanation too short`)
        }
      })
      expect(errors).toEqual([])
    })
  }
})
