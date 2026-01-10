'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>People in your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member) => (
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
                    {member.user_id === currentUserId && (
                      <span className="text-muted-foreground text-sm ml-2">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <Badge className={roleBadgeColors[member.role]} variant="secondary">
                {roleLabels[member.role]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
