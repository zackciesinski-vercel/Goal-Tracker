'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconPicker } from '@/components/icon-picker'
import { FiscalPeriod, getQuarterLabel } from '@/lib/fiscal'

interface CompanyObjective {
  id: string
  title: string
  metric_name: string | null
  year: number
  quarter: number
}

interface GoalFormProps {
  availablePeriods: FiscalPeriod[]
  fiscalStartMonth: number
  isAdmin: boolean
  companyObjectives: CompanyObjective[]
  organizationId: string | null
  isGuest?: boolean
}

export function GoalForm({
  availablePeriods,
  fiscalStartMonth,
  isAdmin,
  companyObjectives,
  organizationId,
  isGuest = false,
}: GoalFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  const [icon, setIcon] = useState('🎯')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState<'company' | 'team' | 'individual'>('individual')
  const [parentGoalId, setParentGoalId] = useState<string>('')
  const [metricName, setMetricName] = useState('')
  const [metricTarget, setMetricTarget] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${availablePeriods[0].year}-${availablePeriods[0].quarter}`
  )

  // Filter company objectives by selected period
  const [selectedYear, selectedQuarter] = selectedPeriod.split('-').map(Number)
  const filteredObjectives = companyObjectives.filter(
    obj => obj.year === selectedYear && obj.quarter === selectedQuarter
  )

  // Company goals don't need a parent
  const needsParent = goalType !== 'company'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If guest, show signup prompt instead of submitting
    if (isGuest) {
      setShowSignupPrompt(true)
      return
    }

    setLoading(true)
    setError(null)

    // Validate parent selection for non-company goals
    if (needsParent && !parentGoalId) {
      setError('Please select a company objective that this goal supports')
      setLoading(false)
      return
    }

    const [year, quarter] = selectedPeriod.split('-').map(Number)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to create a goal')
      setLoading(false)
      return
    }

    if (!organizationId) {
      setError('No organization found. Please complete onboarding first.')
      setLoading(false)
      return
    }

    // Company objectives don't require metrics
    const { error: insertError } = await supabase.from('goals').insert({
      icon,
      title,
      description: description || null,
      owner_id: user.id,
      organization_id: organizationId,
      goal_type: goalType,
      parent_goal_id: needsParent ? parentGoalId : null,
      year,
      quarter,
      // Only set metrics for team/individual goals
      metric_name: goalType === 'company' ? null : metricName,
      metric_target: goalType === 'company' ? null : parseFloat(metricTarget),
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalType">Goal Type</Label>
              <Select
                value={goalType}
                onValueChange={(value: 'company' | 'team' | 'individual') => {
                  setGoalType(value)
                  if (value === 'company') {
                    setParentGoalId('')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="company">Company Objective</SelectItem>}
                  <SelectItem value="team">Team Goal</SelectItem>
                  <SelectItem value="individual">Individual Goal</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {goalType === 'company' && 'Set by leadership for the whole company'}
                {goalType === 'team' && 'Set by managers for their team'}
                {goalType === 'individual' && 'Your personal goal'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Quarter</Label>
              <Select value={selectedPeriod} onValueChange={(value) => {
                setSelectedPeriod(value)
                setParentGoalId('') // Reset parent when period changes
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((period) => (
                    <SelectItem
                      key={`${period.year}-${period.quarter}`}
                      value={`${period.year}-${period.quarter}`}
                    >
                      {getQuarterLabel(period.year, period.quarter)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsParent && (
            <div className="space-y-2">
              <Label htmlFor="parentGoal">Supports Company Objective</Label>
              {filteredObjectives.length === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
                  No company objectives exist for {getQuarterLabel(selectedYear, selectedQuarter)} yet.
                  {isAdmin
                    ? ' Create a company objective first, then create team/individual goals.'
                    : ' Ask your admin to create company objectives first.'}
                </p>
              ) : (
                <Select value={parentGoalId} onValueChange={setParentGoalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company objective..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredObjectives.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Which company objective does this goal contribute to?
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Icon & Title</Label>
            <div className="flex gap-3 items-start">
              <IconPicker value={icon} onChange={setIcon} />
              <Input
                id="title"
                placeholder={
                  goalType === 'company'
                    ? 'e.g., Increase annual recurring revenue'
                    : 'e.g., Sign 10 new partners'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what success looks like..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Metrics - required for team/individual goals, optional for company objectives */}
          {goalType === 'company' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Company objectives are aspirational and don&apos;t require specific metrics.
                Team and individual goals that support this objective will have measurable targets.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metricName">Metric Name</Label>
                <Input
                  id="metricName"
                  placeholder="e.g., Partners signed"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metricTarget">Target Value</Label>
                <Input
                  id="metricTarget"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g., 50"
                  value={metricTarget}
                  onChange={(e) => setMetricTarget(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || (needsParent && filteredObjectives.length === 0 && !isGuest)}
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Signup Prompt Modal for Guests */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Create an Account to Save</CardTitle>
              <CardDescription>
                Sign up for free to save your goals and track progress with your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Link href="/login?redirect=/goals/new">
                  <Button className="w-full" size="lg">
                    Sign Up Free
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setShowSignupPrompt(false)}
                >
                  Continue Exploring
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Already have an account? The sign up page works for both new and existing users.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
