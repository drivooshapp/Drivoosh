import LoadingScreen from '@/src/components/LoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';


const GoogleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
    <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 6.5 29.6 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z" />
    <Path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5C29.1 35.5 26.7 36 24 36c-5.2 0-9.6-3.1-11.3-7.6l-6.5 5C9.6 39.5 16.3 44 24 44z" />
    <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.3 5.4-6.1 6.8l6.1 5C39.5 36.5 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z" />
  </Svg>
);

export default function LoginScreen({ navigation, onLoginSuccess }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/user/login', { email, password });
      const { token, user } = response.data;
      const { firstName, isSetupComplete } = user;
      const role = user?.role;
      const currentUserId = user?.id;

      if (!token || !firstName) {
        console.log('ERROR: token או firstName לא התקבלו מהשרת', response.data);
        Alert.alert('שגיאה', 'התחברות נכשלה, לא התקבלו פרטי משתמש תקינים');
        return;
      }

      if (role === 'tutor') {
        Alert.alert('אין הרשאה', 'הגישה לאפליקציה זו מוגבלת לתלמידים בלבד. החשבון שלך מזוהה כמורה. אנא התחבר דרך אפליקציית המורים.');
        return;
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userName', firstName);
      await AsyncStorage.setItem('currentUserId', currentUserId);
      await AsyncStorage.setItem('isSetupComplete', String(isSetupComplete));

      if (onLoginSuccess) {
        await onLoginSuccess();
      }

    } catch (error: any) {
      console.log("Error details:", error.response?.data || error.message);
      Alert.alert('שגיאה', error.response?.data?.message || 'התחברות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('שחזור סיסמה', 'אנא הזן את כתובת האימייל שלך לקבלת קוד');
      return;
    }
    try {
      setLoading(true);
      await apiClient.post('/user/forgotPassword', { email });

      navigation.navigate('ResetPassword', { email })
    } catch (error: any) {
      Alert.alert('שגיאה', error.response?.data?.message || 'שגיאה בשליחת המייל');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>התחברות</Text>
            <Text style={styles.subtitle}>התחבר לחשבון שלך כדי להמשיך</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>אימייל</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>סיסמה</Text>

              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="•••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>שכחת סיסמה?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>התחבר</Text>
            </TouchableOpacity>

            <View style={styles.socialContainer}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>או</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
                <GoogleLogo />
                <Text style={styles.googleText}>התחבר עם Google</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                אין לך חשבון? <Text style={styles.linkTextBold}>הירשם כאן</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, inner: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 32, },
  logo: { width: 80, height: 80, marginBottom: 16, borderRadius: 20, },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, textAlign: 'right' },
  input: { paddingHorizontal: 16, fontSize: 16, color: '#111', textAlign: 'right', alignItems: 'center', backgroundColor: '#F3F4F6', height: 52, borderRadius: 12, paddingLeft: 14, },
  passwordWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F3F4F6', height: 52, borderRadius: 12, paddingLeft: 14, },
  eyeIcon: { padding: 4, },
  forgotBtn: { alignSelf: 'flex-start', marginTop: 8 },
  forgotText: { color: '#00C2E8', fontSize: 13, fontWeight: '500' },
  button: { height: 56, borderRadius: 28, backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  socialContainer: { marginTop: 22, alignItems: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 10, fontSize: 13, color: '#888' },
  googleButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 28, height: 54, width: '100%', borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  googleText: { fontSize: 15, color: '#111', fontWeight: '500' },
  linkContainer: { marginTop: 30, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#888' },
  linkTextBold: { color: '#00C2E8', fontWeight: '600' },
});