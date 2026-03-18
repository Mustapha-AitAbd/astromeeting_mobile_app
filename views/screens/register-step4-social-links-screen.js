import { useState, useRef } from "react"
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
  ActivityIndicator,
  Animated,
  Linking,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// ─── Platform Config ───────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    icon: "📸",
    color: "#E1306C",
    bgColor: "#FDF0F5",
    placeholder: "https://instagram.com/yourhandle",
    hint: "instagram.com/yourhandle",
    isPhone: false,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👤",
    color: "#1877F2",
    bgColor: "#F0F6FF",
    placeholder: "https://facebook.com/yourprofile",
    hint: "facebook.com/yourprofile",
    isPhone: false,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    color: "#25D366",
    bgColor: "#F0FDF5",
    placeholder: "+212612345678",
    hint: "International format: +212612345678",
    isPhone: true,
  },
  {
    key: "x",
    label: "X (Twitter)",
    icon: "𝕏",
    color: "#000000",
    bgColor: "#F5F5F5",
    placeholder: "https://x.com/yourhandle",
    hint: "x.com/yourhandle",
    isPhone: false,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    color: "#0A66C2",
    bgColor: "#F0F7FF",
    placeholder: "https://linkedin.com/in/yourprofile",
    hint: "linkedin.com/in/yourprofile",
    isPhone: false,
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: "🎵",
    color: "#FF0050",
    bgColor: "#FFF0F3",
    placeholder: "https://tiktok.com/@yourhandle",
    hint: "tiktok.com/@yourhandle",
    isPhone: false,
  },
  {
    key: "snapchat",
    label: "Snapchat",
    icon: "👻",
    color: "#FFFC00",
    bgColor: "#FFFFF0",
    placeholder: "https://snapchat.com/add/yourhandle",
    hint: "snapchat.com/add/yourhandle",
    isPhone: false,
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "▶️",
    color: "#FF0000",
    bgColor: "#FFF0F0",
    placeholder: "https://youtube.com/@yourchannel",
    hint: "youtube.com/@yourchannel",
    isPhone: false,
  },
]

// ─── Validation ────────────────────────────────────────────────────────────────
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

function validateUrl(platform, url) {
  if (!url || !url.trim()) return null // empty = not filled, OK (optional)
  const pattern = PLATFORM_PATTERNS[platform]
  if (!pattern) return `Unsupported platform`
  if (!pattern.test(url.trim())) {
    return platform === "whatsapp"
      ? "Must be an international phone number (e.g. +212612345678)"
      : `Invalid URL. Expected format: ${PLATFORMS.find((p) => p.key === platform)?.hint}`
  }
  return null
}

// ─── PlatformCard Component ────────────────────────────────────────────────────
function PlatformCard({ platform, value, onChange, error, isActive, onToggle }) {
  const animVal = useRef(new Animated.Value(isActive ? 1 : 0)).current

  const toggle = () => {
    Animated.spring(animVal, {
      toValue: isActive ? 0 : 1,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start()
    onToggle()
  }

  const cardBorder = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E8E8E8", platform.color],
  })

  const cardBg = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FAFAFA", platform.bgColor],
  })

  return (
    <Animated.View
      style={[
        styles.platformCard,
        {
          borderColor: error ? "#FF4458" : cardBorder,
          backgroundColor: cardBg,
        },
      ]}
    >
      {/* Header Row */}
      <TouchableOpacity
        style={styles.platformHeader}
        onPress={toggle}
        activeOpacity={0.75}
      >
        <View style={[styles.platformIconBadge, { backgroundColor: platform.color + "20" }]}>
          <Text style={styles.platformIconText}>{platform.icon}</Text>
        </View>

        <View style={styles.platformMeta}>
          <Text style={styles.platformLabel}>{platform.label}</Text>
          {!isActive && (
            <Text style={styles.platformHint}>{platform.hint}</Text>
          )}
        </View>

        {/* Toggle pill */}
        <View style={[styles.togglePill, isActive && { backgroundColor: platform.color }]}>
          <View style={[styles.toggleDot, isActive && styles.toggleDotActive]} />
        </View>
      </TouchableOpacity>

      {/* Input — only shown when active */}
      {isActive && (
        <View style={styles.platformInputRow}>
          <TextInput
            style={[styles.platformInput, error && styles.platformInputError]}
            placeholder={platform.placeholder}
            placeholderTextColor="#AAAAAA"
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={platform.isPhone ? "phone-pad" : "url"}
          />
          {error ? (
            <Text style={styles.platformError}>⚠ {error}</Text>
          ) : value.trim().length > 0 ? (
            <Text style={[styles.platformValid, { color: platform.color }]}>✓ Looks good</Text>
          ) : null}
        </View>
      )}
    </Animated.View>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function RegisterStep4SocialLinks({ navigation, route }) {
  const { email, password, registrationMethod, firstName, lastName,
          dateOfBirth, country, gender, userId, token, user, fromGoogle } = route.params

  // State: which platforms are toggled on
  const [activeKeys, setActiveKeys] = useState(new Set())
  // State: URL values per platform key
  const [values, setValues] = useState(
    Object.fromEntries(PLATFORMS.map((p) => [p.key, ""]))
  )
  // State: validation errors per platform key
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const togglePlatform = (key) => {
    setActiveKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // Clear value & error when deactivating
        setValues((v) => ({ ...v, [key]: "" }))
        setErrors((e) => { const n = { ...e }; delete n[key]; return n })
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleChange = (key, text) => {
    setValues((v) => ({ ...v, [key]: text }))
    // Live validation
    const err = validateUrl(key, text)
    setErrors((e) => {
      const n = { ...e }
      if (err) n[key] = err
      else delete n[key]
      return n
    })
  }

  const validateAll = () => {
    const newErrors = {}
    for (const key of activeKeys) {
      const val = values[key]
      if (!val.trim()) {
        newErrors[key] = "URL is required when platform is enabled"
        continue
      }
      const err = validateUrl(key, val)
      if (err) newErrors[key] = err
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const activeCount = activeKeys.size
  const filledCount = [...activeKeys].filter((k) => values[k].trim()).length

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    // If nothing selected, allow skipping
    if (activeCount === 0) {
      navigateNext()
      return
    }

    if (!validateAll()) return

    setLoading(true)
    try {
      const authToken = token || (await AsyncStorage.getItem("token"))
      if (!authToken) {
        Alert.alert("Error", "Authentication token not found. Please login again.")
        navigation.navigate("Login")
        return
      }

      // Build payload — only active & filled platforms
      const socialLinks = [...activeKeys]
        .filter((k) => values[k].trim())
        .map((k) => ({
          platform: k,
          url: values[k].trim(),
          isPublic: true,
        }))

      const response = await fetch(`${API_BASE_URL}/api/users/social-links/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ socialLinks }),
      })

      const data = await response.json()
      console.log("📥 Social links response:", data)

      if (response.ok && data.success) {
        const { summary } = data.data
        const addedCount = summary?.added?.length ?? socialLinks.length

        // Show partial success info if any were skipped/errored
        if (summary?.errors?.length > 0) {
          const failedPlatforms = summary.errors.map((e) => e.platform).join(", ")
          Alert.alert(
            "Partially Saved",
            `${addedCount} link(s) saved. Could not save: ${failedPlatforms}`,
            [{ text: "Continue", onPress: navigateNext }]
          )
        } else {
          navigateNext()
        }
      } else {
        Alert.alert("Error", data.message || "Failed to save social links. You can add them later in your profile.")
        // Allow continuing despite error
        navigateNext()
      }
    } catch (err) {
      console.error("❌ Error saving social links:", err)
      Alert.alert(
        "Network Error",
        "Could not save social links. You can add them later in your profile settings.",
        [{ text: "Continue", onPress: navigateNext }]
      )
    } finally {
      setLoading(false)
    }
  }

const navigateNext = () => {
  navigation.navigate("RegisterStep6", {
    // ✅ Spread du user object pour inclure toutes les données
    ...user,

    // ✅ Champs explicites nécessaires par RegisterStep6
    token,
    email,
    userId,
    fromGoogle,

    // ✅ Champs phone — RegisterStep6 les attend même si vides ici
    // car l'étape phone (Step5) a déjà été faite avant Step4SocialLinks
    dialCode:        user?.dialCode        || "",
    phoneNumber:     user?.phoneNumber     || "",
    fullPhoneNumber: user?.phone           || "",
    maskedPhone:     user?.phone           || "",
    phoneVerified:   user?.phoneVerified   || false,

    // ✅ Autres champs du profil
    registrationMethod,
    firstName,
    lastName,
    dateOfBirth,
    country,
    gender,
  })
}

  const handleSkip = () => {
    Alert.alert(
      "Skip Social Links?",
      "You can always add your social media links later from your profile settings.",
      [
        { text: "Go Back", style: "cancel" },
        { text: "Skip", onPress: navigateNext },
      ]
    )
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={["#7B2CBF", "#C77DFF", "#E0AAFF"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Connect Your Socials</Text>
            <Text style={styles.subtitle}>
              Let people find you on your favourite platforms
            </Text>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "80%" }]} />
            </View>
            <Text style={styles.progressLabel}>Step 4 of 5</Text>
          </View>

          {/* Stats badge */}
          {activeCount > 0 && (
            <View style={styles.statsBadge}>
              <Text style={styles.statsText}>
                {filledCount}/{activeCount} platform{activeCount !== 1 ? "s" : ""} ready
              </Text>
            </View>
          )}

          {/* Platform Cards */}
          <View style={styles.cardsContainer}>
            <View style={styles.cardsSectionHeader}>
              <Text style={styles.cardsSectionTitle}>Choose your platforms</Text>
              <Text style={styles.cardsSectionHint}>Tap to enable • All optional</Text>
            </View>

            {PLATFORMS.map((platform) => (
              <PlatformCard
                key={platform.key}
                platform={platform}
                value={values[platform.key]}
                onChange={(text) => handleChange(platform.key, text)}
                error={errors[platform.key]}
                isActive={activeKeys.has(platform.key)}
                onToggle={() => togglePlatform(platform.key)}
              />
            ))}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              You control who sees your links. Change visibility anytime in your profile settings.
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#CCC", "#999"] : ["#FF6B9D", "#FFA07A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>  Saving links...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {activeCount === 0 ? "Skip for now →" : `Save & Continue →`}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {activeCount > 0 && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Skip social links</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    paddingBottom: 48,
  },

  // Back
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 24,
  },
  backButtonText: {
    color: "white",
    fontSize: 32,
    fontWeight: "300",
  },

  // Header
  headerSection: {
    marginBottom: 20,
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
    color: "rgba(255,255,255,0.90)",
    lineHeight: 22,
  },

  // Progress
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.30)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
  },
  progressLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Stats badge
  statsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statsText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Cards container
  cardsContainer: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  cardsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cardsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7B2CBF",
    letterSpacing: 0.2,
  },
  cardsSectionHint: {
    fontSize: 12,
    color: "#AAAAAA",
  },

  // Platform card
  platformCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: "hidden",
  },
  platformHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  platformIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  platformIconText: {
    fontSize: 20,
  },
  platformMeta: {
    flex: 1,
  },
  platformLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    letterSpacing: 0.2,
  },
  platformHint: {
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: 2,
  },

  // Toggle pill
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    paddingHorizontal: 3,
    alignItems: "flex-start",
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },

  // Platform input
  platformInputRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  platformInput: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#222",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  platformInputError: {
    borderColor: "#FF4458",
  },
  platformError: {
    color: "#FF4458",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  platformValid: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "600",
  },

  // Privacy note
  privacyNote: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    alignItems: "flex-start",
  },
  privacyIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  privacyText: {
    flex: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 19,
  },

  // Main button
  button: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
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
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Skip button
  skipButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipButtonText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
})