'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { OrganizationMember, User } from '@/types/database'

type MemberWithUser = OrganizationMember & {
  user: User
}

interface MemberListProps {
  members: MemberWithUser[]
  currentUserId: string
  isAdmin: boolean
  isOwner: boolean
}

export function MemberList({ members, currentUserId, isAdmin, isOwner }: MemberListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<MemberWithUser | null>(null)

  const roleLabels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  }

  const roleBadgeColors = {
    owner: 'bg-primary text-primary-foreground',
    admin: 'bg-accent text-accent-foreground',
    member: 'bg-secondary text-secondary-foreground',
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    setLoading(memberId)

    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      router.refresh()
    }
    setLoading(null)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setLoading(memberToRemove.id)

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberToRemove.id)

    if (!error) {
      router.refresh()
    }
    setMemberToRemove(null)
    setLoading(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId
              const canChangeRole = isOwner && !isCurrentUser && member.role !== 'owner'
              const canRemove = isOwner && !isCurrentUser && member.role !== 'owner'

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user.name || member.user.email}
                        {isCurrentUser && (
                          <span className="text-muted-foreground text-sm ml-2">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canChangeRole ? (
                      <Select
                        value={member.role}
                        onValueChange={(v: 'admin' | 'member') => handleRoleChange(member.id, v)}
                        disabled={loading === member.id}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={roleBadgeColors[member.role]} variant="secondary">
                        {roleLabels[member.role]}
                      </Badge>
                    )}

                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setMemberToRemove(member)}
                        disabled={loading === member.id}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <strong>{memberToRemove?.user.name || memberToRemove?.user.email}</strong> from the
              organization? They will lose access to all goals and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={loading === memberToRemove?.id}
            >
              {loading === memberToRemove?.id ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
