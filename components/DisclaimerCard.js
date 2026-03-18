import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { X, AlertCircle, CheckCircle2, FileText, Shield } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { height } = Dimensions.get('window')

// ─── Reusable sub-components ─────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLine} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  )
}

function BulletList({ items, color = '#FF6B6B' }) {
  return (
    <View style={[styles.bulletList, { borderLeftColor: color }]}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletItem}>
          <View style={[styles.bulletDot, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function CheckList({ items, color = '#4CAF50' }) {
  return (
    <View style={styles.checkList}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.checkItem}>
          <CheckCircle2 size={15} color={color} />
          <Text style={[styles.checkText, { color }]}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function InfoBlock({ title, children, accent = '#FF6B6B' }) {
  return (
    <View style={[styles.infoBlock, { borderLeftColor: accent }]}>
      {title && <Text style={[styles.infoBlockTitle, { color: accent }]}>{title}</Text>}
      {children}
    </View>
  )
}

// ─── Tab: Terms of Use ────────────────────────────────────────────────────────

function TermsContent() {
  return (
    <>
      {/* Existing: General disclaimer */}
      <View style={styles.section}>
        <Text style={styles.introText}>
          This application provides compatibility insights based on interpretative,
          symbolic, and algorithmic models inspired by historical astrological traditions
          and modern data structuring.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.bodyLabel}>By accessing and using this app, you acknowledge and agree that:</Text>
        <BulletList
          items={[
            'The results are not objective truths, predictions, or guarantees',
            'All outputs are intended for exploratory, cultural, and entertainment purposes',
            'The app does not provide psychological, medical, legal, or relationship advice',
            "No personal, emotional, financial, or life-changing decisions should be made solely based on the app's content",
            'Human relationships are influenced by personal choice, context, and lived experience beyond any algorithmic model',
            'The user remains fully responsible for their own decisions, interactions, and relationships',
          ]}
        />
      </View>

      {/* Section 3: User Content */}
      <SectionHeader title="3. User Content" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>Users may upload:</Text>
        <BulletList
          color="#8B3A8B"
          items={[
            'One profile photo',
            'Basic profile information',
            'Optional interests',
          ]}
        />
        <Text style={[styles.bodyLabel, { marginTop: 12 }]}>You agree that:</Text>
        <BulletList
          color="#8B3A8B"
          items={[
            'Your photo represents you',
            'You will not upload explicit, sexual, violent, or illegal content',
            'You will not upload images of minors',
            'You will not impersonate another person',
            'You will not use third-party images without consent',
          ]}
        />
        <InfoBlock accent="#FF6B6B">
          <Text style={styles.infoBodyText}>
            We reserve the right to remove content or suspend accounts at our discretion.
          </Text>
        </InfoBlock>
      </View>

      {/* Section 4: Mutual Contact */}
      <SectionHeader title="4. Mutual Contact Mechanism" />
      <View style={styles.section}>
        <BulletList
          color="#8B3A8B"
          items={[
            'When two users express mutual interest, external contact information becomes visible.',
            'All communication after contact unlocking occurs outside this platform.',
            'We are not responsible for any interaction, communication, meeting, or outcome occurring outside the service.',
          ]}
        />
      </View>

      {/* Section 5: Prohibited Uses */}
      <SectionHeader title="5. Prohibited Uses" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>You may not:</Text>
        <BulletList
          color="#FF6B6B"
          items={[
            'Harass or threaten other users',
            'Engage in scams or fraudulent behavior',
            'Use the platform for prostitution or escort services',
            'Attempt to access or target minors',
            'Scrape or copy user data',
            'Misuse unlocked contact information',
          ]}
        />
      </View>

      {/* Section 6: No Identity Verification */}
      <SectionHeader title="6. No Identity Verification" />
      <View style={styles.section}>
        <InfoBlock accent="#FF9800">
          <Text style={styles.infoBodyText}>
            We do not conduct background checks or verify user identity unless explicitly stated.
            Users interact at their own risk.
          </Text>
        </InfoBlock>
      </View>

      {/* Section 7: Limitation of Liability */}
      <SectionHeader title="7. Limitation of Liability" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>
          To the maximum extent permitted by law, we are not liable for:
        </Text>
        <BulletList
          color="#FF6B6B"
          items={[
            'Offline meetings',
            'Emotional distress',
            'Misrepresentation by users',
            'Misuse of shared contact information',
            'User-generated content',
          ]}
        />
        <InfoBlock accent="#FF6B6B">
          <Text style={styles.infoBodyText}>
            The service is provided "as is" without guarantees.
          </Text>
        </InfoBlock>
      </View>

      {/* Section 8: Account Termination */}
      <SectionHeader title="8. Account Termination" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>We may suspend or terminate accounts that:</Text>
        <BulletList
          color="#FF6B6B"
          items={[
            'Violate these Terms',
            'Present safety risks',
            'Are suspected to involve minors',
          ]}
        />
      </View>

      {/* Section 9: Modifications */}
      <SectionHeader title="9. Modifications" />
      <View style={styles.section}>
        <Text style={styles.bodyText}>
          We may modify these Terms at any time. Continued use of the service constitutes
          acceptance of updated Terms.
        </Text>
      </View>

      {/* Section 10: Governing Law */}
      <SectionHeader title="10. Governing Law" />
      <View style={styles.section}>
        <Text style={styles.bodyText}>
          This agreement is governed by the laws of <Text style={styles.bold}>Italy</Text>.
        </Text>
      </View>

      {/* Confirmation */}
      <View style={[styles.section, { marginTop: 4 }]}>
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>By continuing, you confirm that you:</Text>
          <CheckList
            color="#2E7D32"
            items={[
              'Understand the interpretative nature of the service',
              'Accept the app as a tool for reflection, not an authority',
            ]}
          />
        </View>
      </View>
    </>
  )
}

// ─── Tab: Privacy Policy ──────────────────────────────────────────────────────

function PrivacyContent() {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.introText}>
          Last Updated: 30/03/2026{'\n'}
          This Privacy Policy applies to the MVP version of our service and is drafted
          in compliance with the General Data Protection Regulation (GDPR).
        </Text>
      </View>

      {/* Section 3: Purpose of Processing */}
      <SectionHeader title="3. Purpose of Processing" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>We process your data to:</Text>
        <BulletList
          color="#4A90D9"
          items={[
            'Create and manage your account',
            'Perform automated compatibility calculations',
            'Enable mutual contact unlocking',
            'Maintain platform security',
          ]}
        />
      </View>

      {/* Section 4: Legal Basis */}
      <SectionHeader title="4. Legal Basis" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>Processing is based on:</Text>
        <BulletList
          color="#4A90D9"
          items={[
            'Performance of contract (account and matching service)',
            'Explicit consent (automated profiling)',
            'Legitimate interest (security and fraud prevention)',
          ]}
        />
      </View>

      {/* Section 5: Automated Profiling */}
      <SectionHeader title="5. Automated Profiling" />
      <View style={styles.section}>
        <InfoBlock accent="#8B3A8B">
          <Text style={styles.infoBodyText}>
            Compatibility results are generated automatically based on astrological
            calculations derived from the birth data you provide. No human review
            influences compatibility outcomes.{'\n\n'}
            You may delete your account at any time to withdraw consent to profiling.
          </Text>
        </InfoBlock>
      </View>

      {/* Section 6: Data Retention */}
      <SectionHeader title="6. Data Retention" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>Your data is stored:</Text>
        <BulletList
          color="#4A90D9"
          items={[
            'While your account remains active',
            'Deleted upon account deletion',
            'Security logs retained for a limited period where necessary',
          ]}
        />
      </View>

      {/* Section 7: User Rights */}
      <SectionHeader title="7. User Rights (GDPR)" />
      <View style={styles.section}>
        <Text style={styles.bodyLabel}>You have the right to:</Text>
        <View style={styles.gdprGrid}>
          {[
            'Access your data',
            'Request correction',
            'Request deletion',
            'Object to processing where applicable',
          ].map((right, idx) => (
            <View key={idx} style={styles.gdprChip}>
              <CheckCircle2 size={13} color="#4A90D9" />
              <Text style={styles.gdprChipText}>{right}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Section 8: Data Security */}
      <SectionHeader title="8. Data Security" />
      <View style={styles.section}>
        <InfoBlock accent="#4CAF50">
          <Text style={styles.infoBodyText}>
            We implement reasonable technical and organizational measures to protect
            your personal data.
          </Text>
        </InfoBlock>
      </View>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DisclaimerCard({ visible, onClose, onAccept }) {
  const [activeTab, setActiveTab] = useState('terms')

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <AlertCircle size={20} color="#FF6B6B" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Legal Notice</Text>
              <Text style={styles.headerSubtitle}>Please read carefully before continuing</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.7}
          >
            <FileText size={14} color={activeTab === 'terms' ? '#8B3A8B' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
              Terms of Use
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.7}
          >
            <Shield size={14} color={activeTab === 'privacy' ? '#4A90D9' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.declineButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept} activeOpacity={0.8}>
            <LinearGradient
              colors={['#8B3A8B', '#C74B9C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptGradient}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>I Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    height: height * 0.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'column',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#999999',
  },
  closeButton: {
    width: 32, height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8B3A8B',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
  },
  tabTextActive: {
    color: '#8B3A8B',
    fontWeight: '700',
  },

  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 8,
  },

  // Section
  section: {
    marginBottom: 16,
  },

  // Section header (divider with title)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B3A8B',
    marginHorizontal: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Typography
  introText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#555555',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DDDDDD',
  },
  bodyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 8,
    lineHeight: 19,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#555555',
  },
  bold: {
    fontWeight: '700',
    color: '#333333',
  },

  // Bullet list
  bulletList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  bulletDot: {
    width: 6, height: 6,
    borderRadius: 3,
    marginRight: 9,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#555555',
  },

  // Check list
  checkList: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  // Info block
  infoBlock: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    marginTop: 8,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoBodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#555555',
  },

  // GDPR chips
  gdprGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gdprChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EBF4FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gdprChipText: {
    fontSize: 12,
    color: '#4A90D9',
    fontWeight: '500',
  },

  // Confirmation box
  confirmationBox: {
    backgroundColor: '#F0F8F5',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  confirmationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  acceptButton: {
    flex: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})