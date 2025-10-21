import { createNativeStackNavigator } from "@react-navigation/native-stack"
import LoginScreen from "../views/screens/LoginScreen"
import RegisterStep1Screen from "../views/screens/register-step1-screen"
import RegisterStep2Screen from "../views/screens/register-step2-screen"
import RegisterStep3Screen from "../views/screens/register-step3-screen"
import RegisterStep4Screen from "../views/screens/register-step4-screen"
import RegisterStep5Screen from "../views/screens/register-step5-screen"

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
      <Stack.Screen name="RegisterStep3" component={RegisterStep3Screen} />
      <Stack.Screen name="RegisterStep4" component={RegisterStep4Screen} />
      <Stack.Screen name="RegisterStep5" component={RegisterStep5Screen} />
    </Stack.Navigator>
  )
}
