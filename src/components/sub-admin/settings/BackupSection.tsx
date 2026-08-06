import { Database, Users, BookOpen } from 'lucide-react'
import { Card, Stack, Label, Body, Button } from '../../../components/common/AntigravityUI'

interface BackupSectionProps {
  exportingStudents: boolean
  onExportStudents: () => void
  exportingExams: boolean
  onExportExams: () => void
}

export function BackupSection({ exportingStudents, onExportStudents, exportingExams, onExportExams }: BackupSectionProps) {
  return (
    <Card variant="default" className="p-8">
      <Stack gap="lg">
        <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
          <Database size={18} className="text-primary" />
          <Label>Operational Backups</Label>
        </Stack>

        <Body secondary>Download full records of your student cohort and examination history in CSV format.</Body>

        <Stack direction="row" gap="md">
          <Button variant="secondary" onClick={onExportStudents} loading={exportingStudents} className="flex-1">
            <Users size={16} className="mr-2" /> Students
          </Button>
          <Button variant="secondary" onClick={onExportExams} loading={exportingExams} className="flex-1">
            <BookOpen size={16} className="mr-2" /> Exams
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}
