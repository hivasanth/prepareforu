import { memo } from 'react'
import { Search, Plus, Upload } from 'lucide-react'
import { Input, CollectionFilter, Button, CollectionToolbar } from '../../common/AntigravityUI'

interface QuestionsActionsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  difficultyFilter: string
  setDifficultyFilter: (diff: string) => void
  onAddQuestion?: () => void
  onBulkUpload?: () => void
  isUploadDisabled?: boolean
}

export const QuestionsActions = memo(function QuestionsActions({
  searchQuery, setSearchQuery,
  difficultyFilter, setDifficultyFilter,
  onAddQuestion, onBulkUpload,
  isUploadDisabled
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
        
        <CollectionFilter
          label="Difficulty"
          ariaLabel="Filter by difficulty"
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[
            { id: 'all', label: 'All' },
            { id: 'easy', label: 'Easy' },
            { id: 'medium', label: 'Medium' },
            { id: 'hard', label: 'Hard' }
          ]}
          className="w-full sm:w-fit"
        />
      </div>

      {/* Action Buttons Group */}
      <div className="flex items-center gap-3 shrink-0">
        {onBulkUpload && (
          <Button
            variant="secondary"
            onClick={onBulkUpload}
            disabled={isUploadDisabled}
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Bulk</span>
          </Button>
        )}

        {onAddQuestion && (
          <Button
            variant="primary"
            onClick={onAddQuestion}
            disabled={isUploadDisabled}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Question</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

    </CollectionToolbar>
  );
});
