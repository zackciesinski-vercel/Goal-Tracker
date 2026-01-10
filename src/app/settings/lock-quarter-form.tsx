'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { getQuarterLabel } from '@/lib/fiscal'

interface LockQuarterFormProps {
  year: number
  quarter: number
  unlockedCount: number
}

export function LockQuarterForm({ year, quarter, unlockedCount }: LockQuarterFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLock = async () => {
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('goals')
      .update({ is_locked: true })
      .eq('year', year)
      .eq('quarter', quarter)
      .eq('is_locked', false)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {unlockedCount} goal{unlockedCount !== 1 ? 's' : ''} will be locked for{' '}
        {getQuarterLabel(year, quarter)}. Once locked, goals cannot be edited
        but check-ins can still be submitted.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleLock} disabled={loading} variant="destructive">
        {loading ? 'Locking...' : `Lock ${unlockedCount} Goal${unlockedCount !== 1 ? 's' : ''}`}
      </Button>
    </div>
  )
}
