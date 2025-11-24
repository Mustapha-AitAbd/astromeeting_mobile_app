"use client"

import { useState, useContext } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { AuthContext } from "../../context/AuthContext"
import * as AuthSession from 'expo-auth-session';


export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    console.log("Redirect URI =", AuthSession.makeRedirectUri());
    setError("") // Reset error
    setIsLoading(true) // Start loading
    try {
      const result = await login(email, password)
      // If login returns false or an error
      if (!result) {
        setError("Incorrect email or password")
      }
    } catch (err) {
      setError("Incorrect email or password")
    } finally {
      setIsLoading(false) // Stop loading
    }
  }

  return (
    <LinearGradient colors={["#8B3A8B", "#C74B9C", "#E85D9A"]} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require("../../assets/logo.jpeg")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Syni</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.formContainer}>
        {/* Message d'erreur */}
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
            setError("") // Clear error on input
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            setError("") // Clear error on input
          }}
          secureTextEntry
        />

        {/* Forgot Password Link */}
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => alert("Forgot Password")}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingDot}>•</Text>
              <Text style={styles.loadingDot}>•</Text>
              <Text style={styles.loadingDot}>•</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        {/* Google Login Button */}
        <TouchableOpacity style={styles.googleButton} onPress={login}>
          <View style={styles.socialButtonContent}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Links */}
      <View style={styles.bottomContainer}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("RegisterStep1")}>
          <Text style={styles.signupLink}>Create account</Text>
        </TouchableOpacity>
      </View>

      {/* Legal Text */}
      <Text style={styles.legalText}>
        By signing in, you agree to our terms of service
      </Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 50,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 15,
    borderRadius: 20,
  },
  appName: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
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
  loginButtonText: {
    color: "#8B3A8B",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  loginButtonDisabled: {
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
    marginVertical: 30,
  },
  divider: {
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
  socialButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  signupText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginRight: 6,
  },
  signupLink: {
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
  },
})