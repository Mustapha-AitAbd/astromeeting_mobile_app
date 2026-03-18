import { useState, useRef, useEffect } from "react"
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Animated, Platform, StatusBar, Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import CodeInput from "../../components/CodeInput"

const { width, height } = Dimensions.get("window")

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS  — Celestial Luxury
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
  cardBg:     "rgba(17,3,48,0.92)",
  inputBorder:"rgba(255,255,255,0.18)",
  borderGold: "rgba(244,200,66,0.22)",
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
        <View
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: s.r,
            backgroundColor: C.white,
            opacity: s.o,
          }}
        />
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function RegisterStep2Screen({ navigation, route }) {
  const { email, password } = route.params
  const [code, setCode] = useState("")

  // Animations
  const fadeIn   = useRef(new Animated.Value(0)).current
  const slideUp  = useRef(new Animated.Value(40)).current
  const pulse    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, delay: 80,  useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, delay: 80,  useNativeDriver: true }),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the complete verification code")
      return
    }
    navigation.navigate("RegisterStep3", { email, password, registrationMethod: "email" })
  }

  const handleResendCode = () => {
    Alert.alert("Success", "Verification code has been resent to your email")
  }

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] })

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} />

      {/* Cosmic background */}
      <StarField />
      <View style={s.blobTop} />
      <View style={s.blobMiddle} />

      {/* ── BACK BUTTON ── */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <View style={s.backBtnInner}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </View>
      </TouchableOpacity>

      {/* ── CONTENT ── */}
      <Animated.View style={[s.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

        {/* Illustration — envelope orbital */}
        <View style={s.illustrationWrap}>
          <Animated.View style={[s.ring3, { transform: [{ scale: ringScale }] }]} />
          <View style={s.ring2} />
          <View style={s.ring1} />
          <View style={s.orbGlow} />
          <View style={s.orbDot} />
          <View style={s.orbCenter}>
            <Ionicons name="mail-unread-outline" size={38} color={C.goldSoft} />
          </View>
        </View>

        {/* Eyebrow */}
        <Text style={s.eyebrow}>EMAIL VERIFICATION</Text>

        {/* Title */}
        <Text style={s.title}>Enter your{"\n"}code</Text>

        {/* Email label */}
        <View style={s.emailChip}>
          <Ionicons name="at-circle-outline" size={16} color={C.gold} />
          <Text style={s.emailText} numberOfLines={1}>{email}</Text>
        </View>

        {/* ── CODE INPUT CARD ── */}
        <View style={s.codeCard}>
          <Text style={s.codeHint}>
            We sent a 6-digit code to your inbox.{"\n"}Check your spam folder if needed.
          </Text>

          {/* Code input (unchanged component) */}
          <View style={s.codeWrap}>
            <CodeInput length={6} onComplete={setCode} />
          </View>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={s.resendText}>Didn't receive anything?  </Text>
            <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7}>
              <Text style={s.resendLink}>Resend code If you want </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CONTINUE BUTTON ── */}
        <TouchableOpacity
          style={[s.continueBtn, code.length !== 6 && s.continueBtnDisabled]}
          onPress={handleVerifyCode}
          activeOpacity={0.85}
        >
          <View style={s.continueBtnInner}>
            <Text style={[s.continueBtnText, code.length !== 6 && s.continueBtnTextDim]}>
              Verify & Continue  →
            </Text>
          </View>
        </TouchableOpacity>

        {/* Caption */}
        <Text style={s.caption}>Your code expires in 10 minutes ✦</Text>

      </Animated.View>
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
  blobMiddle: {
    position: "absolute", width: 260, height: 260, borderRadius: 130,
    backgroundColor: "#8B5CF612", top: "35%", right: -80,
  },

  // Back button
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 24,
    zIndex: 10,
  },
  backBtnInner: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.glass,
    borderWidth: 1, borderColor: C.faint,
    justifyContent: "center", alignItems: "center",
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 120 : 100,
    alignItems: "center",
  },

  // Illustration
  illustrationWrap: {
    width: ORB + 60, height: ORB + 60,
    alignItems: "center", justifyContent: "center",
    marginBottom: 28,
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

  // Text
  eyebrow: {
    fontSize: 10, fontWeight: "700", letterSpacing: 3.5,
    color: C.goldSoft, marginBottom: 12, opacity: 0.75,
  },
  title: {
    fontSize: 42, fontWeight: "800", color: C.white,
    textAlign: "center", lineHeight: 50, letterSpacing: -0.5,
    marginBottom: 18,
  },

  // Email chip
  emailChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(244,200,66,0.10)",
    borderWidth: 1, borderColor: C.borderGold,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    gap: 6, marginBottom: 28, maxWidth: "85%",
  },
  emailText: { color: C.goldSoft, fontSize: 14, fontWeight: "600", flex: 1 },

  // Code card
  codeCard: {
    width: "100%",
    backgroundColor: C.cardBg,
    borderRadius: 28, borderWidth: 1, borderColor: C.inputBorder,
    padding: 24, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35, shadowRadius: 32, elevation: 10,
    alignItems: "center",
  },
  codeHint: {
    fontSize: 13, color: C.dim, textAlign: "center",
    lineHeight: 20, marginBottom: 24,
  },
  codeWrap: { width: "100%", marginBottom: 24 },

  // Resend
  resendRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  resendText: { color: C.dim, fontSize: 13 },
  resendLink: {
    color: C.goldSoft, fontSize: 13, fontWeight: "700",
    textDecorationLine: "underline",
  },

  // Continue button
  continueBtn: {
    width: "100%",
    borderRadius: 18, borderWidth: 1.5, borderColor: C.gold,
    overflow: "hidden", marginBottom: 16,
  },
  continueBtnDisabled: { borderColor: C.faint, opacity: 0.5 },
  continueBtnInner: {
    backgroundColor: "rgba(244,200,66,0.12)",
    paddingVertical: 17, alignItems: "center",
  },
  continueBtnText: {
    color: C.gold, fontSize: 16, fontWeight: "700", letterSpacing: 0.4,
  },
  continueBtnTextDim: { color: C.dim },

  caption: {
    color: C.dim, fontSize: 12, letterSpacing: 0.3, opacity: 0.65,
  },
})