import { useState, useEffect, useRef, useContext } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
// ✅ REMOVED: import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps"
// ✅ ADDED: WebView + Leaflet/OpenStreetMap — works on Android, Huawei (no Google Play), iOS
import { WebView } from "react-native-webview"
import * as Location from "expo-location"
import { AuthContext } from '../../context/AuthContext'

const { width, height } = Dimensions.get('window')

const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL

// ─── Leaflet HTML Generator ───────────────────────────────────────────────────
// Generates a self-contained HTML page with Leaflet + OpenStreetMap tiles.
// No Google Play Services required — runs inside any WebView.
const buildLeafletHTML = (lat, lng) => `
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
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    var marker = null;

    function sendLocation(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'locationSelected', lat: lat, lng: lng })
        );
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
        marker.bindPopup('Your Birthplace').openPopup();
        marker.on('dragend', function(ev) {
          var pos = ev.target.getLatLng();
          sendLocation(pos.lat, pos.lng);
        });
      }
      sendLocation(lat, lng);
    });

    // Listen for flyTo commands from React Native
    document.addEventListener('message', handleCommand);
    window.addEventListener('message', handleCommand);
    function handleCommand(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'flyTo') {
          map.setView([data.lat, data.lng], data.zoom || 15);
          if (marker) {
            marker.setLatLng([data.lat, data.lng]);
          } else {
            marker = L.marker([data.lat, data.lng], { draggable: true }).addTo(map);
            marker.bindPopup('Your Birthplace').openPopup();
            marker.on('dragend', function(ev) {
              var pos = ev.target.getLatLng();
              sendLocation(pos.lat, pos.lng);
            });
          }
          sendLocation(data.lat, data.lng);
        }
      } catch(e) {}
    }

    // Notify React Native that the map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }
  </script>
</body>
</html>
`

// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterStep6Screen({ navigation, route }) {
  const userData = route.params
  const { dialCode, phoneNumber, fullPhoneNumber, maskedPhone, token } = userData
  const { loginWithToken } = useContext(AuthContext)

  const [location,         setLocation]         = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [leafletHtml,      setLeafletHtml]      = useState(null)

  // `loading`  → initial map setup (full-screen spinner, hides WebView)
  // `locating` → "Use My Location" button spinner (map stays visible)
  const [loading,  setLoading]  = useState(true)
  const [locating, setLocating] = useState(false)
  const [updating, setUpdating] = useState(false)

  // ✅ webViewRef replaces mapRef — used to inject flyTo commands into Leaflet
  const webViewRef = useRef(null)

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need location permission to help you select your birthplace on the map.',
          [{
            text: 'OK',
            onPress: () => {
              const fallback = { latitude: 48.8566, longitude: 2.3522 }
              setLocation(fallback)
              setLeafletHtml(buildLeafletHTML(fallback.latitude, fallback.longitude))
              setLoading(false)
            },
          }]
        )
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const locationData = {
        latitude:  currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }

      setLocation(locationData)
      // ✅ Build the Leaflet HTML once we have the initial coordinates
      setLeafletHtml(buildLeafletHTML(locationData.latitude, locationData.longitude))
    } catch (error) {
      console.error('❌ Error getting location:', error)
      const fallback = { latitude: 48.8566, longitude: 2.3522 }
      setLocation(fallback)
      setLeafletHtml(buildLeafletHTML(fallback.latitude, fallback.longitude))
    } finally {
      setLoading(false)
    }
  }

  // ✅ handleWebViewMessage: receives events posted by the Leaflet HTML
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'locationSelected') {
        setSelectedLocation({ latitude: data.lat, longitude: data.lng })
      }
      // 'mapReady' can be used for future extensions if needed
    } catch (e) {
      console.error('WebView message parse error:', e)
    }
  }


  const updateLocationAPI = async (latitude, longitude) => {
    const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/update-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update location')
    }

    return data
  }

  const handleContinue = async () => {
    if (!selectedLocation) {
      Alert.alert('Location Required', 'Please tap on the map to select your birthplace')
      return
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token is missing. Please try logging in again.')
      return
    }

    setUpdating(true)
    try {
      await updateLocationAPI(selectedLocation.latitude, selectedLocation.longitude)

      const result = await loginWithToken(token)

      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to authenticate')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      Alert.alert('Error', error.message || 'Failed to update location. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  // Full-screen loading only during initial map setup
  if (loading || !location || !leafletHtml) {
    return (
      <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <View style={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Where were you born?</Text>
            <Text style={styles.subtitle}>Tap on the map to select your exact birthplace</Text>
          </View>
        </View>

        {/*
          mapContainer keeps the same flex:1 + overflow:'hidden' + borderRadius.
          ✅ WebView (Leaflet) replaces MapView — identical layout behaviour,
          no Google Play Services required.
          coordinatesBox overlay is inside mapContainer so absolute positioning
          is correctly bounded, exactly as in the original.
        */}
        <View style={styles.mapContainer}>
          {/* ✅ Leaflet map rendered inside WebView */}
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: leafletHtml }}
            style={StyleSheet.absoluteFillObject}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowsInlineMediaPlayback
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#7B2CBF" />
              </View>
            )}
            startInLoadingState
          />

          {/* Coordinates overlay — unchanged from original */}
          {selectedLocation && (
            <View style={styles.coordinatesBox}>
              <Text style={styles.coordinatesLabel}>Selected Location:</Text>
              <Text style={styles.coordinatesText}>Lat: {selectedLocation.latitude.toFixed(6)}</Text>
              <Text style={styles.coordinatesText}>Long: {selectedLocation.longitude.toFixed(6)}</Text>
            </View>
          )}
        </View>



        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, (!selectedLocation || updating) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedLocation || updating}
        >
          <LinearGradient
            colors={(!selectedLocation || updating) ? ["#ccc", "#999"] : ["#FF6B9D", "#FFA07A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {updating ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="white" style={styles.buttonLoader} />
                <Text style={styles.buttonText}>Saving location...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// ✅ All styles are identical to the original.
// Only `webViewLoading` is new (spinner shown while Leaflet tiles load).

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTextContainer: {
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
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
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  // mapContainer: bounded containing block for WebView + coordinatesBox overlay
  mapContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  // ✅ Spinner shown by WebView's renderLoading while Leaflet initialises
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0eeeb',
  },
  coordinatesBox: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  coordinatesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
  },
  myLocationButton: {
    marginHorizontal: 24,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  myLocationGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  myLocationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    marginHorizontal: 24,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 10,
  },
})