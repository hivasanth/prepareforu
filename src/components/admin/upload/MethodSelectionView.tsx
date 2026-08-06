import { PlusCircle, FileJson, Sparkles } from 'lucide-react'
import { Stack, SectionReveal, Grid, Card, Body, Badge } from '../../common/AntigravityUI'
import { AdminIconWrap } from '../../common/AdminIconWrap'
import { AdminText } from '../../common/AdminText'

interface MethodSelectionViewProps {
  onSelect: (type: 'single' | 'bulk') => void
}

export function MethodSelectionView({ onSelect }: MethodSelectionViewProps) {
  return (
    <SectionReveal>
      <Stack gap="xl">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-8">
          <Badge variant="primary" className="mb-4">Upload Method</Badge>
          <AdminText as="h1" variant="cinzel" className="text-3xl font-black mb-4 uppercase tracking-tighter">
            How do you want to upload?
          </AdminText>
          <Body secondary>
            Choose a method to add questions to your database.
          </Body>
        </div>

        <Grid cols={2} gap={24} className="max-md:grid-cols-1">
          <Card
            variant="elevated"
            className="h-full flex flex-col p-8 group relative overflow-hidden cursor-pointer transition-all hover:border-primary/50"
            onClick={() => onSelect('single')}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect('single') }}
          >
            <AdminIconWrap size="lg" rounded="lg" className="mb-6 transition-all group-hover:scale-110 shadow-xl shadow-primary/20">
              <PlusCircle size={28} />
            </AdminIconWrap>
            <div className="flex-1">
              <AdminText as="h3" variant="cinzel" className="text-xl font-bold mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                Add One by One
              </AdminText>
              <Body secondary>
                Type each question manually with full control over formatting.
              </Body>
            </div>
            <div className="mt-8 pt-6 border-t border-border-subtle/30 flex items-center justify-between text-primary font-bold text-xs uppercase tracking-widest">
              Go to Manual Entry →
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-primary group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <PlusCircle size={140} strokeWidth={1} />
            </div>
          </Card>

          <Card
            variant="elevated"
            className="h-full flex flex-col p-8 group relative overflow-hidden cursor-pointer transition-all hover:border-secondary/50"
            onClick={() => onSelect('bulk')}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect('bulk') }}
          >
            <div className="flex justify-between items-start mb-6">
              <AdminIconWrap size="lg" rounded="lg" className="transition-all group-hover:scale-110 shadow-xl shadow-secondary/20">
                <FileJson size={28} />
              </AdminIconWrap>
              <Badge variant="primary" icon={Sparkles}>AI Optimized</Badge>
            </div>
            <div className="flex-1">
              <AdminText as="h3" variant="cinzel" className="text-xl font-bold mb-2 uppercase tracking-tight group-hover:text-secondary transition-colors">
                Upload Many at Once
              </AdminText>
              <Body secondary>
                Use AI to extract and upload multiple questions instantly from your documents.
              </Body>
            </div>
            <div className="mt-8 pt-6 border-t border-border-subtle/30 flex items-center justify-between text-secondary font-bold text-xs uppercase tracking-widest">
              Go to Bulk Upload →
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-secondary group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <FileJson size={140} strokeWidth={1} />
            </div>
          </Card>
        </Grid>
      </Stack>
    </SectionReveal>
  )
}
