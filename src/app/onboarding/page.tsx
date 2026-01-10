import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has an organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership && !membershipError) {
    // Already has an org, redirect to dashboard
    redirect('/')
  }

  // Check for any pending invitations for this user's email - skip join to avoid RLS issues
  const userEmail = user.email?.toLowerCase() ?? ''
  let pendingInvites: { id: string; token: string; organization_id: string; org_name?: string }[] = []

  if (userEmail) {
    const { data: invites } = await supabase
      .from('invitations')
      .select('id, token, organization_id')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    if (invites && invites.length > 0) {
      // Fetch org names separately
      const orgIds = invites.map(i => i.organization_id)
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)

      pendingInvites = invites.map(invite => ({
        ...invite,
        org_name: orgs?.find(o => o.id === invite.organization_id)?.name ?? 'Unknown'
      }))
    }
  }

  return <OnboardingForm userId={user.id} email={user.email ?? ''} pendingInvites={pendingInvites} />
}
