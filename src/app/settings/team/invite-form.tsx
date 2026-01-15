'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface InviteFormProps {
  organizationId: string
}

interface CreatedInvite {
  token: string
  email: string
  role: string
}

export function InviteForm({ organizationId }: InviteFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCreatedInvite(null)

    const normalizedEmail = email.toLowerCase().trim()

    const { data, error: insertError } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email: normalizedEmail,
        role,
      })
      .select('token, email, role')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        setError('This email has already been invited')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    setCreatedInvite(data)
    setEmail('')
    setLoading(false)
    router.refresh()
  }

  const inviteUrl = createdInvite
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${createdInvite.token}`
    : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInviteAnother = () => {
    setCreatedInvite(null)
    setCopied(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite by Email</CardTitle>
        <CardDescription>
          Create a personal invite link for a specific person
        </CardDescription>
      </CardHeader>
      <CardContent>
        {createdInvite ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium mb-1">
                Invite created for {createdInvite.email}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Share this link with them to join as {createdInvite.role}. Expires in 7 days.
              </p>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={handleInviteAnother}>
              Invite Another Person
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v: 'admin' | 'member') => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Creating...' : 'Create Invite Link'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
