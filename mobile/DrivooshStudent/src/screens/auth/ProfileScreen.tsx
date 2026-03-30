import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Modal, StyleSheet, View, Text, TextInput, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, KeyboardTypeOptions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const [tempProfile, setTempProfile] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

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

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await apiClient.put('/student/updateProfile', tempProfile);

            setProfile(response.data.user);

            await AsyncStorage.setItem('isSetupComplete', 'true');

            setModalVisible(false);
            Alert.alert("הצלחה", "הפרופיל עודכן בהצלחה!");

            if (onSetupComplete) {
                onSetupComplete();
            }
        } catch (error) {
            console.error("Update Error:", error);
            Alert.alert("שגיאה", "לא הצלחנו לעדכן את הנתונים");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#4A78FF" />
            </View>
        );
    }

    if (!profile) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} >

                <Modal visible={isModalVisible} animationType="fade" transparent={true}>
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
                                <View key={field.key} style={styles.modalInputWrapper}>
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
                                        onChangeText={(val) => setTempProfile({ ...tempProfile, [field.key]: val })}
                                    />
                                </View>
                            ))}

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>שמור שינויים</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setModalVisible(false)}>
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

                    <Text style={[styles.sectionTitle, { marginTop: 30 }]}>כתובת</Text>

                    <InputField label="עיר" value={profile.city || ''} editable={false} />
                    <InputField label="רחוב" value={profile.street || ''} editable={false} />
                </View>

                <View style={styles.footerSection}>
                    <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
                        <Ionicons name="trash-outline" size={18} color="#FF4A4A" />
                        <Text style={styles.deleteAccountText}>מחיקת חשבון לצמיתות</Text>
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
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
    outlineButton: { borderWidth: 1, borderColor: '#00C2E8', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 25 },
    outlineButtonText: { color: '#00C2E8', fontSize: 14, fontWeight: '600' },
    formSection: { paddingHorizontal: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 15, color: '#888' },
    rowContainer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee', },
    labelText: { fontSize: 14, color: '#727272', textAlign: 'right', width: 80 },
    valueInput: { fontSize: 14, fontWeight: '500', color: '#000000', flex: 1, textAlign: 'left' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 4, padding: 25, elevation: 10 },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#ccc', borderBottomWidth: 1.5, marginBottom: 15, paddingHorizontal: 5 },
    modalInput: { flex: 1, paddingVertical: 8, textAlign: 'right', fontSize: 15, color: '#333' },
    saveBtn: { backgroundColor: '#00C2E8', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontWeight: 'bold' },
    cancelText: { color: '#cf2d24', textAlign: 'center', marginTop: 15 },

    footerSection: {
        marginTop: 50,
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 20,
    },
    deleteAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    deleteAccountText: {
        color: '#FF4A4A',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    }
});

export default ProfileScreen;