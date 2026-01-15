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

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

interface SettingsFormProps {
  settingsId?: string
  organizationId: string
  initialFiscalMonth: number
  initialCadence: number
  initialSlackWebhook: string | null
}

export function SettingsForm({
  settingsId,
  organizationId,
  initialFiscalMonth,
  initialCadence,
  initialSlackWebhook,
}: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [fiscalMonth, setFiscalMonth] = useState(initialFiscalMonth.toString())
  const [cadence, setCadence] = useState(initialCadence.toString())
  const [slackWebhook, setSlackWebhook] = useState(initialSlackWebhook || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const updateData = {
      fiscal_year_start_month: parseInt(fiscalMonth),
      checkin_cadence_days: parseInt(cadence),
      slack_webhook_url: slackWebhook.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (settingsId) {
      result = await supabase
        .from('org_settings')
        .update(updateData)
        .eq('id', settingsId)
    } else {
      result = await supabase.from('org_settings').insert({
        ...updateData,
        organization_id: organizationId,
      })
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fiscalMonth">Fiscal Year Start Month</Label>
        <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          The first month of your fiscal year (Q1 starts here)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cadence">Check-in Cadence (days)</Label>
        <Input
          id="cadence"
          type="number"
          min="1"
          max="30"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          How often team members should update their goals
        </p>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
        <Input
          id="slackWebhook"
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={slackWebhook}
          onChange={(e) => setSlackWebhook(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Get this from your Slack App settings → Incoming Webhooks. Used for sharing goals to Slack.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Settings saved!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}
