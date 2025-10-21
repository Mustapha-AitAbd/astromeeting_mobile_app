"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Picker } from "@react-native-picker/picker"
import { countriesData } from "../../data/countries-cities"

export default function RegisterStep4Screen({ navigation, route }) {
  const userData = route.params
  const [selectedDialCode, setSelectedDialCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleContinue = () => {
    if ( phoneNumber.length < 6) {
      Alert.alert("Error", "Please enter a valid phone number")
      return
    }
    navigation.navigate("RegisterStep5", {
      ...userData,
      dialCode: selectedDialCode,
      phoneNumber,
    })
  }

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>What's your number?</Text>
        <Text style={styles.subtitle}>
          We'll send you a code to verify your phone number. Standard message and data rates may apply.
        </Text>

        {/* Phone Input Container */}
        <View style={styles.phoneContainer}>
          {/* Country Code Picker */}
          <View style={styles.dialCodeContainer}>
            <Picker selectedValue={selectedDialCode} onValueChange={setSelectedDialCode} style={styles.dialCodePicker}>
              {countriesData.map((country) => (
                <Picker.Item
                  key={country.code}
                  label={`${country.code} ${country.dialCode}`}
                  value={country.dialCode}
                />
              ))}
            </Picker>
          </View>

          {/* Phone Number Input */}
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>What happens if I change my number?</Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <LinearGradient
            colors={["#FF6B9D", "#FFA07A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    marginBottom: 40,
  },
  phoneContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  dialCodeContainer: {
    backgroundColor: "white",
    borderRadius: 30,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    width: 120,
  },
  dialCodePicker: {
    height: 50,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  infoText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 40,
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

