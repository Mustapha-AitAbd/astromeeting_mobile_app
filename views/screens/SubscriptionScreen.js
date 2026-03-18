import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from "react-native"
import { Check, Zap, Crown, CreditCard, X } from "lucide-react-native"
import { AuthContext } from "../../context/AuthContext"
import axios from "axios"
import { Linking } from "react-native"
import { WebView } from 'react-native-webview'

export default function SubscriptionScreen({ navigation }) {
  const { token, user } = useContext(AuthContext)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('3months')
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' or 'paypal'
  const [showPayPalModal, setShowPayPalModal] = useState(false)
  const [paypalUrl, setPaypalUrl] = useState('')
  const [paypalOrderId, setPaypalOrderId] = useState('')
  const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    })
  }, [navigation])

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/payment/plans`)
      setPlans(response.data)
    } catch (error) {
      console.error('Error fetching plans:', error)
      Alert.alert('Error', 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  // ===== STRIPE PAYMENT =====
  const handleStripePayment = async () => {
    try {
      if (!token || !user?.email) {
        Alert.alert('Error', 'User not logged in')
        return
      }

      console.log('📧 Creating Stripe checkout session for:', user.email, 'Plan:', selectedPlan)

      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/payment/create-checkout-session`,
        { 
          email: user.email,
          planType: selectedPlan 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { url } = response.data
      console.log('💳 Stripe URL:', url)
      
      if (url) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Unable to open payment page')
      }
    } catch (error) {
      console.error('Stripe payment error:', error)
      Alert.alert('Error', 'Failed to create payment session')
    }
  }

  // ===== PAYPAL PAYMENT =====
  const handlePayPalPayment = async () => {
    try {
      if (!token || !user?.email) {
        Alert.alert('Error', 'User not logged in')
        return
      }

      console.log('📧 Creating PayPal order for:', user.email, 'Plan:', selectedPlan)

      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/payment/paypal/create-order`,
        { 
          email: user.email,
          planType: selectedPlan 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { orderId, approvalUrl } = response.data
      console.log('💰 PayPal Order ID:', orderId)
      console.log('🔗 PayPal Approval URL:', approvalUrl)

      setPaypalOrderId(orderId)
      setPaypalUrl(approvalUrl)
      setShowPayPalModal(true)

    } catch (error) {
      console.error('PayPal payment error:', error)
      Alert.alert('Error', 'Failed to create PayPal order')
    }
  }

  // Handle WebView navigation state changes
  const handleWebViewNavigationStateChange = async (navState) => {
    const { url } = navState

    console.log('🌐 WebView navigating to:', url)

    // Check if user completed payment
    if (url.includes('/payment-success') || url.includes('/api/payment/paypal/success')) {
      console.log('✅ Payment success URL detected')
      setShowPayPalModal(false)
      
      // Show loading
      Alert.alert('Processing', 'Verifying your payment...')
      
      // Capture the payment
      try {
        console.log('✅ Capturing PayPal payment for order:', paypalOrderId)
        
        const response = await axios.post(
          `${EXPO_PUBLIC_API_URL}/api/payment/paypal/capture`,
          { orderId: paypalOrderId },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        )

        console.log('💰 Payment captured successfully:', response.data)
        
        Alert.alert(
          'Success! 🎉', 
          'Your premium subscription is now active!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Navigate back and refresh
                navigation.goBack()
              }
            }
          ]
        )
      } catch (error) {
        console.error('❌ Error capturing payment:', error)
        console.error('Error response:', error.response?.data)
        
        Alert.alert(
          'Payment Error', 
          error.response?.data?.error || 'Payment verification failed. Please contact support with your order ID: ' + paypalOrderId,
          [
            { text: 'OK' }
          ]
        )
      }
    }

    // Check if user cancelled
    if (url.includes('/payment-cancel')) {
      console.log('❌ Payment cancelled')
      setShowPayPalModal(false)
      Alert.alert('Cancelled', 'Payment was cancelled')
    }
  }

  const handleSubscribe = () => {
    if (paymentMethod === 'stripe') {
      handleStripePayment()
    } else {
      handlePayPalPayment()
    }
  }

  const getPlanBadge = (planId) => {
    switch(planId) {
      case '1month':
        return { label: 'STARTER', color: '#2196F3' }
      case '3months':
        return { label: 'POPULAR', color: '#FF9800' }
      case '6months':
        return { label: 'BEST VALUE', color: '#4CAF50' }
      default:
        return { label: '', color: '#666' }
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    )
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Crown size={48} color="#FFD700" />
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>Unlock unlimited features and boost your experience</Text>
        </View>

        {/* PLAN SELECTION */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const badge = getPlanBadge(plan.id)
            const isSelected = selectedPlan === plan.id
            const savingsPercentage = plan.id === '3months' ? '20%' : plan.id === '6months' ? '33%' : null

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.7}
              >
                {badge.label && (
                  <View style={[styles.badge, { backgroundColor: badge.color }]}>
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <View style={styles.radioButton}>
                    {isSelected && <View style={styles.radioButtonSelected} />}
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>€{plan.price.toFixed(2)}</Text>
                  <Text style={styles.pricePerMonth}>
                    €{(plan.price / (plan.duration / 30)).toFixed(2)}/month
                  </Text>
                </View>

                {savingsPercentage && (
                  <View style={styles.savingsBadge}>
                    <Zap size={14} color="#4CAF50" />
                    <Text style={styles.savingsText}>Save {savingsPercentage}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* PAYMENT METHOD SELECTION */}
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentMethod === 'stripe' && styles.paymentMethodCardSelected
            ]}
            onPress={() => setPaymentMethod('stripe')}
          >
            <CreditCard size={24} color={paymentMethod === 'stripe' ? '#FF6B6B' : '#666'} />
            <Text style={[
              styles.paymentMethodText,
              paymentMethod === 'stripe' && styles.paymentMethodTextSelected
            ]}>
              Credit/Debit Card (Stripe)
            </Text>
            <View style={styles.radioButtonPrime}>
              {paymentMethod === 'stripe' && <View style={styles.radioButtonSelected} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentMethod === 'paypal' && styles.paymentMethodCardSelected
            ]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <Text style={styles.paypalIcon}>PP</Text>
            <Text style={[
              styles.paymentMethodText,
              paymentMethod === 'paypal' && styles.paymentMethodTextSelected
            ]}>
              PayPal
            </Text>
            <View style={styles.radioButtonPrime}>
              {paymentMethod === 'paypal' && <View style={styles.radioButtonSelected} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* FEATURES */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          
          {[
            'Unlimited friend requests',
            'Advanced search filters',
            'Priority customer support',
            'Get Certified Badge',
            'Boost your profile visibility'
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={20} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={handleSubscribe}
        >
          <Text style={styles.subscribeButtonText}>
            {paymentMethod === 'stripe' ? 'Pay with Card' : 'Pay with PayPal'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PAYPAL WEBVIEW MODAL */}
      <Modal
        visible={showPayPalModal}
        animationType="slide"
        onRequestClose={() => setShowPayPalModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete PayPal Payment</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowPayPalModal(false)
                Alert.alert('Cancelled', 'Payment was cancelled')
              }}
              style={styles.closeButton}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {paypalUrl ? (
            <WebView
              source={{ uri: paypalUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#FF6B6B" />
                </View>
              )}
            />
          ) : (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Preparing PayPal checkout...</Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  radioButton: {
    top: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonPrime: {
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  pricePerMonth: {
    fontSize: 14,
    color: '#666666',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  paymentMethodContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  paymentMethodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  paymentMethodCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  paymentMethodText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#666666',
  },
  paymentMethodTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  paypalIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0070BA',
    backgroundColor: '#FFC439',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
  },
  subscribeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 40,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  // PayPal Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
})