export function useAuth() {
  const role = localStorage.getItem('admin_role') || '';
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}'); }
    catch { return {}; }
  })();
  const isSuperAdmin = role === 'super_admin' || role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || role === 'admin' || role === 'ADMIN';
  const isCampaignManager = role === 'campaign_manager';
  return { role, user, isSuperAdmin, isAdmin, isCampaignManager };
}
