import { Eye, PenSquare, Trash2 } from 'lucide-react'
import type { Question } from '../../../types/exam.types'
import { DataGrid, IconButton } from '../../common/AntigravityUI'
import { DifficultyBadge } from '../common/DifficultyBadge'
import { GridSkeleton } from '../../common/SharedComponents'
import { AdminPagination } from './AdminPagination'
import { useTheme } from '../../../context/ThemeContext'
import { SelectionCheckbox, SrNumber, QuestionCell, SubjectBadge, ActionsCell } from './QuestionsTableComponents'

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

export function QuestionsTable({
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
  const { isDark } = useTheme();
  
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
    return <GridSkeleton count={5} height={80} columns="grid-cols-1" />
  }

  if (!isLoading && questions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* DESKTOP TABLE VIEW (lg+) */}
      <div className={`hidden lg:block border rounded-3xl overflow-hidden shadow-2xl relative ${!isDark ? 'ancient-card border-primary/20' : 'bg-card-bg border-border-subtle'}`}>
        <DataGrid
          rowKey="id"
          rows={questions}
          columns={[
            {
              key: 'selection',
              label: <SelectionCheckbox checked={allOnPageSelected} onChange={toggleSelectAll} label="Select all on this page" />,
              headerClassName: 'px-6 py-4 w-12',
              render: (_: any, q: Question) => (
                <SelectionCheckbox checked={selectedIds.includes(q.id)} onChange={() => onSelect(q.id)} label="Select this question" />
              )
            },
            {
              key: 'sr',
              label: 'SR.',
              headerClassName: 'px-4 py-4 w-12 text-center',
              cellClassName: 'px-4 py-4 text-center',
              render: (_, q) => {
                const idx = questions.findIndex(item => item.id === q.id);
                return <SrNumber num={page * pageSize + idx + 1} isDark={isDark} />;
              }
            },
            {
              key: 'question_text_en',
              label: 'Question',
              headerClassName: 'px-6 py-4 w-[40%]',
              cellClassName: 'px-6 py-4',
              render: (_: any, q: Question) => (
                <QuestionCell text={q.question_text_en?.trim() || ''} isDark={isDark} />
              )
            },
            {
              key: 'subject_name',
              label: 'Subject',
              headerClassName: 'px-6 py-4',
              cellClassName: 'px-6 py-4',
              render: (val) => <SubjectBadge subject={val || ''} isDark={isDark} />
            },
            {
              key: 'difficulty',
              label: 'Difficulty',
              headerClassName: 'px-6 py-4',
              cellClassName: 'px-6 py-4',
              render: (val) => <DifficultyBadge difficulty={val || 'medium'} />
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'center',
              headerClassName: 'px-6 py-4 text-center w-40',
              cellClassName: 'px-6 py-4 w-40',
              render: (_, q) => <ActionsCell q={q} isDark={isDark} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            }
          ]}
          renderRow={(q, idx) => {
            const isSelected = selectedIds.includes(q.id);
            const columns = [
              { key: 'selection', render: () => <SelectionCheckbox checked={isSelected} onChange={() => onSelect(q.id)} label="Select this question" /> },
              { key: 'sr', render: () => <SrNumber num={page * pageSize + idx + 1} isDark={isDark} /> },
              { key: 'question_text_en', render: () => <QuestionCell text={q.question_text_en?.trim() || ''} isDark={isDark} /> },
              { key: 'subject_name', render: () => <SubjectBadge subject={q.subject_name || ''} isDark={isDark} /> },
              { key: 'difficulty', render: () => <DifficultyBadge difficulty={q.difficulty || 'medium'} /> },
              { key: 'actions', render: () => <ActionsCell q={q} isDark={isDark} onView={onView} onEdit={onEdit} onDelete={onDelete} /> }
            ];

            return (
              <tr key={q.id} className={`transition-colors group border-b border-border-subtle/50 ancient-3d-lift ${isSelected ? (!isDark ? 'bg-[var(--ancient-cream)]/60' : 'bg-primary/5') : ''}`}>
                {columns.map(col => (
                  <td key={col.key} className={`px-6 py-4 ${!isDark ? 'text-[var(--ancient-brown-deep)]' : ''}`}>
                    {col.render(null, q)}
                  </td>
                ))}
              </tr>
            );
          }}
        />
      </div>

      <div className="lg:hidden flex flex-col gap-4">
        {questions.map((q, idx) => {
          const isSelected = selectedIds.includes(q.id);
          return (
            <div key={q.id} className={`border rounded-2xl p-4 shadow-sm flex flex-col gap-3 group transition-colors ancient-3d-lift ${isSelected ? (!isDark ? 'border-primary bg-primary/10' : 'border-primary bg-primary/5') : (!isDark ? 'ancient-card border-primary/10' : 'bg-card-bg border-border-subtle')}`}>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SelectionCheckbox checked={isSelected} onChange={() => onSelect(q.id)} label="Select this question" />
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${!isDark ? 'ancient-icon-badge shadow-sm border-primary/20' : 'bg-primary/10'}`}>
                      <span className="text-[10px] font-black text-primary">{page * pageSize + idx + 1}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${!isDark ? 'text-primary opacity-60' : 'text-text-secondary opacity-50'}`}>
                      ID: {q.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconButton
                      onClick={() => onView(q)}
                      size="sm"
                      aria-label="View question"
                      className={`p-1.5 active:scale-95 transition-all !w-auto !h-auto !bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isDark ? 'text-[var(--ancient-brown)] hover:text-primary' : 'text-text-secondary hover:text-primary'}`}
                    >
                      <Eye className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      onClick={() => onEdit(q)}
                      size="sm"
                      aria-label="Edit question"
                      className={`p-1.5 active:scale-95 transition-all !w-auto !h-auto !bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isDark ? 'text-[var(--ancient-brown)] hover:text-secondary' : 'text-text-secondary hover:text-secondary'}`}
                    >
                      <PenSquare className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      onClick={() => onDelete(q)}
                      size="sm"
                      aria-label="Delete question"
                      className={`p-1.5 active:scale-95 transition-all !w-auto !h-auto !bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isDark ? 'text-danger hover:text-red-600' : 'text-text-secondary hover:text-red-500'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>


              <div className={`text-[13px] font-bold line-clamp-2 md:line-clamp-3 leading-snug ${!isDark ? 'font-garamond text-sm text-[var(--ancient-brown-deep)]' : 'text-text-primary'}`}>
                {/* Phase 5: English exclusively from _en fields */}
                {q.question_text_en?.trim() || 'Untitled Question'}
              </div>

              <div className="pt-2 border-t border-border-subtle/40 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                  <span className="font-bold text-text-secondary opacity-60 uppercase tracking-wider">Subject</span>
                  <SubjectBadge subject={q.subject_name || ''} isDark={isDark} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">Difficulty</span>
                  <DifficultyBadge difficulty={q.difficulty || 'medium'} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AdminPagination
        page={page}
        setPage={setPage}
        hasMore={hasMore}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>

  )
}
