import type { DiagramData } from '../../../types/exam.types';

export type { DiagramData };

export interface QuestionData {
  question_text_en?: string
  question_text_te?: string
  option_a_en?: string
  option_a_te?: string
  option_b_en?: string
  option_b_te?: string
  option_c_en?: string
  option_c_te?: string
  option_d_en?: string
  option_d_te?: string
  explanation_en?: string
  explanation_te?: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  display_order: number
  diagram?: DiagramData
}

export interface ExamConfig {
  title: string
  start_time: string
  end_time: string
  duration_minutes: number
  marks_per_question: number
  negative_mark_value: number
}

export const STEPS = [
  { n: 1, label: 'Prompt' },
  { n: 2, label: 'Paste JSON' },
  { n: 3, label: 'Review' },
  { n: 4, label: 'Setup' },
  { n: 5, label: 'Publish' }
]

export function getLocalISOTime(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function getPromptText(count: number): string {
  return `You are a strict JSON generator for a production exam system. Your task is to generate high-quality bilingual (English + Telugu) multiple-choice questions for competitive exams like APPSC and UPSC. Generate EXACTLY ${count} questions.
      
Each question must follow this JSON schema:
{
"question_text_en": "string",
"question_text_te": "string",
"option_a_en": "string",
"option_a_te": "string",
"option_b_en": "string",
"option_b_te": "string",
"option_c_en": "string",
"option_c_te": "string",
"option_d_en": "string",
"option_d_te": "string",
"correct_option": "A",
"explanation_en": "string",
"explanation_te": "string"
}

Return ONLY the JSON array. Do not include markdown blocks or any other text.`
}

export function safeParse(str: string): any[] {
  const trimmed = str.trim()
  try {
    return JSON.parse(trimmed)
  } catch (e) {
    const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/
    const match = trimmed.match(jsonRegex)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (e2) {
        const cleaned = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim()
        try {
          return JSON.parse(cleaned)
        } catch (e3) {
          throw new Error('JSON structure is corrupted. Please ensure the AI output follows the requested format exactly.')
        }
      }
    }
    throw new Error('No valid JSON array found. Make sure you copied the entire code block from the AI.')
  }
}

export function getTypo(breakpoint: string, element: string): string {
  const scales: Record<string, any> = {
    title:     { xs: 18, sm: 20, md: 22, lg: 24, xl: 26 },
    stepLabel: { xs: 10, sm: 11, md: 12, lg: 12, xl: 13 },
    body:      { xs: 12, sm: 13, md: 14, lg: 15, xl: 15 },
    json:      { xs: 11, sm: 13, md: 14, lg: 14, xl: 14 },
    cardQ:     { xs: 12, sm: 14, md: 15, lg: 16, xl: 16 },
    cardOpt:   { xs: 11, sm: 13, md: 14, lg: 15, xl: 15 },
    cardExpl:  { xs: 10, sm: 12, md: 13, lg: 14, xl: 14 }
  }
  return `${scales[element][breakpoint] || scales[element].xs}px`
}

export function getDimension(breakpoint: string, element: string): number {
  const scales: Record<string, any> = {
    buttonH:     { xs: 36, sm: 38, md: 40, lg: 42, xl: 42 },
    jsonH:       { xs: 200, sm: 250, md: 280, lg: 300, xl: 300 },
    cardPadding: { xs: 10, sm: 12, md: 14, lg: 16, xl: 16 }
  }
  return scales[element][breakpoint] || scales[element].xs
}
