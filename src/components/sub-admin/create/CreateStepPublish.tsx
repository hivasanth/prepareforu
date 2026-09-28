import { ChevronLeft, Rocket, BookOpen, Clock, BarChart3, AlertCircle } from 'lucide-react'
import { Button, IconBadge, Alert } from '../../common/AntigravityUI'
import type { ExamConfig, QuestionData } from './types'

interface CreateStepPublishProps {
  examConfig: ExamConfig
  questions: QuestionData[]
  onPublish: () => void
  onBack: () => void
  isPublishing: boolean
  publishError: string | null
}

export function CreateStepPublish({ examConfig, questions, onPublish, onBack, isPublishing, publishError }: CreateStepPublishProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card-bg border border-border-subtle/20 rounded-2xl p-5">
        <div className="grid gap-3 grid-cols-3">
          {[
            { icon: BookOpen,  label: 'Questions',   value: `${questions.length}` },
            { icon: Clock,     label: 'Duration',    value: `${examConfig.duration_minutes}m` },
            { icon: BarChart3, label: 'Total Marks', value: `${questions.length * examConfig.marks_per_question}` }
          ].map((stat, i) => (
            <div key={i} className="bg-card-bg border border-border-subtle/20 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
              <IconBadge
                icon={stat.icon}
                size="md"
                className="bg-primary/10 text-primary"
                darkClassName="rounded-xl bg-primary/10 text-primary"
              />
              <span className="text-lg font-black text-text-primary leading-none">{stat.value}</span>
              <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-50">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-primary/10 flex items-center gap-3">
          <span className="font-black text-primary text-sm tracking-tight truncate">{examConfig.title || 'Untitled Exam'}</span>
          <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Verified</span>
        </div>
        <div className="divide-y divide-primary/8">
          {[
            { label: 'Start Time', value: examConfig.start_time ? new Date(examConfig.start_time).toLocaleString() : '—' },
            { label: 'End Time',   value: examConfig.end_time ? new Date(examConfig.end_time).toLocaleString() : '—' },
            { label: 'Status',     value: 'Will be Published' },
          ].map((row, i) => (
            <div key={i} className="px-5 py-3 flex justify-between items-center">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">{row.label}</span>
              <span className="text-xs font-bold text-text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {publishError && (
        <Alert variant="error" icon={AlertCircle} title="Unable to publish" className="w-full">
          {publishError}
        </Alert>
      )}

      <Button
        onClick={onPublish}
        loading={isPublishing}
        disabled={isPublishing}
        className="w-full shadow-xl shadow-primary/30 h-[58px]"
      >
        <Rocket size={18} /> Publish Exam
      </Button>

      <div className="flex justify-center">
        <Button
          variant="soft"
          onClick={onBack}
          disabled={isPublishing}
          className="h-10"
        >
          <ChevronLeft size={16} /> Go Back
        </Button>
      </div>
    </div>
  )
}
