'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, OrganizationMember } from '@/types/database'

type OrgRole = 'owner' | 'admin' | 'member'

type OrgContextType = {
  organization: Organization | null
  membership: OrganizationMember | null
  isLoading: boolean
  isAdmin: boolean
  isOwner: boolean
  role: OrgRole | null
  refetch: () => Promise<void>
}

const OrgContext = createContext<OrgContextType | undefined>(undefined)

export function OrgProvider({
  children,
  initialOrg,
  initialMembership,
}: {
  children: React.ReactNode
  initialOrg?: Organization | null
  initialMembership?: OrganizationMember | null
}) {
  const [organization, setOrganization] = useState<Organization | null>(initialOrg ?? null)
  const [membership, setMembership] = useState<OrganizationMember | null>(initialMembership ?? null)
  const [isLoading, setIsLoading] = useState(!initialOrg)

  const supabase = createClient()

  const fetchOrgData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setOrganization(null)
      setMembership(null)
      setIsLoading(false)
      return
    }

    // Get user's organization membership
    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id)
      .single()

    if (membershipData) {
      setMembership({
        id: membershipData.id,
        organization_id: membershipData.organization_id,
        user_id: membershipData.user_id,
        role: membershipData.role,
        joined_at: membershipData.joined_at,
      })
      setOrganization(membershipData.organization as Organization)
    } else {
      setOrganization(null)
      setMembership(null)
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    if (initialOrg === undefined) {
      fetchOrgData()
    }
  }, [initialOrg, fetchOrgData])

  const role = membership?.role ?? null
  const isAdmin = role === 'owner' || role === 'admin'
  const isOwner = role === 'owner'

  return (
    <OrgContext.Provider
      value={{
        organization,
        membership,
        isLoading,
        isAdmin,
        isOwner,
        role,
        refetch: fetchOrgData,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider')
  }
  return context
}
