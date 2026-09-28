import { memo } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import {
  Badge, Button, Card, Pagination, FloatingList, FloatingListHeader, FloatingListItem,
} from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'
import { Skeleton } from '../../common/Skeleton'
import { UserIdentity } from './UserIdentity'
import { formatDate } from '../../../utils/dateUtils'
import type { UserRow } from '../../../types/user.types'

/* ═══ Shared column grid — single source of truth ═══════════════════════════
 * Both FloatingListHeader and every FloatingListItem row consume the
 * EXACT SAME grid definition. This guarantees header ↔ row alignment.
 *
 * Mobile (< md):   participant | status | action         (3 cols)
 * md (< lg):       + exam                                  (4 cols)
 * lg:              + exams taken + joined                   (6 cols)
 *
 * Status/action tracks are FIXED px, never `auto`: header and each row are
 * independent grid instances, so content-sized (`auto`) tracks resolve
 * differently per instance (label vs badge/button widths) and break
 * alignment. Fixed tracks are measured against the widest legitimate
 * control: status badge "Banned" = 85px → 88px; action button
 * "Deactivate" = 87px → 92px. Hidden columns are display:none — no ghost
 * slots.
 * ══════════════════════════════════════════════════════════════════════════ */
const USER_TABLE_GRID = [
  'grid w-full',
  'grid-cols-[minmax(0,1fr)_88px_92px]',
  'md:grid-cols-[minmax(0,1.8fr)_minmax(110px,1fr)_110px_120px]',
  'lg:grid-cols-[minmax(0,2.2fr)_minmax(120px,1fr)_120px_140px_120px_120px]',
  'items-center',
  'gap-x-3 md:gap-x-4',
].join(' ')

const HEADER_CELL = 'text-[10px] font-bold uppercase tracking-widest'

/* AU-4: shape-matched loading state. Composed from the SAME primitives as the
 * final table — Card surface, FloatingList, the ONE USER_TABLE_GRID contract,
 * and the canonical Skeleton primitive — so cold→content swaps are seamless.
 * The wrapper owns the SINGLE role="status" region; every skeleton bar is
 * decorative (no nested live regions). */
const SKELETON_ROW_COUNT = 5

function UsersTableSkeleton() {
  return (
    <Card variant="elevated" role="status" aria-label="Loading students">
      <FloatingList gap="md">
        <FloatingListHeader padding="md">
          <div className={`${USER_TABLE_GRID} text-text-muted light:text-[var(--gold-300)]`}>
            <span className={`${HEADER_CELL} text-left`}>Participant</span>
            <span className={`${HEADER_CELL} hidden md:block text-left`}>Exam</span>
            <span className={`${HEADER_CELL} hidden lg:block text-center`}>Exams Taken</span>
            <span className={`${HEADER_CELL} hidden lg:block text-center`}>Joined</span>
            <span className={`${HEADER_CELL} text-center`}>Status</span>
            <span className={`${HEADER_CELL} text-center`}>Action</span>
          </div>
        </FloatingListHeader>

        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <FloatingListItem key={i} padding="md" innerClassName={`${USER_TABLE_GRID} w-full`}>
            {/* Participant compound cell */}
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton decorative width={36} height={36} borderRadius={12} />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <Skeleton decorative width={128} height={12} borderRadius={6} />
                <Skeleton decorative width={96} height={10} borderRadius={5} />
              </div>
            </div>

            {/* Exam */}
            <div className="hidden md:block">
              <Skeleton decorative width={104} height={24} borderRadius={8} />
            </div>

            {/* Exams taken / Joined */}
            <div className="hidden lg:flex justify-center">
              <Skeleton decorative width={40} height={14} borderRadius={7} />
            </div>
            <div className="hidden lg:flex justify-center">
              <Skeleton decorative width={72} height={14} borderRadius={7} />
            </div>

            {/* Status */}
            <div className="flex justify-center">
              <Skeleton decorative width={85} height={26} borderRadius={13} />
            </div>

            {/* Action */}
            <div className="flex justify-center">
              <Skeleton decorative width={92} height={30} borderRadius={8} />
            </div>
          </FloatingListItem>
        ))}

        {/* Pagination footprint: range text left, prev/next controls right */}
        <div className="flex items-center justify-between px-2 py-3" aria-hidden="true">
          <Skeleton decorative width={140} height={16} borderRadius={8} />
          <div className="flex items-center gap-4">
            <Skeleton decorative width={32} height={28} borderRadius={8} />
            <Skeleton decorative width={32} height={28} borderRadius={8} />
          </div>
        </div>
      </FloatingList>
    </Card>
  )
}

interface UsersTableProps {
  users: UserRow[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  togglingId: string | null
  onToggleRequest: (user: UserRow) => void
}

export const UsersTable = memo(function UsersTable({
  users,
  loading,
  page,
  totalPages,
  onPageChange,
  togglingId,
  onToggleRequest,
}: UsersTableProps) {
  if (loading && users.length === 0) {
    return <UsersTableSkeleton />
  }

  if (!loading && users.length === 0) {
    return null
  }

  return (
    <Card variant="elevated">
      <FloatingList gap="md">
        {/* ═══ Header ══════════════════════════════════════════════════════ */}
        {/* padding="md" aligns the header content-box inset with every
            FloatingListItem row (p-4 + 1px border) — the header ↔ row
            alignment contract. Default 'sm' stays canonical elsewhere. */}
        <FloatingListHeader padding="md">
          <div className={`${USER_TABLE_GRID} text-text-muted light:text-[var(--gold-300)]`}>
            <span className={`${HEADER_CELL} text-left`}>Participant</span>
            <span className={`${HEADER_CELL} hidden md:block text-left`}>Exam</span>
            <span className={`${HEADER_CELL} hidden lg:block text-center`}>Exams Taken</span>
            <span className={`${HEADER_CELL} hidden lg:block text-center`}>Joined</span>
            <span className={`${HEADER_CELL} text-center`}>Status</span>
            <span className={`${HEADER_CELL} text-center`}>Action</span>
          </div>
        </FloatingListHeader>

        {/* ═══ Rows ═══════════════════════════════════════════════════════ */}
        {users.map(u => (
          <FloatingListItem
            key={u.id}
            innerClassName={`${USER_TABLE_GRID} w-full`}
            padding="md"
          >
            {/* PARTICIPANT — compound cell */}
            <div className="flex items-center gap-3 min-w-0">
              <UserIdentity name={u.full_name} email={u.email} truncate />
            </div>

            {/* EXAM */}
            <div className="hidden md:block min-w-0">
              <Badge variant="default" className="capitalize max-w-full">
                <span className="truncate">{u.exam_selection?.replace(/_/g, ' ') || 'None'}</span>
              </Badge>
            </div>

            {/* EXAMS TAKEN */}
            <div className="hidden lg:flex justify-center">
              <AdminText as="span" variant="sans" size="metadata" className="font-medium text-text-primary">
                {u.exams_taken || 0}
              </AdminText>
            </div>

            {/* JOINED */}
            <div className="hidden lg:flex justify-center">
              <AdminText as="span" variant="sans" size="metadata" className="text-text-primary truncate">
                {formatDate(u.created_at)}
              </AdminText>
            </div>

            {/* STATUS */}
            <div className="flex justify-center">
              <Badge
                variant={u.is_active ? 'success' : 'danger'}
                icon={u.is_active ? ShieldCheck : ShieldAlert}
              >
                {u.is_active ? 'Active' : 'Banned'}
              </Badge>
            </div>

            {/* ACTION */}
            <div className="flex justify-center">
              <Button
                variant={u.is_active ? 'danger' : 'success'}
                size="xs"
                loading={togglingId === u.id}
                onClick={() => onToggleRequest(u)}
              >
                {u.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </FloatingListItem>
        ))}

        <Pagination
          page={page - 1}
          totalPages={totalPages}
          onPageChange={(p) => onPageChange(p + 1)}
        />
      </FloatingList>
    </Card>
  )
})
