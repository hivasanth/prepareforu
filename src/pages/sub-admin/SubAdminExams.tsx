import { PageContainer, Stack } from '../../components/common/AntigravityUI'
import { useExamData } from '../../components/sub-admin/exams/useExamData'
import { ExamListSection } from '../../components/sub-admin/exams/ExamListSection'
import { ExamDetailSection } from '../../components/sub-admin/exams/ExamDetailSection'

export default function SubAdminExams() {
  const {
    exams, examsLoading, examsError,
    selectedExamId, selectedExam, evalData, dataLoading, dataError,
    searchTerm, setSearchTerm,
    monthFilter, setMonthFilter,
    monthOptions, filteredExams,
    fetchExams, handleExamChange,
    summaryStats, scoreDistribution,
    topPerformers, bottomPerformers,
  } = useExamData()

  const handleBack = () => {
    handleExamChange('')
  }

  return (
    <PageContainer>
      <Stack gap="lg" className="overflow-x-hidden">
        {selectedExam ? (
          <ExamDetailSection
            selectedExam={selectedExam}
            evalData={evalData}
            dataLoading={dataLoading}
            dataError={dataError}
            summaryStats={summaryStats}
            scoreDistribution={scoreDistribution}
            topPerformers={topPerformers}
            bottomPerformers={bottomPerformers}
            onBack={handleBack}
            onRetry={() => selectedExamId && handleExamChange(selectedExamId)}
          />
        ) : (
          <ExamListSection
            exams={exams}
            examsLoading={examsLoading}
            examsError={examsError}
            filteredExams={filteredExams}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            monthFilter={monthFilter}
            onMonthChange={setMonthFilter}
            monthOptions={monthOptions}
            onRefresh={fetchExams}
            onSelectExam={handleExamChange}
          />
        )}
      </Stack>
    </PageContainer>
  )
}
