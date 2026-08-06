# Foundation Token Keep List — Phase 5.2A

**Phase:** 5.2A (Token Ownership Verification — Review Only)
**Status:** VERIFIED, AWAITING APPROVAL
**Count:** KEEP 74 + FREEZE PROTECTED 222 + MERGE 16 + LEGACY COMPATIBILITY 1 = **313 LIVE tokens**

Categories:
- **KEEP** — LIVE canonical tokens in active use.
- **FREEZE PROTECTED** — LIVE and consumed by a certified frozen Foundation component (AntigravityUI barrel members + certified composites). Deletion/modification requires freeze-register governance (see `FOUNDATION_FREEZE_REGISTER.md`).
- **MERGE** — LIVE near-duplicate tokens resolved by a design decision in Phase 5.3 (values are identical or intentionally colliding).
- **LEGACY COMPATIBILITY** — `--border-color`: D-121 retained alias; canonical owner `--border-default`.

"Frozen consumers" lists the frozen component file(s) that consume the token; tokens may also be consumed by non-frozen files, in which case the freeze protection still applies.
| Token | Category | Def | Runtime | Tailwind | CSS | Rule | Tests | Docs | Frozen consumers |
|---|---|---|---|---|---|---|---|---|---|
| ancient-gold-bright | FREEZE PROTECTED | themes.css:660; index.css:292 | 1 | 0 | 0 | 0 | 0 | 4 | PremiumIconContainer.tsx |
| bg-app | FREEZE PROTECTED | themes.css:398; themes.css:679 | 0 | 37 | 6 | 1 | 0 | 19 | AntigravityLayout.tsx, AdminModal.tsx |
| bg-hover | FREEZE PROTECTED | themes.css:401; themes.css:682 | 2 | 124 | 19 | 4 | 0 | 30 | AntigravityForm.tsx, Navigation.tsx, AntigravityData.tsx, AntigravityButton.tsx, IconBadge.tsx, Menu.tsx, AntigravityCard.tsx, PremiumSelect.tsx |
| bg-surface | FREEZE PROTECTED | themes.css:399; themes.css:680 | 0 | 68 | 20 | 1 | 0 | 72 | Pagination.tsx, AntigravityData.tsx, AdminModal.tsx, AntigravityCard.tsx |
| border-subtle | FREEZE PROTECTED | themes.css:429; themes.css:713 | 17 | 234 | 18 | 5 | 0 | 71 | AntigravityForm.tsx, Pagination.tsx, Navigation.tsx, CollectionCard.tsx, AntigravityData.tsx, AntigravityButton.tsx, Menu.tsx, AdminModal.tsx, SegmentedFilter.tsx, AntigravityCard.tsx, PremiumSelect.tsx |
| button-border-ghost | FREEZE PROTECTED | themes.css:937 | 0 | 2 | 1 | 0 | 0 | 1 | AntigravityButton.tsx |
| button-border-secondary | FREEZE PROTECTED | themes.css:929; themes.css:1232 | 0 | 4 | 1 | 0 | 0 | 15 | AntigravityButton.tsx |
| button-shadow-secondary | FREEZE PROTECTED | themes.css:931; themes.css:1234 | 0 | 2 | 1 | 0 | 0 | 8 | AntigravityButton.tsx |
| button-shadow-secondary-hover | FREEZE PROTECTED | themes.css:932; themes.css:1235 | 0 | 2 | 1 | 0 | 0 | 2 | AntigravityButton.tsx |
| button-surface-ghost | FREEZE PROTECTED | themes.css:933 | 0 | 3 | 1 | 0 | 0 | 3 | AntigravityButton.tsx |
| button-surface-ghost-hover | FREEZE PROTECTED | themes.css:934 | 0 | 3 | 1 | 0 | 0 | 1 | AntigravityButton.tsx |
| button-surface-secondary | FREEZE PROTECTED | themes.css:926; themes.css:1230 | 0 | 2 | 1 | 0 | 0 | 10 | AntigravityButton.tsx |
| button-surface-secondary-hover | FREEZE PROTECTED | themes.css:927; themes.css:1231 | 0 | 2 | 1 | 0 | 0 | 2 | AntigravityButton.tsx |
| button-text-ghost | FREEZE PROTECTED | themes.css:935 | 0 | 3 | 1 | 0 | 0 | 1 | AntigravityButton.tsx |
| button-text-ghost-hover | FREEZE PROTECTED | themes.css:936 | 0 | 3 | 1 | 0 | 0 | 0 | AntigravityButton.tsx |
| button-text-secondary | FREEZE PROTECTED | themes.css:928 | 0 | 2 | 1 | 0 | 0 | 1 | AntigravityButton.tsx |
| card-border | FREEZE PROTECTED | themes.css:1038; themes.css:1225 | 0 | 3 | 2 | 0 | 0 | 19 | AntigravityCard.tsx |
| card-hover-shadow | FREEZE PROTECTED | themes.css:1040 | 0 | 3 | 1 | 0 | 0 | 4 | AntigravityCard.tsx |
| card-shadow | FREEZE PROTECTED | themes.css:1039; themes.css:1226 | 0 | 4 | 1 | 0 | 0 | 13 | AntigravityCard.tsx |
| checkbox-border | FREEZE PROTECTED | themes.css:940; themes.css:1237 | 0 | 1 | 1 | 0 | 0 | 10 | AntigravityForm.tsx |
| checkbox-border-checked | FREEZE PROTECTED | themes.css:944 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityForm.tsx |
| checkbox-border-focus | FREEZE PROTECTED | themes.css:942 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| checkbox-border-hover | FREEZE PROTECTED | themes.css:941 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| checkbox-surface | FREEZE PROTECTED | themes.css:939; themes.css:1236 | 0 | 1 | 1 | 0 | 0 | 6 | AntigravityForm.tsx |
| checkbox-surface-checked | FREEZE PROTECTED | themes.css:943 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| color-accent | FREEZE PROTECTED | themes.css:432; themes.css:716 | 4 | 407 | 33 | 3 | 0 | 33 | AntigravityForm.tsx, Navigation.tsx, CollectionCard.tsx, AntigravityData.tsx, AntigravityButton.tsx, AdminIconWrap.tsx, IconBadge.tsx, Menu.tsx, Alert.tsx, PremiumSelect.tsx, Pagination.tsx, AntigravityLayout.tsx, CollectionFilter.tsx, SegmentedFilter.tsx, AntigravityCard.tsx, Spinner.tsx |
| color-app-bg | FREEZE PROTECTED | index.css:50 | 0 | 37 | 0 | 0 | 0 | 0 | AntigravityLayout.tsx, AdminModal.tsx |
| color-border-subtle | FREEZE PROTECTED | index.css:69 | 2 | 234 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, Pagination.tsx, Navigation.tsx, CollectionCard.tsx, AntigravityData.tsx, AntigravityButton.tsx, Menu.tsx, AdminModal.tsx, SegmentedFilter.tsx, AntigravityCard.tsx, PremiumSelect.tsx |
| color-button-border-ghost | FREEZE PROTECTED | index.css:129 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-border-secondary | FREEZE PROTECTED | index.css:122 | 0 | 4 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-ghost | FREEZE PROTECTED | index.css:125 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-ghost-hover | FREEZE PROTECTED | index.css:126 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-secondary | FREEZE PROTECTED | index.css:119 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-secondary-hover | FREEZE PROTECTED | index.css:120 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-text-ghost | FREEZE PROTECTED | index.css:127 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-text-ghost-hover | FREEZE PROTECTED | index.css:128 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-text-secondary | FREEZE PROTECTED | index.css:121 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-card-auth-light-border | FREEZE PROTECTED | index.css:112 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-card-auth-light-surface | FREEZE PROTECTED | index.css:111 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-card-bg | FREEZE PROTECTED | index.css:51 | 0 | 68 | 0 | 0 | 0 | 1 | Pagination.tsx, AntigravityData.tsx, AdminModal.tsx, AntigravityCard.tsx |
| color-card-border | FREEZE PROTECTED | index.css:99 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-card-premium-border | FREEZE PROTECTED | index.css:106 | 0 | 6 | 0 | 0 | 0 | 0 | AntigravityLayout.tsx, AntigravityCard.tsx |
| color-card-premium-surface | FREEZE PROTECTED | index.css:105 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-checkbox-border | FREEZE PROTECTED | index.css:151 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-border-checked | FREEZE PROTECTED | index.css:155 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-border-focus | FREEZE PROTECTED | index.css:153 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-border-hover | FREEZE PROTECTED | index.css:152 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-surface | FREEZE PROTECTED | index.css:150 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-surface-checked | FREEZE PROTECTED | index.css:154 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-danger | FREEZE PROTECTED | themes.css:446; themes.css:730; index.css:45 | 1 | 128 | 3 | 1 | 0 | 7 | AntigravityData.tsx, AntigravityButton.tsx, IconBadge.tsx, Alert.tsx, AntigravityCard.tsx, AntigravityTypography.tsx |
| color-filter-border | FREEZE PROTECTED | index.css:141 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-border-active | FREEZE PROTECTED | index.css:146 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-border-hover | FREEZE PROTECTED | index.css:143 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-surface | FREEZE PROTECTED | index.css:140 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-surface-active | FREEZE PROTECTED | index.css:144 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-text | FREEZE PROTECTED | index.css:142 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-text-active | FREEZE PROTECTED | index.css:145 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-gold-300 | FREEZE PROTECTED | index.css:73 | 0 | 1 | 0 | 0 | 0 | 3 | AntigravityCard.tsx |
| color-hover-bg | FREEZE PROTECTED | index.css:53 | 0 | 124 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, Navigation.tsx, AntigravityData.tsx, AntigravityButton.tsx, IconBadge.tsx, Menu.tsx, AntigravityCard.tsx, PremiumSelect.tsx |
| color-info | FREEZE PROTECTED | themes.css:449; themes.css:733; index.css:47 | 1 | 2 | 0 | 0 | 0 | 9 | AntigravityCard.tsx |
| color-input-bg | FREEZE PROTECTED | index.css:131 | 0 | 4 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, PremiumSelect.tsx |
| color-input-border | FREEZE PROTECTED | index.css:133 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, PremiumSelect.tsx |
| color-input-border-active | FREEZE PROTECTED | index.css:137 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-input-border-hover-active | FREEZE PROTECTED | index.css:138 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-input-focus-border | FREEZE PROTECTED | index.css:134 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-input-surface-active | FREEZE PROTECTED | index.css:135 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-input-text | FREEZE PROTECTED | index.css:132 | 0 | 4 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, PremiumSelect.tsx |
| color-input-text-active | FREEZE PROTECTED | index.css:136 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-primary | FREEZE PROTECTED | index.css:41 | 0 | 407 | 0 | 0 | 0 | 4 | AntigravityForm.tsx, Navigation.tsx, CollectionCard.tsx, AntigravityData.tsx, AntigravityButton.tsx, AdminIconWrap.tsx, IconBadge.tsx, Menu.tsx, Alert.tsx, PremiumSelect.tsx, Pagination.tsx, AntigravityLayout.tsx, CollectionFilter.tsx, SegmentedFilter.tsx, AntigravityCard.tsx, Spinner.tsx |
| color-radio-border | FREEZE PROTECTED | index.css:158 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-border-checked | FREEZE PROTECTED | index.css:160 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-border-hover | FREEZE PROTECTED | index.css:159 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-dot-checked | FREEZE PROTECTED | index.css:161 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-surface | FREEZE PROTECTED | index.css:157 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-track-surface | FREEZE PROTECTED | index.css:162 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-secondary | FREEZE PROTECTED | themes.css:436; themes.css:720; index.css:43 | 1 | 30 | 1 | 0 | 0 | 10 | AntigravityCard.tsx, AntigravityData.tsx, IconBadge.tsx |
| color-sidebar | FREEZE PROTECTED | index.css:196 | 0 | 2 | 0 | 0 | 0 | 2 | Navigation.tsx |
| color-stat-card-border | FREEZE PROTECTED | index.css:168 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityCard.tsx, AntigravityData.tsx |
| color-stat-icon-bg | FREEZE PROTECTED | index.css:171 | 0 | 3 | 0 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx |
| color-stat-icon-color | FREEZE PROTECTED | index.css:172 | 0 | 3 | 0 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx |
| color-stat-label-text | FREEZE PROTECTED | index.css:170 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-stat-value-text | FREEZE PROTECTED | index.css:169 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| color-success | FREEZE PROTECTED | themes.css:440; themes.css:724; index.css:44 | 1 | 95 | 3 | 1 | 0 | 11 | AntigravityData.tsx, AntigravityButton.tsx, IconBadge.tsx, Alert.tsx, AntigravityCard.tsx |
| color-text-hint | FREEZE PROTECTED | index.css:60 | 0 | 15 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-text-muted | FREEZE PROTECTED | index.css:59 | 0 | 93 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, Pagination.tsx, AntigravityLayout.tsx, CollectionFilter.tsx, IconBadge.tsx, AntigravityTypography.tsx, CollectionHeader.tsx, PremiumSelect.tsx |
| color-text-placeholder | FREEZE PROTECTED | index.css:62 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-text-primary | FREEZE PROTECTED | index.css:56 | 0 | 211 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, Pagination.tsx, Navigation.tsx, CollectionCard.tsx, AntigravityData.tsx, CollectionFilter.tsx, AntigravityButton.tsx, Menu.tsx, AntigravityTypography.tsx, PremiumSelect.tsx |
| color-text-secondary | FREEZE PROTECTED | index.css:58 | 1 | 192 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, Pagination.tsx, AntigravityLayout.tsx, Navigation.tsx, AntigravityData.tsx, AdminModal.tsx, SegmentedFilter.tsx, AntigravityTypography.tsx, PremiumSelect.tsx |
| color-text-title | FREEZE PROTECTED | index.css:57 | 0 | 14 | 0 | 0 | 0 | 4 | AntigravityLayout.tsx, AntigravityData.tsx, AdminModal.tsx, AntigravityTypography.tsx |
| color-warning | FREEZE PROTECTED | themes.css:443; themes.css:727; index.css:46 | 1 | 75 | 1 | 0 | 0 | 5 | AntigravityData.tsx, IconBadge.tsx, Alert.tsx, AntigravityCard.tsx |
| elevation-1 | FREEZE PROTECTED | themes.css:461; themes.css:747 | 0 | 3 | 12 | 9 | 0 | 10 | AntigravityForm.tsx, AntigravityData.tsx, AntigravityCard.tsx |
| elevation-2 | FREEZE PROTECTED | themes.css:462; themes.css:748 | 0 | 10 | 11 | 2 | 0 | 31 | AntigravityForm.tsx, AntigravityButton.tsx |
| elevation-3 | FREEZE PROTECTED | themes.css:463; themes.css:749 | 0 | 11 | 10 | 6 | 0 | 11 | AntigravityButton.tsx, AntigravityCard.tsx |
| elevation-4 | FREEZE PROTECTED | themes.css:464; themes.css:750 | 0 | 2 | 3 | 2 | 0 | 10 | Menu.tsx, PremiumSelect.tsx |
| filter-border | FREEZE PROTECTED | themes.css:954 | 0 | 1 | 1 | 0 | 0 | 6 | CollectionFilter.tsx |
| filter-border-active | FREEZE PROTECTED | themes.css:959 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx |
| filter-border-hover | FREEZE PROTECTED | themes.css:956 | 0 | 1 | 1 | 0 | 0 | 1 | CollectionFilter.tsx |
| filter-shadow | FREEZE PROTECTED | themes.css:960; themes.css:1238 | 0 | 1 | 1 | 0 | 0 | 6 | CollectionFilter.tsx |
| filter-shadow-hover | FREEZE PROTECTED | themes.css:961; themes.css:1239 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx |
| filter-surface | FREEZE PROTECTED | themes.css:953 | 0 | 1 | 1 | 0 | 0 | 6 | CollectionFilter.tsx |
| filter-surface-active | FREEZE PROTECTED | themes.css:957 | 0 | 1 | 1 | 0 | 0 | 1 | CollectionFilter.tsx |
| filter-text | FREEZE PROTECTED | themes.css:955 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx |
| filter-text-active | FREEZE PROTECTED | themes.css:958 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx |
| gold-300 | FREEZE PROTECTED | themes.css:221 | 13 | 1 | 5 | 0 | 0 | 8 | AntigravityCard.tsx |
| gradient-header | FREEZE PROTECTED | themes.css:505; themes.css:790 | 2 | 0 | 2 | 0 | 0 | 13 | PremiumIconContainer.tsx |
| input-bg | FREEZE PROTECTED | themes.css:910 | 0 | 4 | 1 | 0 | 0 | 4 | AntigravityForm.tsx, PremiumSelect.tsx |
| input-border | FREEZE PROTECTED | themes.css:912; index.css:269 | 0 | 2 | 0 | 0 | 0 | 28 | AntigravityForm.tsx, PremiumSelect.tsx |
| input-border-active | FREEZE PROTECTED | themes.css:919 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx |
| input-border-hover-active | FREEZE PROTECTED | themes.css:920 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx |
| input-focus-border | FREEZE PROTECTED | themes.css:914 | 0 | 1 | 1 | 0 | 0 | 2 | AntigravityForm.tsx |
| input-surface-active | FREEZE PROTECTED | themes.css:917 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx |
| input-text | FREEZE PROTECTED | themes.css:911 | 0 | 4 | 1 | 0 | 0 | 2 | AntigravityForm.tsx, PremiumSelect.tsx |
| input-text-active | FREEZE PROTECTED | themes.css:918 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx |
| management-accent | FREEZE PROTECTED | themes.css:1186; themes.css:1265 | 5 | 0 | 0 | 0 | 1 | 20 | AntigravityForm.tsx, CollectionFilter.tsx, AntigravityButton.tsx |
| management-border | FREEZE PROTECTED | themes.css:1180; themes.css:1259 | 8 | 0 | 1 | 1 | 1 | 62 | AntigravityForm.tsx, CollectionFilter.tsx, Menu.tsx, AdminModal.tsx |
| management-border-active | FREEZE PROTECTED | themes.css:1183; themes.css:1262 | 1 | 0 | 0 | 0 | 0 | 7 | CollectionFilter.tsx |
| management-border-hover | FREEZE PROTECTED | themes.css:1182; themes.css:1261 | 2 | 0 | 0 | 0 | 0 | 8 | CollectionFilter.tsx, AntigravityCard.tsx |
| management-border-strong | FREEZE PROTECTED | themes.css:1181; themes.css:1260 | 3 | 0 | 0 | 0 | 0 | 12 | AntigravityLayout.tsx, AntigravityButton.tsx, AntigravityCard.tsx |
| management-shadow | FREEZE PROTECTED | themes.css:1184; themes.css:1263 | 8 | 0 | 1 | 1 | 0 | 35 | AntigravityLayout.tsx, CollectionFilter.tsx, AntigravityButton.tsx, Menu.tsx, AntigravityCard.tsx |
| management-shadow-hover | FREEZE PROTECTED | themes.css:1185; themes.css:1264 | 4 | 0 | 1 | 1 | 0 | 10 | CollectionFilter.tsx, AntigravityButton.tsx, AntigravityCard.tsx |
| management-surface | FREEZE PROTECTED | themes.css:1176; themes.css:1255 | 15 | 0 | 1 | 1 | 1 | 66 | AntigravityForm.tsx, AntigravityLayout.tsx, CollectionFilter.tsx, Menu.tsx, AdminModal.tsx, AntigravityCard.tsx |
| management-surface-active | FREEZE PROTECTED | themes.css:1179; themes.css:1258 | 1 | 0 | 0 | 0 | 0 | 4 | CollectionFilter.tsx |
| management-surface-hover | FREEZE PROTECTED | themes.css:1178; themes.css:1257 | 1 | 0 | 0 | 0 | 0 | 5 | AntigravityButton.tsx |
| management-surface-muted | FREEZE PROTECTED | themes.css:1177; themes.css:1256 | 2 | 0 | 0 | 0 | 0 | 10 | AntigravityButton.tsx |
| material-button-primary-border | FREEZE PROTECTED | themes.css:1077 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| material-button-primary-shadow | FREEZE PROTECTED | themes.css:1078 | 3 | 0 | 0 | 0 | 0 | 1 | AntigravityButton.tsx |
| material-button-primary-surface | FREEZE PROTECTED | themes.css:1076 | 1 | 0 | 0 | 0 | 0 | 3 | AntigravityButton.tsx |
| material-button-primary-text | FREEZE PROTECTED | themes.css:1079 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| material-card-auth-light-border | FREEZE PROTECTED | themes.css:1069 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx |
| material-card-auth-light-shadow | FREEZE PROTECTED | themes.css:1070 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx |
| material-card-auth-light-surface | FREEZE PROTECTED | themes.css:1068 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx |
| material-card-premium-border | FREEZE PROTECTED | themes.css:1062; themes.css:1227 | 0 | 6 | 1 | 0 | 0 | 13 | AntigravityLayout.tsx, AntigravityCard.tsx |
| material-card-premium-shadow | FREEZE PROTECTED | themes.css:1063 | 0 | 4 | 1 | 0 | 0 | 12 | AntigravityLayout.tsx, AntigravityCard.tsx |
| material-card-premium-surface | FREEZE PROTECTED | themes.css:1051 | 0 | 1 | 1 | 0 | 0 | 7 | AntigravityCard.tsx |
| material-input-compact-height | FREEZE PROTECTED | themes.css:1084 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| material-input-compact-padding | FREEZE PROTECTED | themes.css:1086 | 2 | 0 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| material-input-compact-text | FREEZE PROTECTED | themes.css:1085 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| material-tab-pill-border | FREEZE PROTECTED | themes.css:1099 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| material-tab-pill-shadow-light | FREEZE PROTECTED | themes.css:1100 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityData.tsx |
| material-tab-pill-surface | FREEZE PROTECTED | themes.css:1098 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| material-tab-text-hover | FREEZE PROTECTED | themes.css:1106 | 2 | 0 | 0 | 0 | 0 | 0 | AntigravityData.tsx, SegmentedFilter.tsx |
| material-tab-text-inactive | FREEZE PROTECTED | themes.css:1105 | 2 | 0 | 0 | 0 | 0 | 0 | AntigravityData.tsx, SegmentedFilter.tsx |
| material-tab-track-border | FREEZE PROTECTED | themes.css:1096 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| material-tab-track-shadow | FREEZE PROTECTED | themes.css:1097 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityData.tsx |
| material-tab-track-surface | FREEZE PROTECTED | themes.css:1095 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| placeholder-color | FREEZE PROTECTED | themes.css:494; themes.css:704 | 0 | 2 | 1 | 0 | 0 | 0 | AntigravityForm.tsx |
| radio-border | FREEZE PROTECTED | themes.css:947 | 0 | 1 | 1 | 0 | 0 | 2 | AntigravityForm.tsx |
| radio-border-checked | FREEZE PROTECTED | themes.css:949 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| radio-border-hover | FREEZE PROTECTED | themes.css:948 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| radio-dot-checked | FREEZE PROTECTED | themes.css:950 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| radio-surface | FREEZE PROTECTED | themes.css:946 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| radio-track-surface | FREEZE PROTECTED | themes.css:951 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx |
| radius-stat-card-radius | FREEZE PROTECTED | index.css:174 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| radius-stat-icon-radius | FREEZE PROTECTED | index.css:175 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-2xl | FREEZE PROTECTED | themes.css:458; themes.css:743; index.css:88 | 0 | 30 | 4 | 2 | 0 | 3 | AdminModal.tsx |
| shadow-button-secondary | FREEZE PROTECTED | index.css:123 | 0 | 2 | 0 | 0 | 0 | 1 | AntigravityButton.tsx |
| shadow-button-secondary-hover | FREEZE PROTECTED | index.css:124 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| shadow-card-auth-light | FREEZE PROTECTED | index.css:113 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-card-hover-shadow | FREEZE PROTECTED | index.css:101 | 0 | 3 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-card-premium | FREEZE PROTECTED | index.css:107 | 0 | 4 | 0 | 0 | 0 | 5 | AntigravityLayout.tsx, AntigravityCard.tsx |
| shadow-card-shadow | FREEZE PROTECTED | index.css:100 | 0 | 4 | 0 | 0 | 0 | 6 | AntigravityCard.tsx |
| shadow-elevation-1 | FREEZE PROTECTED | index.css:91 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityData.tsx, AntigravityCard.tsx |
| shadow-elevation-2 | FREEZE PROTECTED | index.css:92 | 0 | 10 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityButton.tsx |
| shadow-elevation-3 | FREEZE PROTECTED | index.css:93 | 0 | 11 | 0 | 0 | 0 | 0 | AntigravityButton.tsx, AntigravityCard.tsx |
| shadow-elevation-4 | FREEZE PROTECTED | index.css:94 | 0 | 2 | 0 | 0 | 0 | 0 | Menu.tsx, PremiumSelect.tsx |
| shadow-filter | FREEZE PROTECTED | index.css:147 | 0 | 1 | 0 | 0 | 0 | 3 | CollectionFilter.tsx |
| shadow-filter-hover | FREEZE PROTECTED | index.css:148 | 0 | 1 | 0 | 0 | 0 | 1 | CollectionFilter.tsx |
| shadow-md | FREEZE PROTECTED | themes.css:455; themes.css:740; index.css:85 | 0 | 18 | 7 | 1 | 0 | 4 | Navigation.tsx |
| shadow-premium-card | FREEZE PROTECTED | index.css:183 | 0 | 5 | 0 | 0 | 0 | 3 | AntigravityCard.tsx |
| shadow-premium-elevated | FREEZE PROTECTED | index.css:184 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-sm | FREEZE PROTECTED | themes.css:454; themes.css:739; index.css:84 | 0 | 58 | 13 | 6 | 0 | 6 | AntigravityForm.tsx, AntigravityLayout.tsx, Navigation.tsx |
| shadow-stat-card-shadow | FREEZE PROTECTED | index.css:173 | 0 | 1 | 0 | 0 | 0 | 2 | AntigravityCard.tsx |
| shadow-tab-pill-light | FREEZE PROTECTED | index.css:166 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityData.tsx |
| shadow-tab-track | FREEZE PROTECTED | index.css:165 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityData.tsx |
| shadow-xl | FREEZE PROTECTED | themes.css:457; themes.css:742; index.css:87 | 0 | 26 | 2 | 0 | 0 | 3 | Navigation.tsx |
| sidebar-bg | FREEZE PROTECTED | themes.css:988; themes.css:1198 | 0 | 2 | 5 | 3 | 0 | 21 | Navigation.tsx |
| space-0 | FREEZE PROTECTED | themes.css:301 | 1 | 227 | 1 | 0 | 0 | 2 | AntigravityLayout.tsx, AdminModal.tsx, AntigravityCard.tsx, Pagination.tsx, AntigravityData.tsx, AntigravityTypography.tsx, SuccessModal.tsx, Alert.tsx, CollectionCard.tsx, SegmentedFilter.tsx, AdminFilterBar.tsx |
| space-1 | FREEZE PROTECTED | themes.css:302 | 2 | 283 | 1 | 0 | 0 | 1 | AntigravityLayout.tsx, AntigravityForm.tsx, AntigravityData.tsx, Pagination.tsx, CollectionHeader.tsx, CollectionFilter.tsx, PremiumSelect.tsx, Menu.tsx, CollectionCard.tsx, AntigravityCard.tsx, Navigation.tsx, AntigravityButton.tsx, SegmentedFilter.tsx |
| space-10 | FREEZE PROTECTED | themes.css:309 | 1 | 68 | 1 | 0 | 0 | 1 | AntigravityLayout.tsx, AntigravityCard.tsx, AntigravityButton.tsx, AntigravityForm.tsx, IconBadge.tsx |
| space-12 | FREEZE PROTECTED | themes.css:310 | 2 | 41 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, AntigravityForm.tsx, AntigravityData.tsx, IconBadge.tsx, AntigravityCard.tsx, Spinner.tsx |
| space-16 | FREEZE PROTECTED | themes.css:311 | 1 | 34 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, IconBadge.tsx, AntigravityCard.tsx |
| space-2 | FREEZE PROTECTED | themes.css:303 | 2 | 314 | 1 | 0 | 0 | 3 | AntigravityLayout.tsx, AntigravityForm.tsx, SegmentedFilter.tsx, Pagination.tsx, AntigravityData.tsx, Navigation.tsx, Menu.tsx, AdminModal.tsx, CollectionCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, AntigravityCard.tsx, Alert.tsx, PremiumSelect.tsx |
| space-20 | FREEZE PROTECTED | themes.css:312 | 1 | 16 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, Navigation.tsx, IconBadge.tsx, AntigravityCard.tsx |
| space-24 | FREEZE PROTECTED | themes.css:313 | 1 | 25 | 1 | 0 | 0 | 1 | AntigravityLayout.tsx, IconBadge.tsx, AntigravityCard.tsx |
| space-3 | FREEZE PROTECTED | themes.css:304 | 2 | 296 | 1 | 0 | 0 | 3 | AntigravityLayout.tsx, AntigravityForm.tsx, Navigation.tsx, AntigravityData.tsx, AntigravityCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, SegmentedFilter.tsx, PremiumSelect.tsx, Menu.tsx, Alert.tsx, CollectionCard.tsx, AdminModal.tsx, AdminFilterBar.tsx, CollectionHeader.tsx |
| space-4 | FREEZE PROTECTED | themes.css:305 | 2 | 413 | 1 | 0 | 0 | 2 | AntigravityLayout.tsx, AdminModal.tsx, AntigravityCard.tsx, AntigravityForm.tsx, AntigravityData.tsx, CollectionFilter.tsx, AntigravityButton.tsx, Menu.tsx, SegmentedFilter.tsx, Alert.tsx, PremiumSelect.tsx, Navigation.tsx, SuccessModal.tsx, CollectionCard.tsx, Pagination.tsx, PortalLoadingSkeleton.tsx, Spinner.tsx |
| space-5 | FREEZE PROTECTED | themes.css:306 | 1 | 103 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, AntigravityCard.tsx, AntigravityData.tsx, SegmentedFilter.tsx, ErrorContainer.tsx, AntigravityForm.tsx |
| space-6 | FREEZE PROTECTED | themes.css:307 | 2 | 201 | 1 | 0 | 0 | 5 | AntigravityLayout.tsx, AdminModal.tsx, AntigravityCard.tsx, AntigravityData.tsx, AntigravityButton.tsx, Navigation.tsx, IconBadge.tsx, AntigravityForm.tsx |
| space-8 | FREEZE PROTECTED | themes.css:308 | 3 | 161 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, AdminModal.tsx, AntigravityCard.tsx, AntigravityButton.tsx, RetryButton.tsx, PortalLoadingSkeleton.tsx, IconBadge.tsx, Spinner.tsx |
| spacing-0 | FREEZE PROTECTED | index.css:207 | 0 | 227 | 0 | 0 | 0 | 0 | AdminModal.tsx, AntigravityCard.tsx, Pagination.tsx, AntigravityData.tsx, AntigravityLayout.tsx, AntigravityTypography.tsx, SuccessModal.tsx, Alert.tsx, CollectionCard.tsx, SegmentedFilter.tsx, AdminFilterBar.tsx |
| spacing-1 | FREEZE PROTECTED | index.css:208 | 0 | 283 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityData.tsx, Pagination.tsx, CollectionHeader.tsx, CollectionFilter.tsx, PremiumSelect.tsx, Menu.tsx, CollectionCard.tsx, AntigravityCard.tsx, Navigation.tsx, AntigravityButton.tsx, SegmentedFilter.tsx |
| spacing-10 | FREEZE PROTECTED | index.css:215 | 0 | 68 | 0 | 0 | 0 | 0 | AntigravityCard.tsx, AntigravityButton.tsx, AntigravityLayout.tsx, AntigravityForm.tsx, IconBadge.tsx |
| spacing-12 | FREEZE PROTECTED | index.css:216 | 0 | 41 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityData.tsx, IconBadge.tsx, AntigravityCard.tsx, Spinner.tsx |
| spacing-16 | FREEZE PROTECTED | index.css:217 | 0 | 34 | 0 | 0 | 0 | 0 | IconBadge.tsx, AntigravityCard.tsx |
| spacing-2 | FREEZE PROTECTED | index.css:209 | 0 | 314 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, SegmentedFilter.tsx, Pagination.tsx, AntigravityLayout.tsx, AntigravityData.tsx, Navigation.tsx, Menu.tsx, AdminModal.tsx, CollectionCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, AntigravityCard.tsx, Alert.tsx, PremiumSelect.tsx |
| spacing-20 | FREEZE PROTECTED | index.css:218 | 0 | 16 | 0 | 0 | 0 | 0 | Navigation.tsx, IconBadge.tsx, AntigravityCard.tsx |
| spacing-24 | FREEZE PROTECTED | index.css:219 | 0 | 25 | 0 | 0 | 0 | 0 | IconBadge.tsx, AntigravityCard.tsx |
| spacing-3 | FREEZE PROTECTED | index.css:210 | 0 | 296 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityLayout.tsx, Navigation.tsx, AntigravityData.tsx, AntigravityCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, SegmentedFilter.tsx, PremiumSelect.tsx, Menu.tsx, Alert.tsx, CollectionCard.tsx, AdminModal.tsx, AdminFilterBar.tsx, CollectionHeader.tsx |
| spacing-4 | FREEZE PROTECTED | index.css:211 | 0 | 413 | 0 | 0 | 0 | 0 | AntigravityLayout.tsx, AdminModal.tsx, AntigravityCard.tsx, AntigravityForm.tsx, AntigravityData.tsx, CollectionFilter.tsx, AntigravityButton.tsx, Menu.tsx, SegmentedFilter.tsx, Alert.tsx, PremiumSelect.tsx, Navigation.tsx, SuccessModal.tsx, CollectionCard.tsx, Pagination.tsx, PortalLoadingSkeleton.tsx, Spinner.tsx |
| spacing-5 | FREEZE PROTECTED | index.css:212 | 0 | 103 | 0 | 0 | 0 | 0 | AntigravityCard.tsx, AntigravityLayout.tsx, AntigravityData.tsx, SegmentedFilter.tsx, ErrorContainer.tsx, AntigravityForm.tsx |
| spacing-6 | FREEZE PROTECTED | index.css:213 | 0 | 201 | 0 | 0 | 0 | 0 | AntigravityLayout.tsx, AdminModal.tsx, AntigravityCard.tsx, AntigravityData.tsx, AntigravityButton.tsx, Navigation.tsx, IconBadge.tsx, AntigravityForm.tsx |
| spacing-8 | FREEZE PROTECTED | index.css:214 | 0 | 161 | 0 | 0 | 0 | 0 | AdminModal.tsx, AntigravityCard.tsx, AntigravityLayout.tsx, AntigravityButton.tsx, RetryButton.tsx, PortalLoadingSkeleton.tsx, IconBadge.tsx, Spinner.tsx |
| stat-card-border | FREEZE PROTECTED | themes.css:1111; themes.css:1245 | 0 | 3 | 1 | 0 | 0 | 1 | AntigravityCard.tsx, AntigravityData.tsx |
| stat-card-radius | FREEZE PROTECTED | themes.css:1113 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx |
| stat-card-shadow | FREEZE PROTECTED | themes.css:1112; themes.css:1246 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx |
| stat-icon-bg | FREEZE PROTECTED | themes.css:1116 | 0 | 3 | 1 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx |
| stat-icon-color | FREEZE PROTECTED | themes.css:1117 | 0 | 3 | 1 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx |
| stat-icon-radius | FREEZE PROTECTED | themes.css:1118 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx |
| stat-label-text | FREEZE PROTECTED | themes.css:1115; themes.css:1248 | 0 | 1 | 1 | 0 | 0 | 2 | AntigravityCard.tsx |
| stat-value-text | FREEZE PROTECTED | themes.css:1114; themes.css:1247 | 0 | 4 | 2 | 0 | 0 | 1 | AntigravityCard.tsx |
| surface-floating | FREEZE PROTECTED | themes.css:589; themes.css:828 | 10 | 0 | 3 | 2 | 0 | 47 | Menu.tsx, PremiumSelect.tsx |
| text-body | FREEZE PROTECTED | themes.css:535; index.css:455; index.css:469; index.css:484 | 2 | 0 | 0 | 0 | 0 | 5 | AdminText.tsx, AntigravityTypography.tsx |
| text-caption | FREEZE PROTECTED | themes.css:537; index.css:255; index.css:453; index.css:456; index.css:470; index.css:481; index.css:485 | 1 | 0 | 0 | 0 | 0 | 3 | AntigravityTypography.tsx |
| text-display | FREEZE PROTECTED | themes.css:527; index.css:444; index.css:454; index.css:468; index.css:483 | 1 | 0 | 0 | 0 | 0 | 10 | AntigravityTypography.tsx |
| text-heading | FREEZE PROTECTED | themes.css:555 | 1 | 0 | 0 | 0 | 0 | 16 | AdminText.tsx |
| text-hint | FREEZE PROTECTED | themes.css:416; themes.css:698 | 1 | 15 | 1 | 0 | 0 | 3 | AntigravityCard.tsx |
| text-label | FREEZE PROTECTED | themes.css:539; index.css:256; index.css:443; index.css:467; index.css:482 | 1 | 0 | 0 | 0 | 0 | 13 | AntigravityTypography.tsx |
| text-metadata | FREEZE PROTECTED | themes.css:546 | 1 | 0 | 0 | 0 | 0 | 9 | AdminText.tsx |
| text-muted | FREEZE PROTECTED | themes.css:415; themes.css:697 | 22 | 93 | 3 | 0 | 0 | 3 | AntigravityForm.tsx, Pagination.tsx, AntigravityLayout.tsx, CollectionFilter.tsx, IconBadge.tsx, AntigravityTypography.tsx, CollectionHeader.tsx, PremiumSelect.tsx |
| text-primary | FREEZE PROTECTED | themes.css:412; themes.css:694 | 14 | 211 | 23 | 7 | 0 | 13 | AntigravityData.tsx, AntigravityForm.tsx, Pagination.tsx, Navigation.tsx, CollectionCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, Menu.tsx, AntigravityTypography.tsx, PremiumSelect.tsx |
| text-secondary | FREEZE PROTECTED | themes.css:413; themes.css:695 | 16 | 192 | 9 | 2 | 0 | 4 | AntigravityForm.tsx, Pagination.tsx, AntigravityLayout.tsx, Navigation.tsx, AntigravityData.tsx, AdminModal.tsx, SegmentedFilter.tsx, AntigravityTypography.tsx, PremiumSelect.tsx |
| text-title | FREEZE PROTECTED | themes.css:414; themes.css:696 | 0 | 14 | 1 | 0 | 0 | 19 | AntigravityLayout.tsx, AntigravityData.tsx, AdminModal.tsx, AntigravityTypography.tsx |
| app-bg | KEEP | index.css:264 | 0 | 0 | 1 | 2 | 0 | 0 |  |
| bg-accent-subtle | KEEP | themes.css:409; themes.css:690 | 0 | 0 | 6 | 1 | 0 | 6 |  |
| bg-active | KEEP | themes.css:402; themes.css:683 | 0 | 0 | 3 | 0 | 0 | 7 |  |
| bg-disabled | KEEP | themes.css:403; themes.css:684 | 0 | 0 | 4 | 2 | 0 | 3 |  |
| bg-elevated | KEEP | themes.css:400; themes.css:681 | 4 | 1 | 13 | 4 | 0 | 26 |  |
| bg-input | KEEP | themes.css:404; themes.css:685 | 0 | 0 | 3 | 1 | 0 | 2 |  |
| bg-nav | KEEP | themes.css:558; themes.css:858 | 0 | 0 | 3 | 1 | 0 | 19 |  |
| bg-nav-active | KEEP | themes.css:564; themes.css:864 | 0 | 0 | 2 | 1 | 0 | 2 |  |
| border-accent | KEEP | themes.css:578; themes.css:878 | 0 | 0 | 1 | 1 | 0 | 1 |  |
| border-default | KEEP | themes.css:424; themes.css:708 | 1 | 11 | 9 | 3 | 0 | 3 |  |
| border-disabled | KEEP | themes.css:428; themes.css:712 | 0 | 0 | 1 | 0 | 0 | 0 |  |
| border-focus | KEEP | themes.css:426; themes.css:710 | 0 | 0 | 3 | 2 | 0 | 2 |  |
| border-hover | KEEP | themes.css:427; themes.css:711 | 0 | 0 | 5 | 3 | 0 | 9 |  |
| border-input | KEEP | themes.css:425; themes.css:709 | 0 | 0 | 4 | 3 | 0 | 5 |  |
| canvas-splash-bg | KEEP | themes.css:232 | 2 | 0 | 0 | 0 | 0 | 1 |  |
| canvas-splash-dark | KEEP | themes.css:233 | 1 | 0 | 0 | 0 | 0 | 1 |  |
| card-bg | KEEP | themes.css:903; index.css:265 | 1 | 0 | 2 | 1 | 0 | 26 |  |
| color-accent-rgb | KEEP | themes.css:435; themes.css:719 | 0 | 0 | 1 | 0 | 0 | 0 |  |
| color-accent-subtle | KEEP | themes.css:434; themes.css:718 | 0 | 0 | 2 | 1 | 0 | 0 |  |
| color-border-default | KEEP | index.css:70 | 0 | 11 | 0 | 0 | 0 | 2 |  |
| color-elevated-bg | KEEP | index.css:52 | 0 | 1 | 0 | 0 | 0 | 0 |  |
| color-secondary-light | KEEP | themes.css:437; themes.css:721 | 0 | 0 | 3 | 0 | 0 | 1 |  |
| color-stat-value | KEEP | index.css:197 | 0 | 3 | 0 | 0 | 0 | 4 |  |
| color-text-disabled | KEEP | index.css:61 | 0 | 3 | 0 | 0 | 0 | 0 |  |
| color-text-on-dark | KEEP | index.css:63 | 0 | 1 | 0 | 0 | 0 | 0 |  |
| elevation-raised | KEEP | themes.css:598; themes.css:837 | 0 | 0 | 2 | 1 | 0 | 10 |  |
| elevation-surface | KEEP | themes.css:597; themes.css:836 | 0 | 0 | 1 | 1 | 0 | 7 |  |
| focus-ring-color | KEEP | themes.css:483; themes.css:769 | 0 | 0 | 7 | 4 | 0 | 4 |  |
| focus-ring-offset | KEEP | themes.css:485; themes.css:771 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| focus-ring-width | KEEP | themes.css:484; themes.css:770 | 0 | 0 | 2 | 1 | 0 | 1 |  |
| font-sans | KEEP | themes.css:325 | 0 | 0 | 6 | 6 | 0 | 2 |  |
| forest-900 | KEEP | themes.css:214 | 2 | 0 | 1 | 0 | 0 | 7 |  |
| gold-100 | KEEP | themes.css:219 | 2 | 0 | 0 | 0 | 0 | 1 |  |
| gold-200 | KEEP | themes.css:220 | 5 | 0 | 0 | 0 | 0 | 6 |  |
| gold-400 | KEEP | themes.css:222 | 2 | 0 | 0 | 0 | 0 | 5 |  |
| gradient-app | KEEP | themes.css:503; themes.css:788 | 0 | 0 | 1 | 1 | 0 | 3 |  |
| gradient-surface | KEEP | themes.css:504; themes.css:789 | 0 | 0 | 2 | 2 | 0 | 4 |  |
| header-bg | KEEP | themes.css:992; themes.css:1202 | 0 | 0 | 1 | 1 | 0 | 0 |  |
| header-border | KEEP | themes.css:993; themes.css:1203 | 0 | 0 | 1 | 1 | 0 | 0 |  |
| header-shadow | KEEP | themes.css:994; themes.css:1204 | 0 | 0 | 3 | 3 | 0 | 2 |  |
| header-shadow-sm | KEEP | themes.css:1213 | 0 | 0 | 1 | 1 | 0 | 0 |  |
| icon-accent | KEEP | themes.css:471; themes.css:757 | 0 | 0 | 2 | 0 | 0 | 0 |  |
| input-disabled-border | KEEP | themes.css:1166 | 0 | 0 | 1 | 1 | 0 | 1 |  |
| premium-green | KEEP | themes.css:236 | 1 | 0 | 0 | 0 | 0 | 6 |  |
| primary | KEEP | index.css:272 | 12 | 0 | 0 | 1 | 0 | 26 |  |
| primary-rgb | KEEP | index.css:275 | 1 | 0 | 0 | 0 | 0 | 10 |  |
| radius-3xl | KEEP | themes.css:278; index.css:80 | 0 | 13 | 0 | 0 | 0 | 10 |  |
| radius-card | KEEP | themes.css:513 | 0 | 0 | 3 | 3 | 0 | 5 |  |
| radius-container | KEEP | themes.css:514 | 0 | 0 | 1 | 0 | 0 | 2 |  |
| radius-control | KEEP | themes.css:517 | 0 | 0 | 2 | 0 | 0 | 1 |  |
| radius-md | KEEP | themes.css:274 | 0 | 0 | 1 | 0 | 0 | 0 |  |
| scrollbar-thumb | KEEP | themes.css:488; themes.css:774 | 0 | 0 | 2 | 2 | 0 | 3 |  |
| scrollbar-thumb-hover | KEEP | themes.css:489; themes.css:775 | 0 | 0 | 2 | 2 | 0 | 1 |  |
| scrollbar-track | KEEP | themes.css:490; themes.css:776 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| scrollbar-width | KEEP | themes.css:491; themes.css:777 | 0 | 0 | 0 | 2 | 0 | 0 |  |
| selection-bg | KEEP | themes.css:479; themes.css:765 | 0 | 0 | 1 | 1 | 0 | 7 |  |
| selection-text | KEEP | themes.css:480; themes.css:766 | 0 | 0 | 1 | 1 | 0 | 0 |  |
| shadow-ambient | KEEP | themes.css:606; themes.css:846 | 0 | 0 | 1 | 0 | 0 | 4 |  |
| shadow-contact | KEEP | themes.css:607; themes.css:847 | 0 | 0 | 1 | 0 | 0 | 5 |  |
| shadow-lg | KEEP | themes.css:456; themes.css:741; index.css:86 | 0 | 52 | 4 | 1 | 0 | 2 |  |
| sidebar-border | KEEP | themes.css:989; themes.css:1199 | 0 | 0 | 4 | 3 | 0 | 2 |  |
| stat-card-bg | KEEP | themes.css:1109; themes.css:1244 | 0 | 0 | 1 | 1 | 0 | 9 |  |
| surface-primary | KEEP | themes.css:586; themes.css:825 | 0 | 0 | 1 | 1 | 0 | 5 |  |
| surface-stat | KEEP | themes.css:797 | 0 | 0 | 1 | 0 | 0 | 24 |  |
| surface-tab-pill | KEEP | themes.css:798 | 0 | 0 | 1 | 0 | 0 | 3 |  |
| text-disabled | KEEP | themes.css:417; themes.css:699 | 0 | 3 | 5 | 2 | 0 | 0 |  |
| text-h4 | KEEP | index.css:251 | 0 | 0 | 0 | 1 | 0 | 6 |  |
| text-h5 | KEEP | index.css:252; index.css:442; index.css:452; index.css:466; index.css:480 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| text-h6 | KEEP | index.css:253 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| text-nav-active | KEEP | themes.css:565; themes.css:865 | 0 | 0 | 4 | 3 | 0 | 2 |  |
| text-on-accent | KEEP | themes.css:418; themes.css:700 | 0 | 0 | 5 | 2 | 0 | 0 |  |
| text-on-danger | KEEP | themes.css:419; themes.css:701 | 0 | 0 | 2 | 1 | 0 | 0 |  |
| text-on-dark | KEEP | themes.css:421; themes.css:703 | 0 | 1 | 1 | 0 | 0 | 1 |  |
| weight-bold | KEEP | themes.css:334 | 0 | 0 | 2 | 2 | 0 | 1 |  |
| border-color | LEGACY COMPATIBILITY | index.css:268 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| card-3d-shadow | MERGE | themes.css:799 | 0 | 1 | 1 | 0 | 0 | 32 | AntigravityCard.tsx |
| danger | MERGE | index.css:278 | 9 | 128 | 0 | 0 | 0 | 16 | AntigravityData.tsx, AntigravityButton.tsx, IconBadge.tsx, Alert.tsx, AntigravityCard.tsx, AntigravityTypography.tsx |
| elevation-carved | MERGE | themes.css:813 | 1 | 3 | 4 | 0 | 0 | 49 | PremiumIconContainer.tsx |
| info | MERGE | index.css:280 | 1 | 2 | 0 | 0 | 0 | 8 | AntigravityCard.tsx |
| radius-2xl | MERGE | themes.css:277; index.css:79 | 0 | 98 | 0 | 0 | 0 | 13 | AntigravityLayout.tsx, AntigravityData.tsx, Menu.tsx, AntigravityCard.tsx, PremiumSelect.tsx |
| radius-xl | MERGE | themes.css:276; index.css:78 | 0 | 107 | 0 | 0 | 0 | 17 | AntigravityForm.tsx, Navigation.tsx, AntigravityData.tsx, CollectionFilter.tsx, AntigravityButton.tsx, AdminIconWrap.tsx, IconBadge.tsx, AntigravityCard.tsx, PremiumSelect.tsx |
| secondary | MERGE | index.css:276 | 0 | 30 | 0 | 0 | 0 | 9 | AntigravityData.tsx, IconBadge.tsx |
| shadow-premium-carved | MERGE | index.css:185 | 0 | 2 | 0 | 0 | 0 | 5 |  |
| shadow-premium-icon | MERGE | index.css:186 | 0 | 1 | 0 | 0 | 0 | 6 | PremiumIconContainer.tsx |
| stat-card-3d-shadow | MERGE | themes.css:806 | 0 | 5 | 2 | 0 | 0 | 12 | AntigravityCard.tsx |
| success | MERGE | index.css:277 | 5 | 95 | 0 | 0 | 0 | 10 | AntigravityData.tsx, AntigravityButton.tsx, IconBadge.tsx, Alert.tsx, AntigravityCard.tsx |
| text-h1 | MERGE | themes.css:529; index.css:248; index.css:308; index.css:441; index.css:451; index.css:465; index.css:479 | 1 | 0 | 0 | 1 | 0 | 11 | AntigravityTypography.tsx |
| text-h2 | MERGE | themes.css:531; index.css:249; index.css:309 | 1 | 0 | 0 | 1 | 0 | 4 | AntigravityTypography.tsx |
| text-h3 | MERGE | themes.css:533; index.css:250 | 1 | 0 | 0 | 1 | 0 | 6 | AntigravityTypography.tsx |
| text-stat-value | MERGE | themes.css:541; index.css:192; index.css:457; index.css:471; index.css:486 | 0 | 3 | 0 | 0 | 0 | 14 |  |
| warning | MERGE | index.css:279 | 2 | 75 | 0 | 0 | 0 | 7 | AntigravityData.tsx, IconBadge.tsx, Alert.tsx, AntigravityCard.tsx |
