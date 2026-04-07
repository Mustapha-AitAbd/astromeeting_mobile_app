import { useState, useCallback, useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native"
import { Search, User, Home, Users, ChevronRight, MessageCircle } from "lucide-react-native"
import { Link } from "lucide-react-native"
import { useFocusEffect } from "@react-navigation/native"
import { AuthContext } from "../../context/AuthContext"
import axios from "axios"

// ✅ FIX: Import useSafeAreaInsets to read real OS insets at runtime
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function MessagesScreen({ navigation }) {
  const [activeTab, setActiveTab]     = useState("messages")
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  const { user, token } = useContext(AuthContext)
  const currentUserId   = user?._id
  const API_BASE_URL    = process.env.EXPO_PUBLIC_API_URL

  // ✅ FIX: Read real safe area insets from the OS
  //
  // insets.top    → status bar / notch / Dynamic Island height
  // insets.bottom → home indicator / 3-button nav / gesture bar height
  //
  // These values are provided by the native layer and are always accurate,
  // unlike hardcoded Platform checks which cannot know the device config.
  const insets = useSafeAreaInsets()

  // ✅ FIX: Derive nav bar height once, used in both the nav bar style
  // and the scroll content padding so nothing is ever hidden.
  //
  // Math.max(..., 16) guarantees a comfortable minimum tap zone on
  // devices that report insets.bottom = 0 (e.g. older Android gesture nav).
  const bottomInset    = Math.max(insets.bottom, 16)
  const NAV_BAR_HEIGHT = 56 + bottomInset  // 56 = icon row height (paddingTop 12 + icon 28 + paddingBottom ~16)

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) fetchFriends()
    }, [currentUserId])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchFriends()
    setRefreshing(false)
  }

  const fetchFriends = async () => {
    try {
      const listRes = await fetch(`${API_BASE_URL}/api/friendship/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!listRes.ok) { setFriends([]); setLoading(false); return }

      const friendsList = await listRes.json()
      if (!friendsList.length) { setFriends([]); setLoading(false); return }

      // Hydrate with full profile
      const hydrated = await Promise.all(
        friendsList.map(async (friend) => {
          const uid = friend._id || friend.id
          try {
            const profileRes = await axios.get(`${API_BASE_URL}/api/users/${uid}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            return { ...profileRes.data, _id: uid }
          } catch {
            return { ...friend, _id: uid }
          }
        })
      )
      setFriends(hydrated)
    } catch (err) {
      console.error("fetchFriends error:", err)
      setFriends([])
    } finally {
      setLoading(false)
    }
  }

  const getMainPhoto = (userData) => {
    if (!userData?.photos?.length) return null
    return userData.photos.find((p) => p.isMain)?.url || userData.photos[0]?.url || null
  }

  const getDisplayName = (friend) => {
    const first = friend.firstName?.trim() || ""
    const last  = friend.lastName?.trim()  || ""
    return (first + (last ? " " + last : "")).trim() || friend.name || "User"
  }

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  const handleFriendPress = (friend) => {
    navigation.navigate("Chat", {
      userId:    friend._id,
      userName:  getDisplayName(friend),
      userPhoto: getMainPhoto(friend),
    })
  }

  const filteredFriends = friends.filter((f) => {
    const name = getDisplayName(f).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading friends…</Text>
      </View>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/*
        ✅ FIX: Header uses dynamic paddingTop from real OS insets.
        - iOS:     insets.top covers notch / Dynamic Island / status bar
        - Android: insets.top covers the status bar (varies 24–48 dp per OEM)
        Math.max guarantees a safe minimum on devices that report 0 unexpectedly.
      */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === "ios" ? 54 : 28) }]}>
        <View>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>
            {friends.length} connection{friends.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Users size={18} color="#FF6B6B" />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={16} color="#AAA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends…"
            placeholderTextColor="#AAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/*
        ✅ FIX: ScrollView bottom padding = full nav bar height so the last
        friend row is never hidden behind the floating bottom nav bar.

        Two props work together:
          • contentContainerStyle paddingBottom → Android + iOS layout space
          • contentInset bottom                → iOS: shifts visible area up
          • scrollIndicatorInsets bottom       → iOS: keeps scroll indicator visible
      */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: NAV_BAR_HEIGHT + 16 }]}
        contentInset={{ bottom: NAV_BAR_HEIGHT }}
        scrollIndicatorInsets={{ bottom: NAV_BAR_HEIGHT }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B6B"]}
          />
        }
      >
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => {
            const name  = getDisplayName(friend)
            const photo = getMainPhoto(friend)

            return (
              <TouchableOpacity
                key={friend._id}
                style={styles.friendRow}
                onPress={() => handleFriendPress(friend)}
                activeOpacity={0.72}
              >
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
                    </View>
                  )}
                  {friend.isOnline && <View style={styles.onlineDot} />}
                </View>

                {/* Info */}
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{name}</Text>
                  <Text style={styles.friendSub}>
                    {friend.city
                      ? `${friend.city}${friend.country ? ", " + friend.country : ""}`
                      : "Tap to view profile"}
                  </Text>
                </View>

                {/* Chevron */}
                <ChevronRight size={18} color="#CCC" />
              </TouchableOpacity>
            )
          })
        ) : (
          <View style={styles.emptyState}>
            <Users size={56} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptySub}>
              Discover people on the Home screen and send connection requests.
            </Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.discoverBtnText}>Discover People</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/*
        ✅ FIX: Bottom nav uses dynamic paddingBottom from real OS insets.

        Device config            insets.bottom   Result
        ──────────────────────────────────────────────────────────────
        Android 3-button nav  →  ≈ 48–56 dp   →  bar floats above buttons ✓
        Android 2-button nav  →  ≈ 32 dp      →  correct clearance ✓
        Android full gesture  →  ≈ 0–16 dp    →  Math.max(...,16) kicks in ✓
        iOS with home bar     →  34 dp        →  always correct ✓
        iOS without home bar  →  0            →  Math.max(0,16) = 16 dp ✓

        ❌ Old code: paddingBottom: 28  (hardcoded — wrong on most Android)
        ✅ New code: paddingBottom: bottomInset  (real value from the OS)
      */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setActiveTab("home"); navigation.navigate("Home") }}
        >
          <Home size={26} color={activeTab === "home" ? "#FF6B6B" : "#CCC"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setActiveTab("messages"); navigation.navigate("Messages") }}
        >
          <Link size={26} color={activeTab === "messages" ? "#FF6B6B" : "#CCC"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setActiveTab("profile"); navigation.navigate("Profile") }}
        >
          <User size={26} color={activeTab === "profile" ? "#FF6B6B" : "#CCC"} />
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FA" },
  center:    { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#888" },

  // ─── Header ───────────────────────────────────────────────
  // ✅ paddingTop applied dynamically in JSX via insets.top — removed here
  // to prevent double-padding across different device configurations.
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle:    { fontSize: 26, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#999", marginTop: 2 },
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F3E5F5",
    justifyContent: "center", alignItems: "center",
  },

  // ─── Search ───────────────────────────────────────────────
  searchWrapper: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111" },

  // ─── Scroll ───────────────────────────────────────────────
  // ✅ paddingBottom is now applied dynamically in JSX — removed static
  // value here to avoid conflicts. NAV_BAR_HEIGHT + 16 is set inline.
  scroll:        { flex: 1 },
  scrollContent: { paddingVertical: 8 },

  // ─── Friend row ───────────────────────────────────────────
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // ─── Avatar ───────────────────────────────────────────────
  avatarWrap: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: "#FF6B6B",
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2, borderColor: "#FFF",
  },

  // ─── Info ─────────────────────────────────────────────────
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  friendSub:  { fontSize: 13, color: "#999", marginTop: 2 },

  // ─── Empty state ──────────────────────────────────────────
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#BDBDBD", marginTop: 16, marginBottom: 8 },
  emptySub:   { fontSize: 14, color: "#CCC", textAlign: "center", lineHeight: 20, marginBottom: 28 },
  discoverBtn: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 28,
  },
  discoverBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  // ─── Bottom nav ───────────────────────────────────────────
  // ✅ paddingBottom applied dynamically in JSX via insets.bottom.
  // Static value removed to prevent clipping on Android nav configurations:
  //   ❌ was: paddingBottom: 28  (hardcoded — too small for 3-button nav,
  //                               too large for gesture-only devices)
  //   ✅ now: paddingBottom set inline as Math.max(insets.bottom, 16)
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingTop: 12,
    // paddingBottom → set inline in JSX
    borderTopWidth: 1, borderTopColor: "#EEE",
    // Shadow ensures visual separation from scroll content on all themes
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
})