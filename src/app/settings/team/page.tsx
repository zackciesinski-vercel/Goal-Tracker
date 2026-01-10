import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { redirect } from 'next/navigation'
import { getServerOrg } from '@/lib/org-server'
import { MemberList } from './member-list'
import { InviteForm } from './invite-form'
import { InviteLink } from './invite-link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect('/login')
  }

  const { organization, membership } = await getServerOrg(supabase)

  if (!organization) {
    redirect('/onboarding')
  }

  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

  // Get all members
  const { data: members } = await supabase
    .from('organization_members')
    .select('*, user:users(*)')
    .eq('organization_id', organization.id)
    .order('joined_at', { ascending: true })

  // Get pending invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', organization.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-muted-foreground">
            Manage your organization members and invitations
          </p>
        </div>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>{organization.name}</CardTitle>
            <CardDescription>Your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {members?.length} member{members?.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Invite Link */}
        {isAdmin && (
          <InviteLink
            inviteCode={organization.invite_code}
          />
        )}

        {/* Invite by Email */}
        {isAdmin && (
          <InviteForm organizationId={organization.id} />
        )}

        {/* Pending Invitations */}
        {isAdmin && invitations && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>People who haven&apos;t accepted yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited as {invite.role} · Expires{' '}
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member List */}
        <MemberList
          members={members ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
          isOwner={membership?.role === 'owner'}
        />
      </div>
    </AppShell>
  )
}
