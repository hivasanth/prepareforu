import { useState, useEffect, useRef } from 'react'
import { useAsyncOperation } from '../../../hooks/useAsyncOperation'
import { motion } from 'framer-motion'
import { AlertCircle, Plus, PlusCircle, Trash2 } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { generateRequestId } from '../../../utils/logger'
import { Button, IconButton, Input, Switch, Label, Stack, Grid, Card, Badge, RadioGroup, Alert } from '../../common/AntigravityUI'
import { AdminModal } from '../../common/AdminModal'
import { FieldError } from '../../common/SharedComponents'
import { examCreationSchema } from '../../../validations/securitySchemas'
import type { UserProfile } from '../../../types/auth.types'

interface AddExamModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null | undefined
  onExamCreated: (examId: string) => void
  /** Success announcement for the hosting page — the modal itself closes. */
  onSuccess?: (message: string) => void
}

type AddExamFieldErrors = Partial<Record<
  'examId' | 'examName' | 'examSelection' | 'totalQuestions' | 'totalMarks' | 'durationMinutes' | 'negativeMarkValue' | 'paperName',
  string
>>
type AddExamSubjectErrors = Record<number, Partial<Record<'subject_name' | 'question_count' | 'marks_per_question', string>>>

export function AddExamModal({ isOpen, onClose, user, onExamCreated, onSuccess }: AddExamModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<AddExamFieldErrors>({})
  const [subjectErrors, setSubjectErrors] = useState<AddExamSubjectErrors>({})
  const [subjectsError, setSubjectsError] = useState<string | undefined>(undefined)
  const submittedRef = useRef(false)

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
  const { loading: isSubmitting, execute } = useAsyncOperation()

  const [modalSubjects, setModalSubjects] = useState<Array<{ subject_name: string; question_count: number; marks_per_question: number }>>([
    { subject_name: 'Mathematics', question_count: 15, marks_per_question: 1 },
    { subject_name: 'Computer Science', question_count: 50, marks_per_question: 1.7 }
  ])

  const runningQuestionsSum = modalSubjects.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
  const isSumValid = runningQuestionsSum === Number(totalQuestions)
  const runningMarksSum = modalSubjects.reduce((sum, s) => sum + ((Number(s.question_count) || 0) * (Number(s.marks_per_question) || 0)), 0)

  /** Single close path: reset transient validation state, then hand off to
   *  the parent. Covers every close trigger (cancel, X, Escape, scrim). */
  const handleClose = () => {
    setError(null)
    setFieldErrors({})
    setSubjectErrors({})
    setSubjectsError(undefined)
    submittedRef.current = false
    onClose()
  }

  // M-3: Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalOverflow }
  }, [isOpen])

  const addModalSubject = () => {
    setModalSubjects(prev => [...prev, { subject_name: '', question_count: 0, marks_per_question: 1 }])
  }

  const removeModalSubject = (index: number) => {
    if (modalSubjects.length <= 1) {
      setSubjectsError('At least one subject is required.')
      return
    }
    setModalSubjects(prev => prev.filter((_, idx) => idx !== index))
    if (submittedRef.current) setSubjectsError(undefined)
  }

  const updateModalSubject = (index: number, key: 'subject_name' | 'question_count' | 'marks_per_question', value: string | number) => {
    setModalSubjects(prev => prev.map((sub, idx) => {
      if (idx === index) return { ...sub, [key]: value }
      return sub
    }))
  }

  const runValidation = () => {
    const result = examCreationSchema.safeParse({
      examId,
      examName,
      examSelection,
      totalQuestions: Number(totalQuestions),
      totalMarks: Number(totalMarks),
      durationMinutes: Number(durationMinutes),
      negativeMarking,
      negativeMarkValue: negativeMarking ? Number(negativeMarkValue) : 0,
      isPublished,
      paperName,
      paperStage,
      subjects: modalSubjects.map(sub => ({
        subject_name: sub.subject_name.trim(),
        question_count: Number(sub.question_count),
        marks_per_question: Number(sub.marks_per_question),
      })),
    })

    const nextFieldErrors: AddExamFieldErrors = {}
    const nextSubjectErrors: AddExamSubjectErrors = {}
    let nextSubjectsError: string | undefined

    if (!result.success) {
      result.error.issues.forEach(issue => {
        const [head, idx, field] = issue.path as [string, number | string | undefined, string | undefined]
        if (head === 'subjects' && typeof idx === 'number' && typeof field === 'string') {
          nextSubjectErrors[idx] = { ...nextSubjectErrors[idx], [field]: issue.message }
        } else if (head === 'subjects') {
          nextSubjectsError = issue.message
        } else if (typeof head === 'string' && typeof idx === 'undefined') {
          nextFieldErrors[head as keyof AddExamFieldErrors] = issue.message
        }
      })
    }

    return { result, fieldErrors: nextFieldErrors, subjectErrors: nextSubjectErrors, subjectsError: nextSubjectsError }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    // BUG-J re-entry guard: button disabling alone cannot stop programmatic
    // submissions (e.g. form.requestSubmit) while a create is in flight.
    if (isSubmitting) return
    submittedRef.current = true

    const { result, fieldErrors, subjectErrors, subjectsError } = runValidation()
    setFieldErrors(fieldErrors)
    setSubjectErrors(subjectErrors)
    setSubjectsError(subjectsError)
    if (!result.success) return

    setError(null)
    try {
      await execute(async () => {
        const data = result.data
        const requestId = generateRequestId('create_new_exam')
        await adminService.createNewExam(
          { user, requestId },
          {
            exam_id: data.examId,
            name: data.examName,
            exam_selection: data.examSelection.toUpperCase(),
            total_questions: data.totalQuestions,
            total_marks: data.totalMarks,
            duration_minutes: data.durationMinutes,
            negative_marking: data.negativeMarking,
            negative_mark_value: data.negativeMarkValue,
            is_published: data.isPublished,
            papers: [{
              paper_name: data.paperName,
              stage: data.paperStage,
              total_questions: data.totalQuestions,
              total_marks: data.totalMarks,
              duration_minutes: data.durationMinutes,
              negative_marking: data.negativeMarking,
              negative_mark_value: data.negativeMarkValue,
            }],
            subjects: data.subjects,
          }
        )
        onSuccess?.(`Exam "${data.examName}" created successfully!`)
        onClose()
        onExamCreated(data.examId)
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create exam.')
    }
  }

  const handleFieldBlur = (field: keyof AddExamFieldErrors) => {
    if (!submittedRef.current) return
    const { fieldErrors, subjectsError } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
    setSubjectsError(subjectsError)
  }

  const handleSubjectBlur = (index: number) => {
    if (!submittedRef.current) return
    const { subjectErrors, subjectsError } = runValidation()
    setSubjectErrors(prev => ({ ...prev, [index]: subjectErrors[index] }))
    setSubjectsError(subjectsError)
  }

  const errorId = (field: string) => `${field}-error`

  return (
    <>
    {/* BUG-3 remediation: certified AdminModal host — role="dialog",
     * aria-modal, FocusTrap, Escape-to-close and focus restoration are all
     * owned by the shared modal contract. Only the shell changed; the form,
     * validation and submit behavior are untouched. */}
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Dynamic Exam"
      titleClassName="uppercase tracking-widest"
      description="Deploy a new dynamic standard schema globally"
      headerBadge={(
        <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary">
          <Plus className="w-5 h-5" />
        </span>
      )}
    >
      <form id="add-exam-form" onSubmit={handleCreateExam} noValidate className="space-y-6">
              {error && (
                <Alert variant="error" icon={AlertCircle} title="Unable to create exam" className="w-full">
                  {error}
                </Alert>
              )}
              <Grid cols={2} gap={12}>
                <Card variant="subtle" className="flex flex-col gap-4 p-5 bg-hover-bg/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">General Metadata</span>
                  <Stack gap="sm">
                    <Label htmlFor="exam-id">Exam Key (Unique ID)</Label>
                    <Input
                      id="exam-id"
                      placeholder="e.g. GATE_CS"
                      value={examId}
                      onChange={(e) => setExamId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      onBlur={() => handleFieldBlur('examId')}
                      aria-invalid={!!fieldErrors.examId}
                      aria-describedby={fieldErrors.examId ? errorId('exam-id') : undefined}
                    />
                    {fieldErrors.examId && (
                      <FieldError id="exam-id-error">{fieldErrors.examId}</FieldError>
                    )}
                  </Stack>
                  <Stack gap="sm">
                    <Label htmlFor="exam-name">Display Name</Label>
                    <Input
                      id="exam-name"
                      placeholder="e.g. GATE Computer Science"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      onBlur={() => handleFieldBlur('examName')}
                      aria-invalid={!!fieldErrors.examName}
                      aria-describedby={fieldErrors.examName ? errorId('exam-name') : undefined}
                    />
                    {fieldErrors.examName && (
                      <FieldError id="exam-name-error">{fieldErrors.examName}</FieldError>
                    )}
                  </Stack>
                  <Stack gap="sm">
                    <Label htmlFor="exam-selection">Selection Category</Label>
                    <Input
                      id="exam-selection"
                      placeholder="e.g. GATE, APPSC, BANK_EXAMS"
                      value={examSelection}
                      onChange={(e) => setExamSelection(e.target.value)}
                      onBlur={() => handleFieldBlur('examSelection')}
                      aria-invalid={!!fieldErrors.examSelection}
                      aria-describedby={fieldErrors.examSelection ? errorId('exam-selection') : undefined}
                    />
                    {fieldErrors.examSelection && (
                      <FieldError id="exam-selection-error">{fieldErrors.examSelection}</FieldError>
                    )}
                  </Stack>
                </Card>

                <Card variant="subtle" className="flex flex-col gap-4 p-5 bg-hover-bg/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Exam Parameters</span>
                  <Grid cols={2} gap={12}>
                    <Stack gap="sm">
                      <Label htmlFor="total-questions">Total Questions</Label>
                      <Input
                        id="total-questions"
                        type="number"
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(Number(e.target.value))}
                        onBlur={() => handleFieldBlur('totalQuestions')}
                        aria-invalid={!!fieldErrors.totalQuestions}
                        aria-describedby={fieldErrors.totalQuestions ? errorId('total-questions') : undefined}
                      />
                      {fieldErrors.totalQuestions && (
                        <FieldError id="total-questions-error">{fieldErrors.totalQuestions}</FieldError>
                      )}
                    </Stack>
                    <Stack gap="sm">
                      <Label htmlFor="total-marks">Total Marks</Label>
                      <Input
                        id="total-marks"
                        type="number"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(Number(e.target.value))}
                        onBlur={() => handleFieldBlur('totalMarks')}
                        aria-invalid={!!fieldErrors.totalMarks}
                        aria-describedby={fieldErrors.totalMarks ? errorId('total-marks') : undefined}
                      />
                      {fieldErrors.totalMarks && (
                        <FieldError id="total-marks-error">{fieldErrors.totalMarks}</FieldError>
                      )}
                    </Stack>
                  </Grid>
                  <Stack gap="sm">
                    <Label htmlFor="duration-minutes">Duration (Minutes)</Label>
                    <Input
                      id="duration-minutes"
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      onBlur={() => handleFieldBlur('durationMinutes')}
                      aria-invalid={!!fieldErrors.durationMinutes}
                      aria-describedby={fieldErrors.durationMinutes ? errorId('duration-minutes') : undefined}
                    />
                    {fieldErrors.durationMinutes && (
                      <span id="duration-minutes-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.durationMinutes}</span>
                    )}
                  </Stack>
                  <div className="flex items-center justify-between p-3 bg-hover-bg/10 rounded-xl border border-border-subtle/30 mt-2">
                    <Switch label={isPublished ? 'Publish Immediately' : 'Draft Mode'} checked={isPublished} onChange={setIsPublished} />
                  </div>
                </Card>
              </Grid>

              <Grid cols={2} gap={12}>
                <Card variant="subtle" className="flex flex-col gap-4 p-5 bg-hover-bg/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Initial Paper Details</span>
                  <Stack gap="sm">
                    <Label htmlFor="paper-name">Paper Name</Label>
                    <Input
                      id="paper-name"
                      placeholder="e.g. Core Paper"
                      value={paperName}
                      onChange={(e) => setPaperName(e.target.value)}
                      onBlur={() => handleFieldBlur('paperName')}
                      aria-invalid={!!fieldErrors.paperName}
                      aria-describedby={fieldErrors.paperName ? errorId('paper-name') : undefined}
                    />
                    {fieldErrors.paperName && (
                      <span id="paper-name-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.paperName}</span>
                    )}
                  </Stack>
                  <Stack gap="sm">
                    <Label>Paper Stage</Label>
                    <RadioGroup<'SINGLE' | 'PRELIMS' | 'MAINS'>
                      value={paperStage as 'SINGLE' | 'PRELIMS' | 'MAINS'}
                      onChange={(stage) => setPaperStage(stage)}
                      options={[
                        { value: 'SINGLE', label: 'Single' },
                        { value: 'PRELIMS', label: 'Prelims' },
                        { value: 'MAINS', label: 'Mains' },
                      ]}
                    />
                  </Stack>
                </Card>

                <Card variant="subtle" className="flex flex-col gap-4 p-5 bg-hover-bg/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Negative Marking Penalty</span>
                  <Stack gap="md" className="p-4 bg-hover-bg/10 rounded-xl border border-border-subtle/30">
                    <Switch label="Enable Negative Penalty" checked={negativeMarking} onChange={setNegativeMarking} />
                    {negativeMarking && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                        <Label htmlFor="negative-mark-value">Penalty Value (marks subtracted per wrong answer)</Label>
                        <Input
                          id="negative-mark-value"
                          type="number"
                          step="0.01"
                          value={negativeMarkValue}
                          onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                          onBlur={() => handleFieldBlur('negativeMarkValue')}
                          aria-invalid={!!fieldErrors.negativeMarkValue}
                          aria-describedby={fieldErrors.negativeMarkValue ? errorId('negative-mark-value') : undefined}
                        />
                        {fieldErrors.negativeMarkValue && (
                          <span id="negative-mark-value-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.negativeMarkValue}</span>
                        )}
                      </motion.div>
                    )}
                  </Stack>
                </Card>
              </Grid>

              <Card variant="subtle" className="flex flex-col gap-4 p-5 bg-hover-bg/20">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Subject Configuration</span>
                  <Button type="button" onClick={addModalSubject} variant="secondary" size="sm">
                    <PlusCircle size={14} className="mr-1.5" /> Add Subject
                  </Button>
                </div>

                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 form-scrollbar">
                  {modalSubjects.map((sub, idx) => (
                    <div key={sub.subject_name || idx} className="p-4 rounded-xl border space-y-3 transition-interaction duration-fast ease-standard bg-hover-bg/10 border-border-subtle/30">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-full">
                          <Stack gap="xs">
                            <Label htmlFor={`subject-name-${idx}`}>Subject Name</Label>
                            <Input
                              id={`subject-name-${idx}`}
                              placeholder="e.g. Engineering Mathematics"
                              value={sub.subject_name}
                              onChange={(e) => updateModalSubject(idx, 'subject_name', e.target.value)}
                              onBlur={() => handleSubjectBlur(idx)}
                              aria-invalid={!!subjectErrors[idx]?.subject_name}
                              aria-describedby={subjectErrors[idx]?.subject_name ? `subject-name-${idx}-error` : undefined}
                            />
                            {subjectErrors[idx]?.subject_name && (
                              <span id={`subject-name-${idx}-error`} aria-live="polite" className="text-xs font-bold text-danger mt-1">{subjectErrors[idx]?.subject_name}</span>
                            )}
                          </Stack>
                        </div>
                        <div className="md:pt-4 flex-shrink-0">
                          <IconButton type="button" variant="danger" size="sm" onClick={() => removeModalSubject(idx)} aria-label="Remove subject">
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </div>

                      <div className="h-px bg-border-subtle/20" />

                      <div className="grid grid-cols-2 gap-3">
                        <Stack gap="xs">
                          <Label htmlFor={`subject-questions-${idx}`}>Questions</Label>
                          <Input
                            id={`subject-questions-${idx}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={sub.question_count}
                            onChange={(e) => updateModalSubject(idx, 'question_count', Number(e.target.value))}
                            onBlur={() => handleSubjectBlur(idx)}
                            aria-invalid={!!subjectErrors[idx]?.question_count}
                            aria-describedby={subjectErrors[idx]?.question_count ? `subject-questions-${idx}-error` : undefined}
                          />
                          {subjectErrors[idx]?.question_count && (
                            <span id={`subject-questions-${idx}-error`} aria-live="polite" className="text-xs font-bold text-danger mt-1">{subjectErrors[idx]?.question_count}</span>
                          )}
                        </Stack>
                        <Stack gap="xs">
                          <Label htmlFor={`subject-marks-${idx}`}>Marks / Q</Label>
                          <Input
                            id={`subject-marks-${idx}`}
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min={0.1}
                            value={sub.marks_per_question}
                            onChange={(e) => updateModalSubject(idx, 'marks_per_question', Number(e.target.value))}
                            onBlur={() => handleSubjectBlur(idx)}
                            aria-invalid={!!subjectErrors[idx]?.marks_per_question}
                            aria-describedby={subjectErrors[idx]?.marks_per_question ? `subject-marks-${idx}-error` : undefined}
                          />
                          {subjectErrors[idx]?.marks_per_question && (
                            <span id={`subject-marks-${idx}-error`} aria-live="polite" className="text-xs font-bold text-danger mt-1">{subjectErrors[idx]?.marks_per_question}</span>
                          )}
                        </Stack>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 border-border-subtle/30">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Stack direction="row" align="center" gap="sm">
                      <Label>Running Questions Sum:</Label>
                      <Badge variant={isSumValid ? 'success' : 'danger'} className="!font-bold text-xs">{runningQuestionsSum} / {totalQuestions}</Badge>
                    </Stack>
                    <Stack direction="row" align="center" gap="sm">
                      <Label>Total Calculated Marks:</Label>
                      <Badge variant={runningMarksSum === Number(totalMarks) ? 'success' : 'warning'} className="!font-bold text-xs">{runningMarksSum} / {totalMarks}</Badge>
                    </Stack>
                  </div>
                  {subjectsError && (
                    <span id="subjects-error" aria-live="polite" className="flex items-center gap-1.5 text-danger text-[10px] font-bold uppercase tracking-wider">
                      <AlertCircle size={14} /> {subjectsError}
                    </span>
                  )}
                </div>
              </Card>

              <div className="pt-6 border-t flex justify-end gap-3 border-border-subtle/30">
                {/* BUG-F: Cancel routes through the single close path so the
                 *  form, validation and error state reset exactly like
                 *  X / Escape / scrim-close do. */}
                <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>Deploy dynamic exam</Button>
              </div>
            </form>
    </AdminModal>
    </>
  )
}
