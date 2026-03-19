import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, Text, TextInput, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, KeyboardTypeOptions, ActivityIndicator } from 'react-native';
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
}

const ProfileScreen: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/student/myProfile');
            setProfile(response.data);
        } catch (error) {
            console.error("שגיאה בטעינת הפרופיל:", error);
            Alert.alert('שגיאה', 'תקלה בהצגת נתוני משתמש');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof UserProfile, value: string) => {
        if (profile) {
            setProfile({ ...profile, [field]: value });
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00C2E8" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>לא נמצא מידע על המשתמש</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>פרופיל תלמיד</Text>
                </View>

                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: profile.profileImage || 'H' }}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity style={styles.cameraIconBadge}>
                            <Ionicons name="camera-outline" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.outlineButton}>
                        <Text style={styles.outlineButtonText}>הזמנת חבר</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.outlineButton}>
                        <Text style={styles.outlineButtonText}>מילוי קוד הזמנה</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>פרטים אישיים</Text>

                    <InputField
                        label="שם פרטי"
                        value={profile.firstName}
                        onChangeText={(val: string) => handleChange('firstName', val)}
                    />
                    <InputField
                        label="שם משפחה"
                        value={profile.lastName}
                        onChangeText={(val: string) => handleChange('lastName', val)}
                    />
                    <InputField
                        label="טלפון"
                        value={profile.phoneNumber}
                        keyboardType="phone-pad"
                        onChangeText={(val: string) => handleChange('phoneNumber', val)}
                    />
                    <InputField
                        label="מייל"
                        value={profile.email}
                        keyboardType="email-address"
                        onChangeText={(val: string) => handleChange('email', val)}
                    />

                    <Text style={[styles.sectionTitle, { marginTop: 30 }]}>כתובת</Text>

                    <InputField
                        label="עיר"
                        value={profile.city}
                        onChangeText={(val: string) => handleChange('city', val)}
                    />
                    <InputField
                        label="רחוב \ שכונה"
                        value={profile.street}
                        onChangeText={(val: string) => handleChange('street', val)}
                    />
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

interface InputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: KeyboardTypeOptions;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    value,
    onChangeText,
    keyboardType = 'default'
}) => (
    <View style={styles.rowContainer}>
        <Text style={styles.labelText}>{label}</Text>
        <TextInput
            style={styles.valueInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            textAlign="left"
            placeholder="הקלד..."
            placeholderTextColor="#ccc"
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { position: 'absolute', left: 20, top: 50 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    imageSection: { alignItems: 'center', marginVertical: 20 },
    imageContainer: { position: 'relative' },
    profileImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#abecfd' },
    cameraIconBadge: { position: 'absolute', right: 0, bottom: 5, backgroundColor: '#fff', borderRadius: 15, padding: 6, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2 },
    actionButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 30 },
    outlineButton: { borderWidth: 1, borderColor: '#4A78FF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20 },
    outlineButtonText: { color: '#4A78FF', fontSize: 13, fontWeight: '600' },
    formSection: { paddingHorizontal: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 15, color: '#888', letterSpacing: 0.5 },
    rowContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#dcdcdc',
        width: '100%',
    },
    labelText: {
        fontSize: 14,
        color: '#727272',
        textAlign: 'right',
        width: '100%',
    },
    valueInput: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 5,
        minHeight: 30,
    }
});

export default ProfileScreen;