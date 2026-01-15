import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatGoalsForSlack, postToSlack, getCurrentWeekNumber } from '@/lib/slack'
import { getCurrentFiscalPeriod } from '@/lib/fiscal'

export async function POST() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single()

  const userName = userData?.name || userData?.email?.split('@')[0] || 'User'

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Get org settings (for webhook URL and fiscal year)
  const { data: settings } = await supabase
    .from('org_settings')
    .select('slack_webhook_url, fiscal_year_start_month')
    .eq('organization_id', membership.organization_id)
    .single()

  if (!settings?.slack_webhook_url) {
    return NextResponse.json(
      { error: 'Slack webhook URL not configured. Go to Settings to add it.' },
      { status: 400 }
    )
  }

  // Get current fiscal quarter
  const fiscalStartMonth = settings.fiscal_year_start_month || 2
  const { year, quarter } = getCurrentFiscalPeriod(fiscalStartMonth)

  // Get user's goals for current quarter with their updates
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*, updates(*)')
    .eq('organization_id', membership.organization_id)
    .eq('owner_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .order('created_at', { ascending: true })

  if (goalsError) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }

  // Format and post to Slack
  const weekNumber = getCurrentWeekNumber()
  const { blocks, text } = formatGoalsForSlack(goals || [], userName, weekNumber, fiscalStartMonth)
  const result = await postToSlack(settings.slack_webhook_url, blocks, text)

  if (!result.ok) {
    return NextResponse.json(
      { error: `Failed to post to Slack: ${result.error}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, goalsShared: goals?.length || 0 })
}
