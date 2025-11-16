import { useState, useEffect, useRef, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native"
import { ArrowLeft, Send, MoreVertical } from "lucide-react-native"
import io from 'socket.io-client'
import { API_BASE_URL } from '@env'
import { AuthContext } from "../../context/AuthContext";

export default function ChatScreen({ route, navigation }) {
  const { user, token } = useContext(AuthContext)
  const currentUserId = user?._id

  if (!route || !route.params) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: Missing navigation parameters</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const { conversationId, userId, userName, userAvatar } = route.params
  
  if (!conversationId || !userId || !currentUserId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: Missing conversation data</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [isOnline, setIsOnline] = useState(false) // ✅ Track other user's online status
  const scrollViewRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    console.log('=== ChatScreen Initialized ===')
    console.log('API_BASE_URL:', API_BASE_URL)
    console.log('Conversation ID:', conversationId)
    console.log('Current User ID:', currentUserId)
    console.log('Other User ID:', userId)

    fetchMessages()
    initializeSocket()

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...')
        socketRef.current.disconnect()
      }
    }
  }, [])

  const initializeSocket = () => {
    try {
      console.log('🔌 Initializing Socket.IO connection to:', API_BASE_URL)
      
      const socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('✅ Socket connected! ID:', socket.id)
        setConnected(true)
        
        // ✅ Announce that we're online
        socket.emit('userOnline', currentUserId)
        
        // ✅ Join the conversation room
        socket.emit('joinConversation', conversationId)
        console.log('📍 Joined conversation room:', conversationId)
        
        // ✅ Check if other user is online
        socket.emit('checkUserStatus', userId, (response) => {
          console.log('👤 User status:', response)
          setIsOnline(response.isOnline)
        })
        
        // ✅ Mark messages as delivered when we join
        socket.emit('markConversationDelivered', {
          conversationId: conversationId,
          userId: currentUserId
        })
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message)
        setConnected(false)
      })

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        setConnected(false)
      })

      // ✅ Listen for user status changes
      socket.on('userStatusChanged', ({ userId: changedUserId, isOnline: online }) => {
        if (changedUserId.toString() === userId.toString()) {
          console.log('👤 Other user status changed:', online ? 'online' : 'offline')
          setIsOnline(online)
        }
      })

      socket.on('newMessage', (message) => {
        console.log('📩 NEW MESSAGE received via socket:', message)
        
        if (message.conversationId !== conversationId) {
          console.log('⚠️ Message for different conversation, ignoring')
          return
        }

        // NE PAS ajouter le message si c'est nous qui l'avons envoyé
        const messageSenderId = message.sender?._id || message.sender
        if (messageSenderId.toString() === currentUserId.toString()) {
          console.log('⚠️ Ignoring own message from socket to prevent duplication')
          return
        }

        const formattedMsg = formatMessage(message)
        
        setMessages((prevMessages) => {
          const exists = prevMessages.some(m => m.id === message._id)
          if (exists) {
            return prevMessages.map(m => 
              m.id === message._id ? formattedMsg : m
            )
          }
          return [...prevMessages, formattedMsg]
        })
        
        // ✅ Auto-scroll to new message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      })

      socket.on('messageUpdated', (updatedMessage) => {
        console.log('📝 Message status updated:', updatedMessage)
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === updatedMessage._id 
              ? { ...msg, status: updatedMessage.status } 
              : msg
          )
        )
      })

      // ✅ Handle conversation delivered event
      socket.on('conversationDelivered', ({ conversationId: convId }) => {
        if (convId === conversationId) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.sender === "me" && msg.status === "sent"
                ? { ...msg, status: "delivered" }
                : msg
            )
          )
        }
      })

    } catch (error) {
      console.error('❌ Error initializing socket:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const url = `${API_BASE_URL}/api/chat/message/${conversationId}`
      console.log('📥 Fetching messages from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (!response.ok) {
        console.error('❌ Failed to fetch messages:', response.status)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('📦 Messages received:', data.length, 'messages')
      
      const formattedMessages = data.map(formatMessage)
      setMessages(formattedMessages)
      setLoading(false)

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)

    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      setLoading(false)
    }
  }

  const formatMessage = (message) => {
    const senderId = message.sender?._id || message.sender
    const isMe = senderId.toString() === currentUserId.toString()
    
    return {
      id: message._id,
      text: message.text || '',
      sender: isMe ? "me" : "other",
      timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      status: message.status || "sent",
      rawSender: senderId,
    }
  }

  const handleSend = async () => {
    const text = inputText.trim()
    
    if (!text) return

    const tempId = `temp_${Date.now()}`
    console.log('📤 SENDING message:', text)

    const tempMessage = {
      id: tempId,
      text: text,
      sender: "me",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      status: "sending",
    }

    setMessages((prev) => [...prev, tempMessage])
    setInputText("")

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      const messageData = {
        conversationId: conversationId,
        senderId: currentUserId,
        receiverId: userId,
        text: text,
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const savedMessage = await response.json()
      console.log('✅ Message saved:', savedMessage)

      // Remplacer le message temporaire par le message sauvegardé
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? formatMessage(savedMessage) : msg
        )
      )

      // Émettre le message via socket pour que l'autre utilisateur le reçoive
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('sendMessage', savedMessage)
      }

    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "error" } : msg
        )
      )
    }
  }

  const markMessageAsRead = async (messageId) => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('messageRead', {
          messageId: messageId,
          conversationId: conversationId,
        })
      }

      await fetch(`${API_BASE_URL}/api/chat/message/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: messageId,
          status: 'read',
        }),
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  useEffect(() => {
    if (messages.length === 0) return

    const unreadMessages = messages.filter(
      msg => msg.sender === "other" && msg.status !== "read"
    )

    unreadMessages.forEach((message) => {
      markMessageAsRead(message.id)
    })
  }, [messages])

  const renderMessageStatus = (status) => {
    switch (status) {
      case "sending":
        return <Text style={styles.messageStatus}>⏱</Text>
      case "sent":
        return <Text style={styles.messageStatus}>✓</Text>
      case "delivered":
        return <Text style={styles.messageStatus}>✓✓</Text>
      case "read":
        return <Text style={[styles.messageStatus, styles.readStatus]}>✓✓</Text>
      case "error":
        return <Text style={[styles.messageStatus, styles.errorStatus]}>⚠</Text>
      default:
        return null
    }
  }

  const renderMessage = (message) => {
    const isMe = message.sender === "me"
    
    return (
      <View key={message.id} style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {message.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {message.timestamp}
            </Text>
            {isMe && renderMessageStatus(message.status)}
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8B3A8B" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{userAvatar}</Text>
            {isOnline && <View style={styles.headerOnlineIndicator} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>
              {!connected 
                ? "Connecting..." 
                : isTyping 
                  ? "typing..." 
                  : isOnline 
                    ? "Online" 
                    : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length > 0 ? (
          messages.map(renderMessage)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        )}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.otherMessage]}>
            <View style={[styles.messageBubble, styles.otherMessageBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? "#FFFFFF" : "#CCCCCC"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666666" },
  errorText: { fontSize: 16, color: "#FF0000", textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  button: { backgroundColor: "#8B3A8B", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FF6B6B", justifyContent: "center", alignItems: "center", marginRight: 12, position: 'relative' },
  headerAvatarText: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  headerOnlineIndicator: { position: "absolute", right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#4CAF50", borderWidth: 2, borderColor: "#FFFFFF" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "600", color: "#000000" },
  headerStatus: { fontSize: 12, color: "#666666", fontStyle: "italic" },
  moreButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: "#999999", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#CCCCCC" },
  messageContainer: { marginBottom: 12 },
  myMessage: { alignItems: "flex-end" },
  otherMessage: { alignItems: "flex-start" },
  messageBubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  myMessageBubble: { backgroundColor: "#8B3A8B", borderBottomRightRadius: 4 },
  otherMessageBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, color: "#000000", marginBottom: 4 },
  myMessageText: { color: "#FFFFFF" },
  messageFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  messageTime: { fontSize: 11, color: "#666666" },
  myMessageTime: { color: "#FFFFFF", opacity: 0.8 },
  messageStatus: { fontSize: 11, color: "#FFFFFF", opacity: 0.8 },
  readStatus: { color: "#4CAF50", opacity: 1 },
  errorStatus: { color: "#FF6B6B", opacity: 1 },
  typingIndicator: { flexDirection: "row", gap: 4, paddingVertical: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#999999" },
  inputContainer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 25, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E0E0E0", gap: 12 },
  input: { flex: 1, backgroundColor: "#F5F5F5", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: "#000000", maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#8B3A8B", justifyContent: "center", alignItems: "center" },
  sendButtonDisabled: { backgroundColor: "#E0E0E0" },
})