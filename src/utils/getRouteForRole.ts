export function getRouteForRole(role: string): string {
  if (role === 'admin') return '/admin/overview';
  if (role === 'sub_admin') return '/sub-admin/dashboard';
  return '/dashboard'; // default for all other roles
}
