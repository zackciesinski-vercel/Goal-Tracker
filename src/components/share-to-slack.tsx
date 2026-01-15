'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ShareToSlackProps {
  hasWebhook: boolean
}

export function ShareToSlack({ hasWebhook }: ShareToSlackProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const handleShare = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/slack/share', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true })
        setTimeout(() => setResult(null), 3000)
      } else {
        setResult({ error: data.error })
      }
    } catch {
      setResult({ error: 'Failed to share to Slack' })
    }

    setLoading(false)
  }

  if (!hasWebhook) {
    return (
      <Button variant="outline" size="sm" disabled title="Configure Slack webhook in Settings first">
        Share to Slack
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? 'Sharing...' : 'Share to Slack'}
      </Button>
      {result?.success && (
        <span className="text-sm text-green-600">Posted!</span>
      )}
      {result?.error && (
        <span className="text-sm text-red-600">{result.error}</span>
      )}
    </div>
  )
}
