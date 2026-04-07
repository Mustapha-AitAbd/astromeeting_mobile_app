/**
 * ChatScreen.js
 * ─────────────────────────────────────────────────────────────
 * User Profile view — white/light background preserved.
 * Compatibility displayed as 4-star rows (like HomeScreen)
 * instead of circular rings.
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useContext, useRef } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Animated, Linking, Alert, Platform,
} from "react-native"
import { ArrowLeft, MapPin, Calendar, Star, Globe } from "lucide-react-native"
import { Ionicons } from "@expo/vector-icons"
import { AuthContext } from "../../context/AuthContext"
import axios from "axios"

const { width, height } = Dimensions.get("window")
const PHOTO_HEIGHT = height * 0.52

// ─────────────────────────────────────────────────────────────
//  PALETTE  — light surface kept as requested
// ─────────────────────────────────────────────────────────────
const L = {
  bg:       "#FAFAFA",
  card:     "#FFFFFF",
  title:    "#1A1A1A",
  body:     "#444444",
  sub:      "#888888",
  line:     "#F0F0F0",
  purple:   "#8B3A8B",
  purpleL:  "#F3E5F5",
  // Star axes — same colours as HomeScreen
  emotional:"#5b8fff",   // rose
  physical: "#008000",   // aurora violet
  mental:   "#F4C842",   // teal
  gold:     "#F4C842",
  goldSoft: "#FDE68A",
}

// ─────────────────────────────────────────────────────────────
//  PLATFORM CONFIG
// ─────────────────────────────────────────────────────────────
const PLATFORMS = [
  { key: "instagram", label: "Instagram", emoji: "📸", color: "#C13584", bg: "#FFF0F6" },
  { key: "facebook",  label: "Facebook",  emoji: "👤", color: "#1877F2", bg: "#EEF4FF" },
  { key: "whatsapp",  label: "WhatsApp",  emoji: "💬", color: "#25D366", bg: "#EDFFF5" },
  { key: "linkedin",  label: "LinkedIn",  emoji: "💼", color: "#0077B5", bg: "#E8F4FD" },
  { key: "tiktok",    label: "TikTok",    emoji: "🎵", color: "#010101", bg: "#F0F0F0" },
  { key: "snapchat",  label: "Snapchat",  emoji: "👻", color: "#FFCC00", bg: "#FFFDE7" },
  { key: "youtube",   label: "YouTube",   emoji: "▶️", color: "#FF0000", bg: "#FFF0F0" },
  { key: "x",         label: "X",         emoji: "𝕏",  color: "#000000", bg: "#F5F5F5" },
]

const getPlatformConfig = (key) =>
  PLATFORMS.find(p => p.key === key?.toLowerCase()) ||
  { key, label: key, emoji: "🔗", color: L.purple, bg: L.purpleL }

const buildLink = (platform, url) => {
  if (platform === "whatsapp") {
    const phone = url.replace(/\D/g, "")
    return `https://wa.me/${phone}`
  }
  return url
}

// ─────────────────────────────────────────────────────────────
//  4-STAR ROW  — pct 0-100 → 0-4 filled stars
// ─────────────────────────────────────────────────────────────
function StarRow({ pct = 0, color = L.gold }) {
  const filled = Math.round((pct / 100) * 4)
  return (
    <View style={sr.row}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < filled ? "star" : "star-outline"}
          size={14}
          color={i < filled ? color : "#E0E0E0"}
          style={{ marginRight: 3 }}
        />
      ))}
    </View>
  )
}
const sr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
})

// ─────────────────────────────────────────────────────────────
//  COMPATIBILITY CARD  — 3 axes as star rows
// ─────────────────────────────────────────────────────────────
function CompatCard({ compatibility }) {
  if (!compatibility) return null

  const emotional = compatibility.intesaEmotivaPercent  ?? compatibility.emotional ?? 0
  const physical  = compatibility.intesaFisicaPercent   ?? compatibility.physical  ?? 0
  const mental    = compatibility.intesaMentalePercent  ?? compatibility.mental    ?? 0
  const overall   = Math.round(((compatibility.totalScore || 0) / 12) * 100) ||
                    Math.round((emotional + physical + mental) / 3)

  const axes = [
    { key: "emotional", label: "Emotional", pct: emotional, color: L.emotional, icon: "heart"    },
    { key: "physical",  label: "Physical",  pct: physical,  color: L.physical,  icon: "flash"    },
    { key: "mental",    label: "Mental",    pct: mental,    color: L.mental,    icon: "bulb"     },
  ]

  // Animated fill for overall bar
  const barAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(barAnim, { toValue: overall / 100, duration: 900, delay: 200, useNativeDriver: false }).start()
  }, [overall])

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })

  return (
    <View style={cc.card}>
      {/* Section header */}
      <View style={cc.sectionHeader}>
        <Star size={16} color={L.purple} fill={L.purple} />
        <Text style={cc.sectionTitle}>Compatibility</Text>
      </View>

      {/* Star rows */}
      {axes.map(({ key, label, pct, color, icon }) => (
        <View key={key} style={cc.axisRow}>
          {/* Icon + label */}
          <View style={cc.axisLeft}>
            <View style={[cc.iconWrap, { backgroundColor: color + "18" }]}>
              <Ionicons name={`${icon}-outline`} size={14} color={color} />
            </View>
            <Text style={cc.axisLabel}>{label}</Text>
          </View>

          {/* Stars + percentage */}
          <View style={cc.axisRight}>
            <StarRow pct={pct} color={color} />
            <Text style={[cc.axisPct, { color }]}>{Math.round(pct)}%</Text>
          </View>
        </View>
      ))}

      {/* Separator */}
      <View style={cc.sep} />

      {/* Overall bar */}
      
    </View>
  )
}

const cc = StyleSheet.create({
  card: {
    marginTop: 8,
    backgroundColor: L.card,
    paddingHorizontal: 20, paddingVertical: 22,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 20,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: L.title },

  axisRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  axisLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  axisLabel: { fontSize: 14, fontWeight: "600", color: L.body },
  axisRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  axisPct:   { fontSize: 13, fontWeight: "700", minWidth: 36, textAlign: "right" },

  sep: { height: 1, backgroundColor: L.line, marginVertical: 14 },

  overallRow: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 10,
  },
  overallLabel: { fontSize: 13, color: L.sub, fontWeight: "600" },
  overallPct:   { fontSize: 13, fontWeight: "800" },
  barTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: L.purpleL, overflow: "hidden",
  },
  barFill: {
    height: "100%", borderRadius: 4, backgroundColor: L.purple,
  },
})

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }) {
  const { userId, userName, userPhoto } = route.params || {}
  const { token } = useContext(AuthContext)
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

  const [profile,       setProfile]       = useState(null)
  const [compatibility, setCompatibility] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [photoIndex,    setPhotoIndex]    = useState(0)

  const scrollY = useRef(new Animated.Value(0)).current
  const fadeIn  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (userId) loadAll()
  }, [userId])

  const loadAll = async () => {
    try {
      const [profileRes, compatRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/compatibility/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data)
      if (compatRes.status === "fulfilled" && compatRes.value.data.success) {
        setCompatibility(compatRes.value.data.compatibility)
      }
    } catch (err) {
      console.error("Profile load error:", err)
    } finally {
      setLoading(false)
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }

  const calculateAge = (dob) => {
    if (!dob) return null
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const getInitials = (name = "U") =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  const handleLinkPress = async (platform, url) => {
    const finalUrl = buildLink(platform, url)
    const canOpen  = await Linking.canOpenURL(finalUrl).catch(() => false)
    canOpen
      ? Linking.openURL(finalUrl)
      : Alert.alert("Cannot open link", `Unable to open the ${platform} link.`)
  }

  // Floating header transitions
  const headerBg = scrollY.interpolate({
    inputRange: [PHOTO_HEIGHT - 80, PHOTO_HEIGHT],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,1)"],
    extrapolate: "clamp",
  })
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [PHOTO_HEIGHT - 40, PHOTO_HEIGHT + 10],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={L.purple} />
        <Text style={s.loadingTxt}>Loading profile…</Text>
      </View>
    )
  }

  const p      = profile || {}
  const age    = calculateAge(p.dateOfBirth)
  const name   = `${p.firstName || ""}${p.lastName ? " " + p.lastName : ""}`.trim() || userName || "User"
  const photos = p.photos || []
  const links  = (p.socialLinks || []).filter(l => l.isPublic !== false)
  const mainPic= photos.find(ph => ph.isMain)?.url || photos[0]?.url || userPhoto || null

  return (
    <View style={s.container}>

      {/* ── Floating header ── */}
      <Animated.View style={[s.floatHeader, { backgroundColor: headerBg }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Animated.Text style={[s.floatTitle, { opacity: headerTitleOpacity }]}>
          {name}
        </Animated.Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

        {/* ── Hero photo ── */}
        <View style={[s.photoHero, { height: PHOTO_HEIGHT }]}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
            >
              {photos.map((ph, i) => (
                <Image
                  key={ph._id || i}
                  source={{ uri: ph.url }}
                  style={{ width, height: PHOTO_HEIGHT }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : mainPic ? (
            <Image source={{ uri: mainPic }} style={s.singlePhoto} resizeMode="cover" />
          ) : (
            <View style={s.photoFallback}>
              <Text style={s.photoFallbackText}>{getInitials(name)}</Text>
            </View>
          )}

          <View style={s.photoGradient} />

          {photos.length > 1 && (
            <View style={s.dotsRow}>
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, i === photoIndex && s.dotActive]} />
              ))}
            </View>
          )}

          <View style={s.heroInfo}>
            <Text style={s.heroName}>{name}</Text>
            {age && <Text style={s.heroAge}>{age} yrs</Text>}
          </View>
        </View>

        {/* ── Location ── */}
        {(p.city || p.country) && (
          <View style={s.locationRow}>
            <MapPin size={15} color={L.purple} />
            <Text style={s.locationTxt}>
              {[p.city, p.country].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}

        {/* ── Bio ── */}
        {p.bio ? (
          <View style={s.section}>
            <Text style={s.bioTxt}>{p.bio}</Text>
          </View>
        ) : null}

        {/* ── Quick facts ── */}
        <View style={s.factsRow}>
          {age && (
            <View style={s.factChip}>
              <Calendar size={13} color={L.purple} />
              <Text style={s.factTxt}>{age} years old</Text>
            </View>
          )}
          {p.gender && (
            <View style={s.factChip}>
              <Text style={s.factEmoji}>
                {p.gender === "M" ? "♂️" : p.gender === "F" ? "♀️" : "⚧️"}
              </Text>
              <Text style={s.factTxt}>
                {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other"}
              </Text>
            </View>
          )}
          {p.zodiacSign && (
            <View style={s.factChip}>
              <Text style={s.factEmoji}>✦</Text>
              <Text style={s.factTxt}>{p.zodiacSign}</Text>
            </View>
          )}
        </View>

        {/* ── ⭐ Compatibility stars ── */}
        <CompatCard compatibility={compatibility} />

        {/* ── Social links ── */}
        <View style={s.socialSection}>
          <View style={s.sectionHeader}>
            <Globe size={16} color={L.purple} />
            <Text style={s.sectionTitle}>Social Profiles</Text>
          </View>

          {links.length > 0 ? (
            <View style={s.linksGrid}>
              {links.map(link => {
                const cfg = getPlatformConfig(link.platform)
                return (
                  <TouchableOpacity
                    key={link._id || link.platform}
                    style={[s.linkCard, { backgroundColor: cfg.bg }]}
                    onPress={() => handleLinkPress(link.platform, link.url)}
                    activeOpacity={0.75}
                  >
                    <Text style={s.linkEmoji}>{cfg.emoji}</Text>
                    <Text style={[s.linkLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={s.noLinks}>
              <Text style={s.noLinksEmoji}>🔒</Text>
              <Text style={s.noLinksTxt}>No social profiles shared yet.</Text>
            </View>
          )}
        </View>

        {/* ── Member since ── */}
        {p.createdAt && (
          <View style={s.infoSection}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Member since</Text>
              <Text style={s.infoValue}>
                {new Date(p.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long",
                })}
              </Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  STYLES  — light surface
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: L.bg },
  center:    { justifyContent: "center", alignItems: "center" },
  loadingTxt: { marginTop: 12, fontSize: 14, color: L.sub },

  // Floating header
  floatHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 52 : 36,
    paddingBottom: 10, paddingHorizontal: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.88)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14, shadowRadius: 4, elevation: 3,
  },
  floatTitle: { fontSize: 17, fontWeight: "700", color: L.title },

  // Hero
  photoHero:     { width, overflow: "hidden", backgroundColor: "#111" },
  singlePhoto:   { width, height: PHOTO_HEIGHT },
  photoFallback: {
    width, height: PHOTO_HEIGHT, backgroundColor: L.purple,
    justifyContent: "center", alignItems: "center",
  },
  photoFallbackText: { fontSize: 64, fontWeight: "800", color: "#FFF" },
  photoGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  dotsRow: {
    position: "absolute", bottom: 80, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 5,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "#FFF", width: 18 },
  heroInfo:  { position: "absolute", bottom: 24, left: 20 },
  heroName:  { fontSize: 30, fontWeight: "800", color: "#FFF", letterSpacing: -0.5 },
  heroAge:   { fontSize: 18, fontWeight: "500", color: "rgba(255,255,255,0.8)", marginTop: 2 },

  // Location
  locationRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: L.card,
    borderBottomWidth: 1, borderBottomColor: L.line,
  },
  locationTxt: { fontSize: 14, color: "#555", fontWeight: "500" },

  // Generic section
  section: {
    backgroundColor: L.card, paddingHorizontal: 20, paddingVertical: 16, marginTop: 8,
  },
  bioTxt: { fontSize: 15, color: L.body, lineHeight: 23 },

  // Facts
  factsRow: {
    flexDirection: "row", gap: 8, flexWrap: "wrap",
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: L.card, marginTop: 8,
  },
  factChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: L.purpleL,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  factEmoji: { fontSize: 13 },
  factTxt:   { fontSize: 13, color: L.purple, fontWeight: "600" },

  // Section header (reused by social)
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 18 },
  sectionTitle:  { fontSize: 17, fontWeight: "700", color: L.title },

  // Social
  socialSection: {
    marginTop: 8, backgroundColor: L.card,
    paddingHorizontal: 20, paddingVertical: 22,
  },
  linksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  linkCard: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24,
    minWidth: (width - 60) / 3, justifyContent: "center",
  },
  linkEmoji: { fontSize: 15 },
  linkLabel: { fontSize: 13, fontWeight: "700" },
  noLinks:   { alignItems: "center", paddingVertical: 20 },
  noLinksEmoji: { fontSize: 28, marginBottom: 6 },
  noLinksTxt:   { fontSize: 14, color: "#BDBDBD" },

  // Info
  infoSection: {
    marginTop: 8, backgroundColor: L.card,
    paddingHorizontal: 20, paddingVertical: 6,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: L.line,
  },
  infoLabel: { fontSize: 14, color: L.sub, fontWeight: "500" },
  infoValue: { fontSize: 14, color: L.title, fontWeight: "600" },
})