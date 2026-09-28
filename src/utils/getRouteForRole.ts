export function getRouteForRole(role: string): string {
  if (role === 'admin') return '/admin/overview';
  if (role === 'sub_admin') return '/sub-admin/dashboard';
  if (role === 'deactivated_sub_admin') return '/unauthorized';
  return '/dashboard'; // default for all other roles
}
