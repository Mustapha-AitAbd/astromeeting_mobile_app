import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from "react-native"
import { Bell, Settings, Search, Star, Grid, MessageCircle, User, Flame } from "lucide-react-native"

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    userId: 1,
    name: "Alice Moreau",
    lastMessage: "Hey! How are you doing?",
    timestamp: "10:30 AM",
    unreadCount: 3,
    isOnline: true,
    isTyping: false,
    avatar: "AM",
  },
  {
    id: 2,
    userId: 2,
    name: "Sarah Durand",
    lastMessage: "That sounds great! Let me know",
    timestamp: "9:15 AM",
    unreadCount: 0,
    isOnline: true,
    isTyping: true,
    avatar: "SD",
  },
  {
    id: 3,
    userId: 3,
    name: "Chloé Richard",
    lastMessage: "See you tomorrow!",
    timestamp: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    avatar: "CR",
  },
  {
    id: 4,
    userId: 4,
    name: "Léa Petit",
    lastMessage: "Thanks for the recommendation",
    timestamp: "Yesterday",
    unreadCount: 1,
    isOnline: true,
    isTyping: false,
    avatar: "LP",
  },
  {
    id: 5,
    userId: 5,
    name: "Camille Robert",
    lastMessage: "I loved that place!",
    timestamp: "2 days ago",
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    avatar: "CR",
  },
  {
    id: 6,
    userId: 6,
    name: "Laura Thomas",
    lastMessage: "What time works for you?",
    timestamp: "3 days ago",
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
    avatar: "LT",
  },
]

export default function MessagesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("messages")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)

  // Simulate typing indicator updates
  useEffect(() => {
    const interval = setInterval(() => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.userId === 2 && Math.random() > 0.5) {
            return { ...conv, isTyping: !conv.isTyping }
          }
          return conv
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleConversationPress = (conversation) => {
    navigation.navigate("Chat", {
      userId: conversation.userId,
      userName: conversation.name,
      userAvatar: conversation.avatar,
      isOnline: conversation.isOnline,
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

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Search Bar */}
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

      {/* Conversations List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.conversationsSection}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {filteredConversations.map(renderConversation)}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("home")
            navigation.navigate("Home")
          }}
        >
          <Flame size={28} color={activeTab === "home" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity  style={styles.navItem}  onPress={() => { setActiveTab("explore"); navigation.navigate("Profile"); }}>
            <Grid size={28} color={activeTab === "explore" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("star")}>
          <Star size={28} color={activeTab === "star" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("messages")}>
          <MessageCircle size={28} color={activeTab === "messages" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("profile")
            navigation.navigate("Profile")
          }}
        >
          <User size={28} color={activeTab === "profile" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  tinderLogo: {
    width: 100,
    height: 30,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  conversationsSection: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 16,
  },
  conversationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  conversationContent: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  timestamp: {
    fontSize: 12,
    color: "#999999",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#000000",
  },
  unreadBadge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
