import { useState, useEffect, useRef, useContext } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import MapView, { Marker } from "react-native-maps"
import * as Location from "expo-location"
import { AuthContext } from '../../context/AuthContext' // Ajustez le chemin selon votre structure

const { width, height } = Dimensions.get('window')

// ✅ Charger l'URL de l'API depuis .env
const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL

export default function RegisterStep6Screen({ navigation, route }) {
  const userData = route.params
  const { dialCode, phoneNumber, fullPhoneNumber, maskedPhone, token } = userData
  const { loginWithToken } = useContext(AuthContext) // ✅ Utiliser loginWithToken au lieu de login
  
  const [location, setLocation] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [updating, setUpdating] = useState(false) // ✅ Pour l'animation du bouton
  const mapRef = useRef(null)

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    try {
      // Demander la permission d'accès à la localisation
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need location permission to help you select your birthplace on the map.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Définir une localisation par défaut (Paris, France)
                const defaultLocation = {
                  latitude: 48.8566,
                  longitude: 2.3522,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }
                setLocation(defaultLocation)
                setLoading(false)
              }
            }
          ]
        )
        return
      }

      // Obtenir la localisation actuelle
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }

      setLocation(locationData)
      setLoading(false)
      
      console.log('📍 Current location:', locationData)
    } catch (error) {
      console.error('❌ Error getting location:', error)
      
      // Définir une localisation par défaut en cas d'erreur
      const defaultLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
      setLocation(defaultLocation)
      setLoading(false)
    }
  }

  const handleMapPress = (event) => {
    const coordinate = event.nativeEvent.coordinate
    setSelectedLocation(coordinate)
    console.log('📍 Selected location:', coordinate)
  }

  const handleUseMyLocation = async () => {
    setLoading(true)
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const coordinate = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }

      setSelectedLocation(coordinate)
      
      // Animer la carte vers la localisation actuelle
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000)
      }

      Alert.alert('Success', 'Your current location has been selected')
    } catch (error) {
      console.error('❌ Error getting current location:', error)
      Alert.alert('Error', 'Unable to get your current location. Please select manually on the map.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fonction pour mettre à jour la localisation via API
  const updateLocationAPI = async (latitude, longitude) => {
    try {
      console.log('🔄 Updating location via API...')
      console.log('📍 Coordinates:', { latitude, longitude })
      console.log('🔑 Token:', token)

      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location')
      }

      console.log('✅ Location updated successfully:', data)
      return data

    } catch (error) {
      console.error('❌ Error updating location:', error)
      throw error
    }
  }

  const handleContinue = async () => {
    if (!selectedLocation) {
      Alert.alert(
        'Location Required',
        'Please tap on the map to select your birthplace'
      )
      return
    }

    // ✅ Vérifier que le token existe
    if (!token) {
      Alert.alert(
        'Error',
        'Authentication token is missing. Please try logging in again.'
      )
      return
    }

    // ✅ Démarrer l'animation de chargement
    setUpdating(true)

    try {
      // ✅ Mettre à jour la localisation via API
      await updateLocationAPI(selectedLocation.latitude, selectedLocation.longitude)

      console.log('✅ Location saved successfully')

      // ✅ Se connecter avec le token existant
      // Le RootNavigator va automatiquement basculer vers HomeNavigator
      const result = await loginWithToken(token)

      if (result.success) {
        console.log('✅ User authenticated, navigating to Home...')
      } else {
        Alert.alert('Error', result.message || 'Failed to authenticate')
      }

    } catch (error) {
      console.error('❌ Error:', error)
      Alert.alert(
        'Error',
        error.message || 'Failed to update location. Please try again.'
      )
    } finally {
      // ✅ Arrêter l'animation de chargement
      setUpdating(false)
    }
  }

  if (loading || !location) {
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Where were you born?</Text>
            <Text style={styles.subtitle}>
              Tap on the map to select your exact birthplace
            </Text>
          </View>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={location}
            onPress={handleMapPress}
            onMapReady={() => setMapReady(true)}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Your Birthplace"
                description={`${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                pinColor="#FF6B9D"
              />
            )}
          </MapView>

          {/* Coordinates Display */}
          {selectedLocation && (
            <View style={styles.coordinatesBox}>
              <Text style={styles.coordinatesLabel}>Selected Location:</Text>
              <Text style={styles.coordinatesText}>
                Lat: {selectedLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                Long: {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Use My Location Button */}
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={handleUseMyLocation}
          disabled={updating}
        >
          <LinearGradient
            colors={["#9D4EDD", "#C77DFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.myLocationGradient}
          >
            <Text style={styles.myLocationText}>📍 Use My Current Location</Text>
          </LinearGradient>
        </TouchableOpacity>

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
  map: {
    width: '100%',
    height: '100%',
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