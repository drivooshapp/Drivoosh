import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList, } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoadingScreen from './src/components/LoadingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import ProfileScreen from './src/screens/auth/ProfileScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ViewMyTutorCart from './src/screens/auth/ViewMyTutorCart';

import HomeScreen from './src/screens/main/HomeScreen';
import AllHistoryScreen from './src/screens/main/AllHistoryScreen';
import UpcomingLessons from './src/screens/main/UpcomingLessons';
import ViewStudentsScreen from './src/screens/main/ViewStudentsScreen';
import MessaggesScreen from './src/screens/main/MessaggesScreen';
import PaymentsScreen from './src/screens/main/PaymentsScreen';
import AllReviews from './src/screens/main/AllReviews';

import StudentCart from './src/screens/student/StudentCart';
import LessonsHistory from './src/screens/student/LessonsHistory';

import ProgressFormScreen from './src/screens/student/ProgressForm/NavigationToFormScreen';
import ViewProgressForm from './src/screens/student/ProgressForm/ViewProgressForm';
import FillProgressForm from './src/screens/student/ProgressForm/FillProgressForm';
import StudentProgressFormScreen from './src/screens/student/ProgressForm/StudentProgressFormScreen';
import FinalFormSealScreen from './src/screens/student/ProgressForm/FinalFormSealScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const SearchStack = createStackNavigator();

function StudentCardStack() {
    return (
        <SearchStack.Navigator screenOptions={{ headerShown: false }}>
            <SearchStack.Screen name="AllStudents" component={ViewStudentsScreen} />
            <SearchStack.Screen name="StudentCart" component={StudentCart} />
            <SearchStack.Screen name="StudentHistory" component={LessonsHistory} />

            <SearchStack.Screen name="ProgressFormScreen" component={ProgressFormScreen} />
            <SearchStack.Screen name="ViewProgressForm" component={ViewProgressForm} />
            <SearchStack.Screen name="FillProgressForm" component={FillProgressForm} />
            
            <SearchStack.Screen name="GoalsForm" component={StudentProgressFormScreen} />
            <SearchStack.Screen name="FinalForm" component={FinalFormSealScreen} />
        </SearchStack.Navigator>
    );
}

function TutorCardStack() {
    return (
        <SearchStack.Navigator screenOptions={{ headerShown: false }}>
            <SearchStack.Screen name="MyTutorCart" component={ViewMyTutorCart} />
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
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
                <DrawerItemList {...props} />
                <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#eee' }}>
                    <DrawerItem
                        label="התנתקות"
                        labelStyle={{ color: '#348d9f', textAlign: 'right', fontSize: 18, fontWeight: '600' }}
                        icon={() => <Ionicons name="log-out-outline" size={22} color="#348d9f" />}
                        onPress={() => props.onLogout()}
                    />
                </View>
            </DrawerContentScrollView>
        </SafeAreaView>
    );
}

function DrawerNavigator({ onLogout, userData }: any) {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} onLogout={onLogout} />}
            screenOptions={({ navigation }) => ({
                drawerStyle: {
                    width: 300,
                    backgroundColor: '#fff',
                    borderBottomLeftRadius: 0,
                    overflow: 'visible',
                },
                drawerPosition: 'right',
                headerTitleAlign: 'center',
                drawerActiveTintColor: '#019cbb',
                drawerActiveBackgroundColor: '#47b4c91a',
                drawerLabelStyle: {
                    fontSize: 18,
                    fontWeight: '700',
                    textAlign: 'right',
                },
                drawerItemStyle: {
                    borderRadius: 10,
                    marginVertical: 8,
                },
                headerLeft: () => (
                    <View style={{ marginLeft: 20 }}>
                        <HeaderAvatar userData={userData} />
                    </View>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => navigation.openDrawer()}
                        style={{ marginRight: 20 }}
                    >
                        <Ionicons name="menu" size={32} color="#333" />
                    </TouchableOpacity>
                ),
            })}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'דף הבית',
                    drawerLabel: 'דף הבית',
                    drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
                }}
            />
            <Drawer.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'הפרופיל שלי',
                    drawerLabel: 'הפרופיל שלי',
                    drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
                }}
            />
            <Drawer.Screen
                name="StudentsStack"
                component={StudentCardStack}
                options={{
                    title: 'התלמידים שלי',
                    drawerLabel: 'התלמידים שלי',
                    drawerIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
                }}
            />
            <Drawer.Screen
                name="UpcomingLessons"
                component={UpcomingLessons}
                options={{
                    title: 'מערכת שיעורים',
                    drawerLabel: 'מערכת שיעורים',
                    drawerIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
                }}
            />
            <Drawer.Screen
                name="AllHistory"
                component={AllHistoryScreen}
                options={{
                    title: 'היסטורית שיעורים',
                    drawerLabel: 'היסטורית שיעורים',
                    drawerIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />,
                }}
            />

            <Drawer.Screen
                name="MyTutorCartStack"
                component={TutorCardStack}
                options={{
                    title: 'הדף שלי',
                    drawerLabel: 'הדף שלי',
                    drawerIcon: ({ color }) => <Ionicons name="car-outline" size={22} color={color} />,
                }}
            />
            <Drawer.Screen
                name="Payments"
                component={PaymentsScreen}
                options={{
                    title: 'תשלומים',
                    drawerLabel: 'תשלומים',
                    drawerIcon: ({ color }) => <Ionicons name="card-outline" size={22} color={color} />,
                }}
            />
            <Drawer.Screen
                name="Messagges"
                component={MessaggesScreen}
                options={{
                    title: 'הודעות לתלמידים',
                    drawerLabel: 'הודעות לתלמידים',
                    drawerIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={22} color={color} />,
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
                AsyncStorage.getItem('profileImage'),
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
        <>
            <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#fff" />
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {!userToken ? (
                        <>
                            <Stack.Screen name="Login">
                                {(props) => <LoginScreen {...props} onLoginSuccess={checkLoginStatus} />}
                            </Stack.Screen>
                            <Stack.Screen name="Signup" component={SignupScreen} />
                            <Stack.Screen
                                name="ResetPassword"
                                component={ResetPasswordScreen}
                                options={{ headerShown: false }}
                            />
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
        </>
    );
}
