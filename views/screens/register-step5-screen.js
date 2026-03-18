import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CodeInput from "../../components/CodeInput"
import AsyncStorage from '@react-native-async-storage/async-storage'

const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL

export default function RegisterStep5Screen({ navigation, route }) {
  const userData = route.params
  const { dialCode, phoneNumber, fullPhoneNumber, maskedPhone, token } = userData
  
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the complete verification code")
      return
    }

    setLoading(true)

    try {
      // ✅ Récupération du token
      let authToken = token || await AsyncStorage.getItem('accessToken')
      
      if (!authToken) {
        authToken = await AsyncStorage.getItem('token')
      }

      if (!authToken) {
        Alert.alert(
          "Authentication Error",
          "Session expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        )
        return
      }

      console.log('🔐 Verifying phone code...')

      // ✅ Envoi du code de vérification au backend
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/verify-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          code: code
        })
      })

      const data = await response.json()

      console.log('📡 Verification response:', response.status, data)

      if (!response.ok) {
        // Gestion des différentes erreurs
        if (response.status === 400) {
          if (data.message.includes('expired')) {
            Alert.alert(
              "Code Expired",
              "Your verification code has expired. Please request a new one.",
              [
                {
                  text: "Resend Code",
                  onPress: handleResendCode
                }
              ]
            )
          } else if (data.message.includes('Invalid')) {
            Alert.alert("Invalid Code", "The code you entered is incorrect. Please try again.")
          } else {
            Alert.alert("Error", data.message || "Verification failed")
          }
        } else if (response.status === 401) {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please login again.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("Login")
              }
            ]
          )
        } else {
          Alert.alert("Error", data.message || "Failed to verify code")
        }
        return
      }

      // ✅ Vérification réussie
      console.log('✅ Phone verified successfully')

      Alert.alert(
        "Success",
        "Your phone number has been verified successfully!",
        [
          {
            text: "Continue",
            onPress: () => {
              // ✅ Passer toutes les données à l'étape suivante
              navigation.navigate("RegisterStep6", {
                ...userData,
                phoneVerified: true,
                verifiedPhone: data.phone || fullPhoneNumber
              })
            }
          }
        ]
      )

    } catch (error) {
      console.error('❌ Error verifying code:', error)
      Alert.alert(
        "Network Error",
        "Unable to connect to server. Please check your internet connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)

    try {
      // ✅ Récupération du token
      let authToken = token || await AsyncStorage.getItem('accessToken')
      
      if (!authToken) {
        authToken = await AsyncStorage.getItem('token')
      }

      if (!authToken) {
        Alert.alert(
          "Authentication Error",
          "Session expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        )
        return
      }

      console.log('📤 Resending verification code...')

      // ✅ Appel à l'API pour renvoyer le code
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/resend-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()

      console.log('📡 Resend response:', response.status, data)

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please login again.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("Login")
              }
            ]
          )
        } else {
          Alert.alert("Error", data.message || "Failed to resend code")
        }
        return
      }

      // ✅ Code renvoyé avec succès
      console.log('✅ Verification code resent')
      Alert.alert(
        "Success",
        "A new verification code has been sent to your phone"
      )

      // Réinitialiser le code saisi
      setCode("")

    } catch (error) {
      console.error('❌ Error resending code:', error)
      Alert.alert(
        "Network Error",
        "Unable to connect to server. Please check your internet connection and try again."
      )
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={loading || resendLoading}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.phoneNumber}>
          {maskedPhone || `${dialCode}${phoneNumber}`}
        </Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          <CodeInput 
            length={6} 
            onComplete={setCode} 
            disabled={loading || resendLoading}
          />
        </View>

        {/* Resend Link */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive anything? </Text>
          <TouchableOpacity 
            onPress={handleResendCode}
            disabled={loading || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.resendLink}>Resend</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.button, (loading || resendLoading) && styles.buttonDisabled]} 
          onPress={handleVerifyCode}
          disabled={loading || resendLoading || code.length !== 6}
        >
          <LinearGradient
            colors={(loading || resendLoading || code.length !== 6) ? ["#ccc", "#999"] : ["#FF6B9D", "#FFA07A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Complete Registration</Text>
            )}
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
    alignItems: "center",
    marginBottom: 60,
    minHeight: 24,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})