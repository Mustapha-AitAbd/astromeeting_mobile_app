import { useState, useEffect, useContext, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Image } from "react-native"
import { Users, Settings, LogOut, MessageCircle, User, UserCheck, MapPin, Heart, Home } from "lucide-react-native"
import { useFocusEffect } from '@react-navigation/native'
import { AuthContext } from "../../context/AuthContext"
import axios from "axios"
import { Share2, Link, Globe } from "lucide-react-native";

export default function FriendsScreen({ navigation }) {
  const { token, logout } = useContext(AuthContext)
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("friends")
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    })
  }, [navigation])

  useFocusEffect(
    useCallback(() => {
      fetchFriends()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchFriends()
    setRefreshing(false)
  }

  const fetchFriends = async () => {
    try {
      setLoading(true)
      
      // ✅ ÉTAPE 1: Obtenir la liste des IDs des amis
      const friendsListResponse = await fetch(`${API_BASE_URL}/api/friendship/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!friendsListResponse.ok) {
        Alert.alert('Error', 'Failed to fetch friends list')
        setLoading(false)
        return
      }
      
      const friendsList = await friendsListResponse.json()
      console.log('✅ Friends list received:', friendsList.length, 'friends')
      
      if (friendsList.length === 0) {
        setFriends([])
        setLoading(false)
        return
      }

      // ✅ ÉTAPE 2: Pour chaque ami, récupérer son profil COMPLET (avec photos)
      // C'est la MÊME logique que UserProfileScreen!
      const friendsDetailsPromises = friendsList.map(async (friend) => {
        try {
          const userId = friend._id || friend.id
          
          // ✅ Utiliser la MÊME route que UserProfileScreen
          const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          console.log(`✅ Fetched full profile for ${response.data.firstName || 'User'}`)
          return response.data
        } catch (error) {
          console.error(`❌ Error fetching profile for friend ${friend._id}:`, error)
          // Si erreur, retourner les données partielles qu'on a
          return friend
        }
      })

      // ✅ Attendre que tous les profils soient récupérés
      const friendsWithFullData = await Promise.all(friendsDetailsPromises)
      
      // ✅ Trier par ordre alphabétique
      const sortedFriends = friendsWithFullData.sort((a, b) => {
        const nameA = a.firstName || a.name || ''
        const nameB = b.firstName || b.name || ''
        return nameA.localeCompare(nameB)
      })
      
      console.log('✅ All friends loaded with full data:', sortedFriends.length)
      setFriends(sortedFriends)
      
    } catch (error) {
      console.error('❌ Error in fetchFriends:', error)
      Alert.alert('Error', 'Failed to fetch friends')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setShowSettingsMenu(false)
            await logout()
            Alert.alert("Success", "Logout successful!")
          }
        }
      ]
    )
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // ✅ EXACTEMENT la même logique que UserProfileScreen
  const getInitials = (friend) => {
    if (!friend) return '?'
    const name = friend.firstName || friend.name || 'User'
    return name.charAt(0).toUpperCase()
  }

  // ✅ Obtenir la photo principale - même logique que UserProfileScreen
  const getUserMainPhoto = (friend) => {
    if (!friend.photos || !Array.isArray(friend.photos) || friend.photos.length === 0) {
      return null
    }

    // Chercher la photo principale
    const mainPhoto = friend.photos.find(photo => photo.isMain === true)
    
    if (mainPhoto && mainPhoto.url) {
      return mainPhoto.url
    }

    // Fallback: première photo
    if (friend.photos[0] && friend.photos[0].url) {
      return friend.photos[0].url
    }

    return null
  }

  const handleFriendClick = (friendId) => {
    navigation.navigate('UserProfile', { userId: friendId })
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header avec Logo et Settings */}
      <View style={styles.header}>
        <Image source={require("../../assets/logo-2.png")} style={styles.tinderLogo} resizeMode="contain" />
        <View style={styles.headerRight}>
          <View>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSettingsMenu(!showSettingsMenu)}
            >
              <Settings size={24} color="#666666" />
            </TouchableOpacity>
            
            {showSettingsMenu && (
              <View style={styles.settingsMenu}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <LogOut size={20} color="#FF6B6B" />
                  <Text style={styles.menuItemText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {showSettingsMenu && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSettingsMenu(false)}
        />
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
      >
        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyText}>Start connecting with people to build your network</Text>
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.discoverButtonText}>Discover People</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.friendsList}>
            <View style={styles.friendsHeader}>
              <View>
                <Text style={styles.sectionTitle}>My Friends</Text>
                <Text style={styles.friendsSubtitle}>
                  {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                </Text>
              </View>
            </View>
            
            {friends.map((friend) => {
              const age = calculateAge(friend.dateOfBirth)
              const userPhoto = getUserMainPhoto(friend)
              const initials = getInitials(friend)
              
              // ✅ EXACTEMENT comme UserProfileScreen
              const displayName = `${friend.firstName || friend.name || 'User'}${friend.lastName ? ' ' + friend.lastName : ''}`
              
              return (
                <TouchableOpacity
                  key={friend._id}
                  style={styles.friendCard}
                  onPress={() => handleFriendClick(friend._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.friendHeader}>
                    <View style={styles.avatarContainer}>
                      {userPhoto ? (
                        <Image 
                          source={{ uri: userPhoto }} 
                          style={styles.avatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {initials}
                          </Text>
                        </View>
                      )}
                      <View style={styles.verifiedBadge}>
                        <UserCheck size={14} color="#FFFFFF" />
                      </View>
                    </View>

                    <View style={styles.friendContent}>
                      <View style={styles.nameRow}>
                        <Text style={styles.friendName}>
                          {displayName}
                        </Text>
                        
                      </View>
                      
                      {(friend.city || friend.country) && (
                        <View style={styles.locationRow}>
                          <MapPin size={14} color="#999999" />
                          <Text style={styles.locationText}>
                           {friend.country || ''}
                          </Text>
                        </View>
                      )}

                      
                    </View>

                    <View style={styles.actionContainer}>
                      <View style={styles.statusIndicator}>
                        <Heart size={16} color="#FF6B6B" fill="#FF6B6B" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("home"); navigation.navigate("Home"); }}>
          <Home size={28} color={activeTab === "home" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("messages"); navigation.navigate("Messages"); }}>
          <Link size={28} color={activeTab === "messages" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("profile"); navigation.navigate("Profile"); }}>
          <User size={28} color={activeTab === "profile" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666666" },
  
  // Header styles
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 12, 
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    zIndex: 1000 
  },
  tinderLogo: { width: 100, height: 30 },
  headerRight: { flexDirection: "row", gap: 12, position: "relative" },
  iconButton: { 
    width: 40, 
    height: 40, 
    justifyContent: "center", 
    alignItems: "center", 
    position: "relative" 
  },
  settingsMenu: { 
    position: "absolute", 
    top: 45, 
    right: 0, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 5, 
    minWidth: 180, 
    zIndex: 1001 
  },
  menuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    gap: 12 
  },
  menuItemText: { fontSize: 16, color: "#333333", fontWeight: "500" },
  overlay: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    zIndex: 999 
  },
  
  scrollView: { flex: 1, marginBottom: 80 },
  
  // Empty state
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80, 
    paddingHorizontal: 40 
  },
  emptyTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#333333", 
    marginTop: 20, 
    marginBottom: 8 
  },
  emptyText: { 
    fontSize: 16, 
    color: "#999999", 
    textAlign: 'center',
    marginBottom: 24
  },
  discoverButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  discoverButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  
  // Friends list
  friendsList: { padding: 16 },
  friendsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333"
  },
  friendsSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4
  },
  
  // Friend card
  friendCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: "#F0F0F0", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2
  },
  
  friendHeader: { flexDirection: "row" },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28
  },
  avatarPlaceholder: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: "#FF6B6B", 
    justifyContent: "center", 
    alignItems: "center"
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  verifiedBadge: { 
    position: "absolute", 
    bottom: -2, 
    right: -2, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: "#4CAF50", 
    justifyContent: "center", 
    alignItems: "center", 
    borderWidth: 2, 
    borderColor: "#FFFFFF" 
  },
  
  friendContent: { flex: 1, justifyContent: "center" },
  nameRow: { 
    flexDirection: "row", 
    alignItems: "center",
    marginBottom: 4
  },
  friendName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333333"
  },
  friendAge: {
    fontSize: 16,
    color: "#666666"
  },
  
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6
  },
  locationText: {
    fontSize: 13,
    color: "#999999"
  },
  
  bioText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 18,
    marginTop: 4
  },
  
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  
  // Bottom navigation
 bottomNav: { position: "absolute", bottom: 8, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingBottom: 25, borderTopWidth: 1, borderTopColor: "#E0E0E0" },
  navItem: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center"
  }
})