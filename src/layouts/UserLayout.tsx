import { USER_NAV } from '../config/navigation'
import SidebarLayout from './SidebarLayout'

export default function UserLayout() {
  return (
    <SidebarLayout
      navConfig={USER_NAV}
      storageKey="user-sidebar-mode"
      layoutId="userActive"
      logoText={<>What<span className="text-primary">U</span>Want</>}
      roleBadge={null}
      footerRoleLabel="Student"
    />
  )
}
