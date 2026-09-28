import { supabase } from '../supabase'

export async function countQuery(table: string, filter: Record<string, unknown>): Promise<number> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [k, v] of Object.entries(filter)) {
    if (Array.isArray(v)) {
      if (v.length > 0) q = q.in(k, v)
    } else {
      q = q.eq(k, v as string)
    }
  }
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}
