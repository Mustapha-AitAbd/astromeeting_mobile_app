"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Picker } from "@react-native-picker/picker"
import { countriesData, getCitiesByCountryCode } from "../../data/countries-cities"

export default function RegisterStep3Screen({ navigation, route }) {
  const { email, password, registrationMethod } = route.params
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [gender, setGender] = useState("")
  const [cities, setCities] = useState([])

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode)
    setSelectedCity("")
    const countryCities = getCitiesByCountryCode(countryCode)
    setCities(countryCities)
  }

  const handleContinue = () => {
    if (!firstName || !lastName || !age ) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }
    navigation.navigate("RegisterStep4", {
      email,
      password,
      registrationMethod,
      firstName,
      lastName,
      age,
      country: selectedCountry,
      city: selectedCity,
      gender,
    })
  }

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>We'd love to get to know you better</Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#999"
              value={firstName}
              onChangeText={setFirstName}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#999"
              value={lastName}
              onChangeText={setLastName}
            />

            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#999"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={2}
            />

            {/* Country Picker */}
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedCountry} onValueChange={handleCountryChange} style={styles.picker}>
                <Picker.Item label="Select Country" value="" />
                {countriesData.map((country) => (
                  <Picker.Item key={country.code} label={country.name} value={country.code} />
                ))}
              </Picker>
            </View>

            {/* City Picker */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCity}
                onValueChange={setSelectedCity}
                style={styles.picker}
                enabled={cities.length > 0}
              >
                <Picker.Item label="Select City" value="" />
                {cities.map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>

            {/* Gender Picker */}
            <View style={styles.pickerContainer}>
              <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 30,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  picker: {
    height: 50,
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
