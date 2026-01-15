'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StatusOverride = 'ahead' | 'on_track' | 'at_risk' | 'behind' | 'auto'

interface CheckinFormProps {
  goalId: string
  metricName: string
  currentStatusOverride?: string | null
}

export function CheckinForm({ goalId, metricName, currentStatusOverride }: CheckinFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [metricValue, setMetricValue] = useState('')
  const [notes, setNotes] = useState('')
  const [statusOverride, setStatusOverride] = useState<StatusOverride>(
    (currentStatusOverride as StatusOverride) || 'auto'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Insert the update
    const { error: insertError } = await supabase.from('updates').insert({
      goal_id: goalId,
      metric_value: parseFloat(metricValue),
      notes: notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Update status override if changed
    const newOverride = statusOverride === 'auto' ? null : statusOverride
    if (newOverride !== currentStatusOverride) {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ status_override: newOverride })
        .eq('id', goalId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setMetricValue('')
    setNotes('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="metricValue">{metricName}</Label>
          <Input
            id="metricValue"
            type="number"
            step="any"
            placeholder="Current value"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="What progress did you make this week?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="statusOverride">Status</Label>
        <Select value={statusOverride} onValueChange={(v: StatusOverride) => setStatusOverride(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (based on progress)</SelectItem>
            <SelectItem value="ahead">🔵 Ahead</SelectItem>
            <SelectItem value="on_track">🟢 On Track</SelectItem>
            <SelectItem value="at_risk">🟡 At Risk</SelectItem>
            <SelectItem value="behind">🔴 Behind</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Override the calculated status if the numbers don't tell the full story
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600">Check-in recorded!</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Submit Check-in'}
      </Button>
    </form>
  )
}
