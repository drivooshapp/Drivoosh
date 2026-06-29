import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';


export default function SignupScreen({ navigation }: any) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (text: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text);
    };

    // const handleSignup = async () => {
    //     if (!firstName || !lastName || !email || !password) {
    //         Alert.alert('שגיאה', 'אנא מלא את כל השדות');
    //         return;
    //     }

    //     try {
    //         setLoading(true);
    //         await apiClient.post('/user/register', {
    //             firstName,
    //             lastName,
    //             email,
    //             password,
    //             role: 'student'
    //         });

    //         Alert.alert('הצלחה', 'נרשמת בהצלחה, כעת התחבר');
    //         navigation.navigate('Login');

    //     } catch (error: any) {
    //         console.log("Error details:", error.response?.data || error.message);
    //         Alert.alert('שגיאה', 'הרישום נכשל. ודא שהפרטים תקינים.');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleSignup = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
            Alert.alert('שגיאה', 'אנא מלא את כל השדות כדי להמשיך.');
            return;
        }

        const isFirstNameValid = firstName.trim().length >= 2 && firstName.trim().length <= 20;
        const isLastNameValid = lastName.trim().length >= 2 && lastName.trim().length <= 20;
        const isPasswordValid = password.length >= 6 && password.length <= 12;
        const isEmailValid = validateEmail(email.trim());

        if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid) {
            Alert.alert(
                'פרטים לא תקינים',
                `אנא מלא את הפרטים לפי הכללים הבאים:\n\n` +
                `• שם פרטי ומשפחה: בין 2 ל-20 תווים.\n` +
                `• סיסמה: בין 6 ל-12 תווים.\n` +
                `• אימייל: יש להזין כתובת תקנית.`,
                [{ text: 'סגירה' }]
            );
            return;
        }

        try {
            setLoading(true);
            await apiClient.post('/user/register', {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                password,
                role: 'student'
            });

            Alert.alert('הצלחה', 'נרשמת בהצלחה, כעת התחבר');
            navigation.navigate('Login');

        } catch (error: any) {
            console.log("Error details:", error.response?.data || error.message);

            const serverMessage = error.response?.data?.message || 'הרישום נכשל. ודא שהפרטים תקינים.';
            Alert.alert('שגיאה', serverMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView style={styles.container}>
            {/* <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}> */}
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>

                    <View style={styles.headerContainer}>
                        <Image
                            source={require('../../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>הרשמה</Text>
                        {/* <Text style={styles.subtitle}></Text> */}
                    </View>

                    <View style={styles.form}>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>שם פרטי</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ישראל"
                                placeholderTextColor="#9CA3AF"
                                value={firstName}
                                onChangeText={setFirstName}
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>שם משפחה</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ישראלי"
                                placeholderTextColor="#9CA3AF"
                                value={lastName}
                                onChangeText={setLastName}
                                textAlign="right"
                            />
                        </View>

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
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>סיסמה</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="•••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                textAlign="right"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSignup}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.buttonText}>הירשם כסטודנט</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkContainer}
                        >
                            <Text style={styles.linkText}>
                                כבר יש לך חשבון? <Text style={styles.linkTextBold}>התחבר</Text>
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    inner: { flexGrow: 1, justifyContent: 'center' },
    scrollContainer: { flexGrow: 1, paddingTop: 24, paddingBottom: 40, },
    form: { width: '100%' },
    content: { paddingHorizontal: 24, },
    headerContainer: { alignItems: 'center', marginBottom: 28, },
    logo: { width: 80, height: 80, marginBottom: 12, },
    title: { fontSize: 28, fontWeight: '800', color: '#002E47', textAlign: 'center', },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 13, color: '#666', marginBottom: 6, textAlign: 'right' },
    input: { height: 52, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 16, fontSize: 16, color: '#111', textAlign: 'right' },
    button: { height: 56, borderRadius: 28, backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    linkContainer: { marginTop: 30, alignItems: 'center' },
    linkText: { fontSize: 14, color: '#888' },
    linkTextBold: { color: '#00C2E8', fontWeight: '600' },
});