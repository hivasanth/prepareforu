export function validateOrThrow(
  schema: { safeParse: (data: unknown) => { success: boolean; error?: { issues: Array<{ message: string }> } } },
  data: unknown,
  context: string
): void {
  const result = schema.safeParse(data)
  if (!result.success) {
    const msg = result.error?.issues?.[0]?.message || 'Validation failed'
    throw new Error(`VALIDATION_ERROR (${context}): ${msg}`)
  }
}
