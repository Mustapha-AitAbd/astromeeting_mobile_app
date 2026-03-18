import { useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { makeRedirectUri } from 'expo-auth-session'
import AsyncStorage from '@react-native-async-storage/async-storage'

WebBrowser.maybeCompleteAuthSession()

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export function useGoogleAuth({ onNewUser, onExistingUser, onError }) {
  const [isLoading, setIsLoading] = useState(false)

  const redirectUri = makeRedirectUri({
    scheme: 'com.mustapha01.syni',
    path: 'oauth2redirect',
  })

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  })

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication)
    } else if (response?.type === 'error') {
      setIsLoading(false)
      onError?.('Google sign-in failed. Please try again.')
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setIsLoading(false)
    }
  }, [response])

  const handleGoogleResponse = async (authentication) => {
    const accessToken = authentication?.accessToken

    if (!accessToken) {
      setIsLoading(false)
      onError?.('Failed to get access token from Google')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        onError?.(data.message || 'Google sign-in failed')
        setIsLoading(false)
        return
      }

      await AsyncStorage.multiSet([
        ['userToken', data.token],
        ['userId',    data.user.id],
        ['userEmail', data.user.email],
        ['user',      JSON.stringify(data.user)],
      ])

      setIsLoading(false)

      if (data.needsProfileCompletion) {
        onNewUser?.(data)
      } else {
        onExistingUser?.(data)
      }
    } catch (err) {
      onError?.(`Network error: ${err.message}`)
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!request) {
      onError?.('Google Sign-In is not ready. Please try again.')
      return
    }
    setIsLoading(true)
    try {
      const result = await promptAsync({ useProxy: false })
      if (result?.type !== 'success') {
        setIsLoading(false)
      }
    } catch (err) {
      onError?.('Failed to open Google Sign-In')
      setIsLoading(false)
    }
  }

  return { signInWithGoogle, isLoading, request }
}