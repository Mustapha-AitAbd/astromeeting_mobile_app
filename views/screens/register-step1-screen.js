"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"

WebBrowser.maybeCompleteAuthSession()

export default function RegisterStep1Screen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // --- CONFIG GOOGLE OAUTH (iOS uniquement) ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "576392076825-7cnap922s5u771d1u37b6q47ba0236a1.apps.googleusercontent.com ",
    // Pas besoin d'autres client IDs si on veut seulement iOS
  })

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSuccess(response.authentication)
    } else if (response?.type === "error") {
      console.log("Google OAuth Error:", response.error)
      setError("Google sign-in failed. Please try again.")
    }
  }, [response])

  // --- VALIDATION ---
  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    return true
  }

  // --- MANUAL REGISTER (email / password) ---
  const handleManualRegister = async () => {
    setError("")
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("https://puny-insects-wash.loca.lt/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.log("Register error:", data)
        setError(data.message || "Registration failed")
        return
      }

      Alert.alert("Success", "Account created successfully!")
      navigation.navigate("RegisterStep2", { email, password })
    } catch (error) {
      console.error("Network error:", error)
      setError("Unable to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  // --- GOOGLE REGISTER SUCCESS ---
  const handleGoogleSuccess = async (authentication) => {
    if (!authentication?.idToken) {
      setError("Failed to get authentication token")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("https://puny-insects-wash.loca.lt/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: authentication.idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.log("Google sign-up error:", data)
        setError(data.message || "Unable to sign up with Google")
        return
      }

      Alert.alert("Success", "Signed up successfully with Google!")
      navigation.navigate("RegisterStep3", { registrationMethod: "google", user: data.user })
    } catch (error) {
      console.error("Google Sign-In Error:", error)
      setError("Google sign-in failed")
    } finally {
      setIsLoading(false)
    }
  }

  // --- GOOGLE REGISTER ---
  const handleGoogleRegister = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Google Sign-In is only available on iOS")
      return
    }

    if (!request) {
      setError("Google Sign-In is not ready yet. Please try again.")
      return
    }

    try {
      await promptAsync()
    } catch (error) {
      console.error("Google Sign-In Error:", error)
      setError("Failed to open Google Sign-In")
    }
  }

  return (
    <LinearGradient colors={["#8B3A8B", "#C74B9C", "#E85D9A"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.jpeg")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>Syni</Text>
          </View>

          {/* Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                setError("")
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                setError("")
              }}
              secureTextEntry
              editable={!isLoading}
            />

            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                setError("")
              }}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.buttonDisabled]}
            onPress={handleManualRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingDot}>•</Text>
                <Text style={styles.loadingDot}>•</Text>
                <Text style={styles.loadingDot}>•</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* Google Sign-up Button - iOS uniquement */}
          {Platform.OS === "ios" && (
            <>
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-up Button */}
              <TouchableOpacity
                style={[styles.googleButton, (!request || isLoading) && styles.buttonDisabled]}
                disabled={!request || isLoading}
                onPress={handleGoogleRegister}
              >
                <View style={styles.socialButtonContent}>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>Sign up with Google</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* Bottom Links */}
          <View style={styles.bottomContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Text */}
          <Text style={styles.legalText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
    borderRadius: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: "#FF3B30",
  },
  continueButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    color: "#8B3A8B",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    color: "#8B3A8B",
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 2,
    opacity: 0.8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dividerText: {
    color: "#FFFFFF",
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4285F4",
    marginRight: 12,
  },
  googleButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  loginText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginRight: 6,
  },
  loginLink: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  legalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
  },
})