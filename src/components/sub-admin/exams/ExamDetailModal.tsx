import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  HelpCircle, 
  Trophy, 
  Copy, 
  Check, 
  AlertCircle,
  User,
  History,
  FileText
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { IconBadge } from '../../common/AntigravityUI'

interface ExamDetailModalProps {
  exam: { id: string; title?: string; [key: string]: any }
  onClose: () => void
}

export default function ExamDetailModal({ exam, onClose }: ExamDetailModalProps) {
  const { breakpoint } = useBreakpoint()
  const mountedRef = useRef(true)
  useEffect(() => { return () => { mountedRef.current = false } }, [])
  
  // ── State
  const [activeTab, setActiveTab] = useState<'questions' | 'leaderboard'>('questions')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ questions: any[], leaderboard: any[] }>({ questions: [], leaderboard: [] })
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ── Responsive Configuration
  const getConfig = () => {
    const scales: Record<string, any> = {
      width:    { xs: '100%', sm: '90%',  md: '90%',  lg: '70%',  xl: '60%' },
      height:   { xs: '100%', sm: 'auto',  md: 'auto',  lg: 'auto',  xl: 'auto' },
      maxH:     { xs: '100vh', sm: '85vh', md: '80vh', lg: '80vh', xl: '80vh' },
      padding:  { xs: 12,     sm: 16,     md: 20,     lg: 20,     xl: 24 },
      titleSize: { xs: 16,     sm: 18,     md: 18,     lg: 20,     xl: 22 },
      tabSize:  { xs: 12,     sm: 13,     md: 14,     lg: 14,     xl: 15 },
      textSize: { xs: 11,     sm: 13,     md: 14,     lg: 14,     xl: 15 }
    }
    const get = (key: string) => scales[key][breakpoint] || scales[key].xs
    return {
      width: get('width'),
      height: get('height'),
      maxHeight: get('maxH'),
      padding: `${get('padding')}px`,
      titleSize: `${get('titleSize')}px`,
      tabSize: `${get('tabSize')}px`,
      textSize: `${get('textSize')}px`
    }
  }

  const { width, height, maxHeight, padding, titleSize } = getConfig()

  // ── Data Fetching
  const fetchDetails = async () => {
    if (!mountedRef.current) return
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Questions
      const { data: questions, error: qErr } = await supabase
        .from('teacher_exam_questions')
        .select(`
          *,
          question_text_en,
          option_a_en, option_b_en, option_c_en, option_d_en,
          explanation_en
        `)
        .eq('teacher_exam_id', exam.id)
        .order('display_order', { ascending: true })

      if (qErr) throw qErr

      // 2. Fetch Leaderboard
      // Sort by score DESC, duration_seconds ASC
      const { data: leaderboard, error: lErr } = await supabase
        .from('attempts')
        .select('*, users(full_name)')
        .eq('teacher_exam_id', exam.id)
        .eq('status', 'completed')
        .order('score', { ascending: false })
        .order('duration_seconds', { ascending: true })
        .limit(50)

      if (lErr) throw lErr
      if (!mountedRef.current) return

      setData({
        questions: questions || [],
        leaderboard: leaderboard || []
      })
    } catch (err: any) {
      if (!mountedRef.current) return
      setError('System protocols failed to retrieve the requested intelligence.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [exam.id])

  // ── Logic
  const handleCopy = () => {
    if (data.leaderboard.length === 0) return
    
    let text = `Exam: ${exam.title}\n\n`
    data.leaderboard.forEach((entry, i) => {
      const minutes = Math.floor((entry.duration_seconds || 0) / 60)
      text += `${i + 1}. ${entry.users?.full_name || 'Student'} - ${entry.score}/${entry.total_marks} - ${minutes} min\n`
    })

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => { if (mountedRef.current) setCopied(false) }, 2000)
  }

  // ── Sub-Renderers
  const renderQuestions = () => {
    if (data.questions.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3">
        <HelpCircle size={48} />
        <span className="text-sm font-black uppercase tracking-widest">No questions found in vault</span>
      </div>
    )

    return (
      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <div key={q.id} className="bg-hover-bg/20 border border-border-subtle/50 rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                {i + 1}
              </div>
              <div className="space-y-4 flex-1">
                <p className="font-bold text-text-primary leading-relaxed" style={{ fontSize: breakpoint === 'xs' ? '13px' : '15px' }}>
                  {/* Phase 5: English exclusively from _en fields */}
                  {q.question_text_en?.trim() || 'Untitled Question'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isCorrect = q.correct_option === opt
                    const lowerOpt = opt.toLowerCase()
                    
                    // Phase 5: English exclusively from _en fields
                    const text = (q[`option_${lowerOpt}_en` as keyof typeof q] as string)?.trim() || ''
                    
                    return (
                      <div 
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isCorrect 
                            ? 'bg-success/5 border-success/30 text-success' 
                            : 'bg-card-bg/50 border-border-subtle/30 text-text-secondary opacity-60'
                        }`}
                      >
                        <span className="font-black text-xs w-5 h-5 rounded-md bg-current/5 flex items-center justify-center">{opt}</span>
                        <span className="text-xs font-bold leading-tight">{text}</span>
                      </div>
                    )
                  })}
                </div>

                {q.explanation_en && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Intelligence Report</span>
                    <p className="text-xs text-text-secondary font-medium leading-relaxed italic">
                      {/* Phase 5: English exclusively from _en fields */}
                      "{q.explanation_en?.trim()}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLeaderboard = () => {
    if (data.leaderboard.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3">
        <Trophy size={48} />
        <span className="text-sm font-black uppercase tracking-widest">No students attempted this exam</span>
      </div>
    )

    if (breakpoint === 'xs') {
      return (
        <div className="space-y-3">
          {data.leaderboard.map((entry, idx) => (
            <div key={entry.id} className="bg-hover-bg/20 border border-border-subtle/50 rounded-2xl p-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-warning/20 text-warning' : 
                    idx === 1 ? 'bg-text-secondary/20 text-white' :
                    idx === 2 ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-text-primary uppercase tracking-tight truncate max-w-[120px]">
                      {entry.users?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-[9px] text-text-secondary font-black opacity-50 uppercase">
                      {Math.floor((entry.duration_seconds || 0) / 60)} min • Accuracy: {entry.accuracy}%
                    </span>
                  </div>
               </div>
               <div className="text-right">
                  <span className="text-sm font-black text-primary">
                    {entry.score}<span className="opacity-40 text-[10px]">/{entry.total_marks}</span>
                  </span>
               </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="w-full overflow-hidden border border-border-subtle/50 rounded-2xl bg-card-bg/20">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-hover-bg/30 border-b border-border-subtle/40">
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 w-16">Rank</th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Candidate</th>
              <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Score</th>
              <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Time</th>
              <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {data.leaderboard.map((entry, idx) => (
              <tr key={entry.id} className="hover:bg-hover-bg/20 transition-colors group">
                <td className="px-5 py-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-warning/20 text-warning' : 
                    idx === 1 ? 'bg-text-secondary/20 text-white' :
                    idx === 2 ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'
                  }`}>
                    #{idx + 1}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <IconBadge
                      icon={User}
                      size="md"
                      shape="circle"
                      className="bg-card-bg border border-border-subtle/50 text-text-secondary"
                      darkClassName="rounded-full bg-card-bg border border-border-subtle/50 text-text-secondary"
                    />
                    <span className="text-sm font-black text-text-primary uppercase tracking-tight">
                      {entry.users?.full_name || 'Anonymous Student'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-sm font-black text-primary">
                    {entry.score}<span className="opacity-40 text-[10px]">/{entry.total_marks}</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-center text-xs font-bold text-text-secondary">
                  {Math.floor((entry.duration_seconds || 0) / 60)}m {entry.duration_seconds % 60}s
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                    entry.accuracy >= 80 ? 'bg-success/5 border-success/20 text-success' :
                    entry.accuracy >= 50 ? 'bg-warning/5 border-warning/20 text-warning' : 'bg-danger/5 border-danger/20 text-danger'
                  }`}>
                    {entry.accuracy}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        layoutId={`exam-${exam.id}`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card-bg border border-border-subtle/50 flex flex-col shadow-2xl overflow-hidden"
        style={{ width, height, maxHeight, borderRadius: breakpoint === 'xs' ? '0' : '32px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle/30" style={{ padding }}>
          <div className="flex items-center gap-4">
            <IconBadge
              icon={FileText}
              size="xl"
              className="bg-primary/10 text-primary shadow-sm"
              darkClassName="rounded-2xl bg-primary/10 text-primary shadow-sm"
            />
            <div className="flex flex-col">
              <h2 className="font-black text-text-primary tracking-tight uppercase truncate max-w-[200px] md:max-w-[400px]" style={{ fontSize: titleSize }}>
                {exam.title}
              </h2>
              <div className="flex items-center gap-3 text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-[0.2em]">
                <span>ID: {exam.id.slice(0, 8)}</span>
                <span className="w-1 h-1 rounded-full bg-current" />
                <span>{new Date(exam.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-hover-bg/30 flex items-center justify-center text-text-secondary hover:text-white hover:bg-danger/80 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 bg-hover-bg/10 gap-1 mx-4 mt-4 rounded-2xl border border-border-subtle/20 shrink-0">
          <button 
            onClick={() => setActiveTab('questions')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'questions' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-text-secondary hover:bg-hover-bg/30'
            }`}
          >
            <HelpCircle size={14} /> Questions
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'leaderboard' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-text-secondary hover:bg-hover-bg/30'
            }`}
          >
            <Trophy size={14} /> Leaderboard
          </button>
        </div>

        {/* Action Bar (Only for Leaderboard) */}
        {activeTab === 'leaderboard' && data.leaderboard.length > 0 && (
          <div className="px-4 mt-4 flex justify-end shrink-0">
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 whitespace-nowrap ${
                copied 
                  ? 'bg-success/10 border-success/30 text-success' 
                  : 'bg-card-bg border-border-subtle/50 text-text-primary hover:border-primary/40 hover:bg-hover-bg/40'
              }`}
              style={{ width: breakpoint === 'xs' ? '100%' : 'auto' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Successfully Copied' : 'Copy Leaderboard'}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="animate-spin text-primary">
                <History size={48} />
              </div>
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em]">Decrypting Data Vault...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <AlertCircle size={48} className="text-danger opacity-40" />
              <p className="text-sm text-text-secondary font-bold uppercase max-w-xs">{error}</p>
              <button onClick={fetchDetails} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Retry Access</button>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'questions' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'questions' ? renderQuestions() : renderLeaderboard()}
            </motion.div>
          )}
        </div>

        {/* Footer/Sponsor */}
        <div className="p-4 border-t border-border-subtle/20 bg-hover-bg/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-text-primary">Live Security Sync Active</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-30">PREPAREFORU • v3.0</span>
        </div>
      </motion.div>

    </div>
  )
}
