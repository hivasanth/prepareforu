import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider }                        from './context/AuthContext'
import { ThemeProvider }                  from './context/ThemeContext'
import { LanguageProvider }               from './context/LanguageContext'
import { AuthGuard, RoleGuard, GuestGuard }     from './guards/Guards'
import { useDocumentTitle } from './hooks/useDocumentTitle'

// ─── Layouts ────────────────────────────────────────────────────────────────
import UserLayout                             from './layouts/UserLayout'
import AdminLayout                            from './layouts/AdminLayout'
import SubAdminLayout                         from './layouts/SubAdminLayout'

// ─── Public Pages (lazy-loaded) ───────────────────────────────────────────────
const LoginPage              = lazy(() => import('./pages/LoginPage'))
const SignupPage             = lazy(() => import('./pages/SignupPage'))
const AuthCallbackPage       = lazy(() => import('./pages/auth/AuthCallbackPage'))
const InviteCallbackPage     = lazy(() => import('./pages/auth/InviteCallbackPage'))
const UpdatePasswordPage     = lazy(() => import('./pages/auth/UpdatePasswordPage'))

const SplashPage             = lazy(() => import('./pages/SplashPage'))
const Unauthorized           = lazy(() => import('./pages/Unauthorized'))
const AccountDisabledPage    = lazy(() => import('./pages/AccountDisabledPage'))
const VerifyEmailPage        = lazy(() => import('./pages/VerifyEmailPage'))
const NotFoundPage           = lazy(() => import('./pages/NotFoundPage'))

// ─── Lazy Loaded Pages ────────────────────────────────────────────────────────
const UserDashboard     = lazy(() => import('./pages/user/UserDashboard'))
const UserExams         = lazy(() => import('./pages/user/UserExams'))
const UserHistory       = lazy(() => import('./pages/user/UserHistory'))
const UserSubjectTests  = lazy(() => import('./pages/user/UserSubjectTests'))
const UserTopicExams    = lazy(() => import('./pages/user/UserTopicExams'))
const UserPrepareWrite  = lazy(() => import('./pages/user/UserPrepareWrite'))
const UserPerformance   = lazy(() => import('./pages/user/UserPerformance'))
const UserTeacherExams  = lazy(() => import('./pages/user/UserTeacherExams'))
const UserLeaderboard   = lazy(() => import('./pages/user/UserLeaderboard'))
const UserProfile       = lazy(() => import('./pages/user/UserProfile'))
const UserTopics        = lazy(() => import('./pages/user/UserTopics'))
const UserMemoryGames   = lazy(() => import('./pages/user/UserMemoryGames'))
const UserNumberMemoryRush = lazy(() => import('./pages/user/UserNumberMemoryRush'))
const UserVisualMemoryMatrix = lazy(() => import('./pages/user/UserVisualMemoryMatrix'))
const UserTileMatching = lazy(() => import('./pages/user/UserTileMatching'))
const UserSchulteTrail = lazy(() => import('./pages/user/UserSchulteTrail'))
const UserMemoryGamesLeaderboard = lazy(() => import('./pages/user/UserMemoryGamesLeaderboard'))

const ActiveExamPage     = lazy(() => import('./pages/exam/ActiveExamPage'))
const ReviewPage         = lazy(() => import('./pages/exam/ReviewPage'))

const AdminOverview     = lazy(() => import('./pages/admin/AdminOverview'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSubAdmins    = lazy(() => import('./pages/admin/AdminSubAdmins'))
const AdminQuestions    = lazy(() => import('./pages/admin/AdminQuestions'))
const AdminUpload       = lazy(() => import('./pages/admin/AdminUpload'))
const AdminBulkParserTopic = lazy(() => import('./pages/admin/AdminBulkParserTopic'))
const AdminTopics       = lazy(() => import('./pages/admin/AdminTopics'))
const AdminLeaderboard  = lazy(() => import('./pages/admin/AdminLeaderboard'))
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings'))
const AdminDesignSystem = lazy(() => import('./pages/admin/AdminDesignSystem'))

const SubAdminDashboard = lazy(() => import('./pages/sub-admin/SubAdminDashboard'))
const SubAdminStudents  = lazy(() => import('./pages/sub-admin/SubAdminStudents'))
const SubAdminCreate    = lazy(() => import('./pages/sub-admin/SubAdminCreate'))
const SubAdminExams     = lazy(() => import('./pages/sub-admin/SubAdminExams'))
const SubAdminSettings = lazy(() => import('./pages/sub-admin/SubAdminSettings'))

import PremiumLoader from './components/PremiumLoader'
import ErrorBoundary from './components/ErrorBoundary'

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] bg-transparent">
      <PremiumLoader />
    </div>
  )
}

function PageTitle({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(title)
  return <>{children}</>
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <Routes>
                <Route path="/login"  element={<GuestGuard><Suspense fallback={<PageLoader />}><PageTitle title="Login"><LoginPage /></PageTitle></Suspense></GuestGuard>} />
                <Route path="/signup" element={<GuestGuard><Suspense fallback={<PageLoader />}><PageTitle title="Sign Up"><SignupPage /></PageTitle></Suspense></GuestGuard>} />
                <Route path="/auth/callback"         element={<Suspense fallback={<PageLoader />}><PageTitle title="Authenticating"><AuthCallbackPage /></PageTitle></Suspense>} />
                {/* Dedicated invitation-onboarding entry point. PUBLIC — never
                    wrapped in AuthGuard/RoleGuard/GuestGuard. It is handled by
                    the isolated, non-persisted invite client, so it can never
                    replace a Normal app session (e.g. an Admin in another tab). */}
                <Route path="/auth/invite"           element={<Suspense fallback={<PageLoader />}><PageTitle title="Invitation"><InviteCallbackPage /></PageTitle></Suspense>} />
                <Route path="/auth/update-password"  element={<Suspense fallback={<PageLoader />}><PageTitle title="Update Password"><UpdatePasswordPage /></PageTitle></Suspense>} />

                <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><PageTitle title="Verify Email"><VerifyEmailPage /></PageTitle></Suspense>} />

                {/* ─── Dev-only verification harness (dead-code-eliminated in prod) */}
                {import.meta.env.DEV && (() => {
                  const LazyDevAqAlignment = lazy(() => import('./dev/AqAlignmentHarness'))
                  const LazyDevSaAlignment = lazy(() => import('./dev/SaAlignmentHarness'))
                  const LazyDevUploadAlignment = lazy(() => import('./dev/UploadAlignmentHarness'))
                  return (
                    <>
                      <Route path="/dev/aq-alignment" element={
                        <Suspense fallback={<PageLoader />}>
                          <LazyDevAqAlignment />
                        </Suspense>
                      } />
                      <Route path="/dev/sa-alignment" element={
                        <Suspense fallback={<PageLoader />}>
                          <LazyDevSaAlignment />
                        </Suspense>
                      } />
                      <Route path="/dev/upload-alignment" element={
                        <Suspense fallback={<PageLoader />}>
                          <LazyDevUploadAlignment />
                        </Suspense>
                      } />
                    </>
                  )
                })()}

                <Route path="/" element={<Suspense fallback={<PageLoader />}><PageTitle title="Welcome"><SplashPage /></PageTitle></Suspense>} />

                {/* ─── User Routes ─────────────────────────────────────────── */}
                <Route element={<AuthGuard><RoleGuard allowedRoles={['user']}><UserLayout /></RoleGuard></AuthGuard>}>
                  <Route path="/dashboard"     element={<PageTitle title="Dashboard"><UserDashboard /></PageTitle>} />
                  <Route path="/exams"         element={<PageTitle title="Exams"><UserExams /></PageTitle>} />
                  <Route path="/history"       element={<PageTitle title="History"><UserHistory /></PageTitle>} />
                  <Route path="/subject-tests" element={<PageTitle title="Subject Tests"><UserSubjectTests /></PageTitle>} />
                  <Route path="/topic-exams"   element={<PageTitle title="Topic Exams"><UserTopicExams /></PageTitle>} />
                  <Route path="/topics"        element={<PageTitle title="Topics"><UserTopics /></PageTitle>} />
                  <Route path="/prepare-write" element={<PageTitle title="Prepare & Write"><UserPrepareWrite /></PageTitle>} />
                  <Route path="/performance"   element={<PageTitle title="Performance"><UserPerformance /></PageTitle>} />
                  <Route path="/educator-exams" element={<PageTitle title="Educator Exams"><UserTeacherExams /></PageTitle>} />
                  <Route path="/leaderboard"   element={<PageTitle title="Leaderboard"><UserLeaderboard /></PageTitle>} />
                  <Route path="/memory-games"  element={<PageTitle title="Memory Games"><UserMemoryGames /></PageTitle>} />
                  <Route path="/memory-games/number-memory-rush" element={<PageTitle title="Memory Games — Number Memory Rush"><UserNumberMemoryRush /></PageTitle>} />
                  <Route path="/memory-games/visual-memory-matrix" element={<PageTitle title="Memory Games — Visual Memory Matrix"><UserVisualMemoryMatrix /></PageTitle>} />
                  <Route path="/memory-games/tile-matching" element={<PageTitle title="Memory Games — Tile Matching"><UserTileMatching /></PageTitle>} />
                  <Route path="/memory-games/schulte-trail" element={<PageTitle title="Memory Games — Schulte Trail"><UserSchulteTrail /></PageTitle>} />
                  <Route path="/memory-games/leaderboard" element={<PageTitle title="Memory Games — Leaderboard"><UserMemoryGamesLeaderboard /></PageTitle>} />
                  <Route path="/profile"       element={<PageTitle title="Profile"><UserProfile /></PageTitle>} />
                </Route>

                {/* ─── Admin Routes ─────────────────────────────────────────── */}
                <Route path="/admin" element={<AuthGuard><RoleGuard allowedRoles={['admin']}><AdminLayout /></RoleGuard></AuthGuard>}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview"    element={<PageTitle title="Admin — Overview"><AdminOverview /></PageTitle>} />
                  <Route path="users"       element={<PageTitle title="Admin — Users"><AdminUsers /></PageTitle>} />
                  <Route path="sub-admins"  element={<PageTitle title="Admin — Sub-Admins"><AdminSubAdmins /></PageTitle>} />
                  <Route path="questions"   element={<PageTitle title="Admin — Questions"><AdminQuestions /></PageTitle>} />
                  <Route path="upload"      element={<PageTitle title="Admin — Upload"><AdminUpload /></PageTitle>} />
                  <Route path="upload/bulk-parser/topic/:topicId" element={<PageTitle title="Admin — Bulk Parser"><AdminBulkParserTopic /></PageTitle>} />
                  <Route path="topics"      element={<PageTitle title="Admin — Topics"><AdminTopics /></PageTitle>} />
                  <Route path="leaderboard" element={<PageTitle title="Admin — Leaderboard"><AdminLeaderboard /></PageTitle>} />
                  <Route path="settings"    element={<PageTitle title="Admin — Settings"><AdminSettings /></PageTitle>} />
                  {/* L-1: design-system showcase is a development tool — the
                      route is DEV-gated (dead-code-eliminated in prod) and
                      filtered from ADMIN_NAV. */}
                  {import.meta.env.DEV && (
                    <Route path="design-system" element={<PageTitle title="Admin — Design System"><AdminDesignSystem /></PageTitle>} />
                  )}
                </Route>

                {/* ─── Sub-Admin Routes ─────────────────────────────────────── */}
                <Route path="/sub-admin" element={<AuthGuard><RoleGuard allowedRoles={['sub_admin']}><SubAdminLayout /></RoleGuard></AuthGuard>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<PageTitle title="Sub-Admin — Dashboard"><SubAdminDashboard /></PageTitle>} />
                  <Route path="my-exams"  element={<PageTitle title="Sub-Admin — My Exams"><SubAdminExams /></PageTitle>} />
                  <Route path="students"  element={<PageTitle title="Sub-Admin — Students"><SubAdminStudents /></PageTitle>} />
                  <Route path="create"    element={<PageTitle title="Sub-Admin — Create"><SubAdminCreate /></PageTitle>} />
                  <Route path="settings"  element={<PageTitle title="Sub-Admin — Settings"><SubAdminSettings /></PageTitle>} />
                </Route>

                {/* ─── Exam Routes ──────────────────────────────────────────── */}
                <Route path="/active-exam/:paperId" element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}><PageTitle title="Active Exam"><ActiveExamPage /></PageTitle></Suspense>
                    </ErrorBoundary>
                  </AuthGuard>
                } />

                <Route path="/review/:attemptId" element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}><PageTitle title="Review"><ReviewPage /></PageTitle></Suspense>
                    </ErrorBoundary>
                  </AuthGuard>
                } />

                {/* ─── Fallback / Error Routes ──────────────────────────────── */}
                <Route path="/unauthorized"     element={<Suspense fallback={<PageLoader />}><PageTitle title="Unauthorized"><Unauthorized /></PageTitle></Suspense>} />
                <Route path="/account-disabled" element={<Suspense fallback={<PageLoader />}><PageTitle title="Account Disabled"><AccountDisabledPage /></PageTitle></Suspense>} />
                {/* Route-level 404 — canonical NotFoundSurface instead of a
                    silent wildcard redirect (audit §12). */}
                <Route path="*" element={<Suspense fallback={<PageLoader />}><PageTitle title="Page Not Found"><NotFoundPage /></PageTitle></Suspense>} />
              </Routes>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
    </MotionConfig>
  )
}
