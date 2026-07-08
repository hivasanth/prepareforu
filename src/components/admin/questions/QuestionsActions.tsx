import { Search, Plus, Upload, Filter } from 'lucide-react'
import { Input, FilterSelect, Button } from '../../common/AntigravityUI'

interface QuestionsActionsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  difficultyFilter: string
  setDifficultyFilter: (diff: string) => void
  onAddQuestion?: () => void
  onBulkUpload?: () => void
  isUploadDisabled?: boolean
}

export function QuestionsActions({
  searchQuery, setSearchQuery,
  difficultyFilter, setDifficultyFilter,
  onAddQuestion, onBulkUpload,
  isUploadDisabled
}: QuestionsActionsProps) {

  return (
    <div className={`flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-6 bg-transparent border-none relative z-10`}>
      
      {/* Search & Filter Group */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
        <div className="flex-1">
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
            className="w-full"
          />
        </div>
        
        <FilterSelect
          icon={Filter}
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[
            { id: 'easy', name: 'Easy' },
            { id: 'medium', name: 'Medium' },
            { id: 'hard', name: 'Hard' }
          ]}
          placeholder="Level"
          className="w-full sm:w-auto sm:min-w-[140px]"
        />
      </div>

      {/* Action Buttons Group */}
      <div className="flex items-center gap-3 shrink-0">
        {onBulkUpload && (
          <Button
            variant="secondary"
            onClick={onBulkUpload}
            disabled={isUploadDisabled}
            className="flex items-center gap-2 !h-[44px] md:!h-[48px] !px-4 !rounded-[12px] !text-xs sm:!text-sm"
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
            className="flex items-center gap-2 !h-[44px] md:!h-[48px] !px-4 !rounded-[12px] !text-xs sm:!text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Question</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

    </div>
  );
}
