import LoadingScreen from '@/src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, ActionSheetIOS, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';
import { EditProfileModal } from '../../components/EditProfileModal';
import { BufferTimeModal } from '../../components/BufferTimeModal';


interface UserProfile {
    firstName: string;
    lastName: string;
    identityNumber: string;
    phoneNumber: string;
    email: string;
    city: string;
    street: string;
    profileImage?: string;
    isSetupComplete: boolean;

    carModel: string;
    pricePerLesson: string | number;
    lessonDuration: string | number;
    experienceYears: string | number;
    bio: string;
    workStartHour: string;
    workEndHour: string;
    BufferTime: string;
}

interface InputFieldProps {
    label: string;
    value: string;
    editable?: boolean;
}

const ProfileScreen: React.FC<any> = ({ onSetupComplete, onLogout }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [tempProfile, setTempProfile] = useState<any>({});
    const [isBufferModalVisible, setIsBufferModalVisible] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);

    const BUFFER_DISPLAY_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 45, 60];

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            setFetching(true);
            const response = await apiClient.get('/tutor/myProfile');

            const combinedProfile = {
                ...response.data,
                ...response.data.user
            };

            const hasRequiredFields =
                combinedProfile.identityNumber?.trim() &&
                combinedProfile.phoneNumber?.trim();

            if (hasRequiredFields) {
                combinedProfile.isSetupComplete = true;

                await AsyncStorage.setItem('isSetupComplete', 'true');

                if (onSetupComplete) {
                    onSetupComplete();
                }
            }

            setProfile(combinedProfile);
        } catch (error) {
            // console.error('שגיאה בטעינת הפרופיל:', error);
            Alert.alert('שגיאה', 'תקלה בהצגת נתוני משתמש');
        } finally {
            setFetching(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'מחיקת חשבון',
            'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו היא בלתי הפיכה וכל הנתונים יימחקו.',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'מחק חשבון',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiClient.delete('/user/deleteAccount');
                            await AsyncStorage.multiRemove(['userToken', 'userName', 'isSetupComplete', 'profileImage']);
                            Alert.alert('החשבון נמחק', 'חשבונך הוסר בהצלחה.');
                            if (onLogout) onLogout();
                        } catch (error) {
                            console.log(error);
                            Alert.alert('שגיאה', 'לא ניתן היה למחוק את החשבון כרגע.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const validateAndFormatPhone = (phone: string) => {
        if (!phone) return { isValid: false, error: 'נא להזין מספר טלפון' };
        const cleanNumber = phone.replace(/\D/g, '');
        const isValidLength = cleanNumber.length >= 9 && cleanNumber.length <= 12;
        if (!isValidLength) return { isValid: false, error: 'מספר טלפון חייב להכיל 9 עד 12 ספרות' };

        const isRepeated = /^(\d)\1+$/.test(cleanNumber);
        if (isRepeated) return { isValid: false, error: 'מספר לא תקין (רצף ספרות זהות)' };

        let prefixCheck = '';
        if (cleanNumber.startsWith('0')) prefixCheck = cleanNumber[1];
        else if (cleanNumber.startsWith('972')) prefixCheck = cleanNumber[3];
        else prefixCheck = cleanNumber[0];

        const validPrefixes = ['2', '3', '4', '5', '7', '8', '9'];
        if (!validPrefixes.includes(prefixCheck)) return { isValid: false, error: 'קידומת ישראלית לא מוכרת' };

        let formatted = '';
        if (cleanNumber.startsWith('0')) formatted = `+972${cleanNumber.substring(1)}`;
        else if (cleanNumber.startsWith('972')) formatted = `+${cleanNumber}`;
        else formatted = `+972${cleanNumber}`;

        return { isValid: true, formatted };
    };

    const handleBufferPress = () => {
        if (Platform.OS === 'ios') {
            const optionsLabels = BUFFER_DISPLAY_OPTIONS.map(opt => opt === 0 ? 'ללא הפסקה (0 דקות)' : `${opt} דקות`);
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [...optionsLabels, 'ביטול'],
                    cancelButtonIndex: optionsLabels.length,
                    title: 'בחר מרווח זמן בין שיעורים'
                },
                (buttonIndex) => {
                    if (buttonIndex < optionsLabels.length) {
                        setTempProfile({ ...tempProfile, BufferTime: BUFFER_DISPLAY_OPTIONS[buttonIndex] });
                    }
                }
            );
        } else {
            setIsBufferModalVisible(true);
        }
    };

    const parseTimeToDate = (timeString: string) => {
        const [hours, minutes] = (timeString || "08:00").split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const formatRequiredTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleConfirmStartHour = (date: Date) => {
        const formattedTime = formatRequiredTime(date);
        setTempProfile({ ...tempProfile, workStartHour: formattedTime });
        setShowStartPicker(false);
    };

    const handleConfirmEndHour = (date: Date) => {
        const formattedTime = formatRequiredTime(date);
        setTempProfile({ ...tempProfile, workEndHour: formattedTime });
        setShowEndPicker(false);
    };

    const handleSave = async () => {
        try {
            setErrors({});
            const newErrors: Record<string, string> = {};

            if (!tempProfile.firstName?.trim()) newErrors.firstName = 'שם פרטי הוא שדה חובה';
            if (!tempProfile.lastName?.trim()) newErrors.lastName = 'שם משפחה הוא שדה חובה';
            if (!tempProfile.identityNumber?.trim()) newErrors.identityNumber = 'מספר זהות הוא שדה חובה';
            if (!tempProfile.city?.trim()) newErrors.city = 'עיר היא שדה חובה';
            if (!tempProfile.street?.trim()) newErrors.street = 'רחוב הוא שדה חובה';
            if (!tempProfile.carModel?.trim()) newErrors.carModel = 'דגם רכב הוא שדה חובה';
            if (!tempProfile.pricePerLesson) newErrors.pricePerLesson = 'מחיר לשיעור הוא שדה חובה';

            const phoneResult = validateAndFormatPhone(tempProfile.phoneNumber);
            if (!phoneResult.isValid) newErrors.phoneNumber = phoneResult.error || 'מספר טלפון לא תקין';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setLoading(true);

            const sanitizedProfile = {
                ...tempProfile,
                firstName: tempProfile.firstName.trim(),
                lastName: tempProfile.lastName.trim(),
                identityNumber: tempProfile.identityNumber.trim(),
                city: tempProfile.city.trim(),
                street: tempProfile.street.trim(),
                phoneNumber: phoneResult.formatted,
                carModel: tempProfile.carModel?.trim(),
                pricePerLesson: Number(tempProfile.pricePerLesson),
                lessonDuration: tempProfile.lessonDuration ? Number(tempProfile.lessonDuration) : 45,
                experienceYears: tempProfile.experienceYears ? Number(tempProfile.experienceYears) : 0,
                bufferTime: tempProfile.bufferTime ? Number(tempProfile.bufferTime) : 15,
                bio: tempProfile.bio?.trim()
            };

            try {
                const response = await apiClient.put('/tutor/updateProfile', sanitizedProfile);

                const updatedTutor = response.data.tutor;
                const updatedUser = updatedTutor?.user;

                setProfile(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        ...updatedTutor,
                        ...updatedUser
                    };
                });

                await AsyncStorage.setItem('isSetupComplete', 'true');
                setModalVisible(false);
                Alert.alert('בוצע', 'הפרופיל עודכן בהצלחה');

                if (onSetupComplete) onSetupComplete();
            } catch (e) {
                console.log(e);
            }
        } catch (error: any) {
            console.error('Update Error:', error);
            const serverMessage = error.response?.data?.message;
            if (serverMessage && serverMessage.includes('זהות')) {
                setErrors(prev => ({ ...prev, identityNumber: serverMessage }));
            } else {
                Alert.alert('שגיאה', serverMessage || 'תקלה בעדכון הנתונים');
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => setModalVisible(false);

    if (fetching) return <LoadingScreen />;
    if (!profile) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}>

                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        {profile.profileImage ? (
                            <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
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
                        onPress={() => { setTempProfile(profile); setModalVisible(true); }}
                    >
                        <Text style={styles.outlineButtonText}>עדכן פרטים</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>פרטים אישיים</Text>
                    <InputField label="שם פרטי" value={profile.firstName} />
                    <InputField label="שם משפחה" value={profile.lastName} />
                    <InputField label="מספר זהות" value={profile.identityNumber || ''} />
                    <InputField label="טלפון" value={profile.phoneNumber || ''} />
                    <InputField label="מייל" value={profile.email} />

                    <Text style={styles.sectionTitle}>כתובת</Text>
                    <InputField label="עיר" value={profile.city || ''} />
                    <InputField label="רחוב" value={profile.street || ''} />

                    <Text style={styles.sectionTitle}>פרופיל מקצועי</Text>
                    <InputField label="שנות ניסיון" value={profile.experienceYears !== undefined ? String(profile.experienceYears) : '0'} />
                    <InputField label="דגם רכב" value={profile.carModel || 'טרם עודכן'} />
                    <InputField label="מחיר לשיעור" value={profile.pricePerLesson ? `₪${profile.pricePerLesson}` : 'טרם עודכן'} />
                    <InputField label="משך שיעור" value={profile.lessonDuration ? `${profile.lessonDuration} דקות` : '45 דקות'} />
                    <InputField label="שעות עבודה" value={`${profile.workStartHour || '08:00'} - ${profile.workEndHour || '20:00'}`} />
                    <InputField label="מרווח בין שיעורים" value={profile.BufferTime || '15'} />
                    <InputField label="אודות" value={profile.bio || 'אין פירוט'} />
                </View>

                <View style={styles.footerSection}>
                    <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteAccountText}>מחיקת חשבון לצמיתות</Text>
                        <Ionicons name="trash-outline" size={18} color="#FF4A4A" />
                    </TouchableOpacity>
                </View>


                <EditProfileModal
                    isVisible={isModalVisible}
                    onClose={closeModal}
                    tempProfile={tempProfile}
                    setTempProfile={setTempProfile}
                    errors={errors}
                    setErrors={setErrors}
                    loading={loading}
                    handleSave={handleSave}
                    handleBufferPress={handleBufferPress}
                    showStartPicker={showStartPicker}
                    setShowStartPicker={setShowStartPicker}
                    showEndPicker={showEndPicker}
                    setShowEndPicker={setShowEndPicker}
                    parseTimeToDate={parseTimeToDate}
                    formatRequiredTime={formatRequiredTime}
                    DateTimePickerModalComponent={DateTimePickerModal}
                />

                <BufferTimeModal
                    isVisible={isBufferModalVisible}
                    onClose={() => setIsBufferModalVisible(false)}
                    currentBuffer={tempProfile.BufferTime}
                    onSelectBuffer={(opt) => setTempProfile({ ...tempProfile, BufferTime: opt })}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const InputField: React.FC<InputFieldProps> = ({ label, value }) => (
    <View style={styles.rowContainer}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.valueInput}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 40 },
    imageSection: { alignItems: 'center', marginVertical: 20, marginTop: 60 },
    imageContainer: { position: 'relative' },
    profileImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#00C2E8' },
    initialsContainer: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff', overflow: 'hidden' },
    initialsText: { color: '#fff', fontSize: 45, fontWeight: 'bold', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center', paddingBottom: 5, lineHeight: 55 },
    cameraIconBadge: { position: 'absolute', right: 0, bottom: 5, backgroundColor: '#fff', borderRadius: 15, padding: 6 },
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
    outlineButton: { borderWidth: 1, borderColor: '#00C2E8', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 25 },
    outlineButtonText: { color: '#0194b1', fontSize: 14, fontWeight: '600' },
    formSection: { paddingHorizontal: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 15, color: '#6e6e6e', marginTop: 35 },
    rowContainer: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 20, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
    labelText: { fontSize: 14, color: '#06a1c0', textAlign: 'right', width: 150 },
    valueInput: { fontSize: 14, fontWeight: '500', color: '#000000', flex: 1, textAlign: 'left' },
    errorText: { color: '#D32F2F', fontSize: 12, fontWeight: '500', textAlign: 'right', marginTop: 0.5, paddingRight: 5 },
    saveBtn: { backgroundColor: '#1A1A1A', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelText: { color: '#01829b', fontWeight: '600', textAlign: 'center', marginTop: 15 },
    footerSection: { margin: 40, alignItems: 'center', paddingHorizontal: 30 },
    deleteAccountBtn: { flexDirection: 'row', alignItems: 'center' },
    deleteAccountText: { color: '#FF4A4A', fontSize: 14, fontWeight: '500', marginRight: 8 },
});

export default ProfileScreen;