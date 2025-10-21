import ProfileScreen from "../views/screens/ProfileScreen";
import HomeScreen from "../views/screens/HomeScreen";
import ProfileScreen from "../views/screens/ProfileScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
