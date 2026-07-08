import { 
  Home, 
  FileText, 
  BookOpen, 
  FileSignature, 
  UserCheck, 
  Trophy, 
  User,
  BarChart3,
  HelpCircle,
  Upload,
  Shield,
  Settings,
  PlusCircle,
  Layers,
  Users,
  LayoutGrid,
  History,
  BookMarked
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  color: string;
}

export const USER_NAV: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',     icon: Home,          color: '#2563EB' },
  { label: 'Exams',           path: '/exams',         icon: FileText,      color: '#16A34A' },
  { label: 'History',         path: '/history',       icon: History,       color: '#8B5CF6' },
  { label: 'Subject Tests',   path: '/subject-tests', icon: BookOpen,      color: '#F59E0B' },
  { label: 'Topic Exams',     path: '/topic-exams',   icon: Layers,        color: '#10B981' },
  { label: 'Study Topics',    path: '/topics',        icon: BookMarked,    color: '#7C3AED' },
  { label: 'Prepare & Write', path: '/prepare-write', icon: FileSignature, color: '#DC2626' },
  { label: 'Performance',     path: '/performance',   icon: BarChart3,     color: '#3B82F6' },
  { label: 'Educator Exams',  path: '/educator-exams',icon: UserCheck,     color: '#7C3AED' },
  { label: 'Leaderboard',     path: '/leaderboard',   icon: Trophy,        color: '#EA580C' },
  { label: 'Profile',         path: '/profile',       icon: User,          color: '#0891B2' },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'OVERVIEW',      path: '/admin/overview',    icon: BarChart3,    color: '#374151' },
  { label: 'QUESTIONS',     path: '/admin/questions',   icon: HelpCircle,   color: '#16A34A' },
  { label: 'UPLOAD QS',     path: '/admin/upload',      icon: Upload,       color: '#DB2777' },
  { label: 'TOPICS',        path: '/admin/topics',      icon: BookMarked,   color: '#7C3AED' },
  { label: 'LEADERBOARD',   path: '/admin/leaderboard', icon: Trophy,       color: '#F59E0B' },
  { label: 'USERS',         path: '/admin/users',       icon: Users,        color: '#2563EB' },
  { label: 'SUB ADMINS',    path: '/admin/sub-admins',  icon: Shield,       color: '#4F46E5' },
  { label: 'SETTINGS',      path: '/admin/settings',    icon: Settings,     color: '#EA580C' },
];

export const SUB_ADMIN_NAV: NavItem[] = [
  { label: 'DASHBOARD',     path: '/sub-admin/dashboard', icon: LayoutGrid, color: '#2563EB' },
  { label: 'MY EXAMS',      path: '/sub-admin/my-exams',  icon: Layers,     color: '#F59E0B' },
  { label: 'STUDENTS',      path: '/sub-admin/students',  icon: Users,      color: '#7C3AED' },
  { label: 'CREATE EXAM',   path: '/sub-admin/create',    icon: PlusCircle, color: '#DC2626' },
  { label: 'SETTINGS',      path: '/sub-admin/settings',  icon: Settings,   color: '#374151' },
];
