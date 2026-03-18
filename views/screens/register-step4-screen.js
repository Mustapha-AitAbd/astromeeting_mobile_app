import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export default function RegisterStep4Screen({ navigation, route }) {
  const userData = route.params
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkTokenAvailability()
  }, [])

  const checkTokenAvailability = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const allKeys = await AsyncStorage.getAllKeys()
      
      console.log('🔍 Available AsyncStorage keys:', allKeys)
      console.log('📝 UserData from navigation:', userData)
      
      if (token) {
        console.log('✅ Token found in AsyncStorage')
      } else if (userData?.token) {
        console.log('✅ Token found in navigation params')
      } else {
        console.warn('⚠️ No token found - User might need to complete registration first')
      }
    } catch (error) {
      console.error('❌ Error checking token:', error)
    }
  }

  // ✅ Validation du numéro de téléphone international
  const validatePhoneNumber = (phone) => {
    // Retirer tous les espaces, tirets, parenthèses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    // Doit commencer par + et contenir entre 10 et 15 chiffres
    const phoneRegex = /^\+[1-9]\d{9,14}$/
    
    return phoneRegex.test(cleanPhone)
  }

  // ✅ Formater le numéro pendant la saisie
  const handlePhoneChange = (text) => {
    // Permettre seulement les chiffres, +, espaces, tirets et parenthèses
    const filtered = text.replace(/[^0-9+\s\-\(\)]/g, '')
    
    // S'assurer que + est seulement au début
    if (filtered.includes('+')) {
      const parts = filtered.split('+')
      const formatted = '+' + parts.join('').replace(/\+/g, '')
      setPhoneNumber(formatted)
    } else {
      setPhoneNumber(filtered)
    }
  }

  const handleContinue = async () => {
    // Retirer les espaces et caractères de formatage
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Validation
    if (!cleanPhone.startsWith('+')) {
      Alert.alert("Invalid Format", "Phone number must start with country code (e.g., +1 for US, +33 for France, +212 for Morocco)")
      return
    }

    if (!validatePhoneNumber(cleanPhone)) {
      Alert.alert("Invalid Phone Number", "Please enter a valid international phone number with country code (e.g., +1234567890)")
      return
    }

    if (cleanPhone.length < 10) {
      Alert.alert("Too Short", "Phone number is too short")
      return
    }

    if (cleanPhone.length > 16) {
      Alert.alert("Too Long", "Phone number is too long")
      return
    }

    setLoading(true)

    try {
      // ✅ Récupérer le token
      let token = await AsyncStorage.getItem('userToken')
      
      if (!token) {
        token = await AsyncStorage.getItem('token')
      }
      
      if (!token && userData?.token) {
        token = userData.token
      }

      // ✅ Si pas de token et c'est une inscription Google, utiliser le token
      if (!token && userData?.fromGoogle) {
        token = userData.token
      }

      // ✅ Si toujours pas de token, créer le compte d'abord
      if (!token) {
        console.log('⚠️ No token found - Creating user account first...')
        
        if (!userData?.email || !userData?.password) {
          Alert.alert(
            "Missing Information",
            "Please complete the previous registration steps first.",
            [
              {
                text: "Go Back",
                onPress: () => navigation.goBack()
              }
            ]
          )
          return
        }

        const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: userData.name || `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            password: userData.password,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth,
          })
        })

        const registerData = await registerResponse.json()

        if (!registerResponse.ok) {
          Alert.alert("Registration Error", registerData.message || "Failed to create account")
          return
        }

        token = registerData.token || registerData.accessToken

        if (!token) {
          Alert.alert("Error", "Registration succeeded but no token received")
          return
        }

        await AsyncStorage.setItem('userToken', token)
        console.log('✅ Account created and token saved')
      }

      // ✅ Envoyer le code de vérification SMS
      console.log('📱 Sending verification code to:', cleanPhone)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/send-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: cleanPhone
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data)
        
        if (response.status === 401) {
          await AsyncStorage.removeItem('userToken')
          Alert.alert(
            "Session Expired", 
            "Please start the registration process again.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("RegisterStep1")
              }
            ]
          )
        } else {
          Alert.alert("Error", data.message || "Failed to send verification code")
        }
        return
      }

      console.log('✅ Verification code sent successfully')
      
      Alert.alert(
        "Code Sent! 📱", 
        `A verification code has been sent to ${cleanPhone}`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("RegisterStep5", {
                ...userData,
                token,
                fullPhoneNumber: cleanPhone,
                maskedPhone: data.phone || cleanPhone
              })
            }
          }
        ]
      )

    } catch (error) {
      console.error('❌ Network error:', error)
      Alert.alert(
        "Network Error", 
        "Unable to connect to server. Please check your internet connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>What's your number?</Text>
        <Text style={styles.subtitle}>
          Enter your phone number with country code (e.g., +1 for US, +33 for France, +212 for Morocco)
        </Text>

        {/* Example Format */}
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleLabel}>Examples:</Text>
          <Text style={styles.exampleText}>🇺🇸 US: +1 234 567 8900</Text>
          <Text style={styles.exampleText}>🇫🇷 France: +33 6 12 34 56 78</Text>
          <Text style={styles.exampleText}>🇲🇦 Morocco: +212 6 12 34 56 78</Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <View style={styles.phoneIconContainer}>
            <Text style={styles.phoneIcon}>📱</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="+212 612345678"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            editable={!loading}
            maxLength={20}
            autoFocus={true}
          />
        </View>

        {/* Validation Helper */}
        {phoneNumber.length > 0 && (
          <View style={styles.validationContainer}>
            {phoneNumber.startsWith('+') ? (
              validatePhoneNumber(phoneNumber.replace(/[\s\-\(\)]/g, '')) ? (
                <Text style={styles.validText}>✓ Valid phone number</Text>
              ) : (
                <Text style={styles.invalidText}>⚠ Check your phone number format</Text>
              )
            ) : (
              <Text style={styles.warningText}>⚠ Must start with + and country code</Text>
            )}
          </View>
        )}

        {/* Info Text */}
        <Text style={styles.infoText}>
          Standard message and data rates may apply
        </Text>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleContinue}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#ccc", "#999"] : ["#FF6B9D", "#FFA07A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.loadingText}>Sending code...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Continue →</Text>
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
    marginBottom: 30,
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
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 20,
    marginBottom: 20,
  },
  exampleContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  exampleLabel: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  exampleText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 13,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  phoneIconContainer: {
    marginRight: 12,
  },
  phoneIcon: {
    fontSize: 24,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: "#333",
    fontWeight: "500",
  },
  validationContainer: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  validText: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "600",
  },
  invalidText: {
    color: "#FF9800",
    fontSize: 13,
    fontWeight: "600",
  },
  warningText: {
    color: "#FF5722",
    fontSize: 13,
    fontWeight: "600",
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  button: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
})