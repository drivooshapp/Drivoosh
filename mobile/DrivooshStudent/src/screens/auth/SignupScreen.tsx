import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';


export default function SignupScreen({ navigation }: any) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async () => {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert('שגיאה', 'אנא מלא את כל השדות');
            return;
        }

        try {
            await apiClient.post('/user/register', {
                firstName,
                lastName,
                email,
                password,
                role: 'student'
            });
            // console.log("נרשמת בהצלחה!");
            Alert.alert('הצלחה', 'נרשמת בהצלחה, כעת התחבר');
            navigation.navigate('Login');
        } catch (error: any) {
            console.log("Error details:", error.response?.data || error.message);
            Alert.alert('שגיאה', 'הרישום נכשל. ודא שהפרטים תקינים.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

                <View style={styles.content}>

                    <View style={styles.header}>
                        <Text style={styles.brandName}>Drivoosh</Text>
                        <Text style={styles.title}>יצירת חשבון</Text>
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
                                placeholder="example@mail.com"
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
                                placeholder="••••••••"
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
    content: { paddingHorizontal: 24 },
    header: { marginBottom: 40, alignItems: 'flex-end' },
    brandName: { fontSize: 34, fontWeight: '700', color: '#00C2E8', marginBottom: 6 },
    title: { fontSize: 22, fontWeight: '500', color: '#111' },
    form: { width: '100%' },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 13, color: '#666', marginBottom: 6, textAlign: 'right' },
    input: { height: 52, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 16, fontSize: 16, color: '#111', textAlign: 'right' },
    button: { height: 56, borderRadius: 28, backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    linkContainer: { marginTop: 30, alignItems: 'center' },
    linkText: { fontSize: 14, color: '#888' },
    linkTextBold: { color: '#00C2E8', fontWeight: '600' },
});