import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Image, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, NavigationIndependentTree, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import LoadingScreen from './src/components/LoadingScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import ProfileScreen from './src/screens/auth/ProfileScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import NewBooking from './src/screens/main/BookingScreen';
import HistoryScreen from './src/screens/main/HistoryScreen';
import MessagesScreen from './src/screens/main/MessagesScreen';
import PaymentsScreen from './src/screens/main/PaymentsScreen';
import SearchTutors from './src/screens/main/SearchTutors';
import TutorProfileCard from './src/screens/main/TutorProfileCard';
import AllReviews from './src/screens/main/AllReviews';


const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const SearchStack = createStackNavigator();

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain" component={SearchTutors} />
      <SearchStack.Screen name="TutorDetails" component={TutorProfileCard} />

      <SearchStack.Screen name="AllReviews" component={AllReviews} />
    </SearchStack.Navigator>
  );
}

const HeaderAvatar = ({ userData }: any) => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('ProfileTab')}
      style={{ marginRight: 15 }}
      activeOpacity={0.7}
    >
      {userData?.image ? (
        <Image source={{ uri: userData.image }} style={{ width: 30, height: 30, borderRadius: 15 }} />
      ) : (
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>
            {userData?.name ? userData.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#eee' }}>
        <DrawerItem
          label="התנתקות"
          labelStyle={{ color: '#348d9f', textAlign: 'right', fontWeight: '600', fontSize: 14 }}
          icon={() => <Ionicons name="log-out-outline" size={22} color="#348d9f" />}
          onPress={() => props.onLogout()}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator({ onLogout, userData, navigation }: any) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} onLogout={onLogout} />}
      screenOptions={{
        headerTitleAlign: 'center',
        drawerActiveTintColor: '#42909f',
        drawerItemStyle: { borderRadius: 15, marginVertical: 7 },
        headerRight: () => <HeaderAvatar userData={userData} />,
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
      <Drawer.Screen
        name="NewBooking"
        component={NewBooking}
        options={{
          title: 'שיעור חדש',
          drawerLabel: 'שיעור חדש',
          drawerIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen
        name="SearchTutorsStack"
        component={SearchStackScreen}
        options={{
          title: 'חיפוש מורים',
          drawerLabel: 'חיפוש מורים',
          drawerIcon: ({ color }) => <Ionicons name="search-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          title: 'תשלומים',
          drawerLabel: 'תשלומים',
          drawerIcon: ({ color }) => <Ionicons name="card-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: 'הודעות מהמורה',
          drawerLabel: 'הודעות מהמורה',
          drawerIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={22} color={color} />
        }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'היסטוריית שיעורים',
          drawerItemStyle: { display: 'none' },
          headerShown: true,
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const checkLoginStatus = async () => {
    try {
      const [token, setup, name, image] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('isSetupComplete'),
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('profileImage')
      ]);
      setUserToken(token);
      setIsSetupComplete(setup === 'true');
      setUserName(name);
      setProfileImage(image);
    } catch (e) {
      console.error(e);
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
      console.error(e);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  if (isLoading) return <LoadingScreen />;

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
              {(props) => (
                <DrawerNavigator
                  {...props}
                  onLogout={handleLogout}
                  userData={{ name: userName, image: profileImage }}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}