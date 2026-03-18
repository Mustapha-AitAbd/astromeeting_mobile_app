import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Returns { isLoading, hasSeenOnboarding }
 * Use this in your root navigator to decide the initial route.
 */
export function useOnboarding() {
  const [isLoading,         setIsLoading]         = useState(true)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding")
      .then((value) => setHasSeenOnboarding(value === "true"))
      .catch(() => setHasSeenOnboarding(false))
      .finally(() => setIsLoading(false))
  }, [])

  return { isLoading, hasSeenOnboarding }
}