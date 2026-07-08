import { supabase } from '../supabase'

export async function fetchPublishedTopics(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('study_topics')
    .select('*')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .limit(200)
  if (error) throw error
  return (data as any[]) ?? []
}

export async function fetchAllTopics(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('study_topics')
    .select('*')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data as any[]) ?? []
}

export async function findMaxDisplayOrder(
  examId: string,
  paperId: string,
  subjectName: string
): Promise<number> {
  const { data } = await supabase
    .from('study_topics')
    .select('display_order')
    .eq('exam_id', examId)
    .eq('paper_id', paperId)
    .eq('subject_name', subjectName)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.display_order ?? 0) + 1
}

export async function insertTopic(payload: any): Promise<any> {
  const { data, error } = await supabase
    .from('study_topics')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function modifyTopic(id: string, payload: any): Promise<any> {
  const { data, error } = await supabase
    .from('study_topics')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeTopic(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_topics')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function setTopicPublishStatus(id: string, isPublished: boolean): Promise<void> {
  const { error } = await supabase
    .from('study_topics')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
