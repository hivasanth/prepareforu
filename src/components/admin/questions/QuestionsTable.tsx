import { memo } from 'react'
import type { Question } from '../../../types/exam.types'
import { CollectionCard, CollectionHeader, Pagination, PremiumIconContainer, SelectionCheckbox } from '../../common/AntigravityUI'
import { DifficultyBadge } from '../common/DifficultyBadge'
import { GridSkeleton } from '../../common/SharedComponents'
import { ActionsCell } from './QuestionsTableComponents'

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
    return <GridSkeleton count={5} height={56} columns="grid-cols-1" />
  }

  if (!isLoading && questions.length === 0) {
    return null;
  }

  const rangeStart = page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-6 animate-in">
      {/* Select-all + range (shared Foundation CollectionHeader) */}
      <CollectionHeader
        checked={allOnPageSelected}
        onToggleSelectAll={toggleSelectAll}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={totalCount}
      />

      {/* Premium Question Library — one compact management CollectionCard per question */}
      <div className="flex flex-col gap-3">
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
              leading={
                <div className="flex items-center gap-2">
                  <SelectionCheckbox checked={isSelected} onChange={() => onSelect(q.id)} label="Select this question" />
                  <PremiumIconContainer
                    iconSize={12}
                    className="w-7 h-7 rounded-lg font-black text-[11px]"
                    darkClassName="bg-hover-bg text-text-secondary"
                  >
                    {sr}
                  </PremiumIconContainer>
                </div>
              }
              title={
                <span className="line-clamp-2" title={questionText}>
                  {questionText || 'Untitled Question'}
                </span>
              }
              trailing={<DifficultyBadge difficulty={q.difficulty || 'medium'} />}
              actions={
                <ActionsCell q={q} onView={onView} onEdit={onEdit} onDelete={onDelete} />
              }
            />
          );
        })}
      </div>

      <Pagination
        page={page}
        onPageChange={setPage}
        hasMore={hasMore}
        totalCount={totalCount}
        pageSize={pageSize}
        label="questions"
      />
    </div>
  )
})
