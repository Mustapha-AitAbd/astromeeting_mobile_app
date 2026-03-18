// SettingsScreen v4
// Changes vs v3:
//   • Export downloads the HTML file via expo-file-system + expo-sharing
//   • Consent block shows "Withdraw" OR "Cancel Withdrawal" based on live state
//   • consentWithdrawn status loaded from GET /api/admin/consent-status on mount
//
// Install if not already present:
//   expo install expo-file-system expo-sharing

import React, { useContext, useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, StatusBar, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ChevronLeft, LogOut, HelpCircle, ChevronRight,
  Download, ShieldOff, ShieldCheck, Trash2, RotateCcw, AlertTriangle,
} from 'lucide-react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing   from 'expo-sharing'
import { AuthContext } from '../../context/AuthContext'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

const apiFetch = (path, token, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

const ROUTES = {
  accountStatus:        '/api/admin/account/status',
  deleteAccount:        '/api/admin/account',
  restoreAccount:       '/api/admin/account/restore',
  exportData:           '/api/admin/my-export',
  consentStatus:        '/api/admin/consent-status',
  withdrawConsent:      '/api/admin/withdraw-consent',
  cancelConsent:        '/api/admin/cancel-withdraw-consent',
}

export default function SettingsScreen({ navigation }) {
  const { logout, token } = useContext(AuthContext)

  // ── Deletion state ─────────────────────────────────────────────────────────
  const [deletionScheduled, setDeletionScheduled] = useState(false)
  const [daysRemaining,     setDaysRemaining]     = useState(null)
  const [permanentDate,     setPermanentDate]     = useState(null)

  // ── Consent state ──────────────────────────────────────────────────────────
  const [consentWithdrawn,  setConsentWithdrawn]  = useState(false)
  const [consentDate,       setConsentDate]       = useState(null)

  const [statusLoaded, setStatusLoaded] = useState(false)

  // ── Loading spinners ───────────────────────────────────────────────────────
  const [loadingExport,         setLoadingExport]         = useState(false)
  const [loadingConsent,        setLoadingConsent]        = useState(false)
  const [loadingDeleteRequest,  setLoadingDeleteRequest]  = useState(false)
  const [loadingCancelDeletion, setLoadingCancelDeletion] = useState(false)

  // ── Load deletion + consent status on mount ────────────────────────────────
  const loadStatus = useCallback(async () => {
    if (statusLoaded || !token) return
    try {
      const [delRes, conRes] = await Promise.all([
        apiFetch(ROUTES.accountStatus, token),
        apiFetch(ROUTES.consentStatus, token),
      ])
      const delData = await delRes.json()
      const conData = await conRes.json()

      if (delData.success && delData.isScheduled) {
        setDeletionScheduled(true)
        setDaysRemaining(delData.daysRemaining)
        setPermanentDate(new Date(delData.permanentDeletionAt).toLocaleDateString())
      }
      if (conData.success) {
        setConsentWithdrawn(conData.consentWithdrawn)
        setConsentDate(conData.withdrawnAt ? new Date(conData.withdrawnAt).toLocaleDateString() : null)
      }
    } catch (err) {
      console.error('Error loading status:', err)
    } finally {
      setStatusLoaded(true)
    }
  }, [statusLoaded, token])

  useEffect(() => { loadStatus() }, [loadStatus])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ])
  }

  // ── Export data — downloads HTML file and opens share sheet ───────────────
  const handleExportData = () => {
    Alert.alert(
      'Export My Data',
      'A beautifully formatted HTML file containing all your personal data will be generated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export & Share',
          onPress: async () => {
            setLoadingExport(true)
            try {
              const res = await apiFetch(ROUTES.exportData, token)
              if (!res.ok) {
                const e = await res.json()
                throw new Error(e.message || 'Export failed')
              }

              // Read the HTML response as text
              const htmlContent = await res.text()

              // Save to a temp file in the app's cache directory
              const fileName  = `syni-data-export-${Date.now()}.html`
              const fileUri   = FileSystem.cacheDirectory + fileName

             await FileSystem.writeAsStringAsync(
                fileUri,
                htmlContent,
                {
                  encoding: 'utf8'
                }
              )

              // Check sharing is available (always true on physical devices)
              const canShare = await Sharing.isAvailableAsync()
              if (!canShare) {
                Alert.alert(
                  'Sharing Unavailable',
                  `File saved to:\n${fileUri}\n\nSharing is not supported on this device/simulator.`
                )
                return
              }

              // Open OS share sheet — user can save to Files, email it, etc.
              await Sharing.shareAsync(fileUri, {
                mimeType: 'text/html',
                dialogTitle: 'Save or share your data export',
                UTI: 'public.html',
              })

            } catch (err) {
              console.error('Export error:', err)
              Alert.alert('Export Failed', err.message || 'Could not export data. Please try again.')
            } finally {
              setLoadingExport(false)
            }
          },
        },
      ]
    )
  }

  // ── Withdraw consent ───────────────────────────────────────────────────────
  const handleWithdrawConsent = () => {
    Alert.alert(
      'Withdraw Consent',
      'This will stop your data from being used for profiling and personalised recommendations.\n\nYour account stays active and you can re-enable consent at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
          onPress: async () => {
            setLoadingConsent(true)
            try {
              const res  = await apiFetch(ROUTES.withdrawConsent, token, { method: 'POST' })
              const data = await res.json()
              if (!res.ok) throw new Error(data.message || 'Request failed')

              setConsentWithdrawn(true)
              setConsentDate(new Date().toLocaleDateString())
              Alert.alert('Consent Withdrawn', data.message)
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not withdraw consent. Please try again.')
            } finally {
              setLoadingConsent(false)
            }
          },
        },
      ]
    )
  }

  // ── Cancel consent withdrawal ──────────────────────────────────────────────
  const handleCancelConsent = () => {
    Alert.alert(
      'Re-enable Consent',
      'Your data will be used again for personalised recommendations and matching.\n\nYou can withdraw consent again at any time.',
      [
        { text: 'Keep withdrawn', style: 'cancel' },
        {
          text: 'Re-enable', style: 'default',
          onPress: async () => {
            setLoadingConsent(true)
            try {
              const res  = await apiFetch(ROUTES.cancelConsent, token, { method: 'POST' })
              const data = await res.json()
              if (!res.ok) throw new Error(data.message || 'Request failed')

              setConsentWithdrawn(false)
              setConsentDate(null)
              Alert.alert('Consent Restored', data.message)
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not restore consent. Please try again.')
            } finally {
              setLoadingConsent(false)
            }
          },
        },
      ]
    )
  }

  // ── Request account deletion ───────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Your account will be permanently deleted in 30 days.\n\n• You stay logged in during this period\n• You can cancel from this screen\n• Active subscription is cancelled immediately',
      [
        { text: 'Keep Account', style: 'cancel' },
        {
          text: 'Delete My Account', style: 'destructive',
          onPress: async () => {
            setLoadingDeleteRequest(true)
            try {
              const res  = await apiFetch(ROUTES.deleteAccount, token, { method: 'DELETE' })
              const data = await res.json()
              if (!res.ok) throw new Error(data.message || 'Request failed')

              setDeletionScheduled(true)
              setDaysRemaining(data.daysRemaining ?? 30)
              setPermanentDate(new Date(data.permanentDeletionAt).toLocaleDateString())

              Alert.alert(
                'Deletion Scheduled',
                `Your account will be permanently deleted on ${new Date(data.permanentDeletionAt).toLocaleDateString()}.\n\nYou can cancel from Settings.`,
                [{ text: 'OK' }]
              )
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not schedule deletion. Please try again.')
            } finally {
              setLoadingDeleteRequest(false)
            }
          },
        },
      ]
    )
  }

  // ── Cancel deletion ────────────────────────────────────────────────────────
  const handleCancelDeletion = () => {
    Alert.alert(
      'Restore Account',
      `Cancel the deletion and restore your account? (${daysRemaining ?? '?'} days remaining)`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Restore',
          onPress: async () => {
            setLoadingCancelDeletion(true)
            try {
              const res  = await apiFetch(ROUTES.restoreAccount, token, { method: 'POST' })
              const data = await res.json()
              if (!res.ok) throw new Error(data.message || 'Request failed')

              setDeletionScheduled(false)
              setDaysRemaining(null)
              setPermanentDate(null)

              Alert.alert('✅ Account Restored', 'Your account is fully active again.', [{ text: 'Great!' }])
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel deletion. Please try again.')
            } finally {
              setLoadingCancelDeletion(false)
            }
          },
        },
      ]
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Deletion pending banner */}
        {deletionScheduled && (
          <View style={styles.deletionBanner}>
            <AlertTriangle size={18} color="#C62828" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deletionBannerTitle}>Account pending deletion</Text>
              <Text style={styles.deletionBannerSubtitle}>
                {daysRemaining != null
                  ? `Permanent deletion in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}${permanentDate ? ` (${permanentDate})` : ''}.`
                  : 'Permanent deletion scheduled.'}
                {'\n'}Tap "Restore Account" below to cancel.
              </Text>
            </View>
          </View>
        )}

        {/* Consent withdrawn banner */}
        {consentWithdrawn && (
          <View style={styles.consentBanner}>
            <ShieldOff size={18} color="#E65100" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.consentBannerTitle}>Consent withdrawn</Text>
              <Text style={styles.consentBannerSubtitle}>
                Your data is no longer used for profiling{consentDate ? ` since ${consentDate}` : ''}.
                {'\n'}Tap "Re-enable Consent" to restore personalisation.
              </Text>
            </View>
          </View>
        )}

        {/* ── General ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <SettingRow
            iconBg={styles.supportIconBg}
            icon={<HelpCircle size={22} color="#2196F3" />}
            title="Support & Info"
            subtitle="About this app"
            onPress={() => navigation.navigate('Support')} />
          <SettingRow
            iconBg={styles.logoutIconBg}
            icon={<LogOut size={22} color="#FF6B6B" />}
            title="Logout"
            subtitle="Sign out of your account"
            titleStyle={styles.logoutText}
            onPress={handleLogout} />
        </View>

        {/* ── Privacy & Data ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          

          {/* Withdraw OR cancel consent — toggles based on state */}
          {consentWithdrawn ? (
            <SettingRow
              iconBg={styles.consentActiveIconBg}
              icon={loadingConsent
                ? <ActivityIndicator size="small" color="#4CAF50" />
                : <ShieldCheck size={22} color="#4CAF50" />}
              title="Re-enable Consent"
              subtitle={`Withdrawn${consentDate ? ' on ' + consentDate : ''} — tap to restore`}
              titleStyle={styles.consentActiveText}
              onPress={handleCancelConsent}
              disabled={loadingConsent} />
          ) : (
            <SettingRow
              iconBg={styles.consentIconBg}
              icon={loadingConsent
                ? <ActivityIndicator size="small" color="#FF9800" />
                : <ShieldOff size={22} color="#FF9800" />}
              title="Withdraw Consent"
              subtitle="Stop profiling & personalised recommendations"
              onPress={handleWithdrawConsent}
              disabled={loadingConsent} />
          )}
        </View>

        {/* ── Danger Zone ── */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Danger Zone</Text>
          {deletionScheduled ? (
            <SettingRow
              iconBg={styles.restoreIconBg}
              icon={loadingCancelDeletion
                ? <ActivityIndicator size="small" color="#4CAF50" />
                : <RotateCcw size={22} color="#4CAF50" />}
              title="Restore Account"
              subtitle={`Cancel deletion${daysRemaining != null ? ` — ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` : ''}`}
              onPress={handleCancelDeletion}
              disabled={loadingCancelDeletion} />
          ) : (
            <SettingRow
              iconBg={styles.deleteIconBg}
              icon={loadingDeleteRequest
                ? <ActivityIndicator size="small" color="#D32F2F" />
                : <Trash2 size={22} color="#D32F2F" />}
              title="Delete Account"
              subtitle="Schedule permanent deletion (30-day grace period)"
              titleStyle={styles.deleteText}
              onPress={handleDeleteAccount}
              disabled={loadingDeleteRequest} />
          )}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function SettingRow({ iconBg, icon, title, subtitle, titleStyle, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={onPress} activeOpacity={0.7} disabled={disabled}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, iconBg]}>{icon}</View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, titleStyle]}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#CCCCCC" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backButton:  { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333333' },
  headerRight: { width: 44 },
  content:     { flex: 1 },

  deletionBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFEBEE', borderLeftWidth: 4, borderLeftColor: '#C62828',
    margin: 16, marginBottom: 0, padding: 14, borderRadius: 10,
  },
  deletionBannerTitle:    { fontSize: 14, fontWeight: '700', color: '#C62828', marginBottom: 4 },
  deletionBannerSubtitle: { fontSize: 12, color: '#B71C1C', lineHeight: 18 },

  consentBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF3E0', borderLeftWidth: 4, borderLeftColor: '#E65100',
    margin: 16, marginBottom: 0, padding: 14, borderRadius: 10,
  },
  consentBannerTitle:    { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 4 },
  consentBannerSubtitle: { fontSize: 12, color: '#BF360C', lineHeight: 18 },

  section:            { marginTop: 24, paddingHorizontal: 16 },
  dangerSection:      { marginTop: 24 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#999999',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 4,
  },
  dangerSectionTitle: { color: '#EF9A9A' },

  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  settingItemDisabled:  { opacity: 0.5 },
  settingLeft:          { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingTextContainer: { flex: 1 },
  settingTitle:    { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 2 },
  settingSubtitle: { fontSize: 13, color: '#999999' },

  supportIconBg:      { backgroundColor: '#E3F2FD' },
  logoutIconBg:       { backgroundColor: '#FFEBEE' },
  exportIconBg:       { backgroundColor: '#E8F5E9' },
  consentIconBg:      { backgroundColor: '#FFF3E0' },
  consentActiveIconBg:{ backgroundColor: '#E8F5E9' },
  deleteIconBg:       { backgroundColor: '#FFEBEE' },
  restoreIconBg:      { backgroundColor: '#E8F5E9' },

  logoutText:       { color: '#FF6B6B' },
  deleteText:       { color: '#D32F2F' },
  consentActiveText:{ color: '#2E7D32' },

  versionContainer: { alignItems: 'center', paddingVertical: 32 },
  versionText:      { fontSize: 13, color: '#CCCCCC' },
})