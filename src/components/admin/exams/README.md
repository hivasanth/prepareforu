# Admin Exams

Feature directory for Admin → Exams configuration and management.

## Architecture

```
AdminSettings.tsx (page, 105 lines)
└── useAdminExams (hook, 126 lines) — fetch config/subjects, save params/subjects
    ├── useAdminFilters (shared — exam/paper/subject selection)
    ├── useAsyncOperation (shared — loading state)
    ├── useToast (shared — notifications)
    └── adminService → exam.repository (Supabase)
├── SubjectDistributionPanel — pie chart + subject rows + running total
│   ├── SubjectPieChart — Recharts donut chart
│   └── SubjectCardItem — individual subject row (questions/marks inputs)
├── ExamParamsForm — questions, marks, duration, published, negative marking, multiple attempts
├── SettingsCard — card wrapper with title, icon, save button
└── AddExamModal — full exam creation form with papers and subjects
```

## Key Decisions

- `useAdminExams` owns all state (`config`, `subjects`, `isSaving`, `tabsKey`, `isModalOpen`)
- Config is a merged view of ExamConfig + paper-specific fields (total_questions, etc.)
- `handleSave(key, fn)` wrapper manages per-section saving state via `Record<string, boolean>`
- `saveConfig` syncs to paper when specific paper selected, or to config + all papers when "all papers"
- `saveSubjects` validates running total matches config total before batch update
- `tabsKey` increment forces AdminSelectionTabs remount after exam creation
- Subject scroll-to on load via `useEffect` with `selectedSubject`
- All presentational components wrapped in `memo`
- Existing `components/admin/settings/` components used directly (SettingsCard, SubjectCardItem, SubjectPieChart, AddExamModal)
