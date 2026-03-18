import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// Écran 1: Demande de réinitialisation (email)
export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password-reset-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert(
          "Success",
          "A reset code has been sent to your email",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("ResetPasswordCode", { email: email.trim() })
            }
          ]
        )
      } else {
        setError(data.message || "Failed to send reset code")
        Alert.alert("Error", data.message || "Failed to send reset code")
      }
    } catch (err) {
      console.log("Error:", err)
      setError("Network error. Please try again.")
      Alert.alert("Error", "Network error. Please try again.")
    } finally {
      setIsLoading(false)
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
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a code to reset your password
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
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
            <Text style={styles.submitButtonText}>Send Reset Code</Text>
          )}
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
})