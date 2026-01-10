'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PendingInvite {
  id: string
  token: string
  organization_id: string
  org_name?: string
}

interface OnboardingFormProps {
  userId: string
  email: string
  pendingInvites: PendingInvite[]
}

export function OnboardingForm({ userId, email, pendingInvites }: OnboardingFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const trimmedName = orgName.trim()
    if (!trimmedName) {
      setError('Please enter an organization name')
      setLoading(false)
      return
    }

    // Generate a slug from the name
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: trimmedName,
        slug: `${slug}-${Date.now().toString(36)}`, // Add timestamp for uniqueness
      })
      .select()
      .single()

    if (orgError) {
      setError(orgError.message)
      setLoading(false)
      return
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Create default org settings
    await supabase.from('org_settings').insert({
      organization_id: org.id,
      fiscal_year_start_month: 1,
      checkin_cadence_days: 7,
    })

    router.push('/')
    router.refresh()
  }

  const handleAcceptInvite = async (token: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.rpc('accept_invitation', { invite_token: token })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground mt-2">
            Let&apos;s get you set up with Goal Tracker
          </p>
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">You&apos;ve Been Invited</CardTitle>
              <CardDescription>
                Join an existing organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <span className="font-medium">{invite.org_name}</span>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invite.token)}
                    disabled={loading}
                  >
                    Join
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {pendingInvites.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
        )}

        {/* Create New Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create an Organization</CardTitle>
            <CardDescription>
              Start fresh with your own team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="My Company"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Signed in as {email}
        </p>
      </div>
    </div>
  )
}
