import React, { useRef, useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window")

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS  — Celestial Luxury palette
// ─────────────────────────────────────────────────────────────
const C = {
  void:    "#07011A",   // deepest background
  cosmos:  "#110330",   // card bg
  nebula:  "#1E0A4A",   // elevated surface
  violet:  "#5B21B6",   // mid purple
  aurora:  "#8B5CF6",   // soft purple accent
  gold:    "#F4C842",   // gold star accent
  goldSoft:"#FDE68A",   // soft gold text
  rose:    "#F472B6",   // pink planet
  white:   "#FFFFFF",
  dim:     "rgba(255,255,255,0.55)",
  faint:   "rgba(255,255,255,0.15)",
  glass:   "rgba(255,255,255,0.07)",
}

// ─────────────────────────────────────────────────────────────
//  SLIDE DATA  — astrology connection app concept
// ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "1",
    orb:        "☽",
    orbColor:   C.goldSoft,
    orbGlow:    "#F4C84240",
    ringColor:  "#F4C84230",
    tags:       [],
    tagColor:   "#F4C84225",
    tagBorder:  "#F4C84260",
    tagText:    C.gold,
    eyebrow:    "WELCOME TO SYNI",
    title:      "The Stars\nKnow Who\nYou Are.",
    body:       "Your birth chart is a cosmic fingerprint unlike any other. Syni reads it to understand the real you — before you say a word.",
    cta:        "Begin Your Journey →",
  },
  {
    id: "2",
    orb:        "✦",
    orbColor:   C.rose,
    orbGlow:    "#F472B640",
    ringColor:  "#F472B630",
    tags:       ["💜 Emotional", "⚡ Mental", "🌿 Physical"],
    tagColor:   "#F472B615",
    tagBorder:  "#F472B650",
    tagText:    "#FBCFE8",
    eyebrow:    "DEEP COMPATIBILITY",
    title:      "Mind, Body\n& Soul\nAligned.",
    body:       "We go beyond sun signs. Syni maps your emotional depth, mental wavelength, and physical energy to find people who truly resonate with you.",
    cta:        "See How It Works →",
  },
  {
    id: "3",
    orb:        "⬡",
    orbColor:   C.aurora,
    orbGlow:    "#8B5CF640",
    ringColor:  "#8B5CF630",
    tags:       ["🌙 Moon Sign", "☀️ Sun Sign", "⬆️ Rising", "♀ Venus"],
    tagColor:   "#8B5CF615",
    tagBorder:  "#8B5CF650",
    tagText:    "#C4B5FD",
    eyebrow:    "YOUR COSMIC CIRCLE",
    title:      "Connect\nWith Your\nConstellation.",
    body:       "Discover people whose charts align with yours. Build genuine connections rooted in shared energies, not just shared interests.",
    cta:        "Start for Free  🚀",
  },
]

// ─────────────────────────────────────────────────────────────
//  STAR FIELD  (pure View dots — no images needed)
// ─────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.6 + 0.4,
  o: Math.random() * 0.6 + 0.2,
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

// ─────────────────────────────────────────────────────────────
//  ORBITAL ILLUSTRATION
// ─────────────────────────────────────────────────────────────
const ORBD = 180

function OrbitalIllustration({ slide, pulse }) {
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] })

  return (
    <View style={ill.wrap}>
      <View style={[ill.ring3, { borderColor: slide.ringColor }]} />
      <View style={[ill.ring2, { borderColor: slide.ringColor }]} />
      <View style={[ill.ring1, { borderColor: slide.ringColor, borderWidth: 1.5 }]} />
      <View style={[ill.orbitDot, { backgroundColor: slide.orbColor }]} />
      <View style={[ill.glow, { backgroundColor: slide.orbGlow }]} />
      <Animated.View style={[ill.center, { transform: [{ scale }] }]}>
        <Text style={[ill.symbol, { color: slide.orbColor }]}>{slide.orb}</Text>
      </Animated.View>
    </View>
  )
}

const ill = StyleSheet.create({
  wrap:     { width: ORBD + 80, height: ORBD + 80, alignItems: "center", justifyContent: "center" },
  ring3:    { position: "absolute", width: ORBD + 80, height: ORBD + 80, borderRadius: (ORBD+80)/2, borderWidth: 1, borderStyle: "dashed" },
  ring2:    { position: "absolute", width: ORBD + 40, height: ORBD + 40, borderRadius: (ORBD+40)/2, borderWidth: 1 },
  ring1:    { position: "absolute", width: ORBD,      height: ORBD,      borderRadius: ORBD/2 },
  glow:     { position: "absolute", width: 110, height: 110, borderRadius: 55 },
  center:   { width: 84, height: 84, borderRadius: 42, backgroundColor: C.glass, borderWidth: 1, borderColor: C.faint, alignItems: "center", justifyContent: "center" },
  symbol:   { fontSize: 38 },
  orbitDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, top: 12, left: "50%" },
})

// ─────────────────────────────────────────────────────────────
//  TAG PILLS
// ─────────────────────────────────────────────────────────────
function Tags({ slide }) {
  return (
    <View style={tag.row}>
      {slide.tags.map((t, i) => (
        <View key={i} style={[tag.pill, { backgroundColor: slide.tagColor, borderColor: slide.tagBorder }]}>
          <Text style={[tag.label, { color: slide.tagText }]}>{t}</Text>
        </View>
      ))}
    </View>
  )
}
const tag = StyleSheet.create({
  row:   { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 20 },
  pill:  { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
})

// ─────────────────────────────────────────────────────────────
//  SINGLE SLIDE
// ─────────────────────────────────────────────────────────────
function Slide({ item, pulse, isActive }) {
  const opacity    = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(24)).current

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 480, delay: 120, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 480, delay: 120, useNativeDriver: true }),
      ]).start()
    } else {
      opacity.setValue(0)
      translateY.setValue(24)
    }
  }, [isActive])

  return (
    <View style={[sl.slide, { width }]}>
      <View style={sl.illWrap}>
        <OrbitalIllustration slide={item} pulse={pulse} />
      </View>

      <Animated.View style={[sl.copy, { opacity, transform: [{ translateY }] }]}>
        <Text style={sl.eyebrow}>{item.eyebrow}</Text>
        <Text style={sl.title}>{item.title}</Text>
        <View style={[sl.divider, { backgroundColor: item.orbColor }]} />
        <Text style={sl.body}>{item.body}</Text>
        <Tags slide={item} />
      </Animated.View>
    </View>
  )
}

const sl = StyleSheet.create({
  slide:   { width, paddingHorizontal: 28, alignItems: "center", justifyContent: "center" },
  illWrap: { marginBottom: 36, marginTop: Platform.OS === "ios" ? 40 : 20 },
  copy:    { width: "100%", alignItems: "center" },
  eyebrow: {
    fontSize: 11, fontWeight: "700", letterSpacing: 3.5,
    color: C.dim, marginBottom: 14, textAlign: "center",
  },
  title: {
    fontSize: 44, fontWeight: "800", color: C.white, textAlign: "center",
    lineHeight: 52, letterSpacing: -0.5, marginBottom: 20,
  },
  divider: { width: 36, height: 3, borderRadius: 2, marginBottom: 20 },
  body: {
    fontSize: 15.5, color: C.dim, textAlign: "center",
    lineHeight: 24, maxWidth: 300,
  },
})

// ─────────────────────────────────────────────────────────────
//  PROGRESS BAR INDICATOR
// ─────────────────────────────────────────────────────────────
function ProgressBars({ count, activeIndex }) {
  return (
    <View style={pb.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={pb.track}>
          <View style={[pb.fill, i <= activeIndex && pb.fillActive]} />
        </View>
      ))}
    </View>
  )
}
const pb = StyleSheet.create({
  row:        { flexDirection: "row", gap: 6, marginBottom: 24, width: "100%" },
  track:      { flex: 1, height: 3, borderRadius: 2, backgroundColor: C.faint, overflow: "hidden" },
  fill:       { height: "100%", width: "100%", backgroundColor: "transparent" },
  fillActive: { backgroundColor: C.gold },
})

// ─────────────────────────────────────────────────────────────
//  MAIN ONBOARDING SCREEN
// ─────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const flatListRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Continuous pulse for orbital illustration
  const pulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const isLast = activeIndex === SLIDES.length - 1
  const currentSlide = SLIDES[activeIndex]

  const finishOnboarding = async () => {
    try { await AsyncStorage.setItem("hasSeenOnboarding", "true") } catch (_) {}
    navigation.replace("Login")
  }

  const handleNext = () => {
    if (isLast) { finishOnboarding(); return }
    const next = activeIndex + 1
    flatListRef.current?.scrollToIndex({ index: next, animated: true })
    setActiveIndex(next)
  }

  const onMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width)
    setActiveIndex(index)
  }

  const captions = [
    "Discover your cosmic compatibility",
    "Rooted in astrology · Powered by real traits",
    "Free to join · No credit card required",
  ]

  return (
    <View style={root.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} />

      {/* Star field */}
      <StarField />

      {/* Ambient glow blob */}
      <View style={[root.blob, { backgroundColor: currentSlide.orbGlow }]} />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={root.skip} onPress={finishOnboarding}>
          <Text style={root.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <Slide item={item} pulse={pulse} isActive={index === activeIndex} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        style={{ flex: 1 }}
      />

      {/* Bottom controls panel */}
      <View style={root.panel}>
        <ProgressBars count={SLIDES.length} activeIndex={activeIndex} />

        <TouchableOpacity
          style={[root.btn, { borderColor: isLast ? currentSlide.orbColor : C.faint }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <View style={[root.btnInner, isLast && { backgroundColor: currentSlide.orbColor + "22" }]}>
            <Text style={[root.btnText, isLast && { color: currentSlide.orbColor }]}>
              {currentSlide.cta}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={root.legal}>{captions[activeIndex]}</Text>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  ROOT STYLES
// ─────────────────────────────────────────────────────────────
const root = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.void,
  },
  blob: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    top: height * 0.05,
    alignSelf: "center",
    opacity: 0.35,
  },
  skip: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    right: 28,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.faint,
    backgroundColor: C.glass,
  },
  skipText: {
    color: C.dim,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  panel: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingTop: 8,
    alignItems: "center",
  },
  btn: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    marginBottom: 16,
  },
  btnInner: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: C.glass,
  },
  btnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  legal: {
    color: C.dim,
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: "center",
    opacity: 0.7,
  },
})