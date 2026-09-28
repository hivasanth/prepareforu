import { PageContainer, Stack } from '../../components/common/AntigravityUI'
import { useExamData } from '../../components/sub-admin/exams/useExamData'
import { ExamListSection } from '../../components/sub-admin/exams/ExamListSection'
import { ExamDetailSection } from '../../components/sub-admin/exams/ExamDetailSection'

export default function SubAdminExams() {
  const {
    examsLoading, examsError,
    selectedExamId, selectedExam, activeSection, evalData, dataLoading, dataError,
    searchTerm, setSearchTerm,
    yearFilter, setYearFilter, yearOptions,
    monthFilter, setMonthFilter, monthOptions, filteredExams,
    activeFilter, handleFilterChange, filterCounts, activeFilterResults,
    fetchExams, fetchEvalData, handleExamChange, handleSectionChange, handleBack,
    summaryStats, scoreDistribution,
  } = useExamData()

  return (
    <PageContainer className="min-h-[calc(100vh-16px)]">
      <Stack gap="lg">
        {selectedExam ? (
          <ExamDetailSection
            selectedExam={selectedExam}
            activeSection={activeSection}
            evalData={evalData}
            dataLoading={dataLoading}
            dataError={dataError}
            summaryStats={summaryStats}
            scoreDistribution={scoreDistribution}
            onBack={handleBack}
            onSectionChange={handleSectionChange}
            onRetry={() => selectedExamId && fetchEvalData(selectedExamId)}
          />
        ) : (
          <ExamListSection
            examsLoading={examsLoading}
            examsError={examsError}
            filteredExams={filteredExams}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            filterCounts={filterCounts}
            activeFilterResults={activeFilterResults}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            yearFilter={yearFilter}
            onYearChange={setYearFilter}
            yearOptions={yearOptions}
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
