import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-gesture-handler';

import HomeScreen from './src/screens/auth/HomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import ProfileScreen from './src/screens/auth/ProfileScreen';
import SignupScreen from './src/screens/auth/SignupScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />

      <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#eee' }}>
        <DrawerItem
          label="התנתקות"
          labelStyle={{ color: '#cf2d24', textAlign: 'right', fontWeight: '600', fontSize: 16 }}
          icon={() => <Ionicons name="log-out-outline" size={22} color="#FF3B30" />}
          onPress={() => {
            props.onLogout();
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator({ onLogout }: any) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} onLogout={onLogout} />}
      screenOptions={{
        // drawerPosition: 'right',
        headerTitleAlign: 'center',
        drawerActiveTintColor: '#02a4c5',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'דף הבית',
          drawerLabel: 'בית',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'פרופיל',
          drawerLabel: 'הפרופיל שלי',
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);

  const checkLoginStatus = async () => {
    try {
      // await AsyncStorage.clear(); // ניקוי נתוני המשתמש
      const token = await AsyncStorage.getItem('userToken');
      const setupStatus = await AsyncStorage.getItem('isSetupComplete');

      setUserToken(token);
      setIsSetupComplete(setupStatus === 'true');
    } catch (e) {
      console.error("טעות בטעינת נתוני AsyncStorage", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userName', 'isSetupComplete']);
      setUserToken(null);
      setIsSetupComplete(false);
    } catch (e) {
      console.error("שגיאה בתהליך ההתנתקות", e);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00C2E8" />
      </View>
    );
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {!userToken ? (
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={checkLoginStatus} />}
              </Stack.Screen>
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : !isSetupComplete ? (
            <Stack.Screen name="Profile">
              {(props) => <ProfileScreen {...props} onSetupComplete={checkLoginStatus} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="MainApp">
              {(props) => <DrawerNavigator {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}