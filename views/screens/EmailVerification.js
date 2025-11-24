import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:5000"

export default function EmailVerificationScreen({ route, navigation }) {
  const { email, userId, token, user, fromGoogle } = route.params
  
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Refs pour les inputs
  const inputRefs = useRef([])

  // Countdown pour le bouton "Resend"
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Focus automatique sur le premier input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleCodeChange = (text, index) => {
    // Ne garder que les chiffres
    const digit = text.replace(/[^0-9]/g, '')
    
    if (digit.length <= 1) {
      const newCode = [...code]
      newCode[index] = digit
      setCode(newCode)
      setError("")

      // Focus automatique sur le prochain input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyPress = (e, index) => {
    // Retour arrière : focus sur l'input précédent
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const verificationCode = code.join("")
    
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("📤 Vérification du code:", verificationCode)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        }),
      })

      const data = await response.json()
      console.log("📥 Réponse de vérification:", data)

      if (!response.ok) {
        setError(data.message || "Invalid verification code")
        // Effacer le code en cas d'erreur
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        return
      }

      // Succès !
      Alert.alert(
        "Success! ✅",
        "Your email has been verified successfully!",
        [
          {
            text: "Continue",
            onPress: () => {
              // Navigation vers l'écran principal ou profil
              if (fromGoogle) {
                navigation.navigate("Home", { user: data.user, token })
              } else {
                navigation.navigate("RegisterStep3", { 
                  email, 
                  userId, 
                  token,
                  user: data.user 
                })
              }
            }
          }
        ]
      )

    } catch (error) {
      console.error("❌ Erreur de vérification:", error)
      setError("Unable to verify code. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return

    setResendLoading(true)
    setError("")

    try {
      console.log("📤 Renvoi du code à:", email)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      console.log("📥 Réponse de renvoi:", data)

      if (!response.ok) {
        setError(data.message || "Failed to resend code")
        return
      }

      Alert.alert("Success", "A new verification code has been sent to your email!")
      setCountdown(60) // 60 secondes avant de pouvoir renvoyer à nouveau
      
      // Effacer le code actuel
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()

    } catch (error) {
      console.error("❌ Erreur de renvoi:", error)
      setError("Unable to resend code. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <LinearGradient colors={["#8B3A8B", "#C74B9C", "#E85D9A"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>📧</Text>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  error && styles.codeInputError
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#8B3A8B" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={countdown > 0 || resendLoading}
            >
              <Text style={[
                styles.resendLink,
                (countdown > 0 || resendLoading) && styles.resendDisabled
              ]}>
                {resendLoading ? "Sending..." : countdown > 0 ? `Resend (${countdown}s)` : "Resend Code"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Registration</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  codeInput: {
    width: 50,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#8B3A8B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeInputFilled: {
    backgroundColor: "#F0E6F0",
    borderWidth: 2,
    borderColor: "#8B3A8B",
  },
  codeInputError: {
    borderColor: "#FF3B30",
  },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyButtonText: {
    color: "#8B3A8B",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  resendText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginBottom: 8,
  },
  resendLink: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  resendDisabled: {
    opacity: 0.5,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    fontWeight: "600",
  },
})