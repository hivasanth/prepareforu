import { memo } from 'react'
import { Search } from 'lucide-react'
import { Input, CollectionToolbar, PremiumSelect } from '../../common/AntigravityUI'

export type QuestionFilter = 'all' | 'easy' | 'medium' | 'hard' | 'visuals'

interface QuestionsActionsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filter: QuestionFilter
  setFilter: (filter: QuestionFilter) => void
}

export const QuestionsActions = memo(function QuestionsActions({
  searchQuery, setSearchQuery,
  filter, setFilter,
}: QuestionsActionsProps) {

  return (
    <CollectionToolbar>
      {/* Search & Filter Group */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
        <div className="flex-1">
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
            className="w-full"
            aria-label="Search questions"
          />
        </div>

        <PremiumSelect
          value={filter}
          onChange={(v) => setFilter(v as QuestionFilter)}
          options={[
            { id: 'all', name: 'All' },
            { id: 'easy', name: 'Easy' },
            { id: 'medium', name: 'Medium' },
            { id: 'hard', name: 'Hard' },
            { id: 'visuals', name: 'Visuals' }
          ]}
          label="Question filter"
          className="w-full sm:w-fit"
        />
      </div>
    </CollectionToolbar>
  );
});