import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JoinOrganization } from './join-organization'

interface JoinPageProps {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get organization by invite code
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('invite_code', code)
    .single()

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-semibold">Invalid Invite Link</h1>
          <p className="text-muted-foreground">
            This organization invite link is not valid. Please check the URL and try again.
          </p>
        </div>
      </div>
    )
  }

  // If user is logged in, check if they're already a member
  if (user) {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Already a member, redirect to dashboard
      redirect('/')
    }

    // User is logged in but not a member - join the org
    const { error } = await supabase.rpc('join_organization', { org_invite_code: code })

    if (!error) {
      redirect('/')
    }

    // If there was an error joining, show error
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-semibold">Unable to Join</h1>
          <p className="text-muted-foreground">
            There was a problem joining this organization. You may already be a member of another organization.
          </p>
        </div>
      </div>
    )
  }

  // User not logged in - show sign up/sign in form
  return <JoinOrganization code={code} organizationName={organization.name} />
}
