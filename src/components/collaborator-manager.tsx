'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User, GoalCollaborator } from '@/types/database'

type CollaboratorWithUser = GoalCollaborator & {
  user: User
}

type OrgMember = {
  user_id: string
  user: User
}

interface CollaboratorManagerProps {
  goalId: string
  collaborators: CollaboratorWithUser[]
  orgMembers: OrgMember[]
  ownerId: string
  isOwner: boolean
}

export function CollaboratorManager({
  goalId,
  collaborators,
  orgMembers,
  ownerId,
  isOwner,
}: CollaboratorManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer')

  // Filter out users who are already collaborators or the owner
  const availableMembers = orgMembers.filter(
    (member) =>
      member.user_id !== ownerId &&
      !collaborators.some((c) => c.user_id === member.user_id)
  )

  const handleAddCollaborator = async () => {
    if (!selectedUser) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('goal_collaborators').insert({
      goal_id: goalId,
      user_id: selectedUser,
      role: selectedRole,
      added_by: user?.id,
    })

    if (!error) {
      setSelectedUser('')
      setSelectedRole('viewer')
      router.refresh()
    }
    setLoading(false)
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoading(true)
    await supabase.from('goal_collaborators').delete().eq('id', collaboratorId)
    router.refresh()
    setLoading(false)
  }

  const handleUpdateRole = async (collaboratorId: string, newRole: 'editor' | 'viewer') => {
    setLoading(true)
    await supabase
      .from('goal_collaborators')
      .update({ role: newRole })
      .eq('id', collaboratorId)
    router.refresh()
    setLoading(false)
  }

  const roleLabels = {
    editor: 'Can edit',
    viewer: 'View only',
  }

  const roleBadgeColors = {
    editor: 'bg-primary text-primary-foreground',
    viewer: 'bg-secondary text-secondary-foreground',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Collaborators</CardTitle>
        <CardDescription>
          {isOwner
            ? 'Add team members who can view or edit this goal'
            : 'People collaborating on this goal'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add collaborator form - only for owner */}
        {isOwner && availableMembers.length > 0 && (
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.user.name || member.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedRole}
              onValueChange={(value: 'editor' | 'viewer') => setSelectedRole(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">View only</SelectItem>
                <SelectItem value="editor">Can edit</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddCollaborator} disabled={loading || !selectedUser}>
              Add
            </Button>
          </div>
        )}

        {isOwner && availableMembers.length === 0 && collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No other team members to add. Invite people from Team settings.
          </p>
        )}

        {/* Current collaborators list */}
        {collaborators.length > 0 ? (
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {collab.user.name?.charAt(0).toUpperCase() ||
                        collab.user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {collab.user.name || collab.user.email}
                    </p>
                    {collab.user.name && (
                      <p className="text-xs text-muted-foreground">{collab.user.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <>
                      <Select
                        value={collab.role}
                        onValueChange={(value: 'editor' | 'viewer') =>
                          handleUpdateRole(collab.id, value)
                        }
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">View only</SelectItem>
                          <SelectItem value="editor">Can edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collab.id)}
                        disabled={loading}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Badge className={roleBadgeColors[collab.role]} variant="secondary">
                      {roleLabels[collab.role]}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          collaborators.length === 0 &&
          !isOwner && (
            <p className="text-sm text-muted-foreground">No collaborators on this goal.</p>
          )
        )}
      </CardContent>
    </Card>
  )
}
