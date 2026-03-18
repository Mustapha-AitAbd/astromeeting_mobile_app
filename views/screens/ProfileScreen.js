import { useState, useEffect, useContext } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import {
  Settings,
  MessageCircle,
  User,
  X,
  Plus,
  Camera,
  Home,
  CheckCircle,
  Trash2,
  RefreshCw,
} from "lucide-react-native"
import * as ImagePicker from "expo-image-picker"
import { AuthContext } from "../../context/AuthContext"
import { Share2, Link, Globe } from "lucide-react-native";

const { width } = Dimensions.get("window")
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export default function ProfileScreen({ navigation }) {
  const { token, logout } = useContext(AuthContext)

  const [activeTab, setActiveTab] = useState("profile")
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [userData, setUserData] = useState(null)
  const [photo, setPhoto] = useState(null)        // The one uploaded photo object (or null)
  const [mainPhoto, setMainPhoto] = useState(null)
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (token) {
      loadUserData()
      fetchPendingRequests()
      requestPermissions()
    }
  }, [token])

  // ─── Permissions ──────────────────────────────────────────────────────────────

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (cameraStatus !== "granted" || galleryStatus !== "granted") {
      Alert.alert("Permission Required", "Please grant camera and photo permissions.")
    }
  }

  // ─── Data loading ─────────────────────────────────────────────────────────────

  const loadUserData = async () => {
    try {
      setLoading(true)
      if (!token) { setLoading(false); return }

      // User profile
      const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!userResponse.ok) {
        if (userResponse.status === 401) { handleSessionExpired(); return }
        throw new Error(`HTTP error! status: ${userResponse.status}`)
      }
      const userData = await userResponse.json()
      if (userData.success) {
        setUserData(userData.data)
        const sub = userData.data?.subscription
        setIsPremiumUser(sub?.plan === "premium" && sub?.active === true)
      }

      // Photos — single-photo policy: take only the first one
      const photosResponse = await fetch(`${API_BASE_URL}/api/users/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!photosResponse.ok) throw new Error(`HTTP error! status: ${photosResponse.status}`)
      const photosData = await photosResponse.json()
      if (photosData.success) {
        const allPhotos = photosData.data.photos || []
        setPhoto(allPhotos.length > 0 ? allPhotos[0] : null)
        setMainPhoto(photosData.data.mainPhoto || null)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to load profile data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => { setRefreshing(true); loadUserData() }

  const fetchPendingRequests = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/friendship/requests/received`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (error) {
      console.error("Error fetching pending requests:", error)
    }
  }

  // ─── Auth helper ──────────────────────────────────────────────────────────────

  const handleSessionExpired = () => {
    Alert.alert("Session Expired", "Please login again", [
      { text: "OK", onPress: () => logout() },
    ])
  }

  // ─── Image picking ────────────────────────────────────────────────────────────

  /**
   * Open the native image picker (camera or gallery).
   *
   * Flow:
   *   1. User selects an image.
   *   2. If an existing photo is present, it is deleted silently first.
   *   3. The new image is uploaded and automatically set as the main profile photo.
   *
   * No secondary "Set as Main" step is required from the user.
   */
  const pickImage = async (useCamera = false) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })

      if (!result.canceled && result.assets[0]) {
        // Silently remove the existing photo before uploading the replacement
        if (photo) {
          await confirmDeletePhoto(photo._id, /* silent */ true)
        }
        // Upload and mark as main automatically
        await uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }

  /**
   * Show picker source options. Title adapts to context (add vs. update).
   */
  const showImagePickerOptions = () => {
    Alert.alert(
      photo ? "Update Profile Photo" : "Add Profile Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Gallery", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" },
      ]
    )
  }

  // ─── Upload ───────────────────────────────────────────────────────────────────

  /**
   * Upload the profile photo.
   * setAsMain is always true — the uploaded image becomes the profile picture immediately.
   * @param {string} imageUri - Local URI of the image.
   */
  const uploadPhoto = async (imageUri) => {
    try {
      setUploading(true)
      if (!token) { Alert.alert("Error", "Authentication required"); return }

      const filename = imageUri.split("/").pop()
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : "image/jpeg"

      const formData = new FormData()
      formData.append("photo", { uri: imageUri, name: filename, type })
      formData.append("setAsMain", "true") // Always set as main — no user prompt needed

      const response = await fetch(`${API_BASE_URL}/api/users/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      })

      if (response.status === 401) { handleSessionExpired(); return }

      const data = await response.json()
      if (data.success) {
        Alert.alert("Success", "Profile photo updated!")
        loadUserData()
      } else {
        Alert.alert("Error", data.message || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      Alert.alert("Error", "Failed to upload photo")
    } finally {
      setUploading(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  /** Prompt the user before deleting their profile photo. */
  const deletePhoto = () => {
    if (!photo) return
    Alert.alert(
      "Delete Photo",
      "This will permanently remove your profile photo. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => confirmDeletePhoto(photo._id) },
      ]
    )
  }

  /**
   * Execute the photo deletion API call.
   * @param {string} photoId  - The photo document ID.
   * @param {boolean} silent  - Suppresses the success alert when true (used in replace flow).
   */
  const confirmDeletePhoto = async (photoId, silent = false) => {
    try {
      if (!token) { Alert.alert("Error", "Authentication required"); return }

      const response = await fetch(`${API_BASE_URL}/api/users/photos/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) { handleSessionExpired(); return }

      const data = await response.json()
      if (data.success && !silent) {
        Alert.alert("Success", "Photo deleted!")
        loadUserData()
      }
      // In silent mode the caller (pickImage) handles loadUserData after uploadPhoto
    } catch (error) {
      if (!silent) Alert.alert("Error", "Failed to delete photo")
    }
  }

  // ─── Modal ────────────────────────────────────────────────────────────────────

  const openPhoto = (currentPhoto) => { setSelectedPhoto(currentPhoto); setModalVisible(true) }
  const closeModal = () => { setModalVisible(false); setSelectedPhoto(null) }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Image source={require("../../assets/logo-2.png")} style={styles.tinderLogo} resizeMode="contain" />
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Settings")}>
          <Settings size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B6B"]} />}
      >

        {/* ── Profile header ── */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>

            {/* Avatar with camera shortcut */}
            <View style={styles.profileImageContainer}>
              {mainPhoto ? (
                <Image source={{ uri: mainPhoto.url }} style={styles.profileImage} resizeMode="cover" />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <User size={40} color="#FFFFFF" />
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={showImagePickerOptions}>
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Name + edit profile */}
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>
                  {userData?.firstName || userData?.name} {userData?.lastName}
                </Text>
                {isPremiumUser && (
                  <View style={styles.premiumBadge}>
                    <CheckCircle size={18} color="#2196F3" fill="#2196F3" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.completeProfileButton}
                onPress={() => navigation.navigate("EditProfile")}
                activeOpacity={0.7}
              >
                <Text style={styles.completeProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Photo section ── */}
        <View style={styles.photosSection}>
          <View style={styles.photosSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Photo</Text>
              <Text style={styles.sectionSubtitle}>
                {photo ? "Profile photo set" : "No photo uploaded"}
              </Text>
            </View>

            {/* Show Add button only when no photo exists yet */}
            {!photo && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={showImagePickerOptions}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.addPhotoButtonText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {!photo ? (
            /* ── Empty state ── */
            <View style={styles.emptyPhotos}>
              <Camera size={48} color="#CCCCCC" />
              <Text style={styles.emptyPhotosText}>No photo yet</Text>
              <Text style={styles.emptyPhotosHint}>
                Upload a photo — it will automatically become your profile picture.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={showImagePickerOptions}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.emptyAddButtonText}>Add Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Single photo card ── */
            <View style={styles.singlePhotoCard}>

              {/* Photo preview — long-press to view full size */}
              <TouchableOpacity
                style={styles.singlePhotoTouchable}
                onLongPress={() => openPhoto(photo)}
                activeOpacity={0.92}
              >
                <Image source={{ uri: photo.url }} style={styles.singlePhotoImage} resizeMode="cover" />

                {/* Profile picture badge */}
                {photo.isMain && (
                  <View style={styles.mainBadge}>
                    <CheckCircle size={12} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.mainBadgeText}>PROFILE PHOTO</Text>
                  </View>
                )}

                {/* Subtle long-press hint */}
                <View style={styles.longPressHint}>
                  <Text style={styles.longPressHintText}>Hold to preview</Text>
                </View>
              </TouchableOpacity>

              {/* ── Action buttons ── */}
              <View style={styles.photoActions}>

                {/*
                  "Update Profile Photo"
                  ─────────────────────
                  Replaces the old "Main Photo" / "Set as Main" toggle.
                  Tapping opens the image picker; the selected image is
                  automatically saved as the main profile photo with no
                  additional steps required from the user.
                */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={showImagePickerOptions}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <RefreshCw size={16} color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>
                        Update Profile Photo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={deletePhoto}
                  disabled={uploading}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>
                    Delete
                  </Text>
                </TouchableOpacity>

              </View>

              <Text style={styles.updateHint}>
                Updating your photo will automatically set it as your profile picture.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Bottom nav ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("home"); navigation.navigate("Home") }}>
          <Home size={28} color={activeTab === "home" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("messages"); navigation.navigate("Messages") }}>
          <Link size={28} color={activeTab === "messages" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("profile"); navigation.navigate("Profile") }}>
          <User size={28} color={activeTab === "profile" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
      </View>

      {/* ── Full-screen photo modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <X size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.url }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666666" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  tinderLogo: { width: 100, height: 30 },
  iconButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },

  // Profile section
  profileSection: { padding: 16, backgroundColor: "#FFFFFF" },
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  profileImageContainer: { position: "relative", marginRight: 16 },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FF6B6B",
  },
  profileImagePlaceholder: {
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B6B",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileDetails: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  profileName: { fontSize: 24, fontWeight: "bold", color: "#000000" },
  premiumBadge: { marginLeft: 6, backgroundColor: "#E3F2FD", borderRadius: 12, padding: 2 },
  completeProfileButton: {
    backgroundColor: "#000000",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  completeProfileText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  // Photos section
  photosSection: { backgroundColor: "#FAFAFA", padding: 16, marginTop: 16 },
  photosSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#000000", marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: "#666666" },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  addPhotoButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  // Empty state
  emptyPhotos: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyPhotosText: { fontSize: 18, fontWeight: "600", color: "#333333", marginTop: 16 },
  emptyPhotosHint: {
    fontSize: 13,
    color: "#999999",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  emptyAddButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  emptyAddButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  // Single photo card
  singlePhotoCard: { alignItems: "center" },
  singlePhotoTouchable: {
    width: width - 32,
    height: width - 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
  },
  singlePhotoImage: { width: "100%", height: "100%" },
  mainBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  mainBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 },
  longPressHint: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  longPressHintText: { color: "#FFFFFF", fontSize: 11 },

  // Action buttons
  photoActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    width: width - 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonPrimary: { backgroundColor: "#FF6B6B" },
  actionButtonDanger: { backgroundColor: "#FF3B30" },
  actionButtonText: { fontSize: 14, fontWeight: "600" },
  actionButtonTextLight: { color: "#FFFFFF" },
  updateHint: { marginTop: 10, fontSize: 12, color: "#AAAAAA", textAlign: "center" },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 22,
  },
  fullScreenImage: { width: "100%", height: "80%" },

  // Bottom nav
  bottomNav: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
})