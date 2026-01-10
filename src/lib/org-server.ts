import { createClient } from '@/lib/supabase/server'
import type { Organization, OrganizationMember } from '@/types/database'

// Server-side helper to get org data
export async function getServerOrg(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { organization: null, membership: null }
  }

  const { data: membershipData } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membershipData) {
    return { organization: null, membership: null }
  }

  const membership: OrganizationMember = {
    id: membershipData.id,
    organization_id: membershipData.organization_id,
    user_id: membershipData.user_id,
    role: membershipData.role,
    joined_at: membershipData.joined_at,
  }

  return {
    organization: membershipData.organization as Organization,
    membership,
  }
}
