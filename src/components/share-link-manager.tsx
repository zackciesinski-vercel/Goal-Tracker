'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GoalShareLink } from '@/types/database'

interface ShareLinkManagerProps {
  goalId: string
  shareLink: GoalShareLink | null
  isOwner: boolean
}

export function ShareLinkManager({ goalId, shareLink, isOwner }: ShareLinkManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareLink
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareLink.token}`
    : ''

  const handleGenerateLink = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Deactivate existing links
    if (shareLink) {
      await supabase
        .from('goal_share_links')
        .update({ is_active: false })
        .eq('goal_id', goalId)
    }

    // Create new link
    const { error } = await supabase.from('goal_share_links').insert({
      goal_id: goalId,
      created_by: user?.id,
      is_active: true,
    })

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleToggleActive = async () => {
    if (!shareLink) return
    setLoading(true)

    await supabase
      .from('goal_share_links')
      .update({ is_active: !shareLink.is_active })
      .eq('id', shareLink.id)

    router.refresh()
    setLoading(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOwner) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share Link</CardTitle>
        <CardDescription>
          Generate a public link anyone can view (without login)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shareLink && shareLink.is_active ? (
          <>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="font-mono text-sm"
              />
              <Button onClick={handleCopy} variant="secondary">
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={loading}
              >
                Disable Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLink}
                disabled={loading}
              >
                Regenerate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view this goal and its progress updates.
            </p>
          </>
        ) : (
          <>
            <Button onClick={handleGenerateLink} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Share Link'}
            </Button>
            {shareLink && !shareLink.is_active && (
              <p className="text-xs text-muted-foreground">
                Previous share link was disabled.{' '}
                <button
                  onClick={handleToggleActive}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Re-enable it
                </button>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
