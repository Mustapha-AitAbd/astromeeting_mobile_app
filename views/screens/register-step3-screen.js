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
  Modal,
  FlatList,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { countriesData, getCitiesByCountryCode } from "../../data/countries-cities"

export default function RegisterStep3Screen({ navigation, route }) {
  const { email, password, registrationMethod, userId, token, user, fromGoogle } = route.params
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState("")
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [gender, setGender] = useState(null)
  const [cities, setCities] = useState([])
  const [errors, setErrors] = useState({})
  
  // Modals state
  const [countryModalVisible, setCountryModalVisible] = useState(false)
  const [cityModalVisible, setCityModalVisible] = useState(false)
  const [genderModalVisible, setGenderModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const genderOptions = [
    { label: "Male", value: "male", icon: "♂" },
    { label: "Female", value: "female", icon: "♀" },
    { label: "Other", value: "other", icon: "⚧" },
    { label: "Prefer not to say", value: "not_specified", icon: "•" },
  ]

  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setSelectedCity(null)
    setErrors({ ...errors, country: null, city: null })
    setCountryModalVisible(false)
    setSearchQuery("")
    
    const countryCities = getCitiesByCountryCode(country.code)
    setCities(countryCities || [])
  }

  const handleCitySelect = (city) => {
    setSelectedCity(city)
    setCityModalVisible(false)
    setSearchQuery("")
    if (errors.city) setErrors({ ...errors, city: null })
  }

  const handleGenderSelect = (genderOption) => {
    setGender(genderOption)
    setGenderModalVisible(false)
    if (errors.gender) setErrors({ ...errors, gender: null })
  }

  const filteredCountries = countriesData.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const validateForm = () => {
    const newErrors = {}
    
    if (!firstName.trim()) newErrors.firstName = "First name is required"
    if (!lastName.trim()) newErrors.lastName = "Last name is required"
    if (!age) {
      newErrors.age = "Age is required"
    } else if (parseInt(age) < 13 || parseInt(age) > 120) {
      newErrors.age = "Please enter a valid age (13-120)"
    }
    if (!selectedCountry) newErrors.country = "Please select a country"
    if (!selectedCity && cities.length > 0) newErrors.city = "Please select a city"
    if (!gender) newErrors.gender = "Please select a gender"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validateForm()) {
      navigation.navigate("RegisterStep4", {
        email,
        password,
        registrationMethod,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age,
        country: selectedCountry.code,
        city: selectedCity,
        gender: gender.value,
        userId,
        token,
        user,
        fromGoogle
      })
    }
  }

  const renderSelectionModal = (visible, onClose, title, data, onSelect, renderItem, noDataText) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {data.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={renderItem}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>{noDataText}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>Help us personalize your experience</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="First Name *"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text)
                    if (errors.firstName) setErrors({ ...errors, firstName: null })
                  }}
                  autoCapitalize="words"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Last Name *"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text)
                    if (errors.lastName) setErrors({ ...errors, lastName: null })
                  }}
                  autoCapitalize="words"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.age && styles.inputError]}
                  placeholder="Age *"
                  placeholderTextColor="#999"
                  value={age}
                  onChangeText={(text) => {
                    setAge(text)
                    if (errors.age) setErrors({ ...errors, age: null })
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>

              {/* Gender Selector */}
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={[styles.selector, errors.gender && styles.inputError]}
                  onPress={() => setGenderModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectorText, !gender && styles.placeholderText]}>
                    {gender ? `${gender.icon} ${gender.label}` : "Select Gender *"}
                  </Text>
                  <Text style={styles.selectorArrow}>›</Text>
                </TouchableOpacity>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={[styles.selector, errors.country && styles.inputError]}
                  onPress={() => setCountryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectorText, !selectedCountry && styles.placeholderText]}>
                    {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "Select Country *"}
                  </Text>
                  <Text style={styles.selectorArrow}>›</Text>
                </TouchableOpacity>
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    errors.city && styles.inputError,
                    !selectedCountry && styles.selectorDisabled
                  ]}
                  onPress={() => selectedCountry && setCityModalVisible(true)}
                  activeOpacity={0.7}
                  disabled={!selectedCountry}
                >
                  <Text style={[styles.selectorText, !selectedCity && styles.placeholderText]}>
                    {selectedCity || (selectedCountry ? "Select City *" : "Select a country first")}
                  </Text>
                  <Text style={styles.selectorArrow}>›</Text>
                </TouchableOpacity>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                {cities.length > 0 && (
                  <Text style={styles.helperText}>{cities.length} cities available</Text>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.requiredNote}>* Required fields</Text>

          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
            <LinearGradient
              colors={["#FF6B9D", "#FFA07A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      {renderSelectionModal(
        countryModalVisible,
        () => {
          setCountryModalVisible(false)
          setSearchQuery("")
        },
        "Select Country",
        filteredCountries,
        handleCountrySelect,
        ({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => handleCountrySelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.listItemFlag}>{item.flag}</Text>
            <Text style={styles.listItemText}>{item.name}</Text>
            {selectedCountry?.code === item.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ),
        "No countries found"
      )}

      {/* City Modal */}
      {renderSelectionModal(
        cityModalVisible,
        () => {
          setCityModalVisible(false)
          setSearchQuery("")
        },
        "Select City",
        filteredCities,
        handleCitySelect,
        ({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => handleCitySelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.listItemText}>{item}</Text>
            {selectedCity === item && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ),
        "No cities found"
      )}

      {/* Gender Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={genderModalVisible}
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setGenderModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity 
                onPress={() => setGenderModalVisible(false)} 
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.genderContainer} showsVerticalScrollIndicator={false}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender?.value === option.value && styles.genderOptionSelected
                  ]}
                  onPress={() => handleGenderSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.genderIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.genderLabel,
                    gender?.value === option.value && styles.genderLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  {gender?.value === option.value && (
                    <Text style={styles.genderCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 30,
  },
  backButtonText: {
    color: "white",
    fontSize: 32,
    fontWeight: "300",
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7B2CBF",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "transparent",
    color: "#333",
  },
  inputError: {
    borderColor: "#FF4458",
    borderWidth: 1.5,
  },
  selector: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectorDisabled: {
    backgroundColor: "#F0F0F0",
    opacity: 0.6,
  },
  selectorText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  selectorArrow: {
    fontSize: 24,
    color: "#7B2CBF",
    fontWeight: "300",
  },
  errorText: {
    color: "#FF4458",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  helperText: {
    color: "#7B2CBF",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: "italic",
  },
  requiredNote: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    marginBottom: 24,
    textAlign: "center",
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
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "300",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    marginHorizontal: 24,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  listItemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  checkmark: {
    fontSize: 20,
    color: "#7B2CBF",
    fontWeight: "bold",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
  },
  // Gender Modal Styles
  genderContainer: {
    padding: 24,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderOptionSelected: {
    backgroundColor: "#F3E8FF",
    borderColor: "#7B2CBF",
  },
  genderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  genderLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  genderLabelSelected: {
    color: "#7B2CBF",
    fontWeight: "600",
  },
  genderCheckmark: {
    fontSize: 20,
    color: "#7B2CBF",
    fontWeight: "bold",
  },
})