import { supabase } from '../supabase'

export async function countQuery(table: string, filter: Record<string, unknown>): Promise<number | null> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [k, v] of Object.entries(filter)) {
    if (Array.isArray(v)) {
      if (v.length > 0) q = q.in(k, v)
    } else {
      q = q.eq(k, v as string)
    }
  }
  const { count } = await q
  return count
}
