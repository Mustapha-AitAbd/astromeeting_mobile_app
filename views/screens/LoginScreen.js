import { useState, useEffect, useContext, useRef } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, Animated,
  Dimensions, Platform, StatusBar, KeyboardAvoidingView, ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../../context/AuthContext"
import { useGoogleAuth } from "../../hooks/useGoogleAuth"

const { width, height } = Dimensions.get("window")
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

const C = {
  void:      "#07011A",
  cosmos:    "#110330",
  nebula:    "#1E0A4A",
  violet:    "#5B21B6",
  aurora:    "#8B5CF6",
  gold:      "#F4C842",
  goldSoft:  "#FDE68A",
  rose:      "#F472B6",
  white:     "#FFFFFF",
  dim:       "rgba(255,255,255,0.55)",
  faint:     "rgba(255,255,255,0.15)",
  glass:     "rgba(255,255,255,0.07)",
  inputBg:   "rgba(255,255,255,0.08)",
  inputBorder:"rgba(255,255,255,0.18)",
  error:     "#FF6B6B",
}

const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.6 + 0.4,
  o: Math.random() * 0.5 + 0.15,
}))

function StarField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map(s => (
        <View
          key={s.id}
          style={{
            position:        "absolute",
            left:            `${s.x}%`,
            top:             `${s.y}%`,
            width:           s.r * 2,
            height:          s.r * 2,
            borderRadius:    s.r,
            backgroundColor: C.white,
            opacity:         s.o,
          }}
        />
      ))}
    </View>
  )
}

function OrbitalHeader({ pulse }) {
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] })
  return (
    <View style={orb.wrap}>
      <View style={orb.ring3} />
      <View style={orb.ring2} />
      <View style={orb.ring1} />
      <View style={orb.glow} />
      <View style={orb.dot} />
      <Animated.View style={[orb.center, { transform: [{ scale }] }]}>
        <Image
          source={require("../../assets/logo.jpeg")}
          style={orb.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  )
}

const ORB = 130
const orb = StyleSheet.create({
  wrap:   { width: ORB + 60, height: ORB + 60, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  ring3:  { position: "absolute", width: ORB + 60, height: ORB + 60, borderRadius: (ORB+60)/2, borderWidth: 1, borderColor: "#F4C84220", borderStyle: "dashed" },
  ring2:  { position: "absolute", width: ORB + 28, height: ORB + 28, borderRadius: (ORB+28)/2, borderWidth: 1, borderColor: "#F4C84230" },
  ring1:  { position: "absolute", width: ORB,      height: ORB,      borderRadius: ORB/2,      borderWidth: 1.5, borderColor: "#F4C84240" },
  glow:   { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "#F4C84230" },
  dot:    { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#FDE68A", top: 8, left: "50%" },
  center: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", borderWidth: 1.5, borderColor: "#F4C84260" },
  logo:   { width: 64, height: 64, borderRadius: 32 },
})

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
    borderRadius: 16, paddingHorizontal: 16, marginBottom: 14,
  },
  wrapError: { borderColor: C.error },
  icon: { marginRight: 10 },
})

export default function LoginScreen({ navigation }) {
  const { login, loginWithToken } = useContext(AuthContext)


  const [email,             setEmail]             = useState("")
  const [password,          setPassword]          = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error,             setError]             = useState("")
  const [emailLoading,      setEmailLoading]      = useState(false)

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

  // ✅ Hook Google — remplace tout l'ancien code Google OAuth
  const { signInWithGoogle, isLoading: googleLoading } = useGoogleAuth({
onNewUser: (data) => {
  navigation.navigate("RegisterStep3", {
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
      await loginWithToken(data.token)  // ← sauvegarde token + met isAuthenticated = true
      navigation.replace("Home")        // ← plus besoin de passer user/token en params
    },
    onError: (msg) => setError(msg),
  })

  const isLoading = emailLoading || googleLoading

  const restoreAndLogin = async (token) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/admin/account/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        Alert.alert("Cannot Restore Account", data.message || "Your grace period has expired.", [{ text: "OK" }])
        return
      }
      await login(email, password)
    } catch (err) {
      Alert.alert("Error", "Could not restore your account. Please try again.")
    }
  }

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return }
    setError("")
    setEmailLoading(true)
    try {
      const res  = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.accountScheduledForDeletion) {
        setEmailLoading(false)
        Alert.alert(
          "⚠️ Account Scheduled for Deletion",
          `Permanent deletion in ${data.daysRemaining} day${data.daysRemaining !== 1 ? "s" : ""}.\n\nRestore your account?`,
          [
            { text: "No, stay deleted", style: "destructive", onPress: () => {} },
            { text: "Yes, Restore", onPress: () => restoreAndLogin(data.token) },
          ],
          { cancelable: false }
        )
        return
      }

      if (!res.ok) {
        setError(data.message || "Invalid email or password")
        return
      }

      const result = await login(email, password)
      if (!result?.success) setError(result?.message || "Invalid email or password")
    } catch (err) {
      setError("Server connection error")
    } finally {
      setEmailLoading(false)
    }
  }

  // ✅ Bouton Google — une seule ligne
  const handleGoogleLogin = async () => {
    setError("")
    await signInWithGoogle()
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} />
      <StarField />
      <View style={s.blob} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <OrbitalHeader pulse={pulse} />
            <Text style={s.appName}>Syni</Text>
            <Text style={s.tagline}>Your cosmic connection awaits ✦</Text>
          </Animated.View>

          <Animated.View style={[s.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <Text style={s.eyebrow}>SIGN IN</Text>

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

            <TouchableOpacity
              style={s.forgotWrap}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.primaryBtn, isLoading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <View style={s.primaryBtnInner}>
                {emailLoading ? (
                  <View style={s.dots}>
                    <Text style={s.dot}>•</Text><Text style={s.dot}>•</Text><Text style={s.dot}>•</Text>
                  </View>
                ) : (
                  <Text style={s.primaryBtnText}>Sign In  →</Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={[s.googleBtn, isLoading && s.btnDisabled]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={s.googleBtnInner}>
                {googleLoading ? (
                  <View style={s.dots}>
                    <Text style={[s.dot, { color: C.white }]}>•</Text>
                    <Text style={[s.dot, { color: C.white }]}>•</Text>
                    <Text style={[s.dot, { color: C.white }]}>•</Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.googleLetter}>G</Text>
                    <Text style={s.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: fadeIn }]}>
            <Text style={s.footerText}>New to Syni?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("RegisterStep1")}>
              <Text style={s.footerLink}>Create your account  ✦</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.legal}>By signing in, you agree to our Terms of Service</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  blob: {
    position: "absolute", width: 360, height: 360, borderRadius: 180,
    backgroundColor: "#F4C84225", top: -60, alignSelf: "center", opacity: 0.5,
  },
  scroll: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 64 : 44, paddingBottom: 32,
  },
  header: { alignItems: "center", marginBottom: 36 },
  appName: { fontSize: 42, fontWeight: "800", color: C.white, letterSpacing: 4, marginTop: 16 },
  tagline: { fontSize: 13, color: C.goldSoft, letterSpacing: 0.6, marginTop: 6, opacity: 0.85 },
  card: {
    backgroundColor: C.cosmos, borderRadius: 28, borderWidth: 1,
    borderColor: C.inputBorder, padding: 24, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 32, elevation: 12,
  },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 3, color: C.dim, textAlign: "center", marginBottom: 20 },
  errorBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1, borderColor: "rgba(255,107,107,0.35)",
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 14, gap: 8,
  },
  errorText: { color: C.error, fontSize: 13, flex: 1 },
  inputText: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 16 },
  forgotWrap: { alignSelf: "flex-end", marginBottom: 22, marginTop: -4 },
  forgotText: { color: C.goldSoft, fontSize: 13, fontWeight: "600", opacity: 0.85 },
  primaryBtn: { borderRadius: 16, borderWidth: 1.5, borderColor: C.gold, overflow: "hidden", marginBottom: 28 },
  primaryBtnInner: { backgroundColor: "rgba(244,200,66,0.12)", paddingVertical: 17, alignItems: "center" },
  primaryBtnText: { color: C.gold, fontSize: 16, fontWeight: "700", letterSpacing: 0.4 },
  btnDisabled: { opacity: 0.5 },
  dots: { flexDirection: "row", gap: 4 },
  dot:  { color: C.gold, fontSize: 22, fontWeight: "bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.inputBorder },
  dividerLabel: { color: C.dim, fontSize: 12, letterSpacing: 0.3 },
  googleBtn: { borderRadius: 16, borderWidth: 1, borderColor: C.inputBorder, overflow: "hidden" },
  googleBtnInner: {
    backgroundColor: C.glass, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  googleLetter:  { fontSize: 17, fontWeight: "800", color: "#4285F4" },
  googleBtnText: { color: C.white, fontSize: 15, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 16 },
  footerText: { color: C.dim,   fontSize: 14 },
  footerLink: { color: C.goldSoft, fontSize: 14, fontWeight: "700" },
  legal: { color: C.dim, fontSize: 11, textAlign: "center", opacity: 0.6, lineHeight: 16 },
})
