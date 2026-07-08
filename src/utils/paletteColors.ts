import type { QuestionState } from './examStateCalculator';

export function getPaletteColor(state: QuestionState): string {
  if (state.isCurrent) return 'bg-[#22C55E] text-white border-[#22C55E] ring-2 ring-[#22C55E]/30 shadow-md shadow-[#22C55E]/30 scale-105 z-10';
  if (state.isAnswered && state.isMarked) return 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/30';
  if (state.isAnswered) return 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-sm shadow-[#F59E0B]/30';
  if (state.isMarked) return 'bg-[#8B5CF6]/60 text-white border-[#8B5CF6]/40 shadow-sm';
  if (state.isSkipped) return 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm';
  return 'bg-transparent text-[#94A3B8] border-[#64748B]';
}

export function getPaletteColorMobile(state: QuestionState): string {
  if (state.isCurrent) return 'bg-[#22C55E] text-white border-[#22C55E]';
  if (state.isAnswered && state.isMarked) return 'bg-[#8B5CF6] text-white border-[#8B5CF6]';
  if (state.isAnswered) return 'bg-[#F59E0B] text-white border-[#F59E0B]';
  if (state.isMarked) return 'bg-[#8B5CF6]/60 text-white border-[#8B5CF6]/40';
  if (state.isSkipped) return 'bg-[#3B82F6] text-white border-[#3B82F6]';
  return 'bg-transparent text-[#94A3B8] border-[#64748B]';
}
