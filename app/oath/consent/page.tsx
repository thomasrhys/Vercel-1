'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ConsentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleConsent() {
      const code = searchParams.get('code')
      
      if (!code) {
        setError('No authorization code provided')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/profile')
      }
    }

    handleConsent()
  }, [searchParams, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p>Processing authorization...</p>
    </div>
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-600 mb-4">Authorization Failed</h1>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Return to Login
        </button>
      </div>
    </div>
  }

  return null
}
