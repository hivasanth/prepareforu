import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }               from './context/AuthContext'
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
const UpdatePasswordPage     = lazy(() => import('./pages/auth/UpdatePasswordPage'))

const SplashPage             = lazy(() => import('./pages/SplashPage'))
const Unauthorized           = lazy(() => import('./pages/Unauthorized'))
const AccountDisabledPage    = lazy(() => import('./pages/AccountDisabledPage'))
const VerifyEmailPage        = lazy(() => import('./pages/VerifyEmailPage'))
const FinishSignInPage       = lazy(() => import('./pages/FinishSignInPage'))

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

const ActiveExamPage     = lazy(() => import('./pages/exam/ActiveExamPage'))
const ResultsPage        = lazy(() => import('./pages/exam/ResultsPage'))
const ReviewPage         = lazy(() => import('./pages/exam/ReviewPage'))

const AdminOverview     = lazy(() => import('./pages/admin/AdminOverview'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSubAdmins    = lazy(() => import('./pages/admin/AdminSubAdmins'))
const AdminQuestions    = lazy(() => import('./pages/admin/AdminQuestions'))
const AdminUpload       = lazy(() => import('./pages/admin/AdminUpload'))
const AdminTopics       = lazy(() => import('./pages/admin/AdminTopics'))
const AdminLeaderboard  = lazy(() => import('./pages/admin/AdminLeaderboard'))
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings'))

const SubAdminDashboard = lazy(() => import('./pages/sub-admin/SubAdminDashboard'))
const SubAdminStudents  = lazy(() => import('./pages/sub-admin/SubAdminStudents'))
const SubAdminCreate    = lazy(() => import('./pages/sub-admin/SubAdminCreate'))
const SubAdminExams     = lazy(() => import('./pages/sub-admin/SubAdminExams'))
const SubAdminSettings  = lazy(() => import('./pages/sub-admin/SubAdminSettings'))

import PremiumLoader from './components/PremiumLoader'
import ErrorBoundary from './components/ErrorBoundary'
import { getRouteForRole } from './utils/getRouteForRole'

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
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Routes>
                <Route path="/login"  element={<GuestGuard><Suspense fallback={<PageLoader />}><PageTitle title="Login"><LoginPage /></PageTitle></Suspense></GuestGuard>} />
                <Route path="/signup" element={<GuestGuard><Suspense fallback={<PageLoader />}><PageTitle title="Sign Up"><SignupPage /></PageTitle></Suspense></GuestGuard>} />
                <Route path="/auth/callback"         element={<Suspense fallback={<PageLoader />}><PageTitle title="Authenticating"><AuthCallbackPage /></PageTitle></Suspense>} />
                <Route path="/auth/update-password"  element={<Suspense fallback={<PageLoader />}><PageTitle title="Update Password"><UpdatePasswordPage /></PageTitle></Suspense>} />
                <Route path="/auth/finish-sign-in"   element={<Suspense fallback={<PageLoader />}><PageTitle title="Signing In"><FinishSignInPage /></PageTitle></Suspense>} />

                <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><PageTitle title="Verify Email"><VerifyEmailPage /></PageTitle></Suspense>} />

                <Route path="/" element={<Suspense fallback={<PageLoader />}><PageTitle title="Welcome"><SplashPage /></PageTitle></Suspense>} />

                {/* ─── User Routes ─────────────────────────────────────────── */}
                <Route element={<AuthGuard><UserLayout /></AuthGuard>}>
                  <Route path="/dashboard"     element={<Suspense fallback={<PageLoader />}><PageTitle title="Dashboard"><UserDashboard /></PageTitle></Suspense>} />
                  <Route path="/exams"         element={<Suspense fallback={<PageLoader />}><PageTitle title="Exams"><UserExams /></PageTitle></Suspense>} />
                  <Route path="/history"       element={<Suspense fallback={<PageLoader />}><PageTitle title="History"><UserHistory /></PageTitle></Suspense>} />
                  <Route path="/subject-tests" element={<Suspense fallback={<PageLoader />}><PageTitle title="Subject Tests"><UserSubjectTests /></PageTitle></Suspense>} />
                  <Route path="/topic-exams"   element={<Suspense fallback={<PageLoader />}><PageTitle title="Topic Exams"><UserTopicExams /></PageTitle></Suspense>} />
                  <Route path="/topics"        element={<Suspense fallback={<PageLoader />}><PageTitle title="Topics"><UserTopics /></PageTitle></Suspense>} />
                  <Route path="/prepare-write" element={<Suspense fallback={<PageLoader />}><PageTitle title="Prepare & Write"><UserPrepareWrite /></PageTitle></Suspense>} />
                  <Route path="/performance"   element={<Suspense fallback={<PageLoader />}><PageTitle title="Performance"><UserPerformance /></PageTitle></Suspense>} />
                  <Route path="/educator-exams" element={<Suspense fallback={<PageLoader />}><PageTitle title="Educator Exams"><UserTeacherExams /></PageTitle></Suspense>} />
                  <Route path="/leaderboard"   element={<Suspense fallback={<PageLoader />}><PageTitle title="Leaderboard"><UserLeaderboard /></PageTitle></Suspense>} />
                  <Route path="/profile"       element={<Suspense fallback={<PageLoader />}><PageTitle title="Profile"><UserProfile /></PageTitle></Suspense>} />
                </Route>

                {/* ─── Admin Routes ─────────────────────────────────────────── */}
                <Route path="/admin" element={<AuthGuard><RoleGuard allowedRoles={['admin']}><AdminLayout /></RoleGuard></AuthGuard>}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview"    element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Overview"><AdminOverview /></PageTitle></Suspense>} />
                  <Route path="users"       element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Users"><AdminUsers /></PageTitle></Suspense>} />
                  <Route path="sub-admins"  element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Sub-Admins"><AdminSubAdmins /></PageTitle></Suspense>} />
                  <Route path="questions"   element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Questions"><AdminQuestions /></PageTitle></Suspense>} />
                  <Route path="upload"      element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Upload"><AdminUpload /></PageTitle></Suspense>} />
                  <Route path="topics"      element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Topics"><AdminTopics /></PageTitle></Suspense>} />
                  <Route path="leaderboard" element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Leaderboard"><AdminLeaderboard /></PageTitle></Suspense>} />
                  <Route path="settings"    element={<Suspense fallback={<PageLoader />}><PageTitle title="Admin — Settings"><AdminSettings /></PageTitle></Suspense>} />
                </Route>

                {/* ─── Sub-Admin Routes ─────────────────────────────────────── */}
                <Route path="/sub-admin" element={<AuthGuard><RoleGuard allowedRoles={['sub_admin']}><SubAdminLayout /></RoleGuard></AuthGuard>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><PageTitle title="Sub-Admin — Dashboard"><SubAdminDashboard /></PageTitle></Suspense>} />
                  <Route path="my-exams"  element={<Suspense fallback={<PageLoader />}><PageTitle title="Sub-Admin — My Exams"><SubAdminExams /></PageTitle></Suspense>} />
                  <Route path="students"  element={<Suspense fallback={<PageLoader />}><PageTitle title="Sub-Admin — Students"><SubAdminStudents /></PageTitle></Suspense>} />
                  <Route path="create"    element={<Suspense fallback={<PageLoader />}><PageTitle title="Sub-Admin — Create"><SubAdminCreate /></PageTitle></Suspense>} />
                  <Route path="settings"  element={<Suspense fallback={<PageLoader />}><PageTitle title="Sub-Admin — Settings"><SubAdminSettings /></PageTitle></Suspense>} />
                </Route>

                {/* ─── Exam Routes ──────────────────────────────────────────── */}
                <Route path="/active-exam/:paperId" element={
                  <AuthGuard>
                    <Suspense fallback={<PageLoader />}><PageTitle title="Active Exam"><ActiveExamPage /></PageTitle></Suspense>
                  </AuthGuard>
                } />

                <Route path="/result/:attemptId" element={
                  <AuthGuard>
                    <Suspense fallback={<PageLoader />}><PageTitle title="Results"><ResultsPage /></PageTitle></Suspense>
                  </AuthGuard>
                } />

                <Route path="/review/:attemptId" element={
                  <AuthGuard>
                    <Suspense fallback={<PageLoader />}><PageTitle title="Review"><ReviewPage /></PageTitle></Suspense>
                  </AuthGuard>
                } />

                {/* ─── Fallback / Error Routes ──────────────────────────────── */}
                <Route path="/unauthorized"     element={<Suspense fallback={<PageLoader />}><PageTitle title="Unauthorized"><Unauthorized /></PageTitle></Suspense>} />
                <Route path="/account-disabled" element={<Suspense fallback={<PageLoader />}><PageTitle title="Account Disabled"><AccountDisabledPage /></PageTitle></Suspense>} />
                <Route path="*"                 element={<RoleBasedRedirector />} />
              </Routes>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function RoleBasedRedirector() {
  const { user, loading, initialized } = useAuth()
  if (!initialized || loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  // Privileged roles go straight to their dashboard
  if (user.role === 'admin' || user.role === 'sub_admin') {
    return <Navigate to={getRouteForRole(user.role)} replace />
  }

  // Users go to selection if missing, else dashboard
  if (!user.exam_selection) {
    return <Navigate to="/signup" replace />
  }

  return <Navigate to="/dashboard" replace />
}
