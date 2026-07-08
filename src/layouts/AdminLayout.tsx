import { Shield } from 'lucide-react'
import { ADMIN_NAV } from '../config/navigation'
import SidebarLayout from './SidebarLayout'

export default function AdminLayout() {
  return (
    <SidebarLayout
      navConfig={ADMIN_NAV}
      storageKey="admin-sidebar-mode"
      layoutId="adminActive"
      logoText={<>Admin<span className="text-danger">Panel</span></>}
      roleBadge={{ text: 'Root', icon: Shield }}
      footerRoleLabel="System Admin"
    />
  )
}
