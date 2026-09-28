import { motion } from 'framer-motion'
import { Rocket, Plus, BookOpen, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MOTION_DURATION, MOTION_EASE } from '../../common/AntigravityMotion'
import { Button } from '../../common/AntigravityUI'

interface SuccessViewProps {
  examTitle: string
  onReset: () => void
}

export function SuccessView({ examTitle, onReset }: SuccessViewProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.emphasized }}
      className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8"
    >
      <div className="relative">
        <div className="absolute inset-0 blur-[60px] rounded-full scale-[2] animate-pulse pointer-events-none bg-primary/20" />
        <div className="relative w-36 h-36 rounded-full border-2 flex items-center justify-center shadow-2xl backdrop-blur-sm bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <Rocket size={64} className="text-primary drop-shadow-lg" style={{ animation: 'bounce 2s infinite' }} />
        </div>
        <div className="absolute inset-[-12px] rounded-full border border-primary/10 animate-ping duration-[3s]" />
        <div className="absolute inset-[-24px] rounded-full border border-primary/5" />
      </div>

      <div className="space-y-3 max-w-md">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2">
          <Check size={12} />
          Published Successfully
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter">Mission Accomplished</h1>
        <p className="text-text-secondary font-medium leading-relaxed text-sm">
          Your exam <span className="text-primary font-black">"{examTitle}"</span> is now live and accessible to your students.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
        <Button
          onClick={() => navigate('/sub-admin/my-exams')}
          className="flex-1 h-[52px]"
        >
          <BookOpen size={15} /> View My Exams
        </Button>
        <Button
          onClick={onReset}
          variant="soft"
          className="flex-1 h-[52px]"
        >
          <Plus size={15} /> Create Another
        </Button>
      </div>
    </motion.div>
  )
}
