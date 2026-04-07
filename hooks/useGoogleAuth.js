// hooks/useGoogleAuth.js
import { useEffect, useState } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const API_BASE_URL      = process.env.EXPO_PUBLIC_API_URL
const WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID

/**
 * useGoogleAuth
 *
 * Gère Google OAuth pour le LOGIN et le REGISTER avec la même logique :
 *
 *  ┌─ User existant  → onExistingUser(data)  → navigate Home
 *  └─ Nouvel user    → onNewUser(data)        → navigate RegisterStep3
 *
 * La distinction est faite par le backend via le flag `needsProfileCompletion`.
 */
export function useGoogleAuth({ onNewUser, onExistingUser, onError }) {
  const [isLoading, setIsLoading] = useState(false)

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     WEB_CLIENT_ID,      // Requis pour obtenir l'idToken
    iosClientId:     IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  })

  // ── Réagir à la réponse Google ────────────────────────────────────────────
  useEffect(() => {
    if (!response) return

    if (response.type === 'success') {
      const { idToken, accessToken } = response.authentication ?? {}

      if (idToken) {
        // ✅ Flux principal — idToken signé, vérifiable côté backend de façon sécurisée
        sendIdTokenToBackend(idToken)
      } else if (accessToken) {
        // ✅ Fallback — Android/iOS peut ne pas retourner d'idToken dans certains cas
        fetchUserInfoThenSend(accessToken)
      } else {
        onError?.('Aucun token reçu de Google. Veuillez réessayer.')
        setIsLoading(false)
      }
    } else if (response.type === 'error') {
      onError?.(response.error?.message || "Échec de l'authentification Google")
      setIsLoading(false)
    } else {
      // 'cancel' ou 'dismiss' — l'utilisateur a fermé la fenêtre Google
      setIsLoading(false)
    }
  }, [response])

  // ── Flux 1 : idToken → backend ────────────────────────────────────────────
  const sendIdTokenToBackend = async (idToken) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data.message || 'Échec de la connexion Google')
        return
      }

      handleBackendResponse(data)
    } catch {
      onError?.('Impossible de se connecter au serveur. Vérifiez votre connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Flux 2 : accessToken → userinfo Google → backend ─────────────────────
  const fetchUserInfoThenSend = async (accessToken) => {
    try {
      // Étape 1 : récupérer les infos utilisateur depuis l'API Google
      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!userInfoRes.ok) {
        onError?.('Impossible de récupérer les informations du compte Google')
        return
      }

      const userInfo = await userInfoRes.json()

      // Étape 2 : envoyer accessToken + userInfo au backend
      const res  = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accessToken, userInfo }),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data.message || 'Échec de la connexion Google')
        return
      }

      handleBackendResponse(data)
    } catch {
      onError?.('Impossible de se connecter au serveur. Vérifiez votre connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Logique centrale : LOGIN vs REGISTER selon la réponse backend ─────────
  //
  // Le backend renvoie toujours :
  // {
  //   success: true,
  //   token: "...",
  //   needsProfileCompletion: boolean,   ← clé de la séparation
  //   user: { id, name, email, avatar, hasCompletedProfile, ... }
  // }
  //
  // needsProfileCompletion = true  → Nouvel utilisateur → onNewUser  → RegisterStep3
  // needsProfileCompletion = false → User existant      → onExistingUser → Home
  //
  const handleBackendResponse = (data) => {
    if (data.needsProfileCompletion) {
      onNewUser?.(data)       // 🆕 Nouvel utilisateur → compléter l'inscription
    } else {
      onExistingUser?.(data)  // ✅ User existant → accès direct à Home
    }
  }

  // ── Démarrer l'authentification Google ───────────────────────────────────
  const signInWithGoogle = async () => {
    if (!request) {
      onError?.('Google Sign-In non disponible. Veuillez réessayer dans un instant.')
      return
    }
    setIsLoading(true)
    await promptAsync()
  }

  return { request, isLoading, signInWithGoogle }
}