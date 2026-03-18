import { useState, useEffect, useContext, useCallback, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Image } from "react-native"
import { UserPlus, CheckCircle, X, Users, Settings, LogOut, Flame, Bell, Search, MessageCircle, User, Home } from "lucide-react-native"
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { AuthContext } from "../../context/AuthContext"
import { 
  registerForPushNotificationsAsync, 
  sendLocalNotification,
  setBadgeCount 
} from "../../services/notificationService"
import { Share2, Link, Globe } from "lucide-react-native";

export default function NotificationsScreen({ navigation }) {
  const { token, logout } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingIds, setProcessingIds] = useState(new Set())
  const [activeTab, setActiveTab] = useState("notification")
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [readNotifications, setReadNotifications] = useState(new Set())
  const [expoPushToken, setExpoPushToken] = useState('')
  
  const notificationListener = useRef()
  const responseListener = useRef()

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

  // Configuration des notifications
  useEffect(() => {
    // Enregistrer pour les notifications push
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token)
      // Envoyer le token au backend
      if (token) {
        savePushTokenToBackend(token)
      }
    })

    // Listener pour les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification reçue:', notification)
      // Rafraîchir la liste des notifications
      fetchNotifications()
    })

    // Listener pour les interactions avec les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification cliquée:', response)
      const data = response.notification.request.content.data
      
      // Naviguer vers le profil si userId est présent
      if (data.userId) {
        navigation.navigate('UserProfile', { userId: data.userId })
      } else if (data.friendshipId) {
        navigation.navigate('Notifications')
      }
    })

          // Par ceci :
      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove()
        }
        if (responseListener.current) {
          responseListener.current.remove()
        }
      }
  }, [])

  // Masquer le header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    })
  }, [navigation])

  // Mettre à jour le badge quand les notifications changent
  useEffect(() => {
    const unreadCount = notifications.filter(n => !readNotifications.has(n._id)).length
    setBadgeCount(unreadCount)
  }, [notifications, readNotifications])

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
      loadReadNotifications()
    }, [])
  )

  // Sauvegarder le push token dans le backend
  const savePushTokenToBackend = async (pushToken) => {
    try {
      await fetch(`${API_BASE_URL}/api/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pushToken })
      })
      console.log('✅ Push token saved to backend')
    } catch (error) {
      console.error('Error saving push token:', error)
    }
  }

  const loadReadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('readNotifications')
      if (stored) {
        setReadNotifications(new Set(JSON.parse(stored)))
      }
    } catch (error) {
      console.error('Error loading read notifications:', error)
    }
  }

  const saveReadNotifications = async (notificationIds) => {
    try {
      await AsyncStorage.setItem('readNotifications', JSON.stringify(Array.from(notificationIds)))
    } catch (error) {
      console.error('Error saving read notifications:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/friendship/requests/received`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        // Vérifier s'il y a de nouvelles notifications
        const previousCount = notifications.length
        const newCount = sortedData.length
        
        if (newCount > previousCount && previousCount > 0) {
          const newNotifications = sortedData.slice(0, newCount - previousCount)
          
          // Envoyer une notification locale pour chaque nouvelle demande
          newNotifications.forEach(notif => {
            sendLocalNotification(
              '🔔 New Friend Request',
              `${notif.requester.name} sent you a friend request`,
              {
                userId: notif.requester._id,
                friendshipId: notif._id,
                type: 'friend_request'
              }
            )
          })
        }
        
        setNotifications(sortedData)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notificationId) => {
    const updatedReadNotifications = new Set(readNotifications).add(notificationId)
    setReadNotifications(updatedReadNotifications)
    saveReadNotifications(updatedReadNotifications)
    
    const notification = notifications.find(n => n._id === notificationId)
    if (notification) {
      navigation.navigate('UserProfile', { userId: notification.requester._id })
    }
  }

  const handleAccept = async (friendshipId, requesterName, event) => {
    event.stopPropagation()
    setProcessingIds(prev => new Set(prev).add(friendshipId))
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friendship/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId })
      })

      if (response.ok) {
        // Notification locale de succès
        await sendLocalNotification(
          '✅ Friend Request Accepted',
          `You are now friends with ${requesterName}!`,
          { type: 'friend_accepted' }
        )
        
        Alert.alert('Success', `You are now friends with ${requesterName}!`)
        
        const updatedReadNotifications = new Set(readNotifications).add(friendshipId)
        setReadNotifications(updatedReadNotifications)
        saveReadNotifications(updatedReadNotifications)
        
        setNotifications(prev => prev.map(notif => 
          notif._id === friendshipId 
            ? { ...notif, status: 'accepted' }
            : notif
        ))
      } else {
        const data = await response.json()
        Alert.alert('Error', data.message || 'Failed to accept request')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      Alert.alert('Error', 'Failed to accept request')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(friendshipId)
        return newSet
      })
    }
  }

  const handleDecline = async (friendshipId, event) => {
    event.stopPropagation()
    
    Alert.alert(
      'Decline Friend Request',
      'Are you sure you want to decline this friend request?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set(prev).add(friendshipId))
            
            try {
              const response = await fetch(`${API_BASE_URL}/api/friendship/decline`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friendshipId })
              })

              if (response.ok) {
                Alert.alert('Success', 'Friend request declined')
                
                const updatedReadNotifications = new Set(readNotifications).add(friendshipId)
                setReadNotifications(updatedReadNotifications)
                saveReadNotifications(updatedReadNotifications)
                
                setNotifications(prev => prev.map(notif => 
                  notif._id === friendshipId 
                    ? { ...notif, status: 'declined' }
                    : notif
                ))
              } else {
                const data = await response.json()
                Alert.alert('Error', data.message || 'Failed to decline request')
              }
            } catch (error) {
              console.error('Error declining request:', error)
              Alert.alert('Error', 'Failed to decline request')
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(friendshipId)
                return newSet
              })
            }
          }
        }
      ]
    )
  }

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation()
    
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n._id !== notificationId))
            
            const updatedReadNotifications = new Set(readNotifications)
            updatedReadNotifications.delete(notificationId)
            setReadNotifications(updatedReadNotifications)
            saveReadNotifications(updatedReadNotifications)
          }
        }
      ]
    )
  }

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n._id)
    const updatedReadNotifications = new Set([...readNotifications, ...allIds])
    setReadNotifications(updatedReadNotifications)
    saveReadNotifications(updatedReadNotifications)
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const unreadCount = notifications.filter(n => !readNotifications.has(n._id)).length

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
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
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>Friend requests will appear here</Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            <View style={styles.notificationsHeader}>
              <View>
                <Text style={styles.sectionTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={styles.unreadSubtitle}>{unreadCount} unread</Text>
                )}
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity 
                  style={styles.markAllButton}
                  onPress={markAllAsRead}
                >
                  <CheckCircle size={18} color="#8B3A8B" />
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {notifications.map((notification) => {
              const isProcessing = processingIds.has(notification._id)
              const isRead = readNotifications.has(notification._id)
              const status = notification.status
              
              return (
                <TouchableOpacity
                  key={notification._id}
                  style={[
                    styles.notificationCard,
                    !isRead && styles.unreadNotificationCard
                  ]}
                  onPress={() => handleNotificationClick(notification._id)}
                  activeOpacity={0.7}
                >
                  {!isRead && (
                    <View style={styles.newIndicator}>
                      <View style={styles.newDot} />
                    </View>
                  )}

                  <View style={styles.notificationHeader}>
                    <View style={styles.avatarContainer}>
                      <View style={[
                        styles.avatar,
                        !isRead && styles.unreadAvatar
                      ]}>
                        <Text style={styles.avatarText}>
                          {getInitials(notification.requester.name)}
                        </Text>
                      </View>
                      <View style={[
                        styles.iconBadge,
                        !isRead && styles.unreadIconBadge
                      ]}>
                        <UserPlus size={14} color="#FFFFFF" />
                      </View>
                    </View>

                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationTitle,
                        !isRead && styles.unreadNotificationTitle
                      ]}>
                        <Text style={styles.boldText}>{notification.requester.name}</Text>
                        {' '}sent you a friend request
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimestamp(notification.createdAt)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => handleDeleteNotification(notification._id, e)}
                    >
                      <X size={18} color="#999999" />
                    </TouchableOpacity>
                  </View>

                  {isProcessing ? (
                    <View style={styles.loadingButtons}>
                      <ActivityIndicator color="#8B3A8B" />
                    </View>
                  ) : status === 'accepted' ? (
                    <View style={styles.statusBadge}>
                      <CheckCircle size={16} color="#4CAF50" />
                      <Text style={styles.statusText}>Request Accepted</Text>
                    </View>
                  ) : status === 'declined' ? (
                    <View style={[styles.statusBadge, styles.declinedBadge]}>
                      <X size={16} color="#FF6B6B" />
                      <Text style={[styles.statusText, styles.declinedText]}>Request Declined</Text>
                    </View>
                  ) : (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={(e) => handleAccept(notification._id, notification.requester.name, e)}
                      >
                        <CheckCircle size={18} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={(e) => handleDecline(notification._id, e)}
                      >
                        <X size={18} color="#FFFFFF" />
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  
  // Page header
  notificationsHeader: {
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
  unreadSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  markAllText: {
    fontSize: 13,
    color: "#8B3A8B",
    fontWeight: "600"
  },
  
  scrollView: { flex: 1, marginBottom: 80 },
  
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
    textAlign: 'center' 
  },
  
  notificationsList: { padding: 16 },
  
  // Notification card styles
  notificationCard: { 
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
    elevation: 2,
    position: "relative"
  },
  unreadNotificationCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE0E0",
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  
  // New indicator
  newIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10
  },
  newDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B6B"
  },
  
  notificationHeader: { flexDirection: "row", marginBottom: 16 },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: "#FF6B6B", 
    justifyContent: "center", 
    alignItems: "center",
    opacity: 0.7
  },
  unreadAvatar: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#FF6B6B"
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  iconBadge: { 
    position: "absolute", 
    bottom: -2, 
    right: -2, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: "#8B3A8B", 
    justifyContent: "center", 
    alignItems: "center", 
    borderWidth: 2, 
    borderColor: "#FFFFFF" 
  },
  unreadIconBadge: {
    backgroundColor: "#FF6B6B"
  },
  
  notificationContent: { flex: 1, justifyContent: "center" },
  notificationTitle: { 
    fontSize: 15, 
    color: "#666666", 
    lineHeight: 20, 
    marginBottom: 4 
  },
  unreadNotificationTitle: {
    color: "#333333",
    fontWeight: "500"
  },
  boldText: { fontWeight: "bold", color: "#000000" },
  notificationTime: { fontSize: 13, color: "#999999" },
  
  deleteButton: {
    padding: 4,
    marginLeft: 8
  },
  
  actionButtons: { flexDirection: "row", gap: 10 },
  loadingButtons: { paddingVertical: 12, alignItems: "center" },
  acceptButton: { 
    flex: 1, 
    flexDirection: "row", 
    backgroundColor: "#4CAF50", 
    borderRadius: 25, 
    paddingVertical: 12, 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6 
  },
  acceptButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  declineButton: { 
    flex: 1, 
    flexDirection: "row", 
    backgroundColor: "#FF6B6B", 
    borderRadius: 25, 
    paddingVertical: 12, 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6 
  },
  declineButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  
  // Status badges
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  declinedBadge: {
    backgroundColor: "#FFEBEE"
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50"
  },
  declinedText: {
    color: "#FF6B6B"
  },
  
  // Bottom navigation
  bottomNav: { position: "absolute", bottom: 8, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingBottom: 25, borderTopWidth: 1, borderTopColor: "#E0E0E0" },
  navItem: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    position: "relative"
  },
  notificationBadge: { 
    position: "absolute", 
    top: -5, 
    right: "30%",
    backgroundColor: "#FF6B6B", 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 6
  },
  notificationBadgeText: { 
    color: "#FFFFFF", 
    fontSize: 12, 
    fontWeight: "bold" 
  }
})