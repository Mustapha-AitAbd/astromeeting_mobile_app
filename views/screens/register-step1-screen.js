import React, { useState, useEffect, useRef, useContext } from "react"
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ScrollView, Alert,
  Dimensions, Animated, StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DisclaimerCard from "../../components/DisclaimerCard"
import { useGoogleAuth } from "../../hooks/useGoogleAuth"
import * as AuthSession from 'expo-auth-session'
import { AuthContext } from "../../context/AuthContext"

const { width, height } = Dimensions.get("window")
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

console.log('Redirect URI:', AuthSession.makeRedirectUri({
  scheme: 'com.mustapha01.syni',
  path: 'oauth2redirect',
}))

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
  inputBg:    "rgba(255,255,255,0.08)",
  inputBorder:"rgba(255,255,255,0.18)",
  cardBg:     "rgba(17,3,48,0.92)",
  borderGold: "rgba(244,200,66,0.22)",
  error:      "#FF6B6B",
}

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

function GlassInput({ icon, hasError, children, style }) {
  return (
    <View style={[gi.wrap, hasError && gi.wrapError, style]}>
      {icon && <Ionicons name={icon} size={18} color={C.dim} style={gi.icon} />}
      {children}
    </View>
  )
}

const gi = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 16, paddingHorizontal: 16,
    marginBottom: 14,
  },
  wrapError: { borderColor: C.error },
  icon: { marginRight: 10 },
})

export default function RegisterStep1Screen({ navigation }) {
  // ✅ useContext DANS le composant
  const { loginWithToken } = useContext(AuthContext)

  const [email,             setEmail]             = useState("")
  const [password,          setPassword]          = useState("")
  const [confirmPassword,   setConfirmPassword]   = useState("")
  const [error,             setError]             = useState("")
  const [manualLoading,     setManualLoading]     = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible,  setIsConfirmVisible]  = useState(false)
  const [disclaimerAccepted,  setDisclaimerAccepted]  = useState(false)
  const [showDisclaimerCard,  setShowDisclaimerCard]  = useState(false)

  const fadeIn  = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(40)).current
  const pulse   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, delay: 100, useNativeDriver: true }),
    ]).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const { signInWithGoogle, isLoading: googleLoading } = useGoogleAuth({
    onNewUser: (data) => {
      navigation.replace("RegisterStep3", {
        email:              data.user.email,
        password:           null,
        registrationMethod: "google",
        userId:             data.user.id,
        token:              data.token,
        user:               data.user,
        fromGoogle:         true,
      })
    },
    onExistingUser: async (data) => {
      await loginWithToken(data.token)
      Alert.alert("Welcome back! 🎉", `Welcome back, ${data.user.name || "User"}!`, [{
        text: "Continue",
        onPress: () => navigation.replace("Home"),
      }])
    },
    onError: (msg) => setError(msg),
  })

  const isLoading = manualLoading || googleLoading

  const validateForm = () => {
    if (!disclaimerAccepted) {
      setError("Please read and accept the Terms and Conditions to continue")
      return false
    }
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleManualRegister = async () => {
    setError("")
    if (!validateForm()) return
    setManualLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, password,
          name: email.split("@")[0],
          disclaimerAccepted: true,
          consentTimestamp: new Date().toISOString(),
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.message || "Registration failed"); return }
      if (data.token) {
        await AsyncStorage.setItem("userToken", data.token)
        await AsyncStorage.setItem("userId",    data.user.id)
        await AsyncStorage.setItem("userEmail", data.user.email)
      }
      Alert.alert(
        "Success! 📧",
        "Account created! A verification code has been sent to your email.",
        [{
          text: "OK",
          onPress: () => navigation.navigate("EmailVerification", {
            email: data.user.email, userId: data.user.id,
            token: data.token, user: data.user,
          }),
        }]
      )
    } catch (err) {
      setError("Unable to connect to the server. Please check your internet connection.")
    } finally {
      setManualLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    if (!disclaimerAccepted) {
      setError("Please read and accept the Terms and Conditions to continue")
      return
    }
    setError("")
    await signInWithGoogle()
  }

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true)
    setShowDisclaimerCard(false)
    setError("")
  }
  const handleDeclineDisclaimer = () => setShowDisclaimerCard(false)

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] })

  const ORB = 120

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} />
      <StarField />
      <View style={s.blobTop} />
      <View style={s.blobBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[s.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <View style={s.orbWrap}>
              <Animated.View style={[s.orbRing3]} />
              <Animated.View style={[s.orbRing2]} />
              <View style={s.orbRing1} />
              <View style={s.orbGlow} />
              <View style={s.orbDot} />
              <Animated.View style={[s.orbCenter, { transform: [{ scale: pulseScale }] }]}>
                <Image source={require("../../assets/logo.jpeg")} style={s.logo} resizeMode="contain" />
              </Animated.View>
            </View>
            <Text style={s.appName}>Syni</Text>
            <Text style={s.tagline}>Begin your journey ✦</Text>
          </Animated.View>

          <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <Text style={s.eyebrow}>Sign up to get started</Text>
            <Text style={s.cardTitle}>Create Account</Text>
            <Text style={s.cardSub}>Sign up to get started</Text>

            {error ? (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={C.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <GlassInput icon="mail-outline" hasError={!!error}>
              <TextInput
                style={s.inputText}
                placeholder="Email address"
                placeholderTextColor={C.dim}
                value={email}
                onChangeText={t => { setEmail(t); setError("") }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </GlassInput>

            <GlassInput icon="lock-closed-outline" hasError={!!error}>
              <TextInput
                style={[s.inputText, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={C.dim}
                value={password}
                onChangeText={t => { setPassword(t); setError("") }}
                secureTextEntry={!isPasswordVisible}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={20} color={C.dim} />
              </TouchableOpacity>
            </GlassInput>

            <GlassInput icon="shield-checkmark-outline" hasError={!!error}>
              <TextInput
                style={[s.inputText, { flex: 1 }]}
                placeholder="Confirm Password"
                placeholderTextColor={C.dim}
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); setError("") }}
                secureTextEntry={!isConfirmVisible}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setIsConfirmVisible(!isConfirmVisible)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={isConfirmVisible ? "eye-outline" : "eye-off-outline"} size={20} color={C.dim} />
              </TouchableOpacity>
            </GlassInput>

            <View style={s.termsSection}>
              <TouchableOpacity
                style={s.readTermsBtn}
                onPress={() => setShowDisclaimerCard(true)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <View style={s.readTermsInner}>
                  <View style={s.readTermsIconWrap}>
                    <Ionicons name="document-text-outline" size={20} color={C.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.readTermsTitle}>Terms & Conditions</Text>
                    <Text style={s.readTermsSub}>Tap to read before accepting</Text>
                  </View>
                  <Text style={s.readTermsArrow}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.checkboxRow}
                onPress={() => setDisclaimerAccepted(prev => !prev)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={[s.checkbox, disclaimerAccepted && s.checkboxChecked]}>
                  {disclaimerAccepted && (
                    <Ionicons name="checkmark" size={14} color={C.cosmos} />
                  )}
                </View>
                <Text style={s.checkboxLabel}>
                  I confirm I am 18+ and agree to the Terms.{"\n"}
                  I accept the Privacy Policy and compatibility profiling.
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.primaryBtn, (isLoading || !disclaimerAccepted) && s.btnDisabled]}
              onPress={handleManualRegister}
              disabled={isLoading || !disclaimerAccepted}
              activeOpacity={0.85}
            >
              <View style={s.primaryBtnInner}>
                {manualLoading ? (
                  <View style={s.dots}>
                    <Text style={s.dot}>•</Text>
                    <Text style={s.dot}>•</Text>
                    <Text style={s.dot}>•</Text>
                  </View>
                ) : (
                  <Text style={s.primaryBtnText}>Continue  →</Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={[s.googleBtn, (isLoading || !disclaimerAccepted) && s.btnDisabled]}
              disabled={isLoading || !disclaimerAccepted}
              onPress={handleGoogleRegister}
              activeOpacity={0.8}
            >
              <View style={s.googleBtnInner}>
                {googleLoading ? (
                  <>
                    <Text style={s.dot}>•</Text>
                    <Text style={s.googleBtnText}>Connecting…</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.googleLetter}>G</Text>
                    <Text style={s.googleBtnText}>Sign up with Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: fadeIn }]}>
            <Text style={s.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.footerLink}>Sign in  ✦</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.legal}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <DisclaimerCard
        visible={showDisclaimerCard}
        onClose={handleDeclineDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />
    </View>
  )
}
const ORB = 120

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  blobTop: {
    position: "absolute", width: 360, height: 360, borderRadius: 180,
    backgroundColor: "#8B5CF618", top: -80, alignSelf: "center",
  },
  blobBottom: {
    position: "absolute", width: 280, height: 280, borderRadius: 140,
    backgroundColor: "#F472B610", bottom: 40, right: -80,
  },
  scroll: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 44, paddingBottom: 36,
  },
  header: { alignItems: "center", marginBottom: 32 },
  orbWrap: {
    width: ORB + 60, height: ORB + 60,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 16,
  },
  orbRing3: {
    position: "absolute", width: ORB + 60, height: ORB + 60,
    borderRadius: (ORB + 60) / 2,
    borderWidth: 1, borderColor: "#8B5CF618", borderStyle: "dashed",
  },
  orbRing2: {
    position: "absolute", width: ORB + 28, height: ORB + 28,
    borderRadius: (ORB + 28) / 2, borderWidth: 1, borderColor: "#8B5CF628",
  },
  orbRing1: {
    position: "absolute", width: ORB, height: ORB, borderRadius: ORB / 2,
    borderWidth: 1.5, borderColor: "#8B5CF640",
  },
  orbGlow: {
    position: "absolute", width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#8B5CF622",
  },
  orbDot: {
    position: "absolute", width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.aurora, top: 8, left: "50%",
  },
  orbCenter: {
    width: 64, height: 64, borderRadius: 32, overflow: "hidden",
    borderWidth: 1.5, borderColor: "#8B5CF660",
  },
  logo: { width: 64, height: 64, borderRadius: 32 },
  appName: { fontSize: 38, fontWeight: "800", color: C.white, letterSpacing: 4, marginBottom: 6 },
  tagline: { fontSize: 13, color: C.aurora, letterSpacing: 0.5, opacity: 0.85 },
  card: {
    backgroundColor: C.cardBg, borderRadius: 28, borderWidth: 1,
    borderColor: C.inputBorder, padding: 24, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 32, elevation: 12,
  },
  eyebrow: {
    fontSize: 10, fontWeight: "700", letterSpacing: 3,
    color: C.dim, textAlign: "center", marginBottom: 8,
  },
  cardTitle: { fontSize: 26, fontWeight: "800", color: C.white, marginBottom: 4 },
  cardSub:   { fontSize: 14, color: C.dim, marginBottom: 22 },
  errorBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1, borderColor: "rgba(255,107,107,0.35)",
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 16, gap: 8,
  },
  errorText: { color: C.error, fontSize: 13, flex: 1 },
  inputText: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 16 },
  termsSection: { marginBottom: 22 },
  readTermsBtn: {
    borderRadius: 16, borderWidth: 1, borderColor: C.borderGold,
    backgroundColor: "rgba(244,200,66,0.07)", marginBottom: 12, overflow: "hidden",
  },
  readTermsInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  readTermsIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(244,200,66,0.14)",
    justifyContent: "center", alignItems: "center",
  },
  readTermsTitle: { fontSize: 15, fontWeight: "700", color: C.goldSoft, marginBottom: 2 },
  readTermsSub:   { fontSize: 12, color: C.dim },
  readTermsArrow: { fontSize: 28, color: C.gold, fontWeight: "300" },
  checkboxRow: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: C.glass, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.faint,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 1.5, borderColor: C.faint,
    backgroundColor: "transparent",
    alignItems: "center", justifyContent: "center",
    marginRight: 12, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: C.gold, borderColor: C.gold },
  checkboxLabel: { flex: 1, color: C.dim, fontSize: 13, lineHeight: 20 },
  primaryBtn: {
    borderRadius: 16, borderWidth: 1.5, borderColor: C.aurora,
    overflow: "hidden", marginBottom: 24,
  },
  primaryBtnInner: {
    backgroundColor: "rgba(139,92,246,0.14)",
    paddingVertical: 17, alignItems: "center",
  },
  primaryBtnText: { color: C.aurora, fontSize: 16, fontWeight: "700", letterSpacing: 0.4 },
  btnDisabled: { opacity: 0.4 },
  dots: { flexDirection: "row", gap: 4 },
  dot:  { color: C.aurora, fontSize: 22, fontWeight: "bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.inputBorder },
  dividerLabel: { color: C.dim, fontSize: 12, letterSpacing: 0.3 },
  googleBtn: {
    borderRadius: 16, borderWidth: 1, borderColor: C.inputBorder, overflow: "hidden",
  },
  googleBtnInner: {
    backgroundColor: C.glass, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  googleLetter:  { fontSize: 17, fontWeight: "800", color: "#4285F4" },
  googleBtnText: { color: C.white, fontSize: 15, fontWeight: "600" },
  footer: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 8, marginBottom: 14,
  },
  footerText: { color: C.dim, fontSize: 14 },
  footerLink: { color: C.goldSoft, fontSize: 14, fontWeight: "700" },
  legal: {
    color: C.dim, fontSize: 11, textAlign: "center",
    opacity: 0.6, lineHeight: 16, paddingHorizontal: 16,
  },
})