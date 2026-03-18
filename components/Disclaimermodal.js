import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { ChevronLeft, AlertCircle, CheckCircle2, Shield, Lock } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function DisclaimerScreen({ navigation, route }) {
  const { onAccept } = route.params || {}
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const paddingToBottom = 20
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom

    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    if (onAccept) onAccept()
    navigation.goBack()
  }

  const handleDecline = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleDecline} activeOpacity={0.7}>
          <ChevronLeft size={28} color="#333333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <Text style={styles.headerSubtitle}>Please read carefully</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Alert Banner */}
      <View style={styles.alertBanner}>
        <AlertCircle size={20} color="#FF6B6B" />
        <Text style={styles.alertText}>
          You must read and accept these terms to continue
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* ── TERMS & CONDITIONS ── */}
        <SectionDivider label="Terms & Conditions" />

        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Important Notice</Text>
          </View>
          <Text style={styles.introText}>
            This application provides compatibility insights based on interpretative,
            symbolic, and algorithmic models inspired by historical astrological traditions
            and modern data structuring.
          </Text>
        </View>

        {/* Main Disclaimer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            By accessing and using this app, you acknowledge and agree that:
          </Text>
          <View style={styles.pointsList}>
            <DisclaimerPoint text="The results are not objective truths, predictions, or guarantees" />
            <DisclaimerPoint text="All outputs are intended for exploratory, cultural, and entertainment purposes" />
            <DisclaimerPoint text="The app does not provide psychological, medical, legal, or relationship advice" />
            <DisclaimerPoint text="No personal, emotional, financial, or life-changing decisions should be made solely based on the app's content" />
            <DisclaimerPoint text="Human relationships are influenced by personal choice, context, and lived experience beyond any algorithmic model" />
            <DisclaimerPoint text="The user remains fully responsible for their own decisions, interactions, and relationships" />
          </View>
        </View>

        {/* User Confirmation */}
        <View style={styles.section}>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>By continuing, you confirm that you:</Text>
            <View style={styles.confirmationList}>
              <View style={styles.confirmationItem}>
                <CheckCircle2 size={18} color="#4CAF50" />
                <Text style={styles.confirmationText}>
                  Understand the interpretative nature of the service
                </Text>
              </View>
              <View style={styles.confirmationItem}>
                <CheckCircle2 size={18} color="#4CAF50" />
                <Text style={styles.confirmationText}>
                  Accept the app as a tool for reflection, not an authority
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. User Content */}
        <NumberedSection number="3" title="User Content">
          <Text style={styles.bodyText}>Users may upload:</Text>
          <BulletList items={['One profile photo', 'Basic profile information', 'Optional interests']} />
          <Text style={[styles.bodyText, { marginTop: 10 }]}>You agree that:</Text>
          <BulletList
            items={[
              'Your photo represents you',
              'You will not upload explicit, sexual, violent, or illegal content',
              'You will not upload images of minors',
              'You will not impersonate another person',
              'You will not use third-party images without consent',
            ]}
          />
          <Text style={[styles.bodyText, { marginTop: 10 }]}>
            We reserve the right to remove content or suspend accounts at our discretion.
          </Text>
        </NumberedSection>

        {/* 4. Mutual Contact Mechanism */}
        <NumberedSection number="4" title="Mutual Contact Mechanism">
          <BulletList
            items={[
              'When two users express mutual interest, external contact information becomes visible.',
              'All communication after contact unlocking occurs outside this platform.',
              'We are not responsible for any interaction, communication, meeting, or outcome occurring outside the service.',
            ]}
          />
        </NumberedSection>

        {/* 5. Prohibited Uses */}
        <NumberedSection number="5" title="Prohibited Uses">
          <Text style={styles.bodyText}>You may not:</Text>
          <BulletList
            items={[
              'Harass or threaten other users',
              'Engage in scams or fraudulent behavior',
              'Use the platform for prostitution or escort services',
              'Attempt to access or target minors',
              'Scrape or copy user data',
              'Misuse unlocked contact information',
            ]}
          />
        </NumberedSection>

        {/* 6. No Identity Verification */}
        <NumberedSection number="6" title="No Identity Verification">
          <BulletList
            items={[
              'We do not conduct background checks or verify user identity unless explicitly stated.',
              'Users interact at their own risk.',
            ]}
          />
        </NumberedSection>

        {/* 7. Limitation of Liability */}
        <NumberedSection number="7" title="Limitation of Liability">
          <Text style={styles.bodyText}>
            To the maximum extent permitted by law, we are not liable for:
          </Text>
          <BulletList
            items={[
              'Offline meetings',
              'Emotional distress',
              'Misrepresentation by users',
              'Misuse of shared contact information',
              'User-generated content',
            ]}
          />
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              The service is provided "as is" without guarantees.
            </Text>
          </View>
        </NumberedSection>

        {/* 8. Account Termination */}
        <NumberedSection number="8" title="Account Termination">
          <Text style={styles.bodyText}>We may suspend or terminate accounts that:</Text>
          <BulletList
            items={[
              'Violate these Terms',
              'Present safety risks',
              'Are suspected to involve minors',
            ]}
          />
        </NumberedSection>

        {/* 9. Modifications */}
        <NumberedSection number="9" title="Modifications">
          <Text style={styles.bodyText}>
            We may modify these Terms at any time. Continued use of the service constitutes
            acceptance of updated Terms.
          </Text>
        </NumberedSection>

        {/* 10. Governing Law */}
        <NumberedSection number="10" title="Governing Law">
          <Text style={styles.bodyText}>
            This agreement is governed by the laws of Italy.
          </Text>
        </NumberedSection>

        {/* ── PRIVACY POLICY ── */}
        <SectionDivider label="Privacy Policy" icon="lock" />

        <View style={styles.section}>
          <View style={styles.policyHeader}>
            <Lock size={20} color="#8B3A8B" />
            <Text style={styles.policyHeaderText}>PRIVACY POLICY (MVP — GDPR)</Text>
          </View>
          <Text style={styles.policyDate}>Last Updated: 30/03/2026</Text>
        </View>

        {/* PP 3. Purpose of Processing */}
        <NumberedSection number="3" title="Purpose of Processing" accent="#4A90D9">
          <Text style={styles.bodyText}>We process your data to:</Text>
          <BulletList
            accent="#4A90D9"
            items={[
              'Create and manage your account',
              'Perform automated compatibility calculations',
              'Enable mutual contact unlocking',
              'Maintain platform security',
            ]}
          />
        </NumberedSection>

        {/* PP 4. Legal Basis */}
        <NumberedSection number="4" title="Legal Basis" accent="#4A90D9">
          <Text style={styles.bodyText}>Processing is based on:</Text>
          <BulletList
            accent="#4A90D9"
            items={[
              'Performance of contract (account and matching service)',
              'Explicit consent (automated profiling)',
              'Legitimate interest (security and fraud prevention)',
            ]}
          />
        </NumberedSection>

        {/* PP 5. Automated Profiling */}
        <NumberedSection number="5" title="Automated Profiling" accent="#4A90D9">
          <BulletList
            accent="#4A90D9"
            items={[
              'Compatibility results are generated automatically based on astrological calculations derived from the birth data you provide.',
              'No human review influences compatibility outcomes.',
              'You may delete your account at any time to withdraw consent to profiling.',
            ]}
          />
        </NumberedSection>

        {/* PP 6. Data Retention */}
        <NumberedSection number="6" title="Data Retention" accent="#4A90D9">
          <Text style={styles.bodyText}>Your data is stored:</Text>
          <BulletList
            accent="#4A90D9"
            items={[
              'While your account remains active',
              'Deleted upon account deletion',
              'Security logs retained for a limited period where necessary',
            ]}
          />
        </NumberedSection>

        {/* PP 7. User Rights (GDPR) */}
        <NumberedSection number="7" title="User Rights (GDPR)" accent="#4A90D9">
          <Text style={styles.bodyText}>You have the right to:</Text>
          <BulletList
            accent="#4A90D9"
            items={[
              'Access your data',
              'Request correction',
              'Request deletion',
              'Object to processing where applicable',
            ]}
          />
        </NumberedSection>

        {/* PP 8. Data Security */}
        <NumberedSection number="8" title="Data Security" accent="#4A90D9">
          <Text style={styles.bodyText}>
            We implement reasonable technical and organizational measures to protect your
            personal data.
          </Text>
        </NumberedSection>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <View style={styles.scrollIndicator}>
            <Text style={styles.scrollIndicatorText}>↓ Scroll down to accept ↓</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.declineButton} onPress={handleDecline} activeOpacity={0.7}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, !hasScrolledToBottom && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          activeOpacity={0.8}
          disabled={!hasScrolledToBottom}
        >
          <LinearGradient
            colors={
              hasScrolledToBottom
                ? ['#8B3A8B', '#C74B9C']
                : ['#CCCCCC', '#999999']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptGradient}
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>I Accept and Wish to Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ── Helper Components ─────────────────────────────────────────────────────────

function SectionDivider({ label, icon }) {
  return (
    <View style={styles.sectionDivider}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerLabelWrap}>
        {icon === 'lock' ? (
          <Lock size={14} color="#8B3A8B" style={{ marginRight: 6 }} />
        ) : (
          <Shield size={14} color="#FF6B6B" style={{ marginRight: 6 }} />
        )}
        <Text style={[styles.dividerLabel, icon === 'lock' && { color: '#8B3A8B' }]}>
          {label}
        </Text>
      </View>
      <View style={styles.dividerLine} />
    </View>
  )
}

function NumberedSection({ number, title, children, accent = '#FF6B6B' }) {
  return (
    <View style={styles.numberedSection}>
      <View style={styles.numberedHeader}>
        <View style={[styles.numberBadge, { backgroundColor: accent }]}>
          <Text style={styles.numberBadgeText}>{number}</Text>
        </View>
        <Text style={styles.numberedTitle}>{title}</Text>
      </View>
      <View style={[styles.numberedBody, { borderLeftColor: accent + '55' }]}>
        {children}
      </View>
    </View>
  )
}

function BulletList({ items, accent = '#FF6B6B' }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletItem}>
          <View style={[styles.bullet, { backgroundColor: accent }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function DisclaimerPoint({ text }) {
  return (
    <View style={styles.pointItem}>
      <View style={styles.pointBullet} />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333333' },
  headerSubtitle: { fontSize: 12, color: '#999999', marginTop: 2 },
  headerRight: { width: 44 },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  alertText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    flex: 1,
    fontWeight: '600',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

  // Section Divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E8E8' },
  dividerLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F7F0FF',
    borderRadius: 20,
    marginHorizontal: 10,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Original sections
  section: { marginBottom: 28 },
  titleContainer: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    paddingLeft: 16,
  },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#333333' },
  introText: { fontSize: 15, lineHeight: 24, color: '#555555' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    lineHeight: 24,
  },
  pointsList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  pointItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  pointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: 12,
    marginTop: 8,
  },
  pointText: { flex: 1, fontSize: 14, lineHeight: 22, color: '#555555' },
  confirmationBox: {
    backgroundColor: '#F0F8F5',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  confirmationTitle: { fontSize: 16, fontWeight: '600', color: '#2E7D32', marginBottom: 14 },
  confirmationList: { gap: 12 },
  confirmationItem: { flexDirection: 'row', alignItems: 'flex-start' },
  confirmationText: { flex: 1, fontSize: 14, lineHeight: 21, color: '#388E3C', marginLeft: 10 },

  // Numbered sections
  numberedSection: { marginBottom: 24 },
  numberedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberBadgeText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  numberedTitle: { fontSize: 16, fontWeight: '700', color: '#333333', flex: 1 },
  numberedBody: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    marginLeft: 12,
  },

  // Bullet list
  bulletList: { marginTop: 6 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 8,
  },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, color: '#555555' },

  // Generic body text
  bodyText: { fontSize: 14, lineHeight: 22, color: '#555555', marginBottom: 4 },

  // Note box
  noteBox: {
    marginTop: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  noteText: { fontSize: 13, color: '#795548', fontStyle: 'italic', lineHeight: 20 },

  // Privacy Policy header
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  policyHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B3A8B',
    letterSpacing: 0.8,
    marginLeft: 8,
  },
  policyDate: { fontSize: 12, color: '#999999', marginTop: 2, marginBottom: 8 },

  // Scroll indicator
  scrollIndicator: { alignItems: 'center', paddingVertical: 16, marginTop: 12 },
  scrollIndicatorText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: { fontSize: 16, fontWeight: '600', color: '#666666' },
  acceptButton: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  acceptButtonDisabled: { opacity: 0.6 },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})