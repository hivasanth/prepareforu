import { TestConfigView } from '../../../components/user/TestConfigView'

interface SubjectConfigViewProps {
  selectedSubject: string;
  subjectCounts: Record<string, number>;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  isLaunching: boolean;
  onLaunch: () => void;
  onBack: () => void;
}

export function SubjectConfigView(props: SubjectConfigViewProps) {
  return (
    <TestConfigView
      title={props.selectedSubject}
      options={[30, 50, 80]}
      totalQuestions={props.subjectCounts[props.selectedSubject] || 0}
      questionCount={props.questionCount}
      setQuestionCount={props.setQuestionCount}
      isLaunching={props.isLaunching}
      onLaunch={props.onLaunch}
      onBack={props.onBack}
    />
  );
}
