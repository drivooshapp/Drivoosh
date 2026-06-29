import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';

const CELL_COUNT = 6;

export default function ResetPasswordScreen({ route, navigation }: any) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value: otp, setValue: setOtp });

    const handleReset = async () => {
        if (otp.length < 6 || !newPassword) {
            Alert.alert('שגיאה', 'נא להזין קוד תקין וסיסמה חדשה');
            return;
        }

        try {
            setLoading(true);
            await apiClient.post('/user/resetPassword', { email, otp, newPassword });
            //   Alert.alert('הצלחה', 'הסיסמה שונתה בהצלחה!', [
            //     { text: 'חזרה להתחברות', onPress: () => navigation.navigate('Login') }
            //   ]);
            navigation.navigate('Login')
        } catch (error: any) {
            Alert.alert('שגיאה', error.response?.data?.message || 'האימות נכשל');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>איפוס סיסמה</Text>
                    <Text style={styles.subtitle}>
                        הזן את הקוד שנשלח לכתובת{"\n"}
                        <Text style={styles.boldEmail}>{email}</Text>
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>קוד אימות (6 ספרות)</Text>
                        <CodeField
                            ref={ref}
                            {...props}
                            value={otp}
                            onChangeText={setOtp}
                            cellCount={CELL_COUNT}
                            rootStyle={styles.codeFieldRoot}
                            keyboardType="number-pad"
                            textContentType="oneTimeCode"
                            renderCell={({ index, symbol, isFocused }) => (
                                <View
                                    key={index}
                                    style={styles.cell}
                                    onLayout={getCellOnLayoutHandler(index)}
                                >
                                    <Text style={styles.cellText}>
                                        {symbol || (isFocused ? <Cursor /> : null)}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>סיסמה חדשה</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="מינימום 6 תווים"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleReset}>
                        <Text style={styles.buttonText}>עדכן סיסמה</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    boldEmail: { fontWeight: '700', color: '#111' },
    title: { fontSize: 24, fontWeight: '700', textAlign: 'right', marginBottom: 30, color: '#0197b5' },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 30 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 13, color: '#666', marginBottom: 8, textAlign: 'right' },
    codeFieldRoot: { flexDirection: 'row', justifyContent: 'space-between' },
    cell: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', },
    cellText: { fontSize: 20, color: '#111', fontWeight: '600' },
    passwordWrapper: { flexDirection: 'row-reverse', alignItems: 'center', height: 52, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 16, },
    passwordInput: { flex: 1, textAlign: 'right', fontSize: 16, color: '#5c5c5c' },
    eyeIcon: { padding: 5 },
    button: { height: 56, borderRadius: 28, backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});