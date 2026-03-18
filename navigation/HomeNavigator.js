import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../views/screens/HomeScreen';
import ProfileScreen from '../views/screens/ProfileScreen';
import MessagesScreen from '../views/screens/MessagesScreen';
import ChatScreen from '../views/screens/ChatScreen';
import UserProfileScreen from '../views/screens/UserProfileScreen'
import NotificationsScreen from '../views/screens/NotificationsScreen'
import SubscriptionScreen from '../views/screens/SubscriptionScreen';
import FriendsScreen from '../views/screens/FriendsScreen';
import ProfileEditScreen from '../views/screens/ProfileEditScreen';
import Support from '../views/screens/Supportscreen';
import Settings from '../views/screens/Settingsscreen';
import Disclaimermodal from '../components/Disclaimermodal';
import DisclaimerCard from '../components/DisclaimerCard';
import RegisterStep4SocialLinks from '../views/screens/register-step4-social-links-screen';


const Stack = createNativeStackNavigator();

export default function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      
      <Stack.Screen name="Disclaimer" component={Disclaimermodal} options={{ headerShown: false, presentation: 'card'}} />
      <Stack.Screen name="DisclaimerCard" component={DisclaimerCard} options={{ headerShown: false, presentation: 'card'}} />
      <Stack.Screen name="Support" component={Support} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={ProfileEditScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen 
          name="UserProfile" 
          component={UserProfileScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="Subscription" 
          component={SubscriptionScreen}
          options={{ title: 'Choose Your Plan' }}
        />
    </Stack.Navigator>
  );
}
