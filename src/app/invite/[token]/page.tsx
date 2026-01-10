import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInvite } from './accept-invite'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get invitation details
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*, organization:organizations(*)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-semibold">Invalid or Expired Invite</h1>
          <p className="text-muted-foreground">
            This invitation link is no longer valid. It may have expired or already been used.
          </p>
          <p className="text-sm text-muted-foreground">
            Please ask for a new invitation from your team administrator.
          </p>
        </div>
      </div>
    )
  }

  // If user is logged in and email matches, accept the invite automatically
  if (user && user.email?.toLowerCase() === invitation.email.toLowerCase()) {
    const { error } = await supabase.rpc('accept_invitation', { invite_token: token })

    if (!error) {
      redirect('/')
    }
  }

  // If user is logged in but email doesn't match
  if (user && user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-semibold">Email Mismatch</h1>
          <p className="text-muted-foreground">
            This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re logged in as <strong>{user.email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Please log out and sign in with the correct email address, or ask for a new invitation.
          </p>
        </div>
      </div>
    )
  }

  // User not logged in - show the accept invite form
  return (
    <AcceptInvite
      token={token}
      organizationName={invitation.organization.name}
      email={invitation.email}
      role={invitation.role}
    />
  )
}
