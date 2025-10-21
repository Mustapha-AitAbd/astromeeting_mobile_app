import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from "react-native"
import { Bell, Settings, Search, Star, Zap, Flame, Grid, MessageCircle, User, Lock, LogOut } from "lucide-react-native"
import { useNavigation } from '@react-navigation/native';
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";



const MOCK_PROFILES = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Moreau",
    location: "Rennes, France",
    compatibility: 95,
    distance: "3 km",
    isPremium: true,
  },
  {
    id: 2,
    firstName: "Sarah",
    lastName: "Durand",
    location: "Lille, France",
    compatibility: 91,
    distance: "1 km",
    isPremium: true,
  },
  {
    id: 3,
    firstName: "Chloé",
    lastName: "Richard",
    location: "Strasbourg, France",
    compatibility: 87,
    distance: "6 km",
    isPremium: true,
  },
  {
    id: 4,
    firstName: "Léa",
    lastName: "Petit",
    location: "Nantes, France",
    compatibility: 82,
    distance: "2 km",
    isPremium: true,
  },
  {
    id: 5,
    firstName: "Camille",
    lastName: "Robert",
    location: "Bordeaux, France",
    compatibility: 78,
    distance: "4 km",
    isPremium: true,
  },
  {
    id: 6,
    firstName: "Laura",
    lastName: "Thomas",
    location: "Toulouse, France",
    compatibility: 71,
    distance: "7 km",
    isPremium: false,
  },
  {
    id: 7,
    firstName: "Marie",
    lastName: "Dubois",
    location: "Nice, France",
    compatibility: 63,
    distance: "3 km",
    isPremium: false,
  },
  {
    id: 8,
    firstName: "Julie",
    lastName: "Bernard",
    location: "Marseille, France",
    compatibility: 58,
    distance: "12 km",
    isPremium: false,
  },
  {
    id: 9,
    firstName: "Sophie",
    lastName: "Martin",
    location: "Lyon, France",
    compatibility: 52,
    distance: "8 km",
    isPremium: false,
  },
  {
    id: 10,
    firstName: "Emma",
    lastName: "Wilson",
    location: "Paris, France",
    compatibility: 45,
    distance: "5 km",
    isPremium: false,
  },
]

export default function HomeScreen({ navigation }) {
  const nav = useNavigation();
  const [activeTab, setActiveTab] = useState("profile")
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)


  const handleSendInvitation = (profile) => {
    alert(`Invitation sent to ${profile.firstName} ${profile.lastName}`)
  }

  const handleUpgrade = () => {
    alert("Upgrade to Premium to unlock top matches!")
  }

  const handleSearch = () => {
    alert("Search functionality coming soon!")
  }

const { logout } = useContext(AuthContext);

const handleLogout = async () => {
  setShowSettingsMenu(false);
  await logout(); // Déconnecte l'utilisateur et met isAuthenticated à false
  alert("Déconnexion réussie !");
};
  const renderProfileCard = (profile) => {
    const isLocked = profile.isPremium

    return (
      <View key={profile.id} style={styles.matchCard}>
        <View style={styles.matchCardHeader}>
          <View style={styles.matchProfileImage}>
            <Text style={styles.matchInitials}>
              {profile.firstName[0]}
              {profile.lastName[0]}
            </Text>
          </View>
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.matchLocation}>{profile.location}</Text>
            <View style={styles.compatibilityContainer}>
              <View
                style={[
                  styles.compatibilityBadge,
                  { backgroundColor: profile.compatibility >= 70 ? "#4CAF50" : "#FF9800" },
                ]}
              >
                <Text style={styles.compatibilityText}>{profile.compatibility}% Compatible</Text>
              </View>
            </View>
          </View>
        </View>

        {isLocked ? (
          <TouchableOpacity style={styles.lockedButton} onPress={handleUpgrade}>
            <Lock size={16} color="#666666" style={{ marginRight: 8 }} />
            <Text style={styles.lockedButtonText}>Unlock with Premium</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.inviteButton} onPress={() => handleSendInvitation(profile)}>
            <Text style={styles.inviteButtonText}>Send Invitation</Text>
          </TouchableOpacity>
        )}
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
                  <Text style={styles.menuItemText}>LOGOUT</Text>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        <View style={styles.matchesSection}>
          <View style={styles.matchesSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Matches</Text>
              <Text style={styles.sectionSubtitle}>Sorted by compatibility</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              
              <Search size={20} color="#8B3A8B" />
            </TouchableOpacity>
          </View>
          {MOCK_PROFILES.map(renderProfileCard)}
        </View>

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

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab("home"); navigation.navigate("Home"); }}>
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
    zIndex: 1000,
  },
  tinderLogo: {
    width: 100,
    height: 30,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
    position: "relative",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  iconText: {
    fontSize: 24,
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
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
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
  matchesSection: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    marginTop: 16,
  },
  matchesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  matchProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  matchInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  matchInfo: {
    flex: 1,
    justifyContent: "center",
  },
  matchName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 6,
  },
  compatibilityContainer: {
    flexDirection: "row",
  },
  compatibilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compatibilityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  inviteButton: {
    backgroundColor: "#8B3A8B",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  inviteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  lockedButton: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "bold",
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
  navIcon: {
    fontSize: 28,
    opacity: 0.4,
  },
  navIconActive: {
    opacity: 1,
    color: "#FF6B6B",
  },
})