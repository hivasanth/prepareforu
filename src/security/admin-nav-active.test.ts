import { describe, it, expect } from 'vitest'
import { isNavActive, isNavItemActive, SUB_ADMIN_NAV, type NavItem } from '../config/navigation'

/* L-2 regression: admin sidebar active-state must highlight the section for
 * exact paths AND nested child routes (bulk-parser lives under /admin/upload),
 * while never matching unrelated sections. */
describe('isNavActive — L-2 active-state contract', () => {
  it('matches the exact section path', () => {
    expect(isNavActive('/admin/upload', '/admin/upload')).toBe(true)
  })

  it('matches nested descendant routes', () => {
    expect(isNavActive('/admin/upload', '/admin/upload/bulk-parser/topic/topic-1')).toBe(true)
    expect(isNavActive('/admin/settings', '/admin/settings')).toBe(true)
  })

  it('never matches unrelated or prefix-colliding paths', () => {
    expect(isNavActive('/admin/users', '/admin/users-archive')).toBe(false)
    expect(isNavActive('/admin/topics', '/admin/leaderboard')).toBe(false)
    expect(isNavActive('/admin/overview', '/dashboard')).toBe(false)
  })
})

/* L-2 extension: isNavItemActive adds semantic route ownership via matchPaths
 * (detail routes outside a section's literal path tree keep their owner active). */
describe('isNavItemActive — sub-admin semantic ownership contract', () => {
  const dashboard = SUB_ADMIN_NAV.find(i => i.label === 'DASHBOARD')!

  it('keeps exact-or-descendant behavior for items without matchPaths', () => {
    const plain: NavItem = { label: 'X', path: '/admin/overview', icon: dashboard.icon, color: '#000' }
    expect(isNavItemActive(plain, '/admin/overview')).toBe(true)
    expect(isNavItemActive(plain, '/admin/overview/child')).toBe(true)
    expect(isNavItemActive(plain, '/admin/users')).toBe(false)
  })

  it('matches attributed detail paths via matchPaths (Dashboard owns /sub-admin/exams/:examId)', () => {
    expect(isNavItemActive(dashboard, '/sub-admin/dashboard')).toBe(true)
  })

  it('does not match the deprecated /sub-admin/exams/:examId path to Dashboard', () => {
    expect(isNavItemActive(dashboard, '/sub-admin/exams/ex-1')).toBe(false)
    expect(isNavItemActive(dashboard, '/sub-admin/exams/ex-1?view=leaderboard')).toBe(false)
  })

  it('never leaves two sections active for the same path', () => {
    const activeForExam = SUB_ADMIN_NAV
      .map(item => ({ item, active: isNavItemActive(item, '/sub-admin/exams/ex-1') }))
      .filter(x => x.active)
    expect(activeForExam).toHaveLength(0)
  })

  it('matches my-exams only for its own section (incl. ?exam= detail deep links)', () => {
    const myExams = SUB_ADMIN_NAV.find(i => i.label === 'MY EXAMS')!
    expect(isNavItemActive(myExams, '/sub-admin/my-exams')).toBe(true)
    expect(isNavItemActive(myExams, '/sub-admin/my-exams?exam=ex-1')).toBe(true)
    expect(isNavItemActive(myExams, '/sub-admin/exams/ex-1')).toBe(false)
  })
})
