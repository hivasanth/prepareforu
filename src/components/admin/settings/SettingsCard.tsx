import { Save } from 'lucide-react'
import { Card, Button, SectionReveal, useTheme } from '../../common/AntigravityUI'

interface SettingsCardProps {
  title: string
  icon: React.FC<{ className?: string }>
  children: React.ReactNode
  onSave: () => void
  isSaving?: boolean
}

export function SettingsCard({ title, icon: Icon, children, onSave, isSaving }: SettingsCardProps) {
  const { isDark } = useTheme()
  return (
    <SectionReveal>
      <Card variant="default" className={`h-full flex flex-col p-0 overflow-hidden ${!isDark ? 'ancient-card shadow-xl border-secondary/20' : ''}`}>
        <div className={`p-5 border-b flex items-center gap-3 ${!isDark ? 'bg-[#F4E5C4]/40 border-secondary/10' : 'bg-hover-bg/20 border-border-subtle/50'}`}>
          <div className={`p-2 rounded-xl ${!isDark ? 'ancient-icon-badge shadow-sm' : 'bg-primary/10'}`}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className={`font-black text-sm uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'}`}>{title}</span>
        </div>
        <div className="p-6 flex-1">
          {children}
        </div>
        <div className={`p-4 border-t mt-auto ${!isDark ? 'bg-[#F4E5C4]/20 border-secondary/10' : 'bg-hover-bg/10 border-border-subtle/50'}`}>
          <Button fullWidth onClick={onSave} loading={isSaving} variant="primary">
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </div>
      </Card>
    </SectionReveal>
  )
}
