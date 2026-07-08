import { GraduationCap } from 'lucide-react'
import { SUB_ADMIN_NAV } from '../config/navigation'
import SidebarLayout from './SidebarLayout'

export default function SubAdminLayout() {
  return (
    <SidebarLayout
      navConfig={SUB_ADMIN_NAV}
      storageKey="subadmin-sidebar-mode"
      layoutId="subAdminActive"
      logoText={<>Edu<span className="text-primary">Panel</span></>}
      roleBadge={{ text: 'Educator', icon: GraduationCap }}
      footerRoleLabel="Instructor"
    />
  )
}
