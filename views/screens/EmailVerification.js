import { useState, useEffect, useRef } from "react"
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator,
  Animated, StatusBar, Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  void:       "#07011A",
  cosmos:     "#110330",
  aurora:     "#8B5CF6",
  gold:       "#F4C842",
  goldSoft:   "#FDE68A",
  rose:       "#F472B6",
  white:      "#FFFFFF",
  dim:        "rgba(255,255,255,0.55)",
  faint:      "rgba(255,255,255,0.15)",
  glass:      "rgba(255,255,255,0.07)",
  cardBg:     "rgba(17,3,48,0.92)",
  inputBorder:"rgba(255,255,255,0.18)",
  borderGold: "rgba(244,200,66,0.22)",
  error:      "#FF6B6B",
}

// ─────────────────────────────────────────────────────────────
//  STAR FIELD
// ─────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.6 + 0.4,
  o: Math.random() * 0.5 + 0.12,
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
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function EmailVerificationScreen({ route, navigation }) {
  const { email, userId, token, user, fromGoogle } = route.params

  const [code,          setCode]          = useState(["", "", "", "", "", ""])
  const [isLoading,     setIsLoading]     = useState(false)
  const [error,         setError]         = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown,     setCountdown]     = useState(0)

  const inputRefs = useRef([])

  // Animations
  const fadeIn  = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(36)).current
  const pulse   = useRef(new Animated.Value(0)).current
  // Shake animation for error
  const shake   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, delay: 80, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, delay: 80, useNativeDriver: true }),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const triggerShake = () => {
    shake.setValue(0)
    Animated.sequence([
      Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const handleCodeChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, "")
    if (digit.length <= 1) {
      const next = [...code]
      next[index] = digit
      setCode(next)
      setError("")
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus()
      } else if (digit && index === 5) {
        // ✅ Auto-submit on last digit — dismiss keyboard then verify
        inputRefs.current[5]?.blur()
        const full = next.join("")
        setTimeout(() => handleVerify(full), 80)
      }
    }
  }

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // ✅ Accepts optional codeOverride for auto-submit path
  const handleVerify = async (codeOverride) => {
    const verificationCode = codeOverride !== undefined ? codeOverride : code.join("")
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code")
      triggerShake()
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || "Invalid verification code")
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        triggerShake()
        return
      }
      Alert.alert("Success! ✅", "Your email has been verified successfully!", [{
        text: "Continue",
        onPress: () => {
          if (fromGoogle) {
            navigation.navigate("Home", { user: data.user, token })
          } else {
            navigation.navigate("RegisterStep3", { email, userId, token, user: data.user })
          }
        },
      }])
    } catch {
      setError("Unable to verify code. Please check your connection.")
      triggerShake()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResendLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.message || "Failed to resend code"); return }
      Alert.alert("Success", "A new verification code has been sent to your email!")
      setCountdown(60)
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch {
      setError("Unable to resend code. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] })
  const ORB = 110

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} />
      <StarField />
      <View style={s.blobTop} />
      <View style={s.blobBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={s.content}>

          {/* ── BACK BUTTON ── */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <View style={s.backBtnInner}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </View>
          </TouchableOpacity>

          <Animated.View style={[s.inner, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

            {/* ── ORBITAL ILLUSTRATION ── */}
            <View style={s.orbWrap}>
              <Animated.View style={[s.ring3, { transform: [{ scale: ringScale }] }]} />
              <View style={s.ring2} />
              <View style={s.ring1} />
              <View style={s.orbGlow} />
              <View style={s.orbDot} />
              <View style={s.orbCenter}>
                <Ionicons name="mail-unread-outline" size={38} color={C.goldSoft} />
              </View>
            </View>

            {/* ── HEADER ── */}
            <Text style={s.eyebrow}>EMAIL VERIFICATION</Text>
            <Text style={s.title}>Check Your{"\n"}Email</Text>
            <Text style={s.subtitle}>We've sent a 6-digit code to</Text>

            {/* Email chip */}
            <View style={s.emailChip}>
              <Ionicons name="at-circle-outline" size={15} color={C.gold} />
              <Text style={s.emailChipText} numberOfLines={1}>{email}</Text>
            </View>

            {/* ── CODE CARD ── */}
            <View style={s.card}>

              {/* Error banner */}
              {error ? (
                <View style={s.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={15} color={C.error} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Code inputs */}
              <Animated.View style={[s.codeRow, { transform: [{ translateX: shake }] }]}>
                {code.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => inputRefs.current[i] = r}
                    style={[
                      s.codeBox,
                      digit && s.codeBoxFilled,
                      error && s.codeBoxError,
                    ]}
                    value={digit}
                    onChangeText={t => handleCodeChange(t, i)}
                    onKeyPress={e => handleKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading}
                  />
                ))}
              </Animated.View>

              {/* Resend */}
              <View style={s.resendRow}>
                <Text style={s.resendText}>Didn't receive it? </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={countdown > 0 || resendLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[s.resendLink, (countdown > 0 || resendLoading) && s.resendDim]}>
                    {resendLoading ? "Sending…" : countdown > 0 ? `Resend (${countdown}s)` : "Resend code"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── VERIFY BUTTON ── */}
            <TouchableOpacity
              style={[s.verifyBtn, (isLoading || code.join("").length < 6) && s.verifyBtnDim]}
              onPress={handleVerify}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <View style={s.verifyBtnInner}>
                {isLoading ? (
                  <ActivityIndicator color={C.gold} size="small" />
                ) : (
                  <Text style={s.verifyBtnText}>Verify Email  →</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* ── BACK LINK ── */}
            <TouchableOpacity
              style={s.backLink}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-circle-outline" size={16} color={C.dim} />
              <Text style={s.backLinkText}>Back to Registration</Text>
            </TouchableOpacity>

            <Text style={s.caption}>Your code expires in 10 minutes ✦</Text>

          </Animated.View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const ORB = 110

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },

  blobTop: {
    position: "absolute", width: 360, height: 360, borderRadius: 180,
    backgroundColor: "#F4C84218", top: -100, alignSelf: "center",
  },
  blobBottom: {
    position: "absolute", width: 260, height: 260, borderRadius: 130,
    backgroundColor: "#8B5CF612", bottom: 40, right: -80,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 32,
  },

  // Back button (top-left)
  backBtn: { marginBottom: 24, alignSelf: "flex-start" },
  backBtnInner: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.faint,
    justifyContent: "center", alignItems: "center",
  },

  inner: { flex: 1, alignItems: "center" },

  // Orbital
  orbWrap: {
    width: ORB + 60, height: ORB + 60,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },
  ring3: {
    position: "absolute", width: ORB + 60, height: ORB + 60,
    borderRadius: (ORB + 60) / 2,
    borderWidth: 1, borderColor: "#F4C84218", borderStyle: "dashed",
  },
  ring2: {
    position: "absolute", width: ORB + 28, height: ORB + 28,
    borderRadius: (ORB + 28) / 2,
    borderWidth: 1, borderColor: "#F4C84230",
  },
  ring1: {
    position: "absolute", width: ORB, height: ORB, borderRadius: ORB / 2,
    borderWidth: 1.5, borderColor: "#F4C84248",
  },
  orbGlow: {
    position: "absolute", width: 70, height: 70, borderRadius: 35,
    backgroundColor: "#F4C84220",
  },
  orbDot: {
    position: "absolute", width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.goldSoft, top: 8, left: "50%",
  },
  orbCenter: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.glass,
    borderWidth: 1.5, borderColor: "#F4C84250",
    justifyContent: "center", alignItems: "center",
  },

  // Header text
  eyebrow: {
    fontSize: 10, fontWeight: "700", letterSpacing: 3.5,
    color: C.goldSoft, marginBottom: 10, opacity: 0.75,
  },
  title: {
    fontSize: 38, fontWeight: "800", color: C.white,
    textAlign: "center", lineHeight: 46, letterSpacing: -0.4, marginBottom: 10,
  },
  subtitle: { fontSize: 14, color: C.dim, marginBottom: 10 },

  // Email chip
  emailChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(244,200,66,0.10)",
    borderWidth: 1, borderColor: C.borderGold,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    gap: 6, marginBottom: 24, maxWidth: "85%",
  },
  emailChipText: { color: C.goldSoft, fontSize: 14, fontWeight: "600", flex: 1 },

  // Card
  card: {
    width: "100%",
    backgroundColor: C.cardBg,
    borderRadius: 28, borderWidth: 1, borderColor: C.inputBorder,
    padding: 24, marginBottom: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35, shadowRadius: 32, elevation: 10,
    alignItems: "center",
  },

  // Error banner
  errorBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1, borderColor: "rgba(255,107,107,0.35)",
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 18, gap: 8, width: "100%",
  },
  errorText: { color: C.error, fontSize: 13, flex: 1 },

  // Code boxes
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 22,
  },
  codeBox: {
    width: (width - 48 - 48 - 50) / 6,    // responsive width
    height: 58,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 14,
    fontSize: 24, fontWeight: "800",
    textAlign: "center", color: C.white,
  },
  codeBoxFilled: {
    backgroundColor: "rgba(244,200,66,0.12)",
    borderColor: C.gold,
    color: C.goldSoft,
  },
  codeBoxError: {
    borderColor: C.error,
    backgroundColor: "rgba(255,107,107,0.10)",
  },

  // Resend
  resendRow: { flexDirection: "row", alignItems: "center" },
  resendText: { color: C.dim, fontSize: 13 },
  resendLink: {
    color: C.goldSoft, fontSize: 13, fontWeight: "700",
    textDecorationLine: "underline",
  },
  resendDim: { opacity: 0.4 },

  // Verify button
  verifyBtn: {
    width: "100%",
    borderRadius: 18, borderWidth: 1.5, borderColor: C.gold,
    overflow: "hidden", marginBottom: 16,
  },
  verifyBtnDim: { opacity: 0.45 },
  verifyBtnInner: {
    backgroundColor: "rgba(244,200,66,0.12)",
    paddingVertical: 17, alignItems: "center",
  },
  verifyBtnText: { color: C.gold, fontSize: 16, fontWeight: "700", letterSpacing: 0.4 },

  // Back link
  backLink: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, marginBottom: 12,
  },
  backLinkText: { color: C.dim, fontSize: 14, fontWeight: "500" },

  caption: { color: C.dim, fontSize: 11, opacity: 0.6, letterSpacing: 0.3 },
})