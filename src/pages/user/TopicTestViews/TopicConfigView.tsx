import { useEffect, useMemo } from 'react'
import { TestConfigView } from '../../../components/user/TestConfigView'

interface TopicConfigViewProps {
  selectedSubject: string;
  subjectCounts: Record<string, number>;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  isLaunching: boolean;
  onLaunch: () => void;
  onBack: () => void;
}

export function TopicConfigView(props: TopicConfigViewProps) {
  const totalQuestions = props.subjectCounts[props.selectedSubject] || 0;

  const options = useMemo(() => {
    let opts = [10, 20, 30].filter(cnt => cnt <= totalQuestions);
    if (totalQuestions > 0 && !opts.includes(totalQuestions) && totalQuestions < 30) {
      opts.push(totalQuestions);
    }
    opts.sort((a, b) => a - b);
    return opts.length === 0 ? [10, 20, 30] : opts;
  }, [totalQuestions]);

  useEffect(() => {
    if (totalQuestions > 0 && props.questionCount > totalQuestions) {
      const valid = [10, 20, 30].filter(c => c <= totalQuestions);
      if (valid.length > 0) props.setQuestionCount(valid[0]);
    }
  }, [totalQuestions, props.questionCount, props.setQuestionCount]);

  return (
    <TestConfigView
      title={props.selectedSubject}
      options={options}
      totalQuestions={totalQuestions}
      questionCount={props.questionCount}
      setQuestionCount={props.setQuestionCount}
      isLaunching={props.isLaunching}
      onLaunch={props.onLaunch}
      onBack={props.onBack}
    />
  );
}
