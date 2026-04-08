import React, { useState, useEffect, useContext, useRef, useCallback, memo } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, RefreshControl, ActivityIndicator, Dimensions, Animated, Platform
} from "react-native"
import {
  Bell, Settings, RefreshCw, Star, Flame,
  User, Lock, LogOut, UserPlus, CheckCircle,
  Camera, Home, XCircle
} from "lucide-react-native"
import { useNavigation } from "@react-navigation/native"
import { AuthContext } from "../../context/AuthContext"
import axios from "axios"
import { Link } from "lucide-react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  void:       "#07011A",
  cosmos:     "#110330",
  nebula:     "#1E0A4A",
  aurora:     "#8B5CF6",
  gold:       "#FF6B6B",
  goldSoft:   "#FF6B6B",
  rose:       "#F472B6",
  coral:      "#FF6B6B",
  white:      "#FFFFFF",
  dim:        "rgba(255,255,255,0.55)",
  faint:      "rgba(255,255,255,0.15)",
  glass:      "rgba(255,255,255,0.07)",
  cardBg:     "rgba(17, 3, 48, 0.92)",
  border:     "rgba(255,255,255,0.12)",
  borderGold: "rgba(244,200,66,0.22)",
}

// ─────────────────────────────────────────────────────────────
//  STAR FIELD
// ─────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 1.8 + 0.3,
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
//  HELPER
// ─────────────────────────────────────────────────────────────
const getRecipientId = (req) => {
  if (!req?.recipient) return null
  if (typeof req.recipient === "object" && req.recipient._id) {
    return String(req.recipient._id)
  }
  return String(req.recipient)
}

const getDisplayName = (profile) => {
  const firstName = profile.firstName?.trim()
  const lastName  = profile.lastName?.trim()
  if (firstName || lastName) return `${firstName || ""} ${lastName || ""}`.trim()
  if (profile.name?.trim()) return profile.name.trim()
  return "User"
}

const getUserMainPhoto = (userProfile) => {
  if (userProfile.photos?.length > 0) {
    const main = userProfile.photos.find(p => p.isMain)
    return main ? main.url : userProfile.photos[0].url
  }
  return null
}

// ─────────────────────────────────────────────────────────────
//  STAR RATING
// ─────────────────────────────────────────────────────────────
const renderStatStars = (percentValue, color) => {
  const stars    = []
  const maxStars = 4
  const starValue  = (percentValue / 100) * maxStars
  const fullStars  = Math.floor(starValue)
  const hasHalf    = starValue - fullStars >= 0.5
  for (let i = 0; i < fullStars; i++)
    stars.push(<Star key={`f${i}`} size={11} color={color} fill={color} />)
  if (hasHalf && fullStars < maxStars)
    stars.push(
      <View key="half" style={s.halfStarContainer}>
        <View style={s.halfStarClip}><Star size={11} color={color} fill={color} /></View>
        <Star size={11} color={color} fill="transparent" />
      </View>
    )
  const remaining = maxStars - fullStars - (hasHalf ? 1 : 0)
  for (let i = 0; i < remaining; i++)
    stars.push(<Star key={`e${i}`} size={11} color="rgba(255,255,255,0.25)" fill="transparent" />)
  return stars
}

// ─────────────────────────────────────────────────────────────
//  ✅ USER CARD — isolated React component with memo
//  This is the KEY fix: each card is its own component that
//  receives pendingEntry as a prop and re-renders independently
//  when that prop changes, without relying on parent re-renders.
// ─────────────────────────────────────────────────────────────
const UserCard = ({
  compatibilityResult,
  isPremiumUser,
  isFriend,
  pendingEntry,       // undefined | "__sending__" | "real_mongo_id"
  onSendInvitation,
  onCancelInvitation,
  onUpgrade,
  onNavigateProfile,
}) => {
  const profile    = compatibilityResult
  const category   = compatibilityResult.category
  const statistics = compatibilityResult.statistics || {}

  const isHighCompatibilityLocked = category === "high" && !isPremiumUser
  const userPhoto    = getUserMainPhoto(profile)
  const isSending    = pendingEntry === "__sending__"
  // ✅ invitationSent is derived ONLY from pendingEntry prop
  const invitationSent = !!pendingEntry

  return (
    <TouchableOpacity
      style={s.matchCard}
      onPress={() => {
        if (isHighCompatibilityLocked) {
          Alert.alert(
            "Premium Required",
            "Upgrade to Premium to view highly compatible profiles",
            [{ text: "Cancel", style: "cancel" }, { text: "Upgrade", onPress: onUpgrade }]
          )
          return
        }
        onNavigateProfile(profile.id)
      }}
      activeOpacity={0.95}
    >
      {/* Photo */}
      <View style={s.imageWrapper}>
        {userPhoto ? (
          <>
            <Image
              source={{ uri: userPhoto }}
              style={[s.cardBgImage, isHighCompatibilityLocked && s.blurredImage]}
              resizeMode="cover"
              blurRadius={isHighCompatibilityLocked ? 10 : 0}
            />
            <View style={s.gradientOverlay}>
              <View style={s.gradientTop} />
              <View style={s.gradientBottom} />
            </View>
          </>
        ) : (
          <View style={s.placeholderImage}>
            <View style={s.placeholderCircle}>
              <Text style={s.placeholderInitial}>
                {profile.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          </View>
        )}

        {isHighCompatibilityLocked && (
          <View style={s.lockOverlay}>
            <View style={s.lockIconCircle}><Lock size={32} color={C.white} /></View>
            <Text style={s.lockText}>Premium Profile</Text>
          </View>
        )}

        {/* Stats chip */}
        <View style={s.topBadgesContainer}>
          <View style={s.statsChip}>
            <View style={s.statRow}><View style={s.starsContainer}>{renderStatStars(statistics.intesaEmotivaPercent || 0, "#4CAF50")}</View></View>
            <View style={s.statRow}><View style={s.starsContainer}>{renderStatStars(statistics.intesaFisicaPercent  || 0, "#4FC3F7")}</View></View>
            <View style={s.statRow}><View style={s.starsContainer}>{renderStatStars(statistics.intesaMentalePercent || 0, "#F4C842")}</View></View>
          </View>
        </View>

        {/* Name */}
        <View style={s.userInfoOverlay}>
          <View style={s.nameContainer}>
            <Text style={s.userName} numberOfLines={1}>{getDisplayName(profile)}</Text>
          </View>
          <Text style={s.userLocation} numberOfLines={1}>
            {profile.city || "Unknown"} {profile.country}
          </Text>
        </View>
      </View>

      {/* ✅ Action button — driven entirely by pendingEntry prop */}
      <View style={s.actionsContainer}>
        {isFriend ? (
          // ── Already friends ──
          <View style={s.statusCard}>
            <View style={s.statusIconCircle}>
              <CheckCircle size={22} color="#4CAF50" fill="#4CAF50" />
            </View>
            <View style={s.statusTextContainer}>
              <Text style={s.statusTitle}>Interested</Text>
              <Text style={s.statusSubtitle}>You're already friends</Text>
            </View>
          </View>

        ) : isHighCompatibilityLocked ? (
          // ── Locked (premium) ──
          <TouchableOpacity style={s.unlockCard} onPress={onUpgrade}>
            <View style={s.unlockContent}>
              <View style={s.unlockIconCircle}><Lock size={20} color={C.coral} /></View>
              <View style={s.unlockTextContainer}>
                <Text style={s.unlockTitle}>High Compatibility</Text>
                <Text style={s.unlockSubtitle}>Upgrade to connect</Text>
              </View>
            </View>
            <View style={s.unlockArrow}><Text style={s.unlockArrowText}>→</Text></View>
          </TouchableOpacity>

        ) : invitationSent ? (
          // ── Request pending / sending ──
          <TouchableOpacity
            style={[s.pendingCard, isSending && { opacity: 0.6 }]}
            onPress={() => !isSending && onCancelInvitation(profile.id)}
            disabled={isSending}
          >
            <View style={s.pendingIcon}>
              <XCircle size={20} color={C.dim} />
            </View>
            <View style={s.pendingTextContainer}>
              <Text style={s.pendingTitle}>{isSending ? "Sending…" : "Request Sent"}</Text>
              <Text style={s.pendingSubtitle}>{isSending ? "Please wait" : "Tap to cancel"}</Text>
            </View>
          </TouchableOpacity>

        ) : (
          // ✅ "Interested" button — shown when pendingEntry is undefined/null
          <TouchableOpacity
            style={s.connectCard}
            onPress={() => onSendInvitation(profile.id)}
          >
            <View style={s.connectInner}>
              <View style={s.connectIconCircle}>
                <UserPlus size={22} color={C.white} strokeWidth={2.5} />
              </View>
              <Text style={s.connectText}>Interested</Text>
              <Text style={s.sparkleText}>✨</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  const [activeTab, setActiveTab] = useState("home")
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const { token, user: currentUser, logout } = useContext(AuthContext)
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  const [allDisplayUsers, setAllDisplayUsers] = useState([])
  const [loadingUsers,    setLoadingUsers]    = useState(false)
  const [refreshing,      setRefreshing]      = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [friends,         setFriends]         = useState([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [mainPhoto,       setMainPhoto]       = useState(null)

  // ✅ THE single source of truth
  // { [userId: string]: "real_mongo_id" | "__sending__" }
  // absent key = no pending invitation → show "Interested"
  const [pendingMap, setPendingMap] = useState({})

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  const bottomInset    = Math.max(insets.bottom, 14)
  const NAV_BAR_HEIGHT = 56 + bottomInset

  const pulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (token) {
      fetchUser()
      fetchUserPhotos()
      fetchCompatibilityUsers()
      fetchPendingRequests()
      fetchFriends()
      fetchSentRequests()
    }
  }, [token])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchUser(), fetchUserPhotos(), fetchCompatibilityUsers(),
      fetchPendingRequests(), fetchFriends(), fetchSentRequests(),
    ])
    setRefreshing(false)
  }

  // ── API ──────────────────────────────────────────────────
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(res.data)
      const sub = res.data?.subscription
      setIsPremiumUser(sub?.plan === "premium" && sub?.active === true)
    } catch (e) {
      console.error("fetchUser:", e)
      Alert.alert("Error", "Unable to retrieve user profile")
    } finally {
      setLoadingUser(false)
    }
  }

  const fetchUserPhotos = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/users/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setMainPhoto(data.data.mainPhoto)
    } catch (e) { console.error("fetchUserPhotos:", e) }
  }

  const fetchCompatibilityUsers = async () => {
    setLoadingUsers(true)
    try {
      const res  = await fetch(`${API_BASE_URL}/api/compatibility/results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        const high   = data.highCompatibilityList   || []
        const medium = data.mediumCompatibilityList || []
        const low    = data.lowCompatibilityList    || []
        setAllDisplayUsers([...high, ...medium, ...low])
      } else {
        Alert.alert("Info", data.message || "No compatible users found")
      }
    } catch (e) {
      console.error("fetchCompatibilityUsers:", e)
      Alert.alert("Error", "Unable to load compatible users")
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/friendship/requests/received`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setPendingRequests(list)
      setNotificationCount(list.length)
    } catch (e) { console.error("fetchPendingRequests:", e) }
  }

  const fetchFriends = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/friendship/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setFriends(Array.isArray(data) ? data : [])
    } catch (e) { console.error("fetchFriends:", e) }
  }

  // ✅ Only called on mount + refresh — builds pendingMap from server
  const fetchSentRequests = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/friendship/requests/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      const map  = {}
      list.forEach((req) => {
        if (req.status !== "pending") return
        const uid = getRecipientId(req)
        if (uid && req._id) map[uid] = String(req._id)
      })
      setPendingMap(map)
    } catch (e) { console.error("fetchSentRequests:", e) }
  }

  // ── SEND ─────────────────────────────────────────────────
  const handleSendInvitation = useCallback(async (recipientId) => {
    const targetId = String(recipientId)
    if (pendingMap[targetId]) return // guard double-tap

    const recipientUser = allDisplayUsers.find(u => String(u.id) === targetId)
    const recipientName = recipientUser ? getDisplayName(recipientUser) : "this user"

    // Optimistic: mark as in-flight
    setPendingMap(prev => ({ ...prev, [targetId]: "__sending__" }))

    try {
      const res  = await fetch(`${API_BASE_URL}/api/friendship/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: targetId }),
      })
      const data = await res.json()

      if (res.ok && data.friendship?._id) {
        // ✅ Replace in-flight marker with real ID
        setPendingMap(prev => ({ ...prev, [targetId]: String(data.friendship._id) }))
        Alert.alert("✨ Invitation Sent!", `Your invitation has been sent to ${recipientName}.`, [{ text: "Great!" }])
      } else {
        // Revert
        setPendingMap(prev => { const n = { ...prev }; delete n[targetId]; return n })
        Alert.alert("Error", data.message || "Failed to send invitation")
      }
    } catch (e) {
      // Revert
      setPendingMap(prev => { const n = { ...prev }; delete n[targetId]; return n })
      Alert.alert("Error", "Failed to send invitation. Please check your connection.")
    }
  }, [pendingMap, allDisplayUsers, token, API_BASE_URL])

  // ── CANCEL ───────────────────────────────────────────────
  const handleCancelInvitation = useCallback(async (recipientId) => {
    const targetId     = String(recipientId)
    const friendshipId = pendingMap[targetId]

    if (!friendshipId) return
    if (friendshipId === "__sending__") {
      Alert.alert("Please wait", "The invitation is still being sent.")
      return
    }

    const recipientUser = allDisplayUsers.find(u => String(u.id) === targetId)
    const recipientName = recipientUser ? getDisplayName(recipientUser) : "this user"

    // ✅ Optimistic: remove key → card re-renders with "Interested" button immediately
    setPendingMap(prev => { const n = { ...prev }; delete n[targetId]; return n })

    try {
      const res  = await fetch(`${API_BASE_URL}/api/friendship/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendshipId }),
      })
      const data = await res.json()

      if (res.ok) {
        Alert.alert("🔄 Invitation Canceled", `Your invitation to ${recipientName} has been canceled.`, [{ text: "OK" }])
      } else {
        // Revert on failure
        setPendingMap(prev => ({ ...prev, [targetId]: friendshipId }))
        Alert.alert("Error", data.message || "Failed to cancel invitation")
      }
    } catch (e) {
      // Revert on network error
      setPendingMap(prev => ({ ...prev, [targetId]: friendshipId }))
      Alert.alert("Error", "Failed to cancel invitation. Please check your connection.")
    }
  }, [pendingMap, allDisplayUsers, token, API_BASE_URL])

  const handleUpgrade = useCallback(() => navigation.navigate("Subscription"), [navigation])
  const handleLogout  = async () => { setShowSettingsMenu(false); await logout() }

  // Loading screen
  if (loadingUser) {
    return (
      <View style={[s.container, s.centerContent]}>
        <StarField />
        <View style={s.loadingOrb} />
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={s.loadingText}>Loading your universe…</Text>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <StarField />
      <View style={s.blobTop} />
      <View style={s.blobBottom} />

      {/* HEADER */}
      <View style={[s.header, { paddingTop: Math.max(insets.top, Platform.OS === "ios" ? 50 : 30) }]}>
        <Image source={require("../../assets/logo-3.png")} style={s.headerLogo} resizeMode="contain" />
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconButton} onPress={() => navigation.navigate("Settings")}>
            <Settings size={20} color={C.white} />
          </TouchableOpacity>
          {showSettingsMenu && (
            <View style={s.settingsMenu}>
              <TouchableOpacity style={s.menuItem} onPress={handleLogout}>
                <LogOut size={18} color={C.coral} />
                <Text style={s.menuItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {showSettingsMenu && (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSettingsMenu(false)} />
      )}

      <ScrollView
        style={s.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scrollContent, { paddingBottom: NAV_BAR_HEIGHT + 16 }]}
        contentInset={{ bottom: NAV_BAR_HEIGHT }}
        scrollIndicatorInsets={{ bottom: NAV_BAR_HEIGHT }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} colors={[C.gold]} />
        }
      >
        {/* PROFILE CARD */}
        <View style={s.profileCard}>
          <View style={s.profileHeader}>
            <View style={s.avatarWrap}>
              <Animated.View style={[s.avatarRing, {
                transform: [{ scale: pulse.interpolate({ inputRange: [0,1], outputRange: [0.95,1.05] }) }]
              }]} />
              {mainPhoto
                ? <Image source={{ uri: mainPhoto.url }} style={s.avatar} resizeMode="cover" />
                : <View style={[s.avatar, s.avatarPlaceholder]}><User size={36} color={C.white} /></View>
              }
              <TouchableOpacity style={s.cameraBtn} onPress={() => navigation.navigate("Profile")}>
                <Camera size={14} color={C.white} />
              </TouchableOpacity>
            </View>
            <View style={s.profileMeta}>
              <View style={s.nameRow}>
                <Text style={s.profileName} numberOfLines={1}>
                  {user?.firstName || user?.name} {user?.lastName}
                </Text>
                {isPremiumUser && (
                  <View style={s.premiumBadge}><Star size={12} color={C.gold} fill={C.gold} /></View>
                )}
              </View>
              <TouchableOpacity style={s.profileBtn} onPress={() => navigation.navigate("Profile")}>
                <Text style={s.profileBtnText}>View Profile  →</Text>
              </TouchableOpacity>
            </View>
          </View>
          {!isPremiumUser && (
            <TouchableOpacity style={s.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
              <Star size={16} color={C.cosmos} fill={C.cosmos} />
              <Text style={s.upgradeBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FEATURE TILES */}
        <View style={s.tilesRow}>
          <TouchableOpacity style={s.tile} onPress={() => navigation.navigate("Messages")}>
            <Star size={28} color="#F4C842" fill="#F4C842" />
            <Text style={s.tileLabel}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tile} onPress={() => navigation.navigate("Notifications")}>
            <View>
              <Bell size={28} color={C.rose} />
              {notificationCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>{notificationCount > 99 ? "99+" : notificationCount}</Text>
                </View>
              )}
            </View>
            <Text style={s.tileLabel}>Alerts</Text>
          </TouchableOpacity>
          <View style={s.tile}>
            <Flame size={28} color={isPremiumUser ? C.gold : C.dim} />
            <Text style={[s.tileLabel, isPremiumUser && { color: C.goldSoft }]}>
              {isPremiumUser ? "Premium" : "Free Plan"}
            </Text>
          </View>
        </View>

        {/* DISCOVER */}
        <View style={s.discoverSection}>
          <View style={s.discoverHeader}>
            <View>
              <Text style={s.sectionEyebrow}>COSMIC MATCHES</Text>
              <Text style={s.sectionTitle}>Discover People</Text>
              <Text style={s.sectionSub}>
                {isPremiumUser
                  ? "All profiles unlocked with compatibility scores"
                  : "Upgrade to unlock highly compatible profiles"}
              </Text>
            </View>
            <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
              <RefreshCw size={18} color={C.white} />
            </TouchableOpacity>
          </View>

          {loadingUsers ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator size="large" color={C.gold} />
              <Text style={s.loadingText}>Reading the stars…</Text>
            </View>
          ) : (
            allDisplayUsers.map((result) => {
  const profileId  = String(result.id)
  const isFriend   = friends.some(f => String(f._id) === profileId)
  const pendingEntry = pendingMap[profileId]

  return (
    <UserCard
      key={`${profileId}-${pendingEntry || "none"}`} // ✅ FIX
      compatibilityResult={result}
      isPremiumUser={isPremiumUser}
      isFriend={isFriend}
      pendingEntry={pendingEntry}
      onSendInvitation={handleSendInvitation}
      onCancelInvitation={handleCancelInvitation}
      onUpgrade={handleUpgrade}
      onNavigateProfile={(id) => navigation.navigate("UserProfile", { userId: id })}
    />
  )
})
          )}
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[s.bottomNav, { paddingBottom: bottomInset }]}>
        <TouchableOpacity style={s.navItem} onPress={() => { setActiveTab("home"); navigation.navigate("Home") }}>
          <Home size={26} color={activeTab === "home" ? C.gold : C.dim} />
          {activeTab === "home" && <View style={s.navDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => { setActiveTab("messages"); navigation.navigate("Messages") }}>
          <Link size={26} color={activeTab === "messages" ? C.gold : C.dim} />
          {activeTab === "messages" && <View style={s.navDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => { setActiveTab("profile"); navigation.navigate("Profile") }}>
          <User size={26} color={activeTab === "profile" ? C.gold : C.dim} />
          {activeTab === "profile" && <View style={s.navDot} />}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.void },
  centerContent: { justifyContent: "center", alignItems: "center" },
  blobTop: {
    position: "absolute", width: 380, height: 380, borderRadius: 190,
    backgroundColor: "#F4C84215", top: -100, alignSelf: "center",
  },
  blobBottom: {
    position: "absolute", width: 300, height: 300, borderRadius: 150,
    backgroundColor: "#F472B610", bottom: 60, right: -80,
  },
  loadingOrb: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#F4C84218", alignSelf: "center",
  },
  loadingText: { color: C.dim, fontSize: 14, marginTop: 12, letterSpacing: 0.3 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: "rgba(7,1,26,0.97)",
    borderBottomWidth: 1, borderBottomColor: C.borderGold, zIndex: 100,
  },
  headerLogo:  { width: 80, height: 36 },
  headerRight: { flexDirection: "row", gap: 10, position: "relative" },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.border,
    justifyContent: "center", alignItems: "center",
  },
  settingsMenu: {
    position: "absolute", top: 48, right: 0,
    backgroundColor: C.cosmos, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    minWidth: 150, zIndex: 200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  menuItem:     { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  menuItemText: { color: C.white, fontSize: 15, fontWeight: "500" },

  scrollView:   { flex: 1 },
  scrollContent: { paddingTop: 16 },

  profileCard: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: C.cardBg,
    borderRadius: 24, borderWidth: 1, borderColor: C.borderGold, padding: 18,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  profileHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatarWrap:        { position: "relative", marginRight: 16, width: 80, height: 80, justifyContent: "center", alignItems: "center" },
  avatarRing: {
    position: "absolute", width: 86, height: 86, borderRadius: 43,
    borderWidth: 1.5, borderColor: "#F4C84248",
  },
  avatar:            { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: C.gold },
  avatarPlaceholder: { backgroundColor: C.nebula, justifyContent: "center", alignItems: "center" },
  cameraBtn: {
    position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.gold, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: C.void,
  },
  profileMeta:    { flex: 1 },
  nameRow:        { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 },
  profileName:    { fontSize: 20, fontWeight: "800", color: C.white, flex: 1 },
  premiumBadge: {
    backgroundColor: "rgba(244,200,66,0.15)", borderRadius: 10,
    padding: 4, borderWidth: 1, borderColor: C.borderGold,
  },
  profileBtn: {
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: "rgba(244,200,66,0.07)", alignSelf: "flex-start",
  },
  profileBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  upgradeBtn: {
    backgroundColor: C.gold, borderRadius: 16, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  upgradeBtnText: { color: C.cosmos, fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },

  tilesRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 14 },
  tile: {
    flex: 1, backgroundColor: C.cardBg, borderRadius: 18, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  tileLabel: { fontSize: 11, fontWeight: "700", color: C.dim, marginTop: 8, textAlign: "center", letterSpacing: 0.3 },
  notifBadge: {
    position: "absolute", top: -5, right: -5, backgroundColor: C.coral, borderRadius: 10,
    minWidth: 18, height: 18, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: C.void,
  },
  notifBadgeText: { color: C.white, fontSize: 10, fontWeight: "800", paddingHorizontal: 3 },

  discoverSection: { paddingHorizontal: 16 },
  discoverHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  sectionEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 3, color: "#FFFFFF", marginBottom: 4, opacity: 0.75 },
  sectionTitle:   { fontSize: 22, fontWeight: "800", color: C.white, marginBottom: 4 },
  sectionSub:     { fontSize: 13, color: C.dim, maxWidth: 220 },
  refreshBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.glass,
    borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center",
  },
  loadingContainer: { paddingVertical: 40, alignItems: "center", gap: 12 },

  matchCard: {
    backgroundColor: C.cosmos, borderRadius: 28, marginBottom: 20,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  imageWrapper:    { width: "100%", height: 360, position: "relative", backgroundColor: C.nebula },
  cardBgImage:     { width: "100%", height: "100%" },
  blurredImage:    { opacity: 0.6 },
  gradientOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  gradientTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 120,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  gradientBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
    backgroundColor: "rgba(7,1,26,0.78)",
  },
  placeholderImage: { width: "100%", height: "100%", backgroundColor: C.nebula, justifyContent: "center", alignItems: "center" },
  placeholderCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: C.glass,
    justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: C.faint,
  },
  placeholderInitial: { fontSize: 40, fontWeight: "700", color: C.white },

  lockOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(7,1,26,0.65)", justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  lockIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.glass,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
    borderWidth: 2, borderColor: C.faint,
  },
  lockText: { fontSize: 16, fontWeight: "700", color: C.white, letterSpacing: 0.5 },

  topBadgesContainer: { position: "absolute", top: 14, left: 14, zIndex: 5 },
  statsChip: {
    backgroundColor: "rgba(7,1,26,0.82)", borderRadius: 14, borderWidth: 1, borderColor: C.faint,
    paddingHorizontal: 10, paddingVertical: 8, gap: 4,
  },
  statRow:        { flexDirection: "row", alignItems: "center" },
  starsContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  halfStarContainer: { position: "relative", width: 13, height: 13 },
  halfStarClip:   { position: "absolute", left: 0, top: 0, width: "50%", height: "100%", overflow: "hidden" },

  userInfoOverlay: { position: "absolute", bottom: 18, left: 18, right: 18 },
  nameContainer:   { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  userName: {
    fontSize: 26, fontWeight: "800", color: C.white, letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  userLocation: {
    fontSize: 14, color: "rgba(255,255,255,0.78)",
    textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  actionsContainer: { padding: 14 },

  statusCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(76,175,80,0.1)", borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: "rgba(76,175,80,0.28)",
  },
  statusIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(76,175,80,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  statusTextContainer: { flex: 1 },
  statusTitle:         { fontSize: 16, fontWeight: "700", color: "#4CAF50", marginBottom: 2 },
  statusSubtitle:      { fontSize: 12, color: "rgba(76,175,80,0.75)" },

  unlockCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,107,107,0.28)",
  },
  unlockContent:      { flexDirection: "row", alignItems: "center", flex: 1 },
  unlockIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,107,107,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  unlockTextContainer: { flex: 1 },
  unlockTitle:         { fontSize: 16, fontWeight: "700", color: C.coral, marginBottom: 2 },
  unlockSubtitle:      { fontSize: 12, color: "rgba(255,107,107,0.7)" },
  unlockArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.coral, justifyContent: "center", alignItems: "center",
  },
  unlockArrowText: { fontSize: 16, color: C.white, fontWeight: "700" },

  pendingCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.glass, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  pendingIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.faint,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  pendingTextContainer: { flex: 1 },
  pendingTitle:    { fontSize: 16, fontWeight: "700", color: C.dim, marginBottom: 2 },
  pendingSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.3)" },

  connectCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FF6B6B", // ✅ FIX (garde le reste du style inchangé)
  },
  connectInner: {
    backgroundColor: "#FF6B6B", flexDirection: "row", alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 18, gap: 14,
  },
  connectIconCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  connectText:  { fontSize: 18, fontWeight: "800", color: C.white, flex: 1, letterSpacing: 0.3 },
  sparkleText:  { fontSize: 18 },

  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row",
    backgroundColor: "rgba(7,1,26,0.97)", paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.borderGold,
    shadowColor: C.gold, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14, shadowRadius: 8, elevation: 10,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4, gap: 4 },
  navDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold },
})