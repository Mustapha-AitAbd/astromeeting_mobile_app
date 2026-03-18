import { useState, useRef, useEffect } from "react"
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
  FlatList, Alert, ActivityIndicator, Animated, StatusBar, Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker from "@react-native-community/datetimepicker"

const { width } = Dimensions.get("window")
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  void:       "#07011A",
  cosmos:     "#110330",
  nebula:     "#1E0A4A",
  aurora:     "#8B5CF6",
  gold:       "#F4C842",
  goldSoft:   "#FDE68A",
  rose:       "#F472B6",
  white:      "#FFFFFF",
  dim:        "rgba(255,255,255,0.55)",
  faint:      "rgba(255,255,255,0.15)",
  glass:      "rgba(255,255,255,0.07)",
  cardBg:     "rgba(17,3,48,0.95)",
  inputBg:    "rgba(255,255,255,0.08)",
  inputBorder:"rgba(255,255,255,0.18)",
  borderGold: "rgba(244,200,66,0.22)",
  error:      "#FF6B6B",
  // Modal (light surface — keeps original UX feel for pickers)
  modalBg:    "#FFFFFF",
  modalText:  "#1A1A2E",
  modalSub:   "#5B21B6",
  modalLine:  "#F0F0F0",
  modalPH:    "#999999",
}

// ─────────────────────────────────────────────────────────────
//  STAR FIELD
// ─────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.6 + 0.3,
  o: Math.random() * 0.45 + 0.1,
}))
function StarField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map(s => (
        <View key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.r * 2, height: s.r * 2, borderRadius: s.r,
          backgroundColor: C.white, opacity: s.o,
        }} />
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  GLASS INPUT WRAPPER
// ─────────────────────────────────────────────────────────────
function GlassInput({ icon, hasError, children, style, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View
  return (
    <Wrap onPress={onPress} activeOpacity={0.75} style={[gi.wrap, hasError && gi.wrapError, style]}>
      {icon && <Ionicons name={icon} size={17} color={C.dim} style={gi.icon} />}
      {children}
    </Wrap>
  )
}
const gi = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 12,
  },
  wrapError: { borderColor: C.error },
  icon: { marginRight: 10 },
})

// ─────────────────────────────────────────────────────────────
//  COUNTRY LIST (unchanged data)
// ─────────────────────────────────────────────────────────────
const allCountries = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
]

const fetchCitiesForCountry = async (countryName) => {
  const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country: countryName }),
  })
  const json = await response.json()
  if (json.error || !json.data) return []
  return json.data.sort()
}

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function RegisterStep3Screen({ navigation, route }) {
  const { email, password, registrationMethod, userId, token, user, fromGoogle } = route.params

  const [firstName,     setFirstName]     = useState("")
  const [lastName,      setLastName]      = useState("")
  const [dateOfBirth,   setDateOfBirth]   = useState(null)
  const [showDatePicker,setShowDatePicker]= useState(false)
  const [timeOfBirth,   setTimeOfBirth]   = useState(new Date(0, 0, 0, 12, 0, 0))
  const [showTimePicker,setShowTimePicker]= useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [gender,          setGender]          = useState(null)
  const [errors,          setErrors]          = useState({})
  const [loading,         setLoading]         = useState(false)

  const [selectedCity,       setSelectedCity]       = useState(null)
  const [cities,             setCities]             = useState([])
  const [citiesLoading,      setCitiesLoading]      = useState(false)
  const [citiesError,        setCitiesError]        = useState(null)
  const [cityModalVisible,   setCityModalVisible]   = useState(false)
  const [citySearchQuery,    setCitySearchQuery]    = useState("")
  const [countryModalVisible,setCountryModalVisible]= useState(false)
  const [genderModalVisible, setGenderModalVisible] = useState(false)
  const [searchQuery,        setSearchQuery]        = useState("")

  // Entrance animation
  const fadeIn  = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(30)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 550, delay: 80, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 550, delay: 80, useNativeDriver: true }),
    ]).start()
  }, [])

  const genderOptions = [
    { label: "Male",   value: "M",     icon: "♂" },
    { label: "Female", value: "F",     icon: "♀" },

  ]

  const calculateAge = (d) => {
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
    return age
  }
  const formatDate = (d) => {
    if (!d) return ""
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`
  }
  const formatTime = (t) => {
    if (!t) return "12:00"
    return `${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`
  }
  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === "ios")
    if (selected) { setDateOfBirth(selected); setErrors({ ...errors, dateOfBirth: null }) }
  }
  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === "ios")
    if (selected) { setTimeOfBirth(selected); setErrors({ ...errors, timeOfBirth: null }) }
  }

  const handleCountrySelect = async (country) => {
    setSelectedCountry(country)
    setSelectedCity(null); setCities([]); setCitiesError(null)
    setErrors({ ...errors, country: null, city: null })
    setCountryModalVisible(false); setSearchQuery("")
    setCitiesLoading(true)
    try {
      const list = await fetchCitiesForCountry(country.name)
      if (list.length === 0) setCitiesError("No cities found for this country. You can skip this field.")
      setCities(list)
    } catch { setCitiesError("Could not load cities. Please check your connection.") }
    finally { setCitiesLoading(false) }
  }
  const handleGenderSelect = (opt) => {
    setGender(opt); setGenderModalVisible(false)
    if (errors.gender) setErrors({ ...errors, gender: null })
  }
  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName); setCityModalVisible(false); setCitySearchQuery("")
    if (errors.city) setErrors({ ...errors, city: null })
  }

  const filteredCountries = allCountries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(citySearchQuery.toLowerCase())
  )

  const validateForm = () => {
    const e = {}
    if (!firstName.trim()) e.firstName = "First name is required"
    if (!lastName.trim())  e.lastName  = "Last name is required"
    if (!dateOfBirth) {
      e.dateOfBirth = "Date of birth is required"
    } else {
      const age = calculateAge(dateOfBirth)
      if (age < 18)          e.dateOfBirth = "You must be at least 18 years old"
      else if (age > 120)    e.dateOfBirth = "Please enter a valid date of birth"
      if (dateOfBirth > new Date()) e.dateOfBirth = "Date of birth cannot be in the future"
    }
    if (!selectedCountry) e.country = "Please select a country"
    if (!gender)          e.gender  = "Please select a gender"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinue = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      const authToken = token || await AsyncStorage.getItem("token")
      if (!authToken) {
        Alert.alert("Error", "Authentication token not found. Please login again.")
        navigation.navigate("Login"); return
      }
      const combined = new Date(
        dateOfBirth.getFullYear(), dateOfBirth.getMonth(), dateOfBirth.getDate(),
        timeOfBirth.getHours(), timeOfBirth.getMinutes(), timeOfBirth.getSeconds(), 0
      )
      const profileData = {
        registrationMethod: registrationMethod || "email",
        firstName: firstName.trim(), lastName: lastName.trim(),
        dateOfBirth: combined.toISOString(),
        country: selectedCountry.code,
        city: selectedCity || null,
        gender: gender.value,
      }
      const response = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(profileData),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        if (data.data) await AsyncStorage.setItem("user", JSON.stringify(data.data))
        Alert.alert("Success", "Profile completed successfully!", [{
          text: "OK",
          onPress: () => navigation.navigate("RegisterStep4SocialLinks", {
            email, password, registrationMethod,
            firstName: firstName.trim(), lastName: lastName.trim(),
            dateOfBirth: combined.toISOString(),
            country: selectedCountry.code, city: selectedCity || null, gender: gender.value,
            userId, token: authToken, user: data.data, fromGoogle,
          }),
        }])
      } else {
        Alert.alert("Error", data.message || "Failed to complete profile. Please try again.")
      }
    } catch {
      Alert.alert("Error", "Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const maxDate = new Date()
  const minDate = new Date(); minDate.setFullYear(minDate.getFullYear() - 120)
  const defaultDate = dateOfBirth || new Date(new Date().getFullYear() - 25, new Date().getMonth(), new Date().getDate())

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} />
      <StarField />
      <View style={s.blobTop} />
      <View style={s.blobRight} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <View style={s.backBtnInner}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <Animated.View style={[s.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <Text style={s.eyebrow}>YOUR COSMIC PROFILE</Text>
            <Text style={s.title}>Tell us about{"\n"}yourself</Text>
            <Text style={s.subtitle}>Help us personalize your experience</Text>
          </Animated.View>

          {/* ── FORM CARD ── */}
          <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

            {/* ── Section: Personal ── */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitle}>Personal Information</Text>
              </View>

              {/* First name */}
              <GlassInput icon="person-outline" hasError={!!errors.firstName}>
                <TextInput
                  style={s.inputText}
                  placeholder="First Name *"
                  placeholderTextColor={C.dim}
                  value={firstName}
                  onChangeText={t => { setFirstName(t); if (errors.firstName) setErrors({ ...errors, firstName: null }) }}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </GlassInput>
              {errors.firstName && <Text style={s.errorText}>{errors.firstName}</Text>}

              {/* Last name */}
              <GlassInput icon="person-outline" hasError={!!errors.lastName}>
                <TextInput
                  style={s.inputText}
                  placeholder="Last Name *"
                  placeholderTextColor={C.dim}
                  value={lastName}
                  onChangeText={t => { setLastName(t); if (errors.lastName) setErrors({ ...errors, lastName: null }) }}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </GlassInput>
              {errors.lastName && <Text style={s.errorText}>{errors.lastName}</Text>}

              {/* Date of birth */}
              <GlassInput
                icon="calendar-outline" 
                hasError={!!errors.dateOfBirth}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[s.inputText, { flex: 1 }, !dateOfBirth && s.dimText]}>
                  {dateOfBirth ? formatDate(dateOfBirth) : "Date of Birth *"}
                </Text>
                {dateOfBirth && (
                  <View style={s.agePill}>
                    <Text style={s.agePillText}>{calculateAge(dateOfBirth)} yrs</Text>
                  </View>
                )}
              </GlassInput>
              {errors.dateOfBirth && <Text style={s.errorText}>{errors.dateOfBirth}</Text>}

              {showDatePicker && (
                <DateTimePicker
                  value={defaultDate} mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange} maximumDate={maxDate} minimumDate={minDate} locale="en-US"
                />
              )}

              {/* Time of birth */}
              <GlassInput icon="time-outline" onPress={() => setShowTimePicker(true)}>
                <Text style={[s.inputText, { flex: 1 }]}>
                  Birth Time: {formatTime(timeOfBirth)}
                </Text>
                <Text style={s.optionalTag}>optional</Text>
              </GlassInput>

              {showTimePicker && (
                <DateTimePicker
                  value={timeOfBirth} mode="time" is24Hour
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onTimeChange}
                />
              )}

              {/* Gender */}
              <GlassInput
                icon="transgender-outline"
                hasError={!!errors.gender}
                onPress={() => setGenderModalVisible(true)}
              >
                <Text style={[s.inputText, { flex: 1 }, !gender && s.dimText]}>
                  {gender ? `${gender.icon}  ${gender.label}` : "Select Gender *"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={C.dim} />
              </GlassInput>
              {errors.gender && <Text style={s.errorText}>{errors.gender}</Text>}
            </View>

            {/* ── Section: Location ── */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={[s.sectionDot, { backgroundColor: C.rose }]} />
                <Text style={s.sectionTitle}>Location</Text>
              </View>

              {/* Country */}
              <GlassInput
                icon="earth-outline"
                hasError={!!errors.country}
                onPress={() => setCountryModalVisible(true)}
              >
                <Text style={[s.inputText, { flex: 1 }, !selectedCountry && s.dimText]}>
                  {selectedCountry ? `${selectedCountry.flag}  ${selectedCountry.name}` : "Select Country *"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={C.dim} />
              </GlassInput>
              {errors.country && <Text style={s.errorText}>{errors.country}</Text>}

              {/* City */}
              {selectedCountry && (
                citiesLoading ? (
                  <GlassInput icon="location-outline">
                    <ActivityIndicator size="small" color={C.aurora} style={{ marginRight: 10 }} />
                    <Text style={[s.inputText, s.dimText]}>Loading cities…</Text>
                  </GlassInput>
                ) : citiesError && cities.length === 0 ? (
                  <>
                    <GlassInput icon="location-outline" hasError={!!errors.city}>
                      <TextInput
                        style={[s.inputText, { flex: 1 }]}
                        placeholder="City (optional)"
                        placeholderTextColor={C.dim}
                        value={selectedCity || ""}
                        onChangeText={t => { setSelectedCity(t || null); if (errors.city) setErrors({ ...errors, city: null }) }}
                        editable={!loading}
                      />
                    </GlassInput>
                    <Text style={s.helperText}>⚠️ {citiesError}</Text>
                  </>
                ) : (
                  <GlassInput
                    icon="location-outline"
                    hasError={!!errors.city}
                    onPress={() => cities.length > 0 && setCityModalVisible(true)}
                  >
                    <Text style={[s.inputText, { flex: 1 }, !selectedCity && s.dimText]}>
                      {selectedCity || "Select City (optional)"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={C.dim} />
                  </GlassInput>
                )
              )}
              {errors.city && <Text style={s.errorText}>{errors.city}</Text>}
            </View>

          </Animated.View>

          <Text style={s.requiredNote}>* Required fields</Text>

          {/* Continue button */}
          <TouchableOpacity
            style={[s.continueBtn, loading && s.continueBtnDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={loading}
          >
            <View style={s.continueBtnInner}>
              {loading ? (
                <View style={s.loadingRow}>
                  <ActivityIndicator color={C.gold} size="small" />
                  <Text style={s.continueBtnText}>  Processing…</Text>
                </View>
              ) : (
                <Text style={s.continueBtnText}>Continue  →</Text>
              )}
            </View>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── COUNTRY MODAL ── */}
      <Modal
        animationType="slide" transparent
        visible={countryModalVisible}
        onRequestClose={() => { setCountryModalVisible(false); setSearchQuery("") }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={m.overlay}>
          <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={() => { setCountryModalVisible(false); setSearchQuery("") }} />
          <View style={m.sheet}>
            <View style={m.handle} />
            <View style={m.header}>
              <Text style={m.title}>Select Country</Text>
              <TouchableOpacity onPress={() => { setCountryModalVisible(false); setSearchQuery("") }} style={m.closeBtn}>
                <Ionicons name="close" size={20} color={C.modalText} />
              </TouchableOpacity>
            </View>
            <View style={m.searchRow}>
              <Ionicons name="search" size={16} color={C.modalPH} style={{ marginRight: 8 }} />
              <TextInput
                style={m.searchInput} placeholder="Search country…"
                placeholderTextColor={C.modalPH} value={searchQuery} onChangeText={setSearchQuery}
              />
            </View>
            <FlatList
              data={filteredCountries} keyExtractor={i => i.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={m.listItem} onPress={() => handleCountrySelect(item)} activeOpacity={0.7}>
                  <Text style={m.flag}>{item.flag}</Text>
                  <Text style={m.itemText}>{item.name}</Text>
                  {selectedCountry?.code === item.code && <Ionicons name="checkmark" size={18} color={C.modalSub} />}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator keyboardShouldPersistTaps="handled"
              ListEmptyComponent={() => <View style={m.empty}><Text style={m.emptyText}>No countries found</Text></View>}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── CITY MODAL ── */}
      <Modal
        animationType="slide" transparent
        visible={cityModalVisible}
        onRequestClose={() => { setCityModalVisible(false); setCitySearchQuery("") }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={m.overlay}>
          <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={() => { setCityModalVisible(false); setCitySearchQuery("") }} />
          <View style={m.sheet}>
            <View style={m.handle} />
            <View style={m.header}>
              <View>
                <Text style={m.title}>Select City</Text>
                {selectedCountry && (
                  <Text style={m.subtitle}>{selectedCountry.flag} {selectedCountry.name} · {cities.length} cities</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => { setCityModalVisible(false); setCitySearchQuery("") }} style={m.closeBtn}>
                <Ionicons name="close" size={20} color={C.modalText} />
              </TouchableOpacity>
            </View>
            <View style={m.searchRow}>
              <Ionicons name="search" size={16} color={C.modalPH} style={{ marginRight: 8 }} />
              <TextInput
                style={m.searchInput} placeholder="Search city…" autoFocus
                placeholderTextColor={C.modalPH} value={citySearchQuery} onChangeText={setCitySearchQuery}
              />
              {citySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCitySearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={C.modalPH} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredCities} keyExtractor={(item, i) => `${item}-${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={m.listItem} onPress={() => handleCitySelect(item)} activeOpacity={0.7}>
                  <Ionicons name="location-outline" size={16} color={C.modalSub} style={{ marginRight: 12 }} />
                  <Text style={m.itemText}>{item}</Text>
                  {selectedCity === item && <Ionicons name="checkmark" size={18} color={C.modalSub} />}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator keyboardShouldPersistTaps="handled"
              initialNumToRender={20} maxToRenderPerBatch={30} windowSize={10}
              ListEmptyComponent={() => (
                <View style={m.empty}>
                  <Text style={m.emptyText}>
                    {citySearchQuery ? `No cities matching "${citySearchQuery}"` : "No cities available"}
                  </Text>
                </View>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── GENDER MODAL ── */}
      <Modal
        animationType="slide" transparent
        visible={genderModalVisible}
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <View style={m.overlay}>
          <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={() => setGenderModalVisible(false)} />
          <View style={[m.sheet, { maxHeight: "45%" }]}>
            <View style={m.handle} />
            <View style={m.header}>
              <Text style={m.title}>Select Gender</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)} style={m.closeBtn}>
                <Ionicons name="close" size={20} color={C.modalText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {genderOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[m.genderOption, gender?.value === opt.value && m.genderOptionSelected]}
                  onPress={() => handleGenderSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={m.genderIcon}>{opt.icon}</Text>
                  <Text style={[m.genderLabel, gender?.value === opt.value && m.genderLabelSelected]}>
                    {opt.label}
                  </Text>
                  {gender?.value === opt.value && <Ionicons name="checkmark" size={18} color={C.modalSub} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  SCREEN STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  blobTop: {
    position: "absolute", width: 340, height: 340, borderRadius: 170,
    backgroundColor: "#8B5CF618", top: -80, alignSelf: "center",
  },
  blobRight: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#F4C84212", top: "40%", right: -80,
  },
  scroll: {
    flexGrow: 1, paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 44,
  },

  // Back
  backBtn: { marginBottom: 24 },
  backBtnInner: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.faint,
    justifyContent: "center", alignItems: "center",
  },

  // Header
  header: { marginBottom: 24 },
  eyebrow: {
    fontSize: 10, fontWeight: "700", letterSpacing: 3.5,
    color: C.goldSoft, marginBottom: 10, opacity: 0.75,
  },
  title: {
    fontSize: 38, fontWeight: "800", color: C.white,
    lineHeight: 46, letterSpacing: -0.4, marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: C.dim, lineHeight: 22 },

  // Card
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 26, borderWidth: 1, borderColor: C.inputBorder,
    padding: 20, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 28, elevation: 12,
  },

  // Section
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.aurora },
  sectionTitle: {
    fontSize: 14, fontWeight: "700", color: C.aurora,
    letterSpacing: 0.5, textTransform: "uppercase",
  },

  // Input
  inputText: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 15 },
  dimText:   { color: C.dim },

  // Age pill
  agePill: {
    backgroundColor: "rgba(244,200,66,0.18)", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.borderGold,
  },
  agePillText: { color: C.gold, fontSize: 11, fontWeight: "700" },

  // Optional tag
  optionalTag: {
    fontSize: 11, color: C.dim, fontStyle: "italic",
    backgroundColor: C.glass, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },

  // Errors / helpers
  errorText:  { color: C.error, fontSize: 12, marginTop: -6, marginBottom: 8, marginLeft: 4 },
  helperText: { color: C.goldSoft, fontSize: 12, marginTop: -6, marginBottom: 8, marginLeft: 4, fontStyle: "italic" },
  requiredNote: { color: C.dim, fontSize: 12, textAlign: "center", marginBottom: 20, fontStyle: "italic" },

  // Continue button
  continueBtn: {
    borderRadius: 18, borderWidth: 1.5, borderColor: C.gold, overflow: "hidden",
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnInner: {
    backgroundColor: "rgba(244,200,66,0.12)",
    paddingVertical: 17, alignItems: "center",
  },
  continueBtnText: { color: C.gold, fontSize: 16, fontWeight: "700", letterSpacing: 0.4 },
  loadingRow: { flexDirection: "row", alignItems: "center" },
})

// ─────────────────────────────────────────────────────────────
//  MODAL STYLES  (light surface — keeps familiar picker UX)
// ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: C.modalBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, maxHeight: "85%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#DDD", alignSelf: "center", marginBottom: 16,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.modalLine,
  },
  title:    { fontSize: 20, fontWeight: "800", color: C.modalText },
  subtitle: { fontSize: 13, color: C.modalSub, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center",
  },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F5F5F5",
    marginHorizontal: 20, marginVertical: 14,
    paddingHorizontal: 14, borderRadius: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: C.modalText },
  listItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: C.modalLine,
  },
  flag:     { fontSize: 22, marginRight: 12 },
  itemText: { flex: 1, fontSize: 15, color: C.modalText },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15, color: C.modalPH },

  // Gender
  genderOption: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8F8F8", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 18,
    marginBottom: 10, borderWidth: 2, borderColor: "transparent",
  },
  genderOptionSelected: { backgroundColor: "#F3E8FF", borderColor: C.modalSub },
  genderIcon:  { fontSize: 22, marginRight: 14 },
  genderLabel: { flex: 1, fontSize: 16, color: C.modalText, fontWeight: "500" },
  genderLabelSelected: { color: C.modalSub, fontWeight: "700" },
})