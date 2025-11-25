'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, LogIn, CheckCircle2, AlertCircle } from 'lucide-react'

interface SalesforceLoginButtonProps {
  environmentId: string
  disabled?: boolean
  onTokenReceived?: (token: string, expiresAt: string) => void
  onError?: (error: string) => void
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export function SalesforceLoginButton({
  environmentId,
  disabled = false,
  onTokenReceived,
  onError,
}: SalesforceLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== APP_URL) return

      const { type, success, token, expiresAt, error } = event.data

      if (type === 'salesforce-oauth-success' && success && token) {
        setIsLoading(false)
        setStatus('success')
        onTokenReceived?.(token, expiresAt)

        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000)
      } else if (type === 'salesforce-oauth-error') {
        setIsLoading(false)
        setStatus('error')
        onError?.(error || 'Authentication failed')

        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000)
      }
    },
    [onTokenReceived, onError]
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  const handleLogin = () => {
    setIsLoading(true)
    setStatus('idle')

    // Open popup for OAuth flow
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `/api/auth/salesforce/authorize?environmentId=${environmentId}`,
      'salesforce-oauth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    )

    // Check if popup was blocked
    if (!popup) {
      setIsLoading(false)
      setStatus('error')
      onError?.('Popup was blocked. Please allow popups for this site.')
      return
    }

    // Monitor popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        // If still loading when closed, user cancelled
        if (isLoading) {
          setIsLoading(false)
        }
      }
    }, 500)
  }

  return (
    <Button
      type="button"
      variant={status === 'success' ? 'outline' : 'secondary'}
      size="sm"
      onClick={handleLogin}
      disabled={disabled || isLoading}
      className={status === 'success' ? 'border-green-500 text-green-600' : ''}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : status === 'success' ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Connected
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Retry
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Login with Salesforce
        </>
      )}
    </Button>
  )
}
