import React, { useEffect } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  useAuthStore,
} from "../store/authStore";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoomDetailScreen from "../screens/RoomDetailScreen";
import MainTabs from "./MainTabs";


export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;

  MainTabs:
    | {
        screen?: "Home" | "Bookings" | "Profile";
      }
    | undefined;

  RoomDetail: {
    roomId: string;
  };
};


const Stack =
  createNativeStackNavigator<RootStackParamList>();


export default function AppNavigator() {

  const user =
    useAuthStore((state) => state.user);

  const loading =
    useAuthStore((state) => state.loading);

  const initialize =
    useAuthStore((state) => state.initialize);


  useEffect(() => {

    const unsubscribe =
      initialize();

    return unsubscribe;

  }, [initialize]);


  if (loading) {

    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

      </View>
    );
  }


  return (
    <NavigationContainer>

      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >

        {user ? (

          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
            />

            <Stack.Screen
              name="RoomDetail"
              component={RoomDetailScreen}
            />
          </>

        ) : (

          <>

            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
            />

            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />

            <Stack.Screen
              name="Register"
              component={RegisterScreen}
            />

          </>

        )}

      </Stack.Navigator>

    </NavigationContainer>
  );
}


const styles = StyleSheet.create({

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF4FF",
  },

});