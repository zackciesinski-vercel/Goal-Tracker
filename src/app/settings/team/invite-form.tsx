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

export function InviteForm({ organizationId }: InviteFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: insertError } = await supabase.from('invitations').insert({
      organization_id: organizationId,
      email: email.toLowerCase().trim(),
      role,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('This email has already been invited')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setEmail('')
    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite by Email</CardTitle>
        <CardDescription>
          Send an invitation to a specific person
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          {success && (
            <p className="text-sm text-status-on-track">
              Invitation sent! Share the invite link with them.
            </p>
          )}

          <Button type="submit" disabled={loading || !email.trim()}>
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
