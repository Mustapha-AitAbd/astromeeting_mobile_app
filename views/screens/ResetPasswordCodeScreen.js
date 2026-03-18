import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL

// Écran 2: Saisie du code et nouveau mot de passe
export default function ResetPasswordCodeScreen({ route, navigation }) {
  const { email } = route.params
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!code.trim()) {
      setError("Please enter the reset code")
      return
    }

    if (code.trim().length !== 6) {
      setError("Reset code must be 6 digits")
      return
    }

    if (!newPassword) {
      setError("Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: code.trim(),
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert(
          "Success",
          "Your password has been reset successfully",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        )
      } else {
        setError(data.message || "Failed to reset password")
        Alert.alert("Error", data.message || "Failed to reset password")
      }
    } catch (err) {
      console.log("Error:", err)
      setError("Network error. Please try again.")
      Alert.alert("Error", "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/password-reset-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert("Success", "A new code has been sent to your email")
      } else {
        Alert.alert("Error", data.message || "Failed to resend code")
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again.")
    }
  }

  return (
    <LinearGradient colors={["#8B3A8B", "#C74B9C", "#E85D9A"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {email}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="6-digit code"
          placeholderTextColor="#999"
          value={code}
          onChangeText={(text) => {
            // Only allow numbers
            const numericText = text.replace(/[^0-9]/g, "")
            setCode(numericText)
            setError("")
          }}
          keyboardType="number-pad"
          maxLength={6}
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="New password"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text)
            setError("")
          }}
          secureTextEntry
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Confirm new password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text)
            setError("")
          }}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingDot}>•</Text>
              <Text style={styles.loadingDot}>•</Text>
              <Text style={styles.loadingDot}>•</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResendCode} style={styles.resendButton}>
          <Text style={styles.resendButtonText}>Didn't receive the code? Resend</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
  },
  header: {
    paddingTop: 60,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#f81f14ff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#fcfcfcff",
    fontSize: 14,
    fontWeight: "600",
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
  submitButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonText: {
    color: "#8B3A8B",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  submitButtonDisabled: {
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
  resendButton: {
    marginTop: 20,
    alignItems: "center",
  },
  resendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
})