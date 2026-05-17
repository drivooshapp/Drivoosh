import LoadingScreen from '@/src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, KeyboardTypeOptions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';

interface UserProfile {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    city: string;
    street: string;
    profileImage?: string;
    isSetupComplete: boolean;
    chosenTutor?: {
        id: string;
        pricePerLesson: number;
        user: {
            firstName: string;
            lastName: string;
            profileImage: string;
        };
    };
}

interface InputFieldProps {
    label: string;
    value: string;
    onChangeText?: (text: string) => void;
    keyboardType?: KeyboardTypeOptions;
    editable?: boolean;
}

const ProfileScreen: React.FC<any> = ({ onSetupComplete, onLogout }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [tempProfile, setTempProfile] = useState<any>({});
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);

    // useEffect(() => {
    //     fetchProfile();
    // }, []);
    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            setFetching(true);
            const response = await apiClient.get('/student/myProfile');
            setProfile(response.data);
        } catch (error) {
            console.error("שגיאה בטעינת הפרופיל:", error);
            Alert.alert('שגיאה', 'תקלה בהצגת נתוני משתמש');
        } finally {
            setFetching(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "מחיקת חשבון",
            "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו היא בלתי הפיכה וכל הנתונים יימחקו.",
            [
                { text: "ביטול", style: "cancel" },
                {
                    text: "מחק חשבון",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiClient.delete('/user/deleteAccount');
                            await AsyncStorage.multiRemove(['userToken', 'userName', 'isSetupComplete', 'profileImage']);
                            console.log("החשבון נמחק", "חשבונך הוסר בהצלחה.")
                            Alert.alert("החשבון נמחק", "חשבונך הוסר בהצלחה.");

                            if (onLogout) onLogout();
                        } catch (error) {
                            console.log(error)
                            Alert.alert("שגיאה", "לא ניתן היה למחוק את החשבון כרגע.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const validateAndFormatPhone = (phone: string) => {
        if (!phone) {
            return { isValid: false, error: 'נא להזין מספר טלפון' };
        }

        const cleanNumber = phone.replace(/\D/g, '');

        const isRepeated = /^(\d)\1+$/.test(cleanNumber);
        if (isRepeated) {
            return { isValid: false, error: 'מספר לא תקין (רצף ספרות זהות)' };
        }

        const isValidLength = cleanNumber.length >= 9 && cleanNumber.length <= 12;
        if (!isValidLength) {
            return { isValid: false, error: 'מספר טלפון חייב להכיל 9 עד 12 ספרות' };
        }

        let prefixCheck = '';
        if (cleanNumber.startsWith('0')) {
            prefixCheck = cleanNumber[1];
        } else if (cleanNumber.startsWith('972')) {
            prefixCheck = cleanNumber[3];
        } else {
            prefixCheck = cleanNumber[0];
        }

        const validPrefixes = ['2', '3', '4', '5', '7', '8', '9'];
        if (!validPrefixes.includes(prefixCheck)) {
            return { isValid: false, error: 'קידומת ישראלית לא מוכרת' };
        }

        let formatted = '';
        if (cleanNumber.startsWith('0')) {
            formatted = `+972${cleanNumber.substring(1)}`;
        } else if (cleanNumber.startsWith('972')) {
            formatted = `+${cleanNumber}`;
        } else {
            formatted = `+972${cleanNumber}`;
        }

        return { isValid: true, formatted };
    };

    const handleSave = async () => {
        try {
            setPhoneError('');
            setLoading(true);

            const result = validateAndFormatPhone(tempProfile.phoneNumber);

            if (!result.isValid) {
                setPhoneError(result.error || '');
                setLoading(false);
                return;
            }

            const sanitizedProfile = {
                ...tempProfile,
                phoneNumber: result.formatted
            };

            const response = await apiClient.put('/student/updateProfile', sanitizedProfile);

            setProfile(prev => {
                if (!prev) return response.data.user;
                return {
                    ...prev,
                    ...response.data.user,
                    chosenTutor: prev.chosenTutor
                };
            });

            await AsyncStorage.setItem('isSetupComplete', 'true');

            setModalVisible(false);
            Alert.alert("בוצע", "הפרופיל עודכן בהצלחה");

            if (onSetupComplete) {
                onSetupComplete();
            }

        } catch (error: any) {
            console.error("Update Error:", error);

            const serverMessage = error.response?.data?.message;

            if (serverMessage && serverMessage.includes('טלפון')) {
                setPhoneError(serverMessage);
            } else {
                Alert.alert("שגיאה", serverMessage || "תקלה בעדכון הנתונים");
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setPhoneError('');
        setModalVisible(false);
    };

    if (fetching) return <LoadingScreen />;

    if (!profile) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} >
                <Modal visible={isModalVisible} animationType="fade" transparent={true} statusBarTranslucent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalHeader}>עדכון פרטים</Text>

                            {[
                                { key: 'firstName', placeholder: 'שם פרטי', keyboard: 'default' },
                                { key: 'lastName', placeholder: 'שם משפחה', keyboard: 'default' },
                                { key: 'phoneNumber', placeholder: 'טלפון', keyboard: 'phone-pad' },
                                { key: 'city', placeholder: 'עיר', keyboard: 'default' },
                                { key: 'street', placeholder: 'רחוב', keyboard: 'default' },
                            ].map((field) => (

                                <View key={field.key} style={{ width: '100%', marginBottom: 15 }}>
                                    <View style={styles.modalInputWrapper}>
                                        <Ionicons name="pencil-sharp" size={14} color="#cccccc" />
                                        <TextInput
                                            style={[
                                                styles.modalInput,
                                                { color: tempProfile[field.key]?.trim() ? '#333' : '#BDBDBD' }
                                            ]}
                                            placeholder={field.placeholder}
                                            placeholderTextColor="#b3b3b3"
                                            value={tempProfile[field.key]}
                                            keyboardType={field.keyboard as KeyboardTypeOptions}
                                            onChangeText={(val) => {
                                                if (field.key === 'phoneNumber') setPhoneError('');
                                                setTempProfile({ ...tempProfile, [field.key]: val });
                                            }}
                                        />
                                    </View>

                                    {field.key === 'phoneNumber' && phoneError ? (
                                        <Text style={styles.errorText}>{phoneError}</Text>
                                    ) : null}
                                </View>
                            ))}

                            <TouchableOpacity
                                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>שמור שינויים</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={closeModal}>
                                <Text style={styles.cancelText}>ביטול</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        {profile.profileImage ? (
                            <Image
                                source={{ uri: profile.profileImage }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={[styles.profileImage, styles.initialsContainer]}>
                                <Text style={styles.initialsText}>
                                    {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : ''}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraIconBadge}>
                            <Ionicons name="camera-outline" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => {
                            setTempProfile(profile);
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.outlineButtonText}>
                            עדכן פרטים
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>פרטים אישיים</Text>

                    <InputField label="שם פרטי" value={profile.firstName} editable={false} />
                    <InputField label="שם משפחה" value={profile.lastName} editable={false} />
                    <InputField label="טלפון" value={profile.phoneNumber || ''} editable={false} />
                    <InputField label="מייל" value={profile.email} editable={false} />

                    <Text style={[styles.sectionTitle]}>כתובת</Text>

                    <InputField label="עיר" value={profile.city || ''} editable={false} />
                    <InputField label="רחוב" value={profile.street || ''} editable={false} />

                    <Text style={[styles.sectionTitle]}>מורה</Text>
                    <View style={styles.teacherRow}>
                        <Text style={styles.valueInput}>
                            {profile.chosenTutor
                                ? `${profile.chosenTutor.user.firstName} ${profile.chosenTutor.user.lastName}`
                                : 'טרם נבחר מורה'}
                        </Text>
                        {profile.chosenTutor && (
                            profile.chosenTutor.user.profileImage ? (
                                <Image
                                    source={{ uri: profile.chosenTutor.user.profileImage }}
                                    style={styles.teacherAvatar}
                                />
                            ) : (
                                <View style={[styles.teacherAvatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarInitial}>
                                        {profile.chosenTutor.user.firstName?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )
                        )}
                    </View>

                    {profile.chosenTutor && (
                        <InputField
                            label="עלות שיעור"
                            value={`₪ ${profile.chosenTutor.pricePerLesson}`}
                            editable={false}
                        />
                    )}
                </View>

                <View style={styles.footerSection}>
                    <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteAccountText}>מחיקת חשבון לצמיתות</Text>
                        <Ionicons name="trash-outline" size={18} color="#FF4A4A" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const InputField: React.FC<InputFieldProps> = ({ label, value, editable = true }) => (
    <View style={styles.rowContainer}>
        <Text style={styles.labelText}>{label}</Text>
        {editable ? (
            <TextInput
                style={styles.valueInput}
                value={value}
                textAlign="left"
            />
        ) : (
            <Text style={styles.valueInput}>{value}</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    imageSection: { alignItems: 'center', marginVertical: 20 },
    imageContainer: { position: 'relative' },
    profileImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#00C2E8' },
    initialsContainer: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff', overflow: 'hidden' },
    initialsText: { color: '#fff', fontSize: 45, fontWeight: 'bold', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center', paddingBottom: 5, lineHeight: 55 },
    cameraIconBadge: { position: 'absolute', right: 0, bottom: 5, backgroundColor: '#fff', borderRadius: 15, padding: 6, elevation: 3 },
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
    outlineButton: { borderWidth: 1, borderColor: '#00C2E8', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 25 },
    outlineButtonText: { color: '#0194b1', fontSize: 14, fontWeight: '600' },
    formSection: { paddingHorizontal: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 15, color: '#4ba1b2', marginTop: 50 },
    rowContainer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
    labelText: { fontSize: 14, color: '#727272', textAlign: 'right', width: 80 },
    valueInput: { fontSize: 14, fontWeight: '500', color: '#000000', flex: 1, textAlign: 'left' },
    teacherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 5, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    teacherAvatar: { width: 30, height: 30, borderRadius: 18, marginLeft: 12 },
    avatarInitial: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center', },
    avatarPlaceholder: { width: 30, height: 30, borderRadius: 18, backgroundColor: '#017f98', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 15, padding: 25, elevation: 10 },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#d7d7d7', borderBottomWidth: 1.5, marginBottom: 15, paddingHorizontal: 5 },
    modalInput: { flex: 1, paddingVertical: 8, textAlign: 'right', fontSize: 15, color: '#333' },
    errorText: { color: '#D32F2F', fontSize: 12, fontWeight: '500', textAlign: 'right', marginTop: 4, paddingRight: 5, },
    saveBtn: { backgroundColor: '#1A1A1A', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelText: { color: '#01829b', fontWeight: '600', textAlign: 'center', marginTop: 15 },
    footerSection: { marginTop: 50, alignItems: 'center', paddingHorizontal: 25 },
    deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    deleteAccountText: { color: '#FF4A4A', fontSize: 14, fontWeight: '500', marginRight: 8 }
});

export default ProfileScreen;