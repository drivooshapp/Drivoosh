import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Modal, Image, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moovitLogo from "../../assets/navigateLogos/moovitLogo.png";
import googleMapsLogo from "../../assets/navigateLogos/googleMapsLogo.png";
import wazeLogo from "../../assets/navigateLogos/wazeLogo.png";
import apiClient from '../../src/api/apiClient';

interface Booking {
    id: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    pickupLocation: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    priceAtBooking: string;
    notes: string | null;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        city: string;
    };
}

interface UpcomingLessonModalProps {
    visible: boolean;
    onClose: () => void;
    selectedBooking: Booking | null;
    bookingConfirmed: boolean;
    checkScale: Animated.Value;
    actionLoading: boolean;
    onApproveLesson: (bookingId: string) => void;
    onNavigateToApp: (address: string, app: 'waze' | 'google' | 'moovit') => void;
    onOpenProgress: () => void;
    onCallStudent: (phoneNumber: string) => void;
    onRefreshData?: () => void;
}

export default function UpcomingLessonModal({
    visible,
    onClose,
    selectedBooking,
    bookingConfirmed,
    checkScale,
    actionLoading,
    onApproveLesson,
    onNavigateToApp,
    onOpenProgress,
    onCallStudent,
    onRefreshData,
}: UpcomingLessonModalProps) {
    if (!selectedBooking) return null;

    const showApproveButton = selectedBooking.status === 'pending' && !bookingConfirmed;

    const handleCancelPress = () => {
        Alert.alert(
            "ביטול שיעור",
            `האם אתה בטוח שברצונך לבטל את השיעור עם ${selectedBooking.student?.firstName} ${selectedBooking.student?.lastName}?`,
            [
                { text: "לא", style: "cancel" },
                {
                    text: "כן, בטל שיעור",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await apiClient.put(`/booking/cancel/${selectedBooking.id}`);

                            if (response.data.success) {
                                Alert.alert("בוצע", "השיעור בוטל בהצלחה");
                                if (onRefreshData) {
                                    onRefreshData();
                                }
                                onClose();
                            } else {
                                Alert.alert("שגיאה", response.data.message || "שגיאה בביטול השיעור");
                            }
                        } catch (error) {
                            console.error("Error cancelling lesson:", error);
                            Alert.alert("שגיאה", "לא ניתן להתחבר לשרת");
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalDragHandle} />

                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Ionicons name="close" size={18} color="#0F172A" />
                    </TouchableOpacity>

                    <ScrollView style={styles.modalInnerBody} showsVerticalScrollIndicator={false}>
                        <View style={styles.modalUserHeader}>
                            {selectedBooking.student?.profileImage ? (
                                <Image source={{ uri: selectedBooking.student.profileImage }} style={styles.largeAvatar} />
                            ) : (
                                <View style={styles.largeAvatarPlaceholder}>
                                    <Text style={styles.largeAvatarText}>{selectedBooking.student?.firstName?.charAt(0)}</Text>
                                </View>
                            )}
                            <View style={styles.modalStudentNameContainer}>
                                <Text style={styles.modalStudentName}>
                                    {selectedBooking.student?.firstName} {selectedBooking.student?.lastName}
                                </Text>
                                <Text style={styles.modalTimeSub}>
                                    {selectedBooking.startTime.substring(0, 5)} - {selectedBooking.endTime?.substring(0, 5)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actionButtonsRow}>
                            {showApproveButton && (
                                <TouchableOpacity
                                    style={[styles.urgentApproveButton, actionLoading && { opacity: 0.6 }]}
                                    onPress={() => onApproveLesson(selectedBooking.id)}
                                    disabled={actionLoading}
                                    activeOpacity={0.8}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <View style={styles.urgentButtonContent}>
                                            <Ionicons name="checkmark-done-outline" style={styles.pulsingIcon} />
                                            <Text style={styles.urgentButtonText}>אשר שיעור</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionCancelLessonButton, !showApproveButton && styles.fullWidthCancelButton]}
                                onPress={handleCancelPress}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginLeft: 6 }} />
                                <Text style={styles.actionCancelButtonText}>בטל שיעור</Text>
                            </TouchableOpacity>
                        </View>

                        {bookingConfirmed && (
                            <View style={styles.successContainer}>
                                <Animated.View style={{ marginLeft: 8, transform: [{ scale: checkScale }] }}>
                                    <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                                </Animated.View>
                                <Text style={styles.successText}>השיעור מאושר</Text>
                            </View>
                        )}

                        <View style={styles.premiumCard}>
                            <View style={styles.cardHeaderRow}>
                                <Ionicons name="location-outline" size={16} color="#0F172A" />
                                <Text style={styles.premiumCardTitle}>מיקום איסוף</Text>
                            </View>
                            <View style={styles.cardContentInnerVertical}>
                                <Text style={styles.cleanAddressText}>{selectedBooking.pickupLocation}</Text>

                                <View style={styles.premiumNavigationRow}>
                                    <Text style={styles.premiumNavLabel}>ניווט מהיר באמצעות</Text>
                                    <View style={styles.premiumIconsGroup}>
                                        <TouchableOpacity style={styles.appIconWrapper} onPress={() => onNavigateToApp(selectedBooking.pickupLocation, 'waze')}>
                                            <Image source={wazeLogo} style={styles.appIconImage} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.appIconWrapper} onPress={() => onNavigateToApp(selectedBooking.pickupLocation, 'google')}>
                                            <Image source={googleMapsLogo} style={styles.appIconImage} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.appIconWrapper} onPress={() => onNavigateToApp(selectedBooking.pickupLocation, 'moovit')}>
                                            <Image source={moovitLogo} style={styles.appIconImage} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.premiumCard}>
                            <View style={styles.cardHeaderRow}>
                                <Ionicons name="document-text-outline" size={16} color="#0F172A" />
                                <Text style={styles.premiumCardTitle}>הערות מיוחדות מהתלמיד</Text>
                            </View>
                            <View style={styles.cardContentInnerVertical}>
                                <Text style={{ textAlign: 'right', color: '#8794a6', fontStyle: 'italic' }}>
                                    {selectedBooking.notes || 'אין הערות לשיעור זה'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.premiumCard}
                            activeOpacity={0.85}
                            onPress={onOpenProgress}
                        >
                            <View style={styles.cardHeaderRow}>
                                <Ionicons name="sparkles-outline" size={16} color="#0F172A" />
                                <Text style={styles.premiumCardTitle}>מטרות לימוד והתקדמות</Text>
                            </View>
                            <View style={styles.cardContentInner}>
                                <Text style={styles.premiumCardSub}>לחץ לצפייה בכרטיס התלמיד, ניהול יעדים וסימון מדדים</Text>
                                <Ionicons name="chevron-back" size={14} color="#64748B" style={styles.cardLeftArrow} />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.modalActionButtonsContainer}>
                            <TouchableOpacity
                                style={styles.actionSecondaryCallButton}
                                onPress={() => onCallStudent(selectedBooking.student?.phoneNumber)}
                            >
                                <Ionicons name="call-outline" size={16} color="#0F172A" style={{ marginLeft: 6 }} />
                                <Text style={styles.actionSecondaryButtonText}>ליצירת קשר טלפוני</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16, maxHeight: '88%' },
    modalDragHandle: { width: 40, height: 1, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalCloseButton: { position: 'absolute', top: 16, left: 20, backgroundColor: '#F1F5F9', borderRadius: 20, padding: 6 },
    modalInnerBody: { width: '100%' },
    successContainer: { width: '100%', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 16, paddingVertical: 15, marginBottom: 20, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
    successText: { fontSize: 15, fontWeight: '700', color: '#15803D' },
    modalUserHeader: { flexDirection: 'row-reverse', alignItems: 'center', paddingBottom: 16, marginBottom: 16 },
    largeAvatar: { width: 52, height: 52, borderRadius: 26 },
    largeAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#d0f5f9', justifyContent: 'center', alignItems: 'center' },
    largeAvatarText: { fontSize: 20, fontWeight: '700', color: '#019cbb' },
    modalStudentNameContainer: { marginRight: 14, flex: 1, alignItems: 'flex-end' },
    modalStudentName: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
    modalTimeSub: { fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: '600' },
    actionButtonsRow: { flexDirection: 'row-reverse', width: '100%', gap: 10, marginBottom: 20 },
    urgentApproveButton: { flex: 1, backgroundColor: '#019cbb', borderRadius: 16, paddingVertical: 14, shadowColor: '#019cbb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3, justifyContent: 'center', alignItems: 'center' },
    urgentButtonContent: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
    urgentButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
    pulsingIcon: { fontSize: 16, color: "#FFFFFF", marginLeft: 6, alignItems: 'center' },
    actionCancelLessonButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 16, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
    fullWidthCancelButton: { width: '100%', flex: undefined },
    actionCancelButtonText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
    premiumCard: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
    cardHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8, marginBottom: 10 },
    premiumCardTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', letterSpacing: 0.3 },
    cardContentInner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
    cardContentInnerVertical: { width: '100%', alignItems: 'flex-end' },
    premiumCardSub: { fontSize: 13, color: '#64748B', textAlign: 'right', flex: 1, lineHeight: 18, paddingLeft: 16 },
    cardLeftArrow: { alignSelf: 'center' },
    cleanAddressText: { fontSize: 15, fontWeight: '600', color: '#1E293B', textAlign: 'right', marginBottom: 12 },
    premiumNavigationRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 },
    premiumNavLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    premiumIconsGroup: { flexDirection: 'row-reverse', gap: 10 },
    appIconWrapper: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eef2f6', justifyContent: 'center', alignItems: 'center', padding: 6 },
    appIconImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    modalActionButtonsContainer: { width: '100%', marginTop: 10, gap: 10 },
    actionSecondaryCallButton: { width: '100%', backgroundColor: '#00d5ff', paddingVertical: 14, borderRadius: 16, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
    actionSecondaryButtonText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
});