"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CodeInput from "../../components/CodeInput"

export default function RegisterStep5Screen({ navigation, route }) {
  const { dialCode, phoneNumber } = route.params
  const [code, setCode] = useState("")

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the complete verification code")
      return
    }
    // Simulate verification (in real app, verify with backend)
    Alert.alert("Success", "Your account has been created successfully!", [
      {
        text: "OK",
        onPress: () => navigation.navigate("Login"),
      },
    ])
  }

  const handleResendCode = () => {
    Alert.alert("Success", "Verification code has been resent to your phone")
  }

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.phoneNumber}>
          {dialCode}
          {phoneNumber}
        </Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          <CodeInput length={6} onComplete={setCode} />
        </View>

        {/* Resend Link */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive anything? </Text>
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
          <LinearGradient
            colors={["#FF6B9D", "#FFA07A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Complete Registration</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 40,
  },
  backButtonText: {
    color: "white",
    fontSize: 32,
    fontWeight: "300",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  phoneNumber: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 60,
  },
  codeContainer: {
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 60,
  },
  resendText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  resendLink: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  button: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})
