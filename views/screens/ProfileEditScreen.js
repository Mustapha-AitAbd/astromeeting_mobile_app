import { useState, useEffect, useContext, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  FlatList,
} from "react-native"
import {
  MapPin,
  Edit3,
  Save,
  X,
  ChevronRight,
  Calendar,
  Globe,
  Clock,
  Camera,
  Search,
  Link,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react-native"
import * as Location from "expo-location"
// ✅ REMOVED: import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps"
// ✅ ADDED: WebView replaces react-native-maps — works on ALL devices (Android, Huawei, iOS)
import { WebView } from "react-native-webview"
import * as ImagePicker from "expo-image-picker"
import { AuthContext } from "../../context/AuthContext"

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// ─── Social Platform Config ───────────────────────────────────────────────────

const PLATFORMS = [
  { key: "instagram", label: "Instagram",   placeholder: "https://instagram.com/username",   emoji: "📸", color: "#E1306C" },
  { key: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/username",    emoji: "👤", color: "#1877F2" },
  { key: "linkedin",  label: "LinkedIn",    placeholder: "https://linkedin.com/in/username", emoji: "💼", color: "#0077B5" },
  { key: "x",         label: "X / Twitter", placeholder: "https://x.com/username",           emoji: "𝕏",  color: "#000000" },
  { key: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@username",      emoji: "🎵", color: "#010101" },
  { key: "snapchat",  label: "Snapchat",    placeholder: "https://snapchat.com/add/username", emoji: "👻", color: "#FFAA00" },
  { key: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/@channel",      emoji: "▶️", color: "#FF0000" },
  { key: "whatsapp",  label: "WhatsApp",    placeholder: "+212612345678",                     emoji: "💬", color: "#25D366" },
]

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]))

// ─── Countries ────────────────────────────────────────────────────────────────

const Countries = [
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
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
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
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
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
  { code: "VC", name: "Saint Vincent", flag: "🇻🇨" },
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

// ─── Validation ───────────────────────────────────────────────────────────────

const PLATFORM_PATTERNS = {
  facebook:  /^https?:\/\/(www\.)?facebook\.com\/.+/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
  x:         /^https?:\/\/(www\.)?(x|twitter)\.com\/.+/i,
  whatsapp:  /^\+?[1-9]\d{6,14}$/,
  linkedin:  /^https?:\/\/(www\.)?linkedin\.com\/.+/i,
  tiktok:    /^https?:\/\/(www\.)?tiktok\.com\/.+/i,
  snapchat:  /^https?:\/\/(www\.)?snapchat\.com\/.+/i,
  youtube:   /^https?:\/\/(www\.)?youtube\.com\/.+/i,
}

function validateSocialUrl(platform, url) {
  const pattern = PLATFORM_PATTERNS[platform]
  if (!pattern) return { valid: false, message: `Unsupported platform: ${platform}` }
  if (!pattern.test(url.trim())) {
    return {
      valid: false,
      message:
        platform === "whatsapp"
          ? "WhatsApp requires a valid international phone number (e.g. +212612345678)"
          : `Invalid URL for ${PLATFORM_MAP[platform]?.label || platform}. Check the format and try again.`,
    }
  }
  return { valid: true }
}

// ─── Cities API helper ────────────────────────────────────────────────────────
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

// ─── Leaflet HTML Generator ───────────────────────────────────────────────────
// ✅ Pure HTML/JS using Leaflet + OpenStreetMap — NO Google Play required.
// Works on Android, Huawei (HMS), iOS, and any WebView-capable device.
const buildLeafletHTML = (lat, lng, hasMarker) => {
  const centerLat = lat || 48.8566
  const centerLng = lng || 2.3522
  const zoom = hasMarker ? 13 : 5
  const markerInit = hasMarker
    ? `
      marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
      marker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        sendLocation(pos.lat, pos.lng);
      });
    `
    : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    var marker = null;

    function sendLocation(lat, lng) {
      var msg = JSON.stringify({ type: 'locationSelected', lat: lat, lng: lng });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }

    // Tap on map → place or move marker
    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', function(ev) {
          var pos = ev.target.getLatLng();
          sendLocation(pos.lat, pos.lng);
        });
      }
      sendLocation(lat, lng);
    });

    // Initialize existing marker if provided
    ${markerInit}

    // Notify React Native the map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    // Listen for commands from React Native (flyTo, setMarker)
    document.addEventListener('message', handleCommand);
    window.addEventListener('message', handleCommand);
    function handleCommand(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'flyTo') {
          map.setView([data.lat, data.lng], data.zoom || 14);
          if (marker) {
            marker.setLatLng([data.lat, data.lng]);
          } else {
            marker = L.marker([data.lat, data.lng], { draggable: true }).addTo(map);
            marker.on('dragend', function(ev) {
              var pos = ev.target.getLatLng();
              sendLocation(pos.lat, pos.lng);
            });
          }
          sendLocation(data.lat, data.lng);
        }
      } catch(e) {}
    }
  </script>
</body>
</html>
  `
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileEditScreen({ navigation }) {
  const { token, logout } = useContext(AuthContext)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showMapModal, setShowMapModal]         = useState(false)
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [mapReady, setMapReady]   = useState(false)
  // ✅ webViewRef replaces mapRef — used to inject JS commands into the Leaflet map
  const webViewRef = useRef(null)

  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: "", lastName: "", bio: "", dateOfBirth: null,
    age: null, country: "", city: "", gender: "",
    location: { type: "Point", coordinates: [0, 0] },
    avatar: "",
  })

  const [mainPhoto, setMainPhoto] = useState(null)
  const [editData,  setEditData]  = useState({ ...profileData })

  // Date / Time inputs
  const [dateInput, setDateInput] = useState({ day: "", month: "", year: "" })
  const [timeInput, setTimeInput] = useState({ hour: "", minute: "", second: "" })

  const [countrySearch,     setCountrySearch]     = useState("")
  const [filteredCountries, setFilteredCountries] = useState(Countries)
  const [selectedLocation,  setSelectedLocation]  = useState(null)
  // ✅ leafletHtml holds the generated HTML string for the WebView
  const [leafletHtml, setLeafletHtml] = useState(null)

  // City state
  const [cities,          setCities]          = useState([])
  const [citiesLoading,   setCitiesLoading]   = useState(false)
  const [citiesError,     setCitiesError]     = useState(null)
  const [showCityModal,   setShowCityModal]   = useState(false)
  const [citySearch,      setCitySearch]      = useState("")
  const lastFetchedCountry = useRef(null)

  // Social Links state
  const [localLinks,  setLocalLinks]  = useState([])
  const [savingLinks, setSavingLinks] = useState(false)
  const [linkErrors,  setLinkErrors]  = useState({})

  useEffect(() => {
    navigation.setOptions({ headerShown: false })
    fetchProfile()
    requestPermissions()
  }, [navigation])

  useEffect(() => {
    if (countrySearch.trim() === "") {
      setFilteredCountries(Countries)
    } else {
      setFilteredCountries(
        Countries.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
      )
    }
  }, [countrySearch])

  useEffect(() => {
    if (isEditing && editData.country) {
      loadCitiesForCountry(editData.country, false)
    }
  }, [isEditing])

  const requestPermissions = async () => {
    const { status: cam } = await ImagePicker.requestCameraPermissionsAsync()
    const { status: gal } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (cam !== "granted" || gal !== "granted")
      Alert.alert("Permission Required", "Please grant camera and photo permissions.")
  }

  const parseDateOfBirth = (dob) => {
    if (!dob) return
    const d = new Date(dob)
    setDateInput({
      day:   d.getDate().toString().padStart(2, "0"),
      month: (d.getMonth() + 1).toString().padStart(2, "0"),
      year:  d.getFullYear().toString(),
    })
    setTimeInput({
      hour:   d.getHours().toString().padStart(2, "0"),
      minute: d.getMinutes().toString().padStart(2, "0"),
      second: d.getSeconds().toString().padStart(2, "0"),
    })
  }

  const combineDateOfBirth = () => {
    const { day, month, year } = dateInput
    if (!day || !month || !year) return null
    const h = timeInput.hour   || "00"
    const m = timeInput.minute || "00"
    const s = timeInput.second || "00"
    return `${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}T${h.padStart(2,"0")}:${m.padStart(2,"0")}:${s.padStart(2,"0")}.000Z`
  }

  const loadCitiesForCountry = async (countryName, resetCity = true) => {
    if (!countryName) return
    if (lastFetchedCountry.current === countryName) return

    setCitiesLoading(true)
    setCitiesError(null)
    if (resetCity) {
      setEditData((prev) => ({ ...prev, city: "" }))
    }

    try {
      const list = await fetchCitiesForCountry(countryName)
      setCities(list)
      if (list.length === 0) {
        setCitiesError("No cities found for this country. You can type a city manually.")
      }
      lastFetchedCountry.current = countryName
    } catch (err) {
      console.error("❌ Failed to fetch cities:", err)
      setCitiesError("Could not load cities. Check your connection.")
      setCities([])
    } finally {
      setCitiesLoading(false)
    }
  }

  // ── Fetch profile + social links ──────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const [profileRes, photosRes, linksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/profile`,     { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/users/photos`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/users/social-links`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfileData(data.data)
        setEditData(data.data)
        if (data.data.dateOfBirth) parseDateOfBirth(data.data.dateOfBirth)
        if (
          data.data.location?.coordinates?.[0] !== 0 &&
          data.data.location?.coordinates?.[1] !== 0
        ) {
          setSelectedLocation({
            latitude:  data.data.location.coordinates[1],
            longitude: data.data.location.coordinates[0],
          })
        }
      }

      if (photosRes.ok) {
        const pData = await photosRes.json()
        if (pData.success) setMainPhoto(pData.data.mainPhoto || null)
      }

      if (linksRes.ok) {
        const lData = await linksRes.json()
        if (lData.success) {
          setLocalLinks(
            (lData.data.socialLinks || []).map((l) => ({ ...l, _state: "saved" }))
          )
        }
      }
    } catch (err) {
      console.error("fetchProfile error:", err)
      Alert.alert("Error", "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  // ── Social Links CRUD ─────────────────────────────────────────────────────

  const handleLinkChange = (platform, value) => {
    setLinkErrors((prev) => ({ ...prev, [platform]: null }))
    setLocalLinks((prev) => {
      const existing = prev.find((l) => l.platform === platform)
      if (existing) {
        return prev.map((l) => l.platform === platform ? { ...l, url: value } : l)
      }
      return [...prev, { platform, url: value, isPublic: true, _state: "new" }]
    })
  }

  const handleDeleteLink = (platform) => {
    setLinkErrors((prev) => { const n = { ...prev }; delete n[platform]; return n })
    setLocalLinks((prev) =>
      prev
        .map((l) => l.platform === platform && l._state === "saved" ? { ...l, _state: "deleted" } : l)
        .filter((l) => !(l.platform === platform && l._state === "new"))
    )
  }

  const saveSocialLinks = async () => {
    const errors = {}
    for (const link of localLinks) {
      if (link._state === "deleted") continue
      if (!link.url?.trim()) continue
      const { valid, message } = validateSocialUrl(link.platform, link.url)
      if (!valid) errors[link.platform] = message
    }
    if (Object.keys(errors).length > 0) {
      setLinkErrors(errors)
      Alert.alert("Validation Error", "Please fix the highlighted social link errors before saving.")
      return false
    }
    setSavingLinks(true)
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      for (const link of localLinks) {
        if (link._state === "deleted" && link._id) {
          await fetch(`${API_BASE_URL}/api/users/social-links/${link._id}`, { method: "DELETE", headers })
          continue
        }
        const url = link.url?.trim()
        if (!url) continue
        if (link._state === "new") {
          await fetch(`${API_BASE_URL}/api/users/social-links`, {
            method: "POST", headers,
            body: JSON.stringify({ platform: link.platform, url, isPublic: link.isPublic }),
          })
          continue
        }
        if (link._state === "saved" && link._id) {
          await fetch(`${API_BASE_URL}/api/users/social-links/${link._id}`, {
            method: "PUT", headers,
            body: JSON.stringify({ url, isPublic: link.isPublic }),
          })
        }
      }
      const res = await fetch(`${API_BASE_URL}/api/users/social-links`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setLocalLinks((data.data.socialLinks || []).map((l) => ({ ...l, _state: "saved" })))
      }
      return true
    } catch (err) {
      console.error("saveSocialLinks error:", err)
      Alert.alert("Error", "Failed to save social links")
      return false
    } finally {
      setSavingLinks(false)
    }
  }

  // ── Profile Save ──────────────────────────────────────────────────────────

  const validateDateInputs = () => {
    const { day, month, year } = dateInput
    if (!day || !month || !year) { Alert.alert("Error","Complete date required"); return false }
    const d = parseInt(day), m = parseInt(month), y = parseInt(year)
    if (d<1||d>31||m<1||m>12||y<1900||y>new Date().getFullYear()) { Alert.alert("Error","Invalid date"); return false }
    const dt = new Date(y, m-1, d)
    if (dt.getDate()!==d||dt.getMonth()!==m-1||dt.getFullYear()!==y) { Alert.alert("Error","Invalid date"); return false }
    return true
  }

  const validateTimeInputs = () => {
    const { hour, minute, second } = timeInput
    if (hour||minute||second) {
      if (+hour<0||+hour>23||+(minute||0)<0||+(minute||0)>59||+(second||0)<0||+(second||0)>59) {
        Alert.alert("Error","Invalid time"); return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (isEditing && (dateInput.day || dateInput.month || dateInput.year)) {
      if (!validateDateInputs() || !validateTimeInputs()) return
      const dob = combineDateOfBirth()
      if (dob) editData.dateOfBirth = dob
    }
    if (editData.bio?.length > 200) { Alert.alert("Error","Bio max 200 chars"); return }

    setSaving(true)
    try {
      const [profileOk, linksOk] = await Promise.all([
        (async () => {
          const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName:   editData.firstName,
              lastName:    editData.lastName,
              bio:         editData.bio,
              dateOfBirth: editData.dateOfBirth,
              country:     editData.country,
              city:        editData.city || null,
              gender:      editData.gender,
              location:    editData.location,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            setProfileData(data.data)
            setEditData(data.data)
            if (data.data.dateOfBirth) parseDateOfBirth(data.data.dateOfBirth)
            return true
          }
          const err = await res.json()
          Alert.alert("Error", err.message || "Failed to update profile")
          return false
        })(),
        saveSocialLinks(),
      ])

      if (profileOk && linksOk) {
        setIsEditing(false)
        Alert.alert("Success", "Profile updated successfully!")
      }
    } catch (err) {
      console.error("handleSave error:", err)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({ ...profileData })
    if (profileData.dateOfBirth) parseDateOfBirth(profileData.dateOfBirth)
    else { setDateInput({ day:"",month:"",year:"" }); setTimeInput({ hour:"",minute:"",second:"" }) }
    lastFetchedCountry.current = null
    fetchProfile()
    setLinkErrors({})
    setIsEditing(false)
  }

  const handleCountrySelect = (item) => {
    const countryChanged = editData.country !== item.name
    setEditData((prev) => ({ ...prev, country: item.name, city: countryChanged ? "" : prev.city }))
    setShowCountryModal(false)
    setCountrySearch("")
    if (countryChanged) {
      lastFetchedCountry.current = null
      loadCitiesForCountry(item.name, true)
    }
  }

  // ── Map (Leaflet/WebView) ─────────────────────────────────────────────────

  // ✅ openMapModal: builds the Leaflet HTML and opens the modal.
  // No Google Play, no native map SDK needed — just a WebView loading HTML.
  const openMapModal = async () => {
    try {
      let lat, lng, hasMarker

      if (selectedLocation) {
        lat = selectedLocation.latitude
        lng = selectedLocation.longitude
        hasMarker = true
      } else {
        // Try to get device GPS for initial centering
        try {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            })
            lat = loc.coords.latitude
            lng = loc.coords.longitude
          } else {
            lat = 48.8566; lng = 2.3522  // Default: Paris
          }
        } catch {
          lat = 48.8566; lng = 2.3522
        }
        hasMarker = false
      }

      // Build the Leaflet HTML with initial center and optional marker
      setLeafletHtml(buildLeafletHTML(lat, lng, hasMarker))
      setMapReady(false)
      setShowMapModal(true)
    } catch (err) {
      console.error("openMapModal error:", err)
      Alert.alert("Error", "Unable to open the map. Please try again.")
    }
  }

  const handleMapConfirm = () => {
    if (!selectedLocation) { Alert.alert("Error", "Select a location on the map first"); return }
    setEditData({
      ...editData,
      location: {
        type: "Point",
        coordinates: [selectedLocation.longitude, selectedLocation.latitude],
      },
    })
    setShowMapModal(false)
  }



  // ✅ handleWebViewMessage: receives location picks and map-ready events
  // from the Leaflet HTML via window.ReactNativeWebView.postMessage
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === "locationSelected") {
        setSelectedLocation({ latitude: data.lat, longitude: data.lng })
      } else if (data.type === "mapReady") {
        setMapReady(true)
      }
    } catch (e) {
      console.error("WebView message parse error:", e)
    }
  }

  // ── Photo ─────────────────────────────────────────────────────────────────

  const showImagePickerOptions = () =>
    Alert.alert("Change Profile Photo","Choose an option",[
      { text:"Take Photo",          onPress: () => pickImage(true)  },
      { text:"Choose from Gallery", onPress: () => pickImage(false) },
      { text:"Cancel", style:"cancel" },
    ])

  const pickImage = async (useCamera = false) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.8 })
      if (!result.canceled && result.assets[0]) uploadPhoto(result.assets[0].uri)
    } catch { Alert.alert("Error","Failed to pick image") }
  }

  const uploadPhoto = async (imageUri) => {
    try {
      setUploading(true)
      const fd = new FormData()
      const filename = imageUri.split("/").pop()
      const match = /\.(\w+)$/.exec(filename)
      fd.append("photo", { uri: imageUri, name: filename, type: match ? `image/${match[1]}` : "image/jpeg" })
      const res = await fetch(`${API_BASE_URL}/api/users/photos/profile`, {
        method:"PUT", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"multipart/form-data" }, body: fd,
      })
      const data = await res.json()
      if (res.status === 401) { Alert.alert("Session Expired","Please login again",[{ text:"OK", onPress: logout }]); return }
      if (data.success) { Alert.alert("Success","Profile photo updated!"); await fetchProfile() }
      else Alert.alert("Error", data.message || "Failed to upload")
    } catch { Alert.alert("Error","Failed to upload photo") }
    finally { setUploading(false) }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getInitials = () => {
    const name = `${profileData.firstName||""} ${profileData.lastName||""}`.trim()
    if (!name) return "?"
    const p = name.split(" ")
    return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : name.substring(0,2).toUpperCase()
  }

  const formatDOB = (dob) => {
    if (!dob) return "Not set"
    const d = new Date(dob)
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()} at ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`
  }

  const getCountryFlag = (name) => Countries.find((c) => c.name === name)?.flag || "🌍"

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  const visibleLinks = localLinks.filter((l) => l._state !== "deleted" && l.url?.trim())

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <X size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Edit3 size={20} color="#FF6B6B" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || savingLinks}>
            {saving || savingLinks
              ? <ActivityIndicator size="small" color="#FF6B6B" />
              : <Save size={20} color="#FF6B6B" />
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Photo ── */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto.url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={showImagePickerOptions} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.changePhotoButton} onPress={showImagePickerOptions} disabled={uploading}>
            <Text style={styles.changePhotoText}>{uploading ? "Uploading..." : "Change Photo"}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Form Fields ── */}
        <View style={styles.formContainer}>

          {/* First Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>First Name</Text>
            {isEditing
              ? <TextInput style={styles.input} value={editData.firstName} onChangeText={(t)=>setEditData({...editData,firstName:t})} placeholder="First name" placeholderTextColor="#CCC" />
              : <Text style={styles.fieldValue}>{profileData.firstName||"Not set"}</Text>
            }
          </View>

          {/* Last Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            {isEditing
              ? <TextInput style={styles.input} value={editData.lastName} onChangeText={(t)=>setEditData({...editData,lastName:t})} placeholder="Last name" placeholderTextColor="#CCC" />
              : <Text style={styles.fieldValue}>{profileData.lastName||"Not set"}</Text>
            }
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelRow}>
              <Calendar size={18} color="#666" />
              <Text style={styles.fieldLabel}>Date of Birth</Text>
            </View>
            {isEditing ? (
              <>
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateInputWrapper}>
                    <TextInput style={styles.dateInput} value={dateInput.day} onChangeText={(t)=>setDateInput({...dateInput,day:t.replace(/\D/g,"")})} placeholder="DD" placeholderTextColor="#CCC" keyboardType="numeric" maxLength={2} />
                    <Text style={styles.dateSeparator}>/</Text>
                    <TextInput style={styles.dateInput} value={dateInput.month} onChangeText={(t)=>setDateInput({...dateInput,month:t.replace(/\D/g,"")})} placeholder="MM" placeholderTextColor="#CCC" keyboardType="numeric" maxLength={2} />
                    <Text style={styles.dateSeparator}>/</Text>
                    <TextInput style={[styles.dateInput,styles.yearInput]} value={dateInput.year} onChangeText={(t)=>setDateInput({...dateInput,year:t.replace(/\D/g,"")})} placeholder="YYYY" placeholderTextColor="#CCC" keyboardType="numeric" maxLength={4} />
                  </View>
                </View>
                <Text style={styles.helperText}>Format: Day / Month / Year</Text>
              </>
            ) : (
              <Text style={styles.fieldValue}>{profileData.dateOfBirth ? formatDOB(profileData.dateOfBirth) : "Not set"}</Text>
            )}
          </View>

          {/* Time of Birth */}
          {isEditing && (
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Clock size={18} color="#666" />
                <Text style={styles.fieldLabel}>Time of Birth (Optional)</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateInputWrapper}>
                  <TextInput style={styles.dateInput} value={timeInput.hour} onChangeText={(t)=>setTimeInput({...timeInput,hour:t.replace(/\D/g,"")})} placeholder="HH" placeholderTextColor="#CCC" keyboardType="numeric" maxLength={2} />
                  <Text style={styles.dateSeparator}>:</Text>
                  <TextInput style={styles.dateInput} value={timeInput.minute} onChangeText={(t)=>setTimeInput({...timeInput,minute:t.replace(/\D/g,"")})} placeholder="MM" placeholderTextColor="#CCC" keyboardType="numeric" maxLength={2} />
                  <Text style={styles.dateSeparator}>:</Text>
                  <TextInput style={styles.dateInput} value={timeInput.second} onChangeText={(t)=>setTimeInput({...timeInput,second:t.replace(/\D/g,"")})} placeholder="SS" placeholderTextColor="#CCC" keyboardType="numeric" maxLength={2} />
                </View>
              </View>
              <Text style={styles.helperText}>Format: Hour (0-23) : Minute : Second</Text>
            </View>
          )}

          {/* Location Coordinates */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelRow}>
              <MapPin size={18} color="#666" />
              <Text style={styles.fieldLabel}>Location Coordinates of Birth</Text>
            </View>
            {isEditing ? (
              <TouchableOpacity style={styles.mapButton} onPress={openMapModal}>
                <MapPin size={20} color="#FF6B6B" />
                <Text style={styles.mapButtonText}>{selectedLocation ? "Change Location" : "Select on Map"}</Text>
                <ChevronRight size={20} color="#999" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.location?.coordinates[0] && profileData.location?.coordinates[1]
                  ? `${profileData.location.coordinates[1].toFixed(4)}, ${profileData.location.coordinates[0].toFixed(4)}`
                  : "Not set"}
              </Text>
            )}
          </View>

          {/* Age */}
          {profileData.age && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Age (Calculated)</Text>
              <Text style={styles.fieldValue}>{profileData.age} years old</Text>
            </View>
          )}

          {/* Gender */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Gender</Text>
            {isEditing ? (
              <View style={styles.genderContainer}>
                {[
                  { value: "M", label: "Male"   },
                  { value: "F", label: "Female" },
                ].map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.genderButton, editData.gender === value && styles.genderButtonActive]}
                    onPress={() => setEditData({ ...editData, gender: value })}
                  >
                    <Text style={[styles.genderButtonText, editData.gender === value && styles.genderButtonTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.gender === "M" ? "Male" : profileData.gender === "F" ? "Female" : "Not set"}
              </Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bio</Text>
            {isEditing ? (
              <>
                <TextInput style={[styles.input,styles.bioInput]} value={editData.bio} onChangeText={(t)=>setEditData({...editData,bio:t})} placeholder="Tell us about yourself..." placeholderTextColor="#CCC" multiline maxLength={200} />
                <Text style={styles.charCount}>{editData.bio?.length||0}/200</Text>
              </>
            ) : (
              <Text style={styles.fieldValue}>{profileData.bio||"Not set"}</Text>
            )}
          </View>

          {/* Country */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelRow}>
              <Globe size={18} color="#666" />
              <Text style={styles.fieldLabel}>Current Country</Text>
            </View>
            {isEditing ? (
              <TouchableOpacity style={styles.countryButton} onPress={() => setShowCountryModal(true)}>
                <Text style={styles.countryButtonText}>
                  {editData.country ? `${getCountryFlag(editData.country)} ${editData.country}` : "Select Country"}
                </Text>
                <ChevronRight size={20} color="#999" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.country ? `${getCountryFlag(profileData.country)} ${profileData.country}` : "Not set"}
              </Text>
            )}
          </View>

          {/* City */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelRow}>
              <MapPin size={18} color="#666" />
              <Text style={styles.fieldLabel}>Current City</Text>
            </View>

            {isEditing ? (
              editData.country ? (
                citiesLoading ? (
                  <View style={[styles.countryButton, styles.disabledButton]}>
                    <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 8 }} />
                    <Text style={styles.countryButtonTextMuted}>Loading cities…</Text>
                  </View>
                ) : citiesError && cities.length === 0 ? (
                  <View>
                    <TextInput
                      style={styles.input}
                      value={editData.city || ""}
                      onChangeText={(t) => setEditData({ ...editData, city: t })}
                      placeholder="Enter city (optional)"
                      placeholderTextColor="#CCC"
                    />
                    <Text style={styles.helperTextWarning}>⚠️ {citiesError}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={() => setShowCityModal(true)}
                  >
                    <Text style={editData.city ? styles.countryButtonText : styles.countryButtonTextMuted}>
                      {editData.city ? `🏙️ ${editData.city}` : "Select City (optional)"}
                    </Text>
                    <ChevronRight size={20} color="#999" />
                  </TouchableOpacity>
                )
              ) : (
                <View style={[styles.countryButton, styles.disabledButton]}>
                  <Text style={styles.countryButtonTextMuted}>Select a country first</Text>
                </View>
              )
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.city ? `🏙️ ${profileData.city}` : "Not set"}
              </Text>
            )}
          </View>

          {/* ── Social Links ── */}
          <View style={styles.sectionDivider} />
          <View style={styles.sectionHeader}>
            <Link size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Social Media Links</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Add your social profiles so your friends can connect with you externally.
          </Text>

          {isEditing ? (
            <View style={styles.socialLinksEditContainer}>
              {PLATFORMS.map((platform) => {
                const saved = localLinks.find((l) => l.platform === platform.key && l._state !== "deleted")
                const currentUrl = saved?.url ?? ""
                const error = linkErrors[platform.key]
                return (
                  <View key={platform.key} style={styles.socialLinkEditRow}>
                    <View style={[styles.platformBadge, { backgroundColor: platform.color + "18", borderColor: platform.color + "40" }]}>
                      <Text style={styles.platformEmoji}>{platform.emoji}</Text>
                      <Text style={[styles.platformBadgeLabel, { color: platform.color }]}>{platform.label}</Text>
                    </View>
                    <View style={styles.socialLinkInputRow}>
                      <TextInput
                        style={[styles.socialLinkInput, error && styles.socialLinkInputError, currentUrl && !error && styles.socialLinkInputFilled]}
                        value={currentUrl}
                        onChangeText={(v) => handleLinkChange(platform.key, v)}
                        placeholder={platform.placeholder}
                        placeholderTextColor="#BBBBBB"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={platform.key === "whatsapp" ? "phone-pad" : "url"}
                      />
                      {currentUrl ? (
                        <TouchableOpacity style={styles.deleteLinkBtn} onPress={() => handleDeleteLink(platform.key)}>
                          <Trash2 size={18} color="#FF4444" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {error && <Text style={styles.linkErrorText}>{error}</Text>}
                  </View>
                )
              })}
            </View>
          ) : (
            visibleLinks.length > 0 ? (
              <View style={styles.socialLinksViewContainer}>
                {visibleLinks.map((link) => {
                  const cfg = PLATFORM_MAP[link.platform] || { label: link.platform, emoji: "🔗", color: "#8B3A8B" }
                  return (
                    <View key={link._id || link.platform} style={[styles.socialLinkViewPill, { backgroundColor: cfg.color + "12", borderColor: cfg.color + "30" }]}>
                      <Text style={styles.platformEmoji}>{cfg.emoji}</Text>
                      <View style={styles.socialLinkViewText}>
                        <Text style={[styles.socialLinkViewLabel, { color: cfg.color }]}>{cfg.label}</Text>
                        <Text style={styles.socialLinkViewUrl} numberOfLines={1}>{link.url}</Text>
                      </View>
                      <CheckCircle size={16} color={cfg.color} />
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.noLinksContainer}>
                <Text style={styles.noLinksText}>No social links added yet.</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.noLinksAction}>Tap Edit to add your links →</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButtonFull} onPress={handleSave} disabled={saving || savingLinks}>
                {saving || savingLinks
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.saveButtonText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ── Country Modal ── */}
      <Modal visible={showCountryModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowCountryModal(false); setCountrySearch("") }}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Country</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchContainer}>
            <Search size={20} color="#999" />
            <TextInput style={styles.searchInput} placeholder="Search countries..." placeholderTextColor="#CCC" value={countrySearch} onChangeText={setCountrySearch} />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(i) => i.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => handleCountrySelect(item)}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                {editData.country === item.name && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.countryListContent}
          />
        </View>
      </Modal>

      {/* ── City Modal ── */}
      <Modal visible={showCityModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowCityModal(false); setCitySearch("") }}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.modalTitleBlock}>
              <Text style={styles.modalTitle}>Select City</Text>
              {editData.country ? (
                <Text style={styles.modalSubtitle}>
                  {getCountryFlag(editData.country)} {editData.country} · {cities.length} cities
                </Text>
              ) : null}
            </View>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchContainer}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities..."
              placeholderTextColor="#CCC"
              value={citySearch}
              onChangeText={setCitySearch}
              autoFocus
            />
            {citySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCitySearch("")} style={styles.clearBtn}>
                <X size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredCities}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  setEditData((prev) => ({ ...prev, city: item }))
                  setShowCityModal(false)
                  setCitySearch("")
                }}
              >
                <Text style={styles.cityEmoji}>🏙️</Text>
                <Text style={styles.countryName}>{item}</Text>
                {editData.city === item && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.countryListContent}
            initialNumToRender={20}
            maxToRenderPerBatch={30}
            windowSize={10}
            ListEmptyComponent={() => (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  {citySearch ? `No cities matching "${citySearch}"` : "No cities available"}
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* ── Map Modal (Leaflet / OpenStreetMap — no Google Play needed) ── */}
      <Modal visible={showMapModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={handleMapConfirm}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            {/* ✅ WebView renders a full Leaflet map — works on ALL devices */}
            {leafletHtml ? (
              <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: leafletHtml }}
                style={StyleSheet.absoluteFillObject}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                // ✅ Allow loading Leaflet tiles from OpenStreetMap CDN
                mixedContentMode="always"
                allowsInlineMediaPlayback
                // Show a spinner while the WebView is loading
                renderLoading={() => (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.mapLoadingText}>Loading map…</Text>
                  </View>
                )}
                startInLoadingState
              />
            ) : (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.mapLoadingText}>Preparing map…</Text>
              </View>
            )}

            {/* Coordinates display — same position/style as before */}

            {/* Coordinates display — same position/style as before */}
            {selectedLocation && (
              <View style={styles.coordinatesDisplay}>
                <Text style={styles.coordinatesLabel}>Selected Location:</Text>
                <Text style={styles.coordinatesText}>Lat: {selectedLocation.latitude.toFixed(6)}</Text>
                <Text style={styles.coordinatesText}>Lng: {selectedLocation.longitude.toFixed(6)}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// ✅ All styles are identical to the original. Only map-related additions noted.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },

  header: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:16, paddingTop:50, paddingBottom:16, backgroundColor:"#FFF", borderBottomWidth:1, borderBottomColor:"#F0F0F0" },
  backButton: { width:40, height:40, justifyContent:"center" },
  headerTitle: { fontSize:20, fontWeight:"bold", color:"#333" },
  editButton: { width:40, height:40, justifyContent:"center", alignItems:"flex-end" },
  saveButton: { width:40, height:40, justifyContent:"center", alignItems:"flex-end" },

  scrollView: { flex: 1 },

  photoSection: { alignItems:"center", paddingVertical:30, borderBottomWidth:1, borderBottomColor:"#F0F0F0" },
  avatarContainer: { position:"relative", marginBottom:12 },
  avatar: { width:120, height:120, borderRadius:60 },
  avatarPlaceholder: { width:120, height:120, borderRadius:60, backgroundColor:"#FF6B6B", justifyContent:"center", alignItems:"center" },
  avatarText: { fontSize:40, fontWeight:"bold", color:"#FFF" },
  cameraButton: { position:"absolute", bottom:0, right:0, backgroundColor:"#FF6B6B", borderRadius:18, width:36, height:36, justifyContent:"center", alignItems:"center", borderWidth:3, borderColor:"#FFF" },
  changePhotoButton: { paddingVertical:8, paddingHorizontal:20 },
  changePhotoText: { color:"#FF6B6B", fontSize:14, fontWeight:"600" },

  formContainer: { padding: 16 },
  fieldContainer: { marginBottom: 24 },
  fieldLabel: { fontSize:14, fontWeight:"600", color:"#666", marginBottom:8, marginLeft:4 },
  fieldLabelRow: { flexDirection:"row", alignItems:"center", gap:6, marginBottom:8 },
  fieldValue: { fontSize:16, color:"#333", paddingVertical:12, paddingHorizontal:16, backgroundColor:"#F8F8F8", borderRadius:12 },

  input: { backgroundColor:"#FFF", borderWidth:1, borderColor:"#E0E0E0", borderRadius:12, paddingVertical:12, paddingHorizontal:16, fontSize:16, color:"#333" },
  bioInput: { minHeight:100, textAlignVertical:"top" },
  charCount: { fontSize:12, color:"#999", textAlign:"right", marginTop:4 },

  dateTimeRow: { flexDirection:"row", alignItems:"center" },
  dateInputWrapper: { flexDirection:"row", alignItems:"center", backgroundColor:"#FFF", borderWidth:1, borderColor:"#E0E0E0", borderRadius:12, paddingVertical:8, paddingHorizontal:12, flex:1 },
  dateInput: { fontSize:16, color:"#333", textAlign:"center", minWidth:40, paddingVertical:4 },
  yearInput: { minWidth:60 },
  dateSeparator: { fontSize:16, color:"#999", marginHorizontal:4 },
  helperText: { fontSize:12, color:"#999", marginTop:6, marginLeft:4 },
  helperTextWarning: { fontSize:12, color:"#FF8C00", marginTop:6, marginLeft:4 },

  genderContainer: { flexDirection:"row", gap:8 },
  genderButton: { flex:1, paddingVertical:12, borderRadius:12, borderWidth:1, borderColor:"#E0E0E0", backgroundColor:"#FFF", alignItems:"center" },
  genderButtonActive: { backgroundColor:"#FF6B6B", borderColor:"#FF6B6B" },
  genderButtonText: { fontSize:14, fontWeight:"600", color:"#666" },
  genderButtonTextActive: { color:"#FFF" },

  countryButton: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"#FFF", borderWidth:1, borderColor:"#E0E0E0", borderRadius:12, paddingVertical:12, paddingHorizontal:16 },
  countryButtonText: { flex:1, fontSize:16, color:"#333" },
  countryButtonTextMuted: { flex:1, fontSize:16, color:"#BBBBBB" },
  disabledButton: { backgroundColor:"#FAFAFA", borderColor:"#EFEFEF" },

  mapButton: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"#FFF", borderWidth:1, borderColor:"#E0E0E0", borderRadius:12, paddingVertical:12, paddingHorizontal:16 },
  mapButtonText: { flex:1, fontSize:16, color:"#333", marginLeft:8 },

  actionButtons: { flexDirection:"row", gap:12, marginTop:20 },
  cancelButton: { flex:1, paddingVertical:14, borderRadius:12, borderWidth:1, borderColor:"#E0E0E0", backgroundColor:"#FFF", alignItems:"center" },
  cancelButtonText: { fontSize:16, fontWeight:"600", color:"#666" },
  saveButtonFull: { flex:2, paddingVertical:14, borderRadius:12, backgroundColor:"#FF6B6B", alignItems:"center", shadowColor:"#FF6B6B", shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:5 },
  saveButtonText: { fontSize:16, fontWeight:"bold", color:"#FFF" },

  sectionDivider: { height:1, backgroundColor:"#F0F0F0", marginVertical:8 },
  sectionHeader: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:6, marginTop:8 },
  sectionTitle: { fontSize:17, fontWeight:"700", color:"#333" },
  sectionSubtitle: { fontSize:13, color:"#999", marginBottom:18, lineHeight:18 },

  socialLinksEditContainer: { gap: 16 },
  socialLinkEditRow: { gap: 6 },
  platformBadge: { flexDirection:"row", alignItems:"center", gap:6, alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:5, borderRadius:20, borderWidth:1, marginBottom:2 },
  platformEmoji: { fontSize: 14 },
  platformBadgeLabel: { fontSize:12, fontWeight:"700" },
  socialLinkInputRow: { flexDirection:"row", alignItems:"center", gap:8 },
  socialLinkInput: { flex:1, backgroundColor:"#FFF", borderWidth:1, borderColor:"#E0E0E0", borderRadius:12, paddingVertical:11, paddingHorizontal:14, fontSize:14, color:"#333" },
  socialLinkInputError: { borderColor:"#FF4444", backgroundColor:"#FFF8F8" },
  socialLinkInputFilled: { borderColor:"#4CAF50", backgroundColor:"#F8FFF8" },
  deleteLinkBtn: { width:40, height:44, justifyContent:"center", alignItems:"center", backgroundColor:"#FFF0F0", borderRadius:10, borderWidth:1, borderColor:"#FFCCCC" },
  linkErrorText: { fontSize:12, color:"#FF4444", marginLeft:4 },

  socialLinksViewContainer: { gap: 10 },
  socialLinkViewPill: { flexDirection:"row", alignItems:"center", gap:10, padding:12, borderRadius:14, borderWidth:1 },
  socialLinkViewText: { flex:1 },
  socialLinkViewLabel: { fontSize:13, fontWeight:"700" },
  socialLinkViewUrl: { fontSize:12, color:"#999", marginTop:1 },
  noLinksContainer: { alignItems:"center", paddingVertical:24, backgroundColor:"#FAFAFA", borderRadius:14, borderWidth:1, borderColor:"#F0F0F0", borderStyle:"dashed" },
  noLinksText: { fontSize:14, color:"#BBBBBB", marginBottom:6 },
  noLinksAction: { fontSize:13, color:"#FF6B6B", fontWeight:"600" },

  modalContainer: { flex:1, backgroundColor:"#FFF" },
  modalHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:16, paddingTop:50, paddingBottom:16, borderBottomWidth:1, borderBottomColor:"#F0F0F0" },
  modalTitle: { fontSize:18, fontWeight:"bold", color:"#333" },
  modalTitleBlock: { alignItems: "center" },
  modalSubtitle: { fontSize:12, color:"#FF6B6B", marginTop:2 },
  cityEmoji: { fontSize:22, width:36, textAlign:"center" },
  emptyList: { flex:1, justifyContent:"center", alignItems:"center", paddingVertical:60 },
  emptyListText: { fontSize:15, color:"#BBBBBB" },
  clearBtn: { padding:6 },
  confirmText: { fontSize:16, fontWeight:"600", color:"#FF6B6B" },
  searchContainer: { flexDirection:"row", alignItems:"center", backgroundColor:"#F8F8F8", borderRadius:12, paddingHorizontal:16, paddingVertical:12, margin:16, gap:10 },
  searchInput: { flex:1, fontSize:16, color:"#333" },
  countryListContent: { paddingHorizontal:16, paddingBottom:20 },
  countryItem: { flexDirection:"row", alignItems:"center", paddingVertical:16, paddingHorizontal:12, gap:12 },
  countryFlag: { fontSize:28, width:40 },
  countryName: { flex:1, fontSize:16, color:"#333", fontWeight:"500" },
  checkmark: { fontSize:20, color:"#FF6B6B", fontWeight:"bold" },
  separator: { height:1, backgroundColor:"#F0F0F0", marginHorizontal:12 },

  // mapWrapper: contains the WebView + overlay buttons (unchanged from original)
  mapWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E5E3DF",
  },
  // ✅ mapLoading shown while WebView/Leaflet is initializing
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  mapLoadingText: {
    fontSize: 14,
    color: "#666",
  },
  // Overlay buttons — identical positions/styles to the original
  myLocationButton: { position:"absolute", bottom:140, left:20, right:20, backgroundColor:"#FF6B6B", paddingVertical:14, borderRadius:30, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.2, shadowRadius:8, elevation:4 },
  myLocationText: { color:"#FFF", fontSize:16, fontWeight:"600" },
  coordinatesDisplay: { position:"absolute", bottom:20, left:20, right:20, backgroundColor:"#FFF", padding:16, borderRadius:12, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:4, elevation:3 },
  coordinatesLabel: { fontSize:12, fontWeight:"bold", color:"#FF6B6B", marginBottom:4 },
  coordinatesText: { fontSize:11, color:"#333", fontFamily:"monospace" },
})