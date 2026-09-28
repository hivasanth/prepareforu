import { memo } from 'react'
import type { Question } from '../../../types/exam.types'
import { Card, CollectionCard, Pagination, NumberBadge, SelectionCheckbox } from '../../common/AntigravityUI'
import { FloatingList, FloatingListHeader } from '../../common/AntigravityUI'
import { DifficultyBadge } from '../common/DifficultyBadge'
import { LoadingSkeleton } from '../../common/SharedComponents'
import { Skeleton } from '../../common/Skeleton'
import { ActionsCell } from './QuestionsTableComponents'
import { QUESTION_TABLE_GRID } from './questionsTableGrid'

const HEADER_CELL = 'text-[10px] font-bold uppercase tracking-widest'

interface QuestionsTableProps {
  questions: Question[]
  isLoading: boolean
  page: number
  setPage: (page: number) => void
  hasMore: boolean
  totalCount: number
  pageSize: number
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onEdit: (q: Question) => void
  onView: (q: Question) => void
  onDelete: (q: Question) => void
}

export const QuestionsTable = memo(function QuestionsTable({
  questions,
  isLoading,
  page,
  setPage,
  hasMore,
  totalCount,
  pageSize,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onView,
  onDelete
}: QuestionsTableProps) {
  const allOnPageSelected = questions.length > 0 && questions.every(q => selectedIds.includes(q.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      onSelectAll(selectedIds.filter(id => !questions.find(q => q.id === id)));
    } else {
      const pageIds = questions.map(q => q.id);
      onSelectAll([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  if (isLoading && questions.length === 0) {
    return <QuestionsTableSkeleton />
  }

  if (!isLoading && questions.length === 0) {
    return null;
  }

  // F-11: when the backend omits meta.count, totalCount is 0 — never render
  // "Showing 1–30 of 0" while rows are visibly present.
  const displayTotal = Math.max(totalCount, page * pageSize + questions.length)
  const rangeStart = questions.length > 0 ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min((page + 1) * pageSize, displayTotal);

  return (
    <div className="flex flex-col gap-3 animate-in" aria-busy={isLoading}>
      {/* ═══ Result count — above the data grid (select-all lives in the
          header's SELECT track below) ═════════════════════════════════════ */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-wider">
          Showing {rangeStart}–{rangeEnd} of {displayTotal}
        </span>
      </div>

      {/* ═══ Outer elevated container ═════════════════════════════════════ */}
      <Card variant="elevated">
        <FloatingList gap="sm">
          {/* ═══ Header — padding="md" shares the rows' 16px inset ════════ */}
          <FloatingListHeader padding="md">
            <div data-testid="questions-header-grid" className={`${QUESTION_TABLE_GRID} text-text-muted light:text-[var(--gold-300)]`}>
              {/* SELECT — select-all occupies the SAME first grid track as
                  every row checkbox (one QUESTION_TABLE_GRID contract). */}
              <SelectionCheckbox checked={allOnPageSelected} onChange={toggleSelectAll} label="Select all on this page" />
              <span className={`${HEADER_CELL} text-center`}>#</span>
              <span className={`${HEADER_CELL} text-left`}>Question</span>
              <span className={`${HEADER_CELL} hidden md:block text-center`}>Difficulty</span>
              <span className={`${HEADER_CELL} text-center`}>Actions</span>
            </div>
          </FloatingListHeader>

          {/* ═══ Rows ═════════════════════════════════════════════════════ */}
          {questions.map((q, idx) => {
            const isSelected = selectedIds.includes(q.id);
            const sr = page * pageSize + idx + 1;
            const questionText = q.question_text_en?.trim() || '';
            return (
              <CollectionCard
                key={q.id}
                layout="row"
                variant="premium"
                padding={16}
                selected={isSelected}
                titleAs="h3"
                innerClassName={QUESTION_TABLE_GRID}
                leading={
                  <SelectionCheckbox checked={isSelected} onChange={() => onSelect(q.id)} label="Select this question" />
                }
                /* NUMBER — dedicated grid column (not nested in the title). */
                content={<NumberBadge value={sr} variant="question" />}
                title={
                  <span className="line-clamp-2 text-[13px] md:text-[14px] font-bold leading-tight tracking-tight text-text-primary" title={questionText}>
                    {questionText || 'Untitled Question'}
                  </span>
                }
                trailing={
                  <div className="hidden md:flex items-center justify-center min-w-0">
                    <DifficultyBadge difficulty={q.difficulty || 'medium'} />
                  </div>
                }
                actions={
                  <ActionsCell q={q} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                }
              />
            );
          })}

          <Pagination
            page={page}
            onPageChange={setPage}
            hasMore={hasMore}
            totalCount={totalCount}
            pageSize={pageSize}
            label="questions"
            showRange={false}
          />
        </FloatingList>
      </Card>
    </div>
  )
})

/* ═══ Loading state — structural parity with the loaded table ═══════════════
 * Composed ONLY from canonical primitives (Skeleton / LoadingSkeleton / Card)
 * mirroring the final page structure: metadata row → elevated Card → header
 * bar → five question rows (same QUESTION_TABLE_GRID tracks) → pagination.
 * One container-level role="status"; inner skeletons are decorative. */
function QuestionsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading questions" className="flex flex-col gap-3 animate-in">
      {/* Result count */}
      <div className="flex items-center gap-3 px-1">
        <LoadingSkeleton height={12} width={140} borderRadius={6} decorative />
      </div>

      <Card variant="elevated">
        <div className="flex flex-col gap-2">
          {/* Header bar */}
          <Skeleton type="card" unit="row" decorative pad="p-3 md:p-4" borderRadius={16}>
            <div className={QUESTION_TABLE_GRID}>
              <LoadingSkeleton width={20} height={20} borderRadius={6} decorative />
              <LoadingSkeleton width={12} height={10} borderRadius={6} decorative />
              <LoadingSkeleton height={10} width={72} borderRadius={6} decorative />
              <div className="hidden md:flex items-center justify-center min-w-0">
                <LoadingSkeleton height={10} width={64} borderRadius={6} decorative />
              </div>
              <div className="flex items-center justify-center min-w-0">
                <LoadingSkeleton height={10} width={48} borderRadius={6} decorative />
              </div>
            </div>
          </Skeleton>

          {/* Question rows — same grid contract as loaded rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} type="card" unit="row" decorative borderRadius={16} height={64}>
              <div className={QUESTION_TABLE_GRID}>
                <LoadingSkeleton width={20} height={20} borderRadius={6} decorative />
                <LoadingSkeleton width={28} height={28} borderRadius={8} decorative />
                <div className="min-w-0 flex flex-col gap-1.5">
                  <LoadingSkeleton height={12} width="85%" borderRadius={6} decorative />
                  <LoadingSkeleton height={12} width="55%" borderRadius={6} decorative />
                </div>
                <div className="hidden md:flex items-center justify-center min-w-0">
                  <LoadingSkeleton width={56} height={20} borderRadius={999} decorative />
                </div>
                <div className="flex items-center justify-center gap-2 min-w-0">
                  <LoadingSkeleton width={32} height={32} borderRadius={8} decorative />
                  <LoadingSkeleton width={32} height={32} borderRadius={8} decorative />
                  <LoadingSkeleton width={32} height={32} borderRadius={8} decorative />
                </div>
              </div>
            </Skeleton>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 px-2 pt-1">
            <LoadingSkeleton height={12} width={160} borderRadius={6} decorative />
            <div className="flex items-center gap-2">
              <LoadingSkeleton width={32} height={32} borderRadius={8} decorative />
              <LoadingSkeleton width={32} height={32} borderRadius={8} decorative />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
