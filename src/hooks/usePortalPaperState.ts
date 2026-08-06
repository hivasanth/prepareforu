import { useState, useEffect, useMemo } from 'react';
import { getAllowedExamIds } from '../utils/examUtils';
import { getCachedPapers } from '../services/subjectTestService';
import type { ExamPaper } from '../types/exam.types';

interface PortalPaperStateOptions {
  examSelection: string | undefined;
}

export function usePortalPaperState({ examSelection }: PortalPaperStateOptions) {
  const [papers, setPapers] = useState<ExamPaper[]>(() => {
    if (!examSelection) return [];
    return getCachedPapers(examSelection) || [];
  });
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const isAppsc = examSelection === 'APPSC_GROUPS' || examSelection === 'APPSC';

  const groupOptions = useMemo(() => {
    const allowedIds = getAllowedExamIds(examSelection || '');
    return allowedIds.map(id => ({
      id,
      label: id.replace('APPSC_', '').replace('_', ' ')
    }));
  }, [examSelection]);

  // Auto-select first paper when APPSC papers load
  useEffect(() => {
    if (!isAppsc || !papers.length || selectedPaperId) return;
    const firstPaper = papers[0];
    setActiveGroup(firstPaper.exam_id);
    setSelectedPaperId(firstPaper.id);
  }, [isAppsc, papers, selectedPaperId]);

  return {
    papers,
    setPapers,
    selectedPaperId,
    setSelectedPaperId,
    activeGroup,
    setActiveGroup,
    isFilterOpen,
    setIsFilterOpen,
    groupOptions,
    isAppsc,
  };
}
