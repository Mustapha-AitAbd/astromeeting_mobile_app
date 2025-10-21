"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { ArrowLeft, Send, MoreVertical } from "lucide-react-native"

const MOCK_MESSAGES = [
  {
    id: 1,
    text: "Hey! How are you doing?",
    sender: "other",
    timestamp: "10:25 AM",
  },
  {
    id: 2,
    text: "I'm doing great! Thanks for asking. How about you?",
    sender: "me",
    timestamp: "10:26 AM",
  },
  {
    id: 3,
    text: "Pretty good! I was thinking we could grab coffee sometime this week?",
    sender: "other",
    timestamp: "10:28 AM",
  },
  {
    id: 4,
    text: "That sounds perfect! How about Thursday afternoon?",
    sender: "me",
    timestamp: "10:29 AM",
  },
  {
    id: 5,
    text: "Thursday works great for me! Around 3 PM?",
    sender: "other",
    timestamp: "10:30 AM",
  },
]

export default function ChatScreen({ route, navigation }) {
  const { userId, userName, userAvatar, isOnline } = route.params
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollViewRef = useRef(null)

  // Simulate other user typing
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 2000)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        sender: "me",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      }
      setMessages([...messages, newMessage])
      setInputText("")

      // Simulate response after 2 seconds
      setTimeout(() => {
        const responseMessage = {
          id: messages.length + 2,
          text: "Thanks for your message! 😊",
          sender: "other",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        }
        setMessages((prev) => [...prev, responseMessage])
      }, 2000)
    }
  }

  const renderMessage = (message) => {
    const isMe = message.sender === "me"
    return (
      <View key={message.id} style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>{message.text}</Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>{message.timestamp}</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{userAvatar}</Text>
          </View>
          {isOnline && <View style={styles.headerOnlineIndicator} />}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>{isTyping ? "typing..." : isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
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

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999999"
          value={inputText}
          onChangeText={setInputText}
          multiline
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerOnlineIndicator: {
    position: "absolute",
    left: 30,
    top: 28,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  headerStatus: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessage: {
    alignItems: "flex-end",
  },
  otherMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: "#8B3A8B",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 4,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 11,
    color: "#666666",
  },
  myMessageTime: {
    color: "#FFFFFF",
    opacity: 0.8,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 25,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000000",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B3A8B",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
})
