import { z } from 'zod'

// ─── Admin Shared Schemas ─────────────────────────────────────────────────────
// Shared Zod schemas for Admin-module forms that have no home in the auth or
// security schema files. Consumers reference these instead of declaring
// file-local rules so validation rules exist only once.

// ─── Prompt Template (BulkUploadPromptEditorModal) ────────────────────────────
// Used by: PromptEditorModal (via useBulkUpload). Replaces the former manual
// truthiness check for topic_name / prompt_text.

export const promptTemplateSchema = z.object({
  topic_name: z.string().trim().min(1, 'Topic / Name is required'),
  prompt_text: z.string().trim().min(1, 'Prompt instructions are required'),
})

export type PromptTemplateInput = z.infer<typeof promptTemplateSchema>

// ─── Topic Metadata (AdminTopics form) ────────────────────────────────────────
// Used by: useAdminTopics.handleSave. display_order must be >= 1; youtube_url
// is optional but must be a valid URL when provided.

export const topicMetadataSchema = z.object({
  display_order: z.number().int().min(1, 'Topic # must be at least 1'),
  youtube_url: z.string().trim().refine(
    (value) => value === '' || z.string().url().safeParse(value).success,
    { message: 'Enter a valid URL' }
  ),
})

export type TopicMetadataInput = z.infer<typeof topicMetadataSchema>
