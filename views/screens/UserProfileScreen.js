import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from "react-native"
import { ArrowLeft, UserPlus, MessageCircle, MapPin, Heart, X, CheckCircle, Phone, Calendar, Shield, Verified } from "lucide-react-native"
import { AuthContext } from "../../context/AuthContext"
import { LinearGradient } from 'expo-linear-gradient'
import axios from "axios"

const { width, height } = Dimensions.get("window")

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params
  const { token, user: currentUser } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friendshipStatus, setFriendshipStatus] = useState(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      checkFriendshipStatus()
    }
  }, [userId])

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    })
  }, [navigation])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('✅ User profile loaded:', response.data)
      setProfile(response.data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      Alert.alert('Error', 'Unable to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const checkFriendshipStatus = async () => {
    try {
      const [friendsRes, sentRes, receivedRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/requests/sent`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/requests/received`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const friends = await friendsRes.json()
      const sent = await sentRes.json()
      const received = await receivedRes.json()

      if (friends.some(f => f._id === userId)) {
        setFriendshipStatus('friends')
      } else if (sent.some(r => r.recipient._id === userId)) {
        setFriendshipStatus('pending')
      } else if (received.some(r => r.requester._id === userId)) {
        setFriendshipStatus('received')
      } else {
        setFriendshipStatus('none')
      }
    } catch (error) {
      console.error('Error checking friendship status:', error)
    }
  }

  const handleSendInvitation = async () => {
    setSendingRequest(true)
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: userId })
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'Friend request sent successfully!')
        setFriendshipStatus('pending')
      } else {
        Alert.alert('Error', data.message || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      Alert.alert('Error', 'Failed to send invitation')
    } finally {
      setSendingRequest(false)
    }
  }

  const handleAcceptRequest = async () => {
    try {
      const receivedRes = await fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/requests/received`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const received = await receivedRes.json()
      const request = received.find(r => r.requester._id === userId)

      if (!request) {
        Alert.alert('Error', 'Request not found')
        return
      }

      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId: request._id })
      })

      if (response.ok) {
        Alert.alert('Success', 'Friend request accepted!')
        setFriendshipStatus('friends')
        await createConversation()
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      Alert.alert('Error', 'Failed to accept request')
    }
  }

  const handleDeclineRequest = async () => {
    try {
      const receivedRes = await fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/requests/received`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const received = await receivedRes.json()
      const request = received.find(r => r.requester._id === userId)

      if (!request) return

      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/friendship/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId: request._id })
      })

      if (response.ok) {
        Alert.alert('Success', 'Friend request declined')
        setFriendshipStatus('none')
      }
    } catch (error) {
      console.error('Error declining request:', error)
    }
  }

  const createConversation = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: currentUser._id,
          receiverId: userId
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        return conversation._id
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleMessage = async () => {
    if (friendshipStatus !== 'friends') {
      Alert.alert('Error', 'You must be friends to send messages')
      return
    }

    try {
      const conversationId = await createConversation()
      if (conversationId) {
        navigation.navigate('Chat', {
          conversationId,
          userId,
          userName: profile.firstName || profile.name,
          userAvatar: getInitials(),
          currentUserId: currentUser._id
        })
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation')
    }
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

  const getInitials = () => {
    if (!profile) return '?'
    const name = profile.firstName || profile.name || 'User'
    return name.charAt(0).toUpperCase()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8B3A8B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const age = calculateAge(profile.dateOfBirth)

  return (
    <View style={styles.container}>
      {/* Header Flottant */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Carousel de Photos avec Gradient Overlay */}
        {profile.photos && profile.photos.length > 0 ? (
          <View style={styles.photosSection}>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width)
                setActivePhotoIndex(index)
              }}
            >
              {profile.photos.map((photo, index) => (
                <View key={photo._id || index} style={styles.photoContainer}>
                  <Image 
                    source={{ uri: photo.url }}
                    style={styles.photoCarousel}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.photoGradient}
                  />
                </View>
              ))}
            </ScrollView>
            
            {/* Indicateurs modernisés */}
            <View style={styles.photoIndicators}>
              {profile.photos.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === activePhotoIndex && styles.photoIndicatorActive
                  ]}
                />
              ))}
            </View>

            {/* Badge de vérification */}
            {profile.phoneVerified && (
              <View style={styles.verifiedBadge}>
                <Shield size={16} color="#FFFFFF" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noPhotoSection}>
            <LinearGradient
              colors={['#8B3A8B', '#6B2A6B']}
              style={styles.profileImageLarge}
            >
              <Text style={styles.profileImageTextLarge}>{getInitials()}</Text>
            </LinearGradient>
          </View>
        )}

        {/* En-tête Profil Moderne */}
        <View style={styles.profileHeader}>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.profileNameLarge}>
                {profile.firstName || profile.name || 'User'} {profile.lastName || ''}
              </Text>
              {age && <Text style={styles.ageText}>{age}</Text>}
            </View>
            
            {friendshipStatus === 'friends' && (
              <View style={styles.friendBadgeCompact}>
                <CheckCircle size={16} color="#4CAF50" />
                <Text style={styles.friendBadgeText}>Friends</Text>
              </View>
            )}
          </View>
          
          {profile.city && profile.country && (
            <View style={styles.locationRow}>
              <MapPin size={18} color="#8B3A8B" />
              <Text style={styles.locationText}>
                {profile.city}, {profile.country}
              </Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Grille d'informations */}
        <View style={styles.infoGrid}>
          {age && (
            <View style={styles.infoCard}>
              <View style={styles.iconContainer}>
                <Heart size={24} color="#8B3A8B" />
              </View>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{age} years</Text>
            </View>
          )}

          {profile.gender && (
            <View style={styles.infoCard}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>👤</Text>
              </View>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Other'}
              </Text>
            </View>
          )}

          {profile.country && (
            <View style={styles.infoCard}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>🌍</Text>
              </View>
              <Text style={styles.infoLabel}>Country</Text>
              <Text style={styles.infoValue}>{profile.country}</Text>
            </View>
          )}

          {profile.dateOfBirth && (
            <View style={styles.infoCard}>
              <View style={styles.iconContainer}>
                <Calendar size={24} color="#8B3A8B" />
              </View>
              <Text style={styles.infoLabel}>Birthday</Text>
              <Text style={styles.infoValue}>{new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
          )}
        </View>

        {/* Préférences Section */}
        {profile.preference && (
          <View style={styles.modernSection}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            
            <View style={styles.preferenceContainer}>
              {profile.preference.interestedIn && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>🎯</Text>
                  <View style={styles.preferenceContent}>
                    <Text style={styles.preferenceLabel}>Interested in</Text>
                    <Text style={styles.preferenceValue}>{profile.preference.interestedIn.join(', ')}</Text>
                  </View>
                </View>
              )}
              
              {profile.preference.ageRange && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>📅</Text>
                  <View style={styles.preferenceContent}>
                    <Text style={styles.preferenceLabel}>Age range</Text>
                    <Text style={styles.preferenceValue}>
                      {profile.preference.ageRange.min || 18} - {profile.preference.ageRange.max || 99} years
                    </Text>
                  </View>
                </View>
              )}
              
              {profile.preference.maxDistance && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>📍</Text>
                  <View style={styles.preferenceContent}>
                    <Text style={styles.preferenceLabel}>Distance</Text>
                    <Text style={styles.preferenceValue}>Up to {profile.preference.maxDistance} km</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.modernSection}>
          <Text style={styles.sectionTitle}>Additional Info</Text>
          
          <View style={styles.additionalInfoContainer}>
            {profile.createdAt && (
              <View style={styles.additionalInfoRow}>
                <Text style={styles.additionalInfoLabel}>Member since</Text>
                <Text style={styles.additionalInfoValue}>{formatDate(profile.createdAt)}</Text>
              </View>
            )}
            
            {profile.lastActive && (
              <View style={styles.additionalInfoRow}>
                <Text style={styles.additionalInfoLabel}>Last active</Text>
                <Text style={styles.additionalInfoValue}>{formatDate(profile.lastActive)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Boutons d'action modernisés */}
      <View style={styles.actionContainer}>
        {friendshipStatus === 'none' && (
          <TouchableOpacity 
            style={[styles.primaryButton, sendingRequest && styles.disabledButton]}
            onPress={handleSendInvitation}
            disabled={sendingRequest}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B3A8B', '#6B2A6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {sendingRequest ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <UserPlus size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Add Friend</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {friendshipStatus === 'pending' && (
          <View style={styles.pendingButton}>
            <Text style={styles.pendingButtonText}>Request Sent</Text>
          </View>
        )}

        {friendshipStatus === 'received' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRequest} activeOpacity={0.8}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} onPress={handleDeclineRequest} activeOpacity={0.8}>
              <X size={20} color="#FFFFFF" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA" 
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: "#666666",
    fontWeight: "500"
  },
  errorText: { 
    fontSize: 18, 
    color: "#999999", 
    marginBottom: 24,
    fontWeight: "500"
  },
  scrollView: { 
    flex: 1 
  },
  
  // Header flottant
  floatingHeader: { 
    position: 'absolute', 
    top: 50, 
    left: 16, 
    zIndex: 100 
  },
  floatingBackButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center',
    backdropFilter: 'blur(10px)'
  },
  
  // Photos carousel
  photosSection: { 
    width: width, 
    height: height * 0.55,
    position: 'relative',
    backgroundColor: '#000000'
  },
  photoContainer: {
    width: width,
    height: '100%'
  },
  photoCarousel: { 
    width: width, 
    height: '100%'
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200
  },
  photoIndicators: { 
    position: 'absolute', 
    bottom: 24, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 6,
    paddingHorizontal: 20
  },
  photoIndicator: { 
    height: 3,
    flex: 1,
    maxWidth: 40,
    borderRadius: 2, 
    backgroundColor: 'rgba(255, 255, 255, 0.4)'
  },
  photoIndicatorActive: { 
    backgroundColor: '#FFFFFF'
  },
  
  verifiedBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  
  // No photo section
  noPhotoSection: { 
    alignItems: 'center', 
    paddingVertical: 60,
    backgroundColor: '#F8F9FA'
  },
  profileImageLarge: { 
    width: 140, 
    height: 140, 
    borderRadius: 70,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 16, 
    elevation: 8
  },
  profileImageTextLarge: { 
    fontSize: 56, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  
  // Profile header
  profileHeader: { 
    paddingHorizontal: 24, 
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF'
  },
  nameContainer: {
    marginBottom: 12
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  profileNameLarge: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1A1A1A',
    letterSpacing: -0.5
  },
  ageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666666'
  },
  friendBadgeCompact: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  friendBadgeText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#4CAF50' 
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8
  },
  locationText: { 
    fontSize: 16, 
    color: '#666666',
    fontWeight: '500'
  },
  
  // Bio
  bioSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 1
  },
  bioText: { 
    fontSize: 16, 
    color: '#333333', 
    lineHeight: 24,
    fontWeight: '400'
  },
  
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  },
  infoCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  iconEmoji: {
    fontSize: 28
  },
  infoLabel: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'center'
  },
  
  // Modern sections
  modernSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 24
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1A1A1A', 
    marginBottom: 20,
    letterSpacing: -0.3
  },
  
  // Preferences
  preferenceContainer: {
    gap: 16
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12
  },
  preferenceIcon: {
    fontSize: 24
  },
  preferenceContent: {
    flex: 1
  },
  preferenceLabel: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 4
  },
  preferenceValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600'
  },
  
  // Additional info
  additionalInfoContainer: {
    gap: 12
  },
  additionalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  additionalInfoLabel: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500'
  },
  additionalInfoValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600'
  },
  
  // Action buttons
  actionContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    paddingBottom: 55,
    elevation: 10

  },
  primaryButton: { 
    borderRadius: 28,
    
    overflow: 'hidden'
  },
  buttonGradient: {
    flexDirection: 'row',
    
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  disabledButton: { 
    opacity: 0.6 
  },
  primaryButtonText: { 
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: 'bold',
    letterSpacing: 0.3
  },
  pendingButton: { 
    backgroundColor: '#F0F0F0', 
    borderRadius: 28, 
    paddingVertical: 18, 
    alignItems: 'center' 
  },
  pendingButtonText: { 
    color: '#666666', 
    fontSize: 17, 
    fontWeight: 'bold' 
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  acceptButton: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: '#4CAF50', 
    borderRadius: 28, 
    paddingVertical: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  acceptButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  declineButton: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: '#FF5252', 
    borderRadius: 28, 
    paddingVertical: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  declineButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  messageButton: { 
    borderRadius: 28,
    overflow: 'hidden'
  },
  messageButtonText: { 
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: 'bold',
    letterSpacing: 0.3
  },
  backButton: { 
    backgroundColor: '#8B3A8B', 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 28,
    shadowColor: '#8B3A8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  backButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
})