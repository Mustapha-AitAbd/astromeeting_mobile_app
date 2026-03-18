import { createNativeStackNavigator } from "@react-navigation/native-stack"
import LoginScreen from "../views/screens/LoginScreen"
import OnboardingScreen from "../views/screens/Onboardingscreen"
import RegisterStep1Screen from "../views/screens/register-step1-screen"
import RegisterStep2Screen from "../views/screens/register-step2-screen"
import RegisterStep3Screen from "../views/screens/register-step3-screen"
import RegisterStep4Screen from "../views/screens/register-step4-screen"
import RegisterStep4SocialLinks from "../views/screens/register-step4-social-links-screen"
import RegisterStep5Screen from "../views/screens/register-step5-screen"
import RegisterStep6Screen from "../views/screens/register-step6-screen"
import EmailVerificationScreen from "../views/screens/EmailVerification"
import ForgotPasswordScreen from "../views/screens/ForgotPasswordScreen"
import ResetPasswordCodeScreen from "../views/screens/ResetPasswordCodeScreen"

const Stack = createNativeStackNavigator()

// hasSeenOnboarding is passed from RootNavigator
export default function AuthNavigator({ hasSeenOnboarding }) {
  return (
    <Stack.Navigator
      // If the user hasn't seen onboarding yet → start there
      // Otherwise → go straight to Login
      initialRouteName={hasSeenOnboarding ? "Login" : "Onboarding"}
      screenOptions={{
        headerShown: false,
        // Smooth horizontal slide between all auth screens
        animation: "slide_from_right",
      }}
    >
      {/* ── Onboarding (only shown on first launch) ── */}
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          // Prevent going back to onboarding once dismissed
          gestureEnabled: false,
        }}
      />

      {/* ── Auth screens ── */}
      <Stack.Screen name="Login"             component={LoginScreen} />
      <Stack.Screen name="ForgotPassword"    component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPasswordCode" component={ResetPasswordCodeScreen} />
      <Stack.Screen name="RegisterStep1"     component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterStep2"     component={RegisterStep2Screen} />
      <Stack.Screen name="RegisterStep3"     component={RegisterStep3Screen} />
      <Stack.Screen name="RegisterStep4"     component={RegisterStep4Screen} />
      <Stack.Screen name="RegisterStep4SocialLinks" component={RegisterStep4SocialLinks} />
      <Stack.Screen name="RegisterStep5"     component={RegisterStep5Screen} />
      <Stack.Screen name="RegisterStep6"     component={RegisterStep6Screen} />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}