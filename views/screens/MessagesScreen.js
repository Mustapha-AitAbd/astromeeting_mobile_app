import { useState, useEffect, useCallback, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, RefreshControl } from "react-native"
import { Bell, Settings, Search, Star, Grid, MessageCircle, User, Flame } from "lucide-react-native"
import { API_BASE_URL } from '@env'
import { useFocusEffect } from '@react-navigation/native'
import { AuthContext } from "../../context/AuthContext";

export default function MessagesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("messages")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Récupérer le user depuis AuthContext
  const { user, token } = useContext(AuthContext)
  const currentUserId = user?._id

  // Recharger quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        fetchConversations()
      }
    }, [currentUserId])
  )

  useEffect(() => {
    if (currentUserId) {
      fetchConversations()
    } else {
      console.error('❌ No user found in AuthContext')
      setLoading(false)
    }
  }, [currentUserId])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchConversations()
    setRefreshing(false)
  }

  const fetchConversations = async () => {
    try {
      const url = `${API_BASE_URL}/api/chat/conversation/${currentUserId}`
      console.log('🔍 Fetching conversations from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status)
        setLoading(false)
        setConversations([])
        return
      }

      const data = await response.json()
      console.log('📦 Conversations received:', data.length, 'conversations')

      if (!data || data.length === 0) {
        console.log('ℹ️ No conversations found')
        setConversations([])
        setLoading(false)
        return
      }

      // Transformer les conversations
      const formattedConversations = await Promise.all(
        data.map(async (conv) => {
          try {
            // Trouver l'autre participant
            const otherParticipantId = conv.participants.find(
              p => p.toString() !== currentUserId.toString()
            )
            
            console.log('👤 Other participant ID:', otherParticipantId)

            // Récupérer les infos de l'utilisateur
            let userData = null
            try {
              const userUrl = `${API_BASE_URL}/api/users/${otherParticipantId}`
              console.log('Fetching user from:', userUrl)
              
              const userResponse = await fetch(userUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              })
              
              console.log('User response status:', userResponse.status)
              
              if (userResponse.ok) {
                const text = await userResponse.text()
                console.log('User response text:', text.substring(0, 200))
                
                try {
                  userData = JSON.parse(text)
                  console.log('✅ User data parsed:', userData)
                } catch (parseError) {
                  console.error('❌ Failed to parse user data:', parseError)
                  console.log('Response was:', text.substring(0, 100))
                }
              } else {
                console.error('❌ User API returned error:', userResponse.status)
              }
            } catch (userError) {
              console.error('❌ Error fetching user:', userError)
            }

            // Le lastMessage est déjà populé par le backend
            let lastMessageText = 'No messages yet'
            let lastMessageTime = null

            if (conv.lastMessage) {
              lastMessageText = conv.lastMessage.text || 'Media message'
              lastMessageTime = conv.lastMessage.createdAt
            }

            // Utiliser les données utilisateur si disponibles, sinon valeurs par défaut
            const userName = userData?.firstName || userData?.name || `User ${otherParticipantId.substring(0, 6)}`
            const userOnline = userData?.isOnline || false

            return {
              id: conv._id,
              userId: otherParticipantId,
              name: userName,
              lastMessage: lastMessageText,
              timestamp: lastMessageTime ? formatTimestamp(lastMessageTime) : 'No messages',
              unreadCount: 0,
              isOnline: userOnline,
              isTyping: false,
              avatar: getInitials(userName),
            }

          } catch (err) {
            console.error('❌ Error formatting conversation:', err)
            return null
          }
        })
      )

      const validConversations = formattedConversations.filter(c => c !== null)
      console.log('✅ Valid conversations:', validConversations.length)
      
      setConversations(validConversations)
      setLoading(false)

    } catch (error) {
      console.error('❌ Error fetching conversations:', error)
      setLoading(false)
      setConversations([])
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConversationPress = (conversation) => {
    console.log('🔗 Opening conversation:', conversation.id)
    
    if (!conversation.id || !conversation.userId || !currentUserId) {
      console.error('❌ Missing required parameters for navigation!')
      alert('Error: Cannot open conversation. Missing data.')
      return
    }
    
    navigation.navigate("Chat", {
      conversationId: conversation.id,
      userId: conversation.userId,
      userName: conversation.name,
      userAvatar: conversation.avatar,
      isOnline: conversation.isOnline,
      currentUserId: currentUserId,
    })
  }

  const renderConversation = (conversation) => {
    return (
      <TouchableOpacity
        key={conversation.id}
        style={styles.conversationCard}
        onPress={() => handleConversationPress(conversation)}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{conversation.avatar}</Text>
          </View>
          {conversation.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{conversation.name}</Text>
            <Text style={styles.timestamp}>{conversation.timestamp}</Text>
          </View>

          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, conversation.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
              {conversation.isTyping ? "typing..." : conversation.lastMessage}
            </Text>
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    )
  }

  if (!currentUserId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Please login to see your messages</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo-2.png")} style={styles.tinderLogo} resizeMode="contain" />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color="#666666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#999999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
      >
        <View style={styles.conversationsSection}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {filteredConversations.length > 0 ? (
            filteredConversations.map(renderConversation)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start swiping to match with people!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("home"); navigation.navigate("Home"); }}>
          <Flame size={28} color={activeTab === "home" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("explore"); navigation.navigate("Profile"); }}>
          <Grid size={28} color={activeTab === "explore" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("star")}>
          <Star size={28} color={activeTab === "star" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("messages")}>
          <MessageCircle size={28} color={activeTab === "messages" ? "#FF6B6B" : "#CCCCCC"} />
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
  errorText: { fontSize: 16, color: "#999999", textAlign: 'center', padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "#FFFFFF" },
  tinderLogo: { width: 100, height: 30 },
  headerRight: { flexDirection: "row", gap: 12 },
  iconButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#000000" },
  scrollView: { flex: 1 },
  conversationsSection: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 24, fontWeight: "bold", color: "#000000", marginBottom: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 18, color: "#999999", textAlign: 'center', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#CCCCCC", textAlign: 'center' },
  conversationCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#F0F0F0" },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FF6B6B", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  onlineIndicator: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#4CAF50", borderWidth: 2, borderColor: "#FFFFFF" },
  conversationContent: { flex: 1, justifyContent: "center" },
  conversationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  conversationName: { fontSize: 16, fontWeight: "600", color: "#000000" },
  timestamp: { fontSize: 12, color: "#999999" },
  messageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMessage: { fontSize: 14, color: "#666666", flex: 1 },
  unreadMessage: { fontWeight: "600", color: "#000000" },
  unreadBadge: { backgroundColor: "#FF6B6B", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 6, marginLeft: 8 },
  unreadCount: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingBottom: 25, borderTopWidth: 1, borderTopColor: "#E0E0E0" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
})