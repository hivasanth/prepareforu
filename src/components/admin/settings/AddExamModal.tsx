import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, PlusCircle, Trash2, AlertCircle } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { generateRequestId } from '../../../utils/logger'
import { Button, Input, Switch, Label, Stack, Grid, Card, Badge, useTheme } from '../../common/AntigravityUI'
import { useToast } from '../../../hooks/useToast'
import type { UserProfile } from '../../../types/auth.types'

interface AddExamModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null | undefined
  onExamCreated: (examId: string) => void
}

export function AddExamModal({ isOpen, onClose, user, onExamCreated }: AddExamModalProps) {
  const { isDark } = useTheme()
  const { showSuccess, showError } = useToast()

  const [examId, setExamId] = useState('')
  const [examName, setExamName] = useState('')
  const [examSelection, setExamSelection] = useState('GATE')
  const [totalQuestions, setTotalQuestions] = useState(65)
  const [totalMarks, setTotalMarks] = useState(100)
  const [durationMinutes, setDurationMinutes] = useState(180)
  const [negativeMarking, setNegativeMarking] = useState(true)
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.33)
  const [isPublished, setIsPublished] = useState(true)
  const [paperName, setPaperName] = useState('Core Paper')
  const [paperStage, setPaperStage] = useState<'SINGLE' | 'PRELIMS' | 'MAINS'>('SINGLE')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [modalSubjects, setModalSubjects] = useState<Array<{ subject_name: string; question_count: number; marks_per_question: number }>>([
    { subject_name: 'Mathematics', question_count: 15, marks_per_question: 1 },
    { subject_name: 'Computer Science', question_count: 50, marks_per_question: 1.7 }
  ])

  const runningQuestionsSum = modalSubjects.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
  const isSumValid = runningQuestionsSum === Number(totalQuestions)
  const runningMarksSum = modalSubjects.reduce((sum, s) => sum + ((Number(s.question_count) || 0) * (Number(s.marks_per_question) || 0)), 0)

  const addModalSubject = () => {
    setModalSubjects(prev => [...prev, { subject_name: '', question_count: 0, marks_per_question: 1 }])
  }

  const removeModalSubject = (index: number) => {
    if (modalSubjects.length <= 1) {
      showError('At least one subject is required.')
      return
    }
    setModalSubjects(prev => prev.filter((_, idx) => idx !== index))
  }

  const updateModalSubject = (index: number, key: string, value: any) => {
    setModalSubjects(prev => prev.map((sub, idx) => {
      if (idx === index) return { ...sub, [key]: value }
      return sub
    }))
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examId.trim() || !examName.trim() || !examSelection.trim() || !paperName.trim()) {
      showError('Please fill out all required fields.')
      return
    }
    if (!isSumValid) {
      showError(`Subject questions sum (${runningQuestionsSum}) must equal Total Questions (${totalQuestions}).`)
      return
    }

    setIsSubmitting(true)
    try {
      const requestId = generateRequestId('create_new_exam')
      await adminService.createNewExam(
        { user, requestId },
        {
          exam_id: examId.trim().toUpperCase(),
          name: examName.trim(),
          exam_selection: examSelection.trim().toUpperCase(),
          total_questions: Number(totalQuestions),
          total_marks: Number(totalMarks),
          duration_minutes: Number(durationMinutes),
          negative_marking: negativeMarking,
          negative_mark_value: negativeMarking ? Number(negativeMarkValue) : 0,
          is_published: isPublished,
          papers: [{
            paper_name: paperName.trim(),
            stage: paperStage,
            total_questions: Number(totalQuestions),
            total_marks: Number(totalMarks),
            duration_minutes: Number(durationMinutes),
            negative_marking: negativeMarking,
            negative_mark_value: negativeMarking ? Number(negativeMarkValue) : 0,
          }],
          subjects: modalSubjects.map(sub => ({
            subject_name: sub.subject_name.trim(),
            question_count: Number(sub.question_count),
            marks_per_question: Number(sub.marks_per_question)
          }))
        }
      )
      showSuccess(`Exam "${examName}" created successfully!`)
      onClose()
      onExamCreated(examId.trim().toUpperCase())
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to create exam.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-md">
          <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClose() }} aria-label="Close modal" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 flex flex-col p-6 md:p-8 ${
              !isDark
                ? 'bg-[#FDF5E2]/98 border-2 border-[#B07A14]/40 text-[#3D1F08] shadow-2xl rounded-[24px]'
                : 'bg-card-bg/98 border border-border-subtle/80 text-text-primary shadow-2xl rounded-[24px] backdrop-blur-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${!isDark ? 'ancient-icon-badge shadow-sm' : 'bg-primary/10 text-primary'}`}>
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg md:text-xl font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'}`}>
                    Add New Dynamic Exam
                  </h2>
                  <p className={`text-[10px] uppercase font-bold tracking-wider opacity-60 ${!isDark ? 'font-garamond italic' : ''}`}>
                    Deploy a new dynamic standard schema globally
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className={`p-2 rounded-full transition-colors hover:bg-hover-bg/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isDark ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="mt-6 space-y-6">
              <Grid cols={2} gap={20}>
                <Card variant="subtle" className={`flex flex-col gap-4 p-5 ${!isDark ? 'bg-white/50 border-[#B07A14]/20' : 'bg-hover-bg/20'}`}>
                  <span className={`text-xs font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-primary'}`}>General Metadata</span>
                  <Stack gap="sm">
                    <Label>Exam Key (Unique ID)</Label>
                    <Input placeholder="e.g. GATE_CS" value={examId} onChange={(e) => setExamId(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required />
                  </Stack>
                  <Stack gap="sm">
                    <Label>Display Name</Label>
                    <Input placeholder="e.g. GATE Computer Science" value={examName} onChange={(e) => setExamName(e.target.value)} required />
                  </Stack>
                  <Stack gap="sm">
                    <Label>Selection Category</Label>
                    <Input placeholder="e.g. GATE, APPSC, BANK_EXAMS" value={examSelection} onChange={(e) => setExamSelection(e.target.value)} required />
                  </Stack>
                </Card>

                <Card variant="subtle" className={`flex flex-col gap-4 p-5 ${!isDark ? 'bg-white/50 border-[#B07A14]/20' : 'bg-hover-bg/20'}`}>
                  <span className={`text-xs font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-primary'}`}>Exam Parameters</span>
                  <Grid cols={2} gap={12}>
                    <Stack gap="sm">
                      <Label>Total Questions</Label>
                      <Input type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(Number(e.target.value))} required />
                    </Stack>
                    <Stack gap="sm">
                      <Label>Total Marks</Label>
                      <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} required />
                    </Stack>
                  </Grid>
                  <Stack gap="sm">
                    <Label>Duration (Minutes)</Label>
                    <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} required />
                  </Stack>
                  <div className="flex items-center justify-between p-3 bg-hover-bg/10 rounded-xl border border-border-subtle/30 mt-2">
                    <Switch label={isPublished ? 'Publish Immediately' : 'Draft Mode'} checked={isPublished} onChange={setIsPublished} />
                  </div>
                </Card>
              </Grid>

              <Grid cols={2} gap={20}>
                <Card variant="subtle" className={`flex flex-col gap-4 p-5 ${!isDark ? 'bg-white/50 border-[#B07A14]/20' : 'bg-hover-bg/20'}`}>
                  <span className={`text-xs font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-primary'}`}>Initial Paper Details</span>
                  <Stack gap="sm">
                    <Label>Paper Name</Label>
                    <Input placeholder="e.g. Core Paper" value={paperName} onChange={(e) => setPaperName(e.target.value)} required />
                  </Stack>
                  <Stack gap="sm">
                    <Label>Paper Stage</Label>
                    <div className="flex gap-2 pt-1">
                      {['SINGLE', 'PRELIMS', 'MAINS'].map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => setPaperStage(stage as any)}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                            paperStage === stage
                              ? (!isDark ? 'bg-primary text-white border-primary shadow-sm' : 'bg-primary/20 text-primary border-primary')
                              : (!isDark ? 'bg-[#F4E5C4]/30 border-primary/25 text-primary/80 hover:bg-[#F4E5C4]/50' : 'bg-hover-bg/40 border-border-subtle/50 text-text-secondary hover:text-text-primary')
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </Stack>
                </Card>

                <Card variant="subtle" className={`flex flex-col gap-4 p-5 ${!isDark ? 'bg-white/50 border-[#B07A14]/20' : 'bg-hover-bg/20'}`}>
                  <span className={`text-xs font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-primary'}`}>Negative Marking Penalty</span>
                  <Stack gap="md" className="p-4 bg-hover-bg/10 rounded-xl border border-border-subtle/30">
                    <Switch label="Enable Negative Penalty" checked={negativeMarking} onChange={setNegativeMarking} />
                    {negativeMarking && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                        <Label>Penalty Value (marks subtracted per wrong answer)</Label>
                        <Input type="number" step="0.01" value={negativeMarkValue} onChange={(e) => setNegativeMarkValue(Number(e.target.value))} required={negativeMarking} />
                      </motion.div>
                    )}
                  </Stack>
                </Card>
              </Grid>

              <Card variant="subtle" className={`flex flex-col gap-4 p-5 ${!isDark ? 'bg-white/50 border-[#B07A14]/20' : 'bg-hover-bg/20'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/20">
                  <span className={`text-xs font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-primary'}`}>Subject Quota Allocation</span>
                  <Button type="button" onClick={addModalSubject} variant="secondary" className="!h-9 !px-3 text-[10px]">
                    <PlusCircle size={14} className="mr-1.5" /> Add Subject
                  </Button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 form-scrollbar">
                  {modalSubjects.map((sub, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 transition-all ${
                      !isDark ? 'bg-[#F4E5C4]/20 border-primary/10' : 'bg-hover-bg/10 border-border-subtle/30'
                    }`}>
                      <div className="flex-1 w-full">
                        <Stack gap="xs">
                          <Label>Subject Name</Label>
                          <Input placeholder="e.g. Engineering Mathematics" value={sub.subject_name} onChange={(e) => updateModalSubject(idx, 'subject_name', e.target.value)} required />
                        </Stack>
                      </div>
                      <div className="w-full md:w-32">
                        <Stack gap="xs">
                          <Label>Question Count</Label>
                          <Input type="number" value={sub.question_count} onChange={(e) => updateModalSubject(idx, 'question_count', Number(e.target.value))} required />
                        </Stack>
                      </div>
                      <div className="w-full md:w-32">
                        <Stack gap="xs">
                          <Label>Marks per Q</Label>
                          <Input type="number" step="0.1" value={sub.marks_per_question} onChange={(e) => updateModalSubject(idx, 'marks_per_question', Number(e.target.value))} required />
                        </Stack>
                      </div>
                      <div className="md:pt-4 flex-shrink-0">
                        <button type="button" onClick={() => removeModalSubject(idx)} aria-label="Remove subject" className="p-2.5 rounded-lg text-danger hover:bg-danger/10 transition-colors border border-transparent hover:border-danger/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${!isDark ? 'border-primary/20' : 'border-border-subtle/30'}`}>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Stack direction="row" align="center" gap="sm">
                      <Label>Running Questions Sum:</Label>
                      <Badge variant={isSumValid ? 'success' : 'danger'} className="!font-black text-xs">{runningQuestionsSum} / {totalQuestions}</Badge>
                    </Stack>
                    <Stack direction="row" align="center" gap="sm">
                      <Label>Total Calculated Marks:</Label>
                      <Badge variant={runningMarksSum === Number(totalMarks) ? 'success' : 'warning'} className="!font-black text-xs">{runningMarksSum} / {totalMarks}</Badge>
                    </Stack>
                  </div>
                  {!isSumValid && (
                    <div className="flex items-center gap-1.5 text-danger text-[10px] font-black uppercase tracking-wider">
                      <AlertCircle size={14} /> Questions sum must match exact total questions.
                    </div>
                  )}
                </div>
              </Card>

              <div className={`pt-6 border-t flex justify-end gap-3 ${!isDark ? 'border-primary/20' : 'border-border-subtle/30'}`}>
                <Button type="button" variant="secondary" onClick={onClose} className="!px-6">Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting || !isSumValid} loading={isSubmitting} className="!px-8">Deploy dynamic exam</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
