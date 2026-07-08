import { supabase } from '../supabase'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'

export type QueryFilter = Record<string, string | string[] | number | boolean | null | undefined>

export function buildQuery<T extends PostgrestFilterBuilder<any, any, any, any, unknown>>(
  table: string,
  filters?: QueryFilter
): T {
  let q = supabase.from(table).select('*') as unknown as T
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        if (value.length > 0) q = q.in(key, value) as unknown as T
      } else {
        q = q.eq(key, value) as unknown as T
      }
    }
  }
  return q
}

export async function countQuery(table: string, filter: Record<string, any>): Promise<number> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [k, v] of Object.entries(filter)) {
    if (Array.isArray(v)) {
      if (v.length > 0) q = q.in(k, v)
    } else {
      q = q.eq(k, v)
    }
  }
  const { count } = await q
  return count || 0
}
