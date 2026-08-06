import { memo } from 'react'
import { Youtube } from 'lucide-react'
import { Label, Input, Switch } from '../../common/AntigravityUI'

interface TopicMetadataFieldsProps {
  displayOrder: number
  onDisplayOrderChange: (val: number) => void
  youtubeUrl: string
  onYoutubeUrlChange: (val: string) => void
  isPublished: boolean
  onPublishedChange: (val: boolean) => void
  fieldErrors?: Partial<Record<'display_order' | 'youtube_url', string>>
  onFieldBlur?: (field: 'display_order' | 'youtube_url') => void
}

export const TopicMetadataFields = memo(function TopicMetadataFields({
  displayOrder, onDisplayOrderChange,
  youtubeUrl, onYoutubeUrlChange,
  isPublished, onPublishedChange,
  fieldErrors = {}, onFieldBlur,
}: TopicMetadataFieldsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b border-border-subtle/20">
      <div className="flex items-center gap-2">
        <Label htmlFor="topic-display-order" className="text-xs whitespace-nowrap">Topic #</Label>
        <Input
          id="topic-display-order"
          type="number" min={1} value={displayOrder}
          onChange={e => onDisplayOrderChange(Number(e.target.value))}
          onBlur={() => onFieldBlur?.('display_order')}
          aria-invalid={!!fieldErrors.display_order}
          aria-describedby={fieldErrors.display_order ? 'topic-display-order-error' : undefined}
          className="w-16"
        />
        {fieldErrors.display_order && (
          <span id="topic-display-order-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.display_order}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Youtube size={14} className="text-text-muted flex-shrink-0" />
        <Input
          id="topic-youtube-url"
          type="url"
          placeholder="YouTube link (optional)"
          value={youtubeUrl}
          onChange={e => onYoutubeUrlChange(e.target.value)}
          onBlur={() => onFieldBlur?.('youtube_url')}
          aria-invalid={!!fieldErrors.youtube_url}
          aria-describedby={fieldErrors.youtube_url ? 'topic-youtube-url-error' : undefined}
          className="flex-1"
        />
      </div>

      <Switch label="Visible to students" checked={isPublished} onChange={onPublishedChange} />
      {fieldErrors.youtube_url && (
        <span id="topic-youtube-url-error" aria-live="polite" className="w-full text-xs font-bold text-danger mt-1">{fieldErrors.youtube_url}</span>
      )}
    </div>
  )
})
