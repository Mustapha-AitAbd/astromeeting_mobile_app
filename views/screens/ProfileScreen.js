import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Dimensions } from "react-native"
import { Bell, Settings, Star, Zap, Flame, Grid, MessageCircle, User, X } from "lucide-react-native"
import { useNavigation } from '@react-navigation/native';


const { width } = Dimensions.get("window")
const imageSize = (width - 48) / 3 // 3 columns with padding


// Mock photo data
const MOCK_PHOTOS = [
  { id: 1, source: require("../../assets/portrait-photo-1.png") },
  { id: 2, source: require("../../assets/diverse-portrait-study.png") },
  { id: 3, source: require("../../assets/portrait-photo-3.png") },
  { id: 4, source: require("../../assets/portrait-photo-4.png") },
  { id: 5, source: require("../../assets/portrait-photo-5.jpg") },
  { id: 6, source: require("../../assets/portrait-photo-6.jpg") },
  { id: 7, source: require("../../assets/portrait-photo-7.jpg") },
  { id: 8, source: require("../../assets/portrait-photo-8.jpg") },
  { id: 9, source: require("../../assets/portrait-photo-9.jpg") },
  { id: 10, source: require("../../assets/portrait-photo-10.jpg") },
  { id: 11, source: require("../../assets/portrait-photo-11.jpg") },
  { id: 12, source: require("../../assets/portrait-photo-12.jpg") },
]


export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("profile")
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  const handleUpgrade = () => {
    alert("Upgrade to Premium!")
  }

  const openPhoto = (photo) => {
    setSelectedPhoto(photo)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedPhoto(null)
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileImageText}>M</Text>
              </View>
              <View style={styles.completionBadge}>
                <Text style={styles.completionText}>60%</Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>Mustapha, 24</Text>
                <Text style={styles.verifiedBadge}>✓</Text>
              </View>
              <TouchableOpacity style={styles.completeProfileButton}>
                <Text style={styles.completeProfileText}>✏️ Complete my profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.certifButton}>
            <Text style={styles.certifButtonText}>Get Syni Certified</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.featureCard}>
            <Star size={32} color="#FFD700" />
            <Text style={styles.featureTitle}>0 Superlike</Text>
          </View>
          <View style={styles.featureCard}>
            <Zap size={32} color="#9C27B0" />
            <Text style={styles.featureTitle}>My Boosts</Text>
          </View>
          <View style={styles.featureCard}>
            <Flame size={32} color="#FF6B6B" />
            <Text style={styles.featureTitle}>0 Subscription</Text>
          </View>
        </View>

        <View style={styles.photosSection}>
          <View style={styles.photosSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Photos</Text>
              <Text style={styles.sectionSubtitle}>{MOCK_PHOTOS.length} photos</Text>
            </View>
          </View>

          <View style={styles.photoGrid}>
            {MOCK_PHOTOS.map((photo) => (
              <TouchableOpacity key={photo.id} style={styles.photoItem} onPress={() => openPhoto(photo)}>
                <Image source={photo.source} style={styles.photoImage} resizeMode="cover" />

              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upgrade Section */}
        <View style={styles.upgradeSection}>
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeHeader}>
              <Image source={require("../../assets/logo-2.png")} style={styles.upgradeLogo} resizeMode="contain" />
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>GOLD</Text>
              </View>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.upgradeTitle}>Features included</Text>

            <View style={styles.featureRow}>
              <Text style={styles.featureLabel}>See who likes your profile</Text>
              <View style={styles.featureComparison}>
                <Text style={styles.featureNo}>—</Text>
                <Text style={styles.featureYes}>✓</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Text style={styles.featureLabel}>Unlimited Likes</Text>
              <View style={styles.featureComparison}>
                <Text style={styles.featureNo}>—</Text>
                <Text style={styles.featureYes}>✓</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Text style={styles.featureLabel}>Free Superlikes</Text>
              <View style={styles.featureComparison}>
                <Text style={styles.featureNo}>—</Text>
                <Text style={styles.featureYes}>✓</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.seeAllFeaturesButton}>
              <Text style={styles.seeAllFeaturesText}>See all features</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Flame size={28} color={activeTab === "home" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity  style={styles.navItem}  onPress={() => { setActiveTab("explore"); navigation.navigate("Profile"); }}>
            <Grid size={28} color={activeTab === "explore" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("star")}>
          <Star size={28} color={activeTab === "star" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("message"); navigation.navigate("Messages"); }}>
          <MessageCircle size={28} color={activeTab === "messages" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("profile")}>
          <User size={28} color={activeTab === "profile" ? "#FF6B6B" : "#CCCCCC"} />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <X size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image source={selectedPhoto.source} style={styles.fullScreenImage} resizeMode="contain" />

          )}
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FF6B6B",
  },
  profileImageText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  completionBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  completionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginRight: 8,
  },
  verifiedBadge: {
    fontSize: 20,
    color: "#2196F3",
  },
  completeProfileButton: {
    backgroundColor: "#000000",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  completeProfileText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  certifButton: {
    backgroundColor: "#2196F3",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  certifButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  featuresSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
    textAlign: "center",
  },
  featureLink: {
    fontSize: 10,
    color: "#8B3A8B",
    fontWeight: "bold",
  },
  photosSection: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    marginTop: 16,
  },
  photosSectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  photoItem: {
    width: imageSize,
    height: imageSize,
    marginBottom: 4,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 22,
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  upgradeSection: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    marginTop: 16,
    marginBottom: 100,
  },
  upgradeCard: {
    backgroundColor: "#FFD700",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFA500",
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  upgradeLogo: {
    width: 60,
    height: 30,
    marginRight: 8,
  },
  goldBadge: {
    backgroundColor: "#FFA500",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: "auto",
  },
  goldBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  upgradeButton: {
    backgroundColor: "#FFA500",
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 14,
    color: "#000000",
    flex: 1,
  },
  featureComparison: {
    flexDirection: "row",
    gap: 40,
  },
  featureNo: {
    fontSize: 18,
    color: "#666666",
  },
  featureYes: {
    fontSize: 18,
    color: "#4CAF50",
  },
  seeAllFeaturesButton: {
    marginTop: 16,
    alignItems: "center",
  },
  seeAllFeaturesText: {
    color: "#8B3A8B",
    fontSize: 16,
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
