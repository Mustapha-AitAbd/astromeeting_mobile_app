import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Heart, ExternalLink, Mail } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function SupportScreen({ navigation }) {
  const handleDonatePress = () => {
    const donationUrl = 'https://your-donation-link.com' // Replace with actual link
    
    Linking.canOpenURL(donationUrl).then(supported => {
      if (supported) {
        Linking.openURL(donationUrl)
      } else {
        Alert.alert('Error', 'Cannot open the donation link')
      }
    })
  }

  const handleEmailSupport = () => {
    const email = 'syniapp.team@gmail.com'
    const subject = 'Support Request'
    const mailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`
    
    Linking.canOpenURL(mailUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailUrl)
      } else {
        Alert.alert('Email Support', `Please contact us at: ${email}`)
      }
    }).catch(() => {
      Alert.alert('Email Support', `Please contact us at: ${email}`)
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Info</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            A modern way to explore human resonance
          </Text>
        </View>

        {/* App Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This App</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Since ancient times, people across cultures have looked to the sky to understand life. Both Eastern and Western traditions developed symbolic systems to read cycles, patterns, and relationships — using the movement of the heavens as a language for human connection.
            </Text>
            <Text style={styles.bodyText}>
              This app grows out of that shared intuition to explore how two people may resonate with one another.
            </Text>
            <Text style={styles.bodyText}>
              At its core, the app looks at relationships through three intertwined lenses: emotional, physical and mental resonance. We explore ways in which two individuals might naturally feel together, challenge each other, or find balance.
            </Text>
            <Text style={styles.bodyText}>
              The results are intentionally simple to read, yet open enough to invite reflection rather than conclusions. No matches are labeled as perfect or impossible. No outcomes are promised.
            </Text>
            <Text style={styles.bodyText}>
              The experience is meant to support curiosity, awareness, and conversation — leaving space for complexity, growth, and personal choice.
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Each match in the app is described through three independent scores, reflecting different aspects of relational compatibility. Rather than reducing a connection to a single number, the app invites you to look at how a relationship may unfold on multiple levels.
            </Text>
            <Text style={styles.bodyText}>
              The three scores represent resonance at a different level:
            </Text>
            <Text style={styles.bodyText}>
              <Text style={styles.term}>
                emotional (feelings){" "}
                <Text style={styles.greenStar}>★</Text>
              </Text>
              {", "}
              <Text style={styles.term}>
                physical (attraction){" "}
                <Text style={styles.blueStar}>★</Text>
              </Text>
              {", and "}
              <Text style={styles.term}>
                mental (view of life){" "}
                <Text style={styles.yellowStar}>★</Text>
              </Text>
              {". Together, they offer a balanced snapshot of potential dynamics — without claiming to define the relationship itself."}
            </Text>
            <Text style={styles.bodyText}>
              As you scroll, the app continuously presents new potential matches, organized by overall compatibility quality. Matches are gently grouped into three intuitive categories:
            </Text>

            {/* Categories */}
            <View style={styles.categoryContainer}>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, styles.excellentDot]} />
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryTitle}>Green</Text>
                  <Text style={styles.categoryDescription}>
                    Where the three dimensions show strong and harmonious alignment
                  </Text>
                </View>
              </View>

              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, styles.goodDot]} />
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryTitle}>Blue</Text>
                  <Text style={styles.categoryDescription}>
                    Where compatibility is present with room for exploration and growth
                  </Text>
                </View>
              </View>

              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, styles.moderateDot]} />
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryTitle}>Yellow</Text>
                  <Text style={styles.categoryDescription}>
                    Where differences may play a more active role in the interaction
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.bodyText}>
              There is no "right" or "wrong" category. Each level represents a different kind of encounter — some smoother, some more challenging, all potentially meaningful.
            </Text>
            <Text style={styles.bodyText}>
              The experience is designed to feel fluid and exploratory. You are free to scroll, pause, reflect, and follow what resonates with you, without pressure or predefined outcomes.
            </Text>
          </View>
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              If you have questions, feedback, or need assistance with the app, our support team is here to help.
            </Text>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailSupport}
              activeOpacity={0.8}
            >
              <View style={styles.emailButtonContent}>
                <Mail size={20} color="#2196F3" />
                <View style={styles.emailTextContainer}>
                  <Text style={styles.emailButtonTitle}>Contact Support</Text>
                  <Text style={styles.emailButtonSubtitle}>syniapp.team@gmail.com</Text>
                </View>
                <ExternalLink size={18} color="#2196F3" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support This Project</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              If you find the app meaningful or helpful, you may choose to support the ongoing research and development behind this project. Voluntary contributions help sustain independent exploration at the intersection of ancient symbolic traditions and modern interpretative models.
            </Text>

            <TouchableOpacity
              style={styles.donateButton}
              onPress={handleDonatePress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.donateGradient}
              >
                <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.donateButtonText}>Support / Donate</Text>
                <ExternalLink size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for being part of this journey
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FAFAFA',
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    marginBottom: 16,
  },
  categoryContainer: {
    marginVertical: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 12,
  },
  excellentDot: {
    backgroundColor: '#4CAF50',
  },
  goodDot: {
    backgroundColor: '#2196F3',
  },
  moderateDot: {
    backgroundColor: '#FF9800',
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#777777',
  },
  donateButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  donateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  emailButton: {
    marginTop: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    overflow: 'hidden',
  },
  emailButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  emailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  emailButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  emailButtonSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  greenStar: {
    color: "green",
    fontWeight: "bold",
  },
  blueStar: {
    color: "#5b8fff",
    fontWeight: "bold",
  },
  yellowStar: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  term: {
    fontWeight: "600",
  },
})