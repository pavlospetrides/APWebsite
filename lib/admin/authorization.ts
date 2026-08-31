import { createSupabaseRequestClient } from '@/lib/supabase/server';

export async function getAdminAuthorization() {
  const supabase = await createSupabaseRequestClient();
  if (!supabase) return { authorized: false, configured: false, user: null } as const;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { authorized: false, configured: true, user: null } as const;

  const [membership, assurance] = await Promise.all([
    supabase.from('admin_users').select('user_id').eq('user_id', userData.user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const authorized = Boolean(
    membership.data &&
      !membership.error &&
      !assurance.error &&
      assurance.data.currentLevel === 'aal2',
  );
  return { authorized, configured: true, user: userData.user } as const;
}
