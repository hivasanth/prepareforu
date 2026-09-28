import { z } from 'zod'

// ─── Admin Shared Schemas ─────────────────────────────────────────────────────
// Shared Zod schemas for Admin-module forms that have no home in the auth or
// security schema files. Consumers reference these instead of declaring
// file-local rules so validation rules exist only once.

// ─── Prompt Template (BulkUploadPromptEditorModal) ────────────────────────────
// Used by: PromptEditorModal (via useBulkUpload). topic_id is the canonical
// exam_topics.id chosen from the live dropdown; topic_name is the denormalized
// display cache resolved from exam_topics.

export const promptTemplateSchema = z.object({
  topic_id: z.string().uuid('Select a topic'),
  topic_name: z.string().trim().min(1, 'Topic / Name is required'),
  prompt_text: z.string().trim().min(1, 'Prompt instructions are required'),
})

export type PromptTemplateInput = z.infer<typeof promptTemplateSchema>

// ─── Topic Metadata (AdminTopics form) ────────────────────────────────────────
// Used by: useAdminTopics.handleSave. display_order must be >= 1; youtube_url
// is optional but must be a valid URL when provided.

export const topicMetadataSchema = z.object({
  display_order: z.number().int().min(1, 'Topic # must be at least 1').max(100000, 'Topic # must be at most 100000'),
  youtube_url: z.string().trim().refine(
    (value) => value === '' || z.string().url().safeParse(value).success,
    { message: 'Enter a valid URL' }
  ),
})

export type TopicMetadataInput = z.infer<typeof topicMetadataSchema>
