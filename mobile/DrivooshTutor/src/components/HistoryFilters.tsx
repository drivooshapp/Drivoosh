import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface HistoryFiltersProps {
    isVisible: boolean;
    onClose: () => void;
    tempName: string; setTempName: (val: string) => void;
    tempCity: string; setTempCity: (val: string) => void;
    tempDate: string; setTempDate: (val: string) => void;
    tempPaid: 'all' | 'paid' | 'unpaid'; setTempPaid: (val: 'all' | 'paid' | 'unpaid') => void;
    onApply: () => void;
    onClear: () => void;
}

export default function HistoryFilters({
    isVisible, onClose, tempName, setTempName, tempCity, setTempCity, tempDate, setTempDate, tempPaid, setTempPaid, onApply, onClear
}: HistoryFiltersProps) {
    const [showDatePicker, setShowDatePicker] = useState(false);

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={styles.modalContent}
                        >

                            <View style={styles.modalHeaderRow}>
                                <TouchableOpacity onPress={onClear} activeOpacity={0.7}><Text style={styles.resetText}>נקה הכל</Text></TouchableOpacity>
                                <Text style={styles.modalTitle}>מסננים</Text>
                                <TouchableOpacity style={styles.closeButtonCircle} onPress={onClose} activeOpacity={0.7}><Ionicons name="close" size={16} color="#1A1A1A" /></TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.modalScrollView}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                            >
                                <View style={styles.modalBody}>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>שם התלמיד</Text>
                                        <View style={styles.modalInputWrapper}>
                                            <TextInput style={styles.modalInput} placeholder="חפש לפי שם" placeholderTextColor="#A3A3A3" value={tempName} onChangeText={setTempName} textAlign="right" />
                                            <Ionicons name="person-outline" size={16} color="#A3A3A3" style={styles.inputIcon} />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>עיר / אזור</Text>
                                        <View style={styles.modalInputWrapper}>
                                            <TextInput style={styles.modalInput} placeholder="איפה התלמיד גר?" placeholderTextColor="#A3A3A3" value={tempCity} onChangeText={setTempCity} textAlign="right" />
                                            <Ionicons name="map-outline" size={16} color="#A3A3A3" style={styles.inputIcon} />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>תאריך השיעור</Text>
                                        <TouchableOpacity style={styles.modalInputWrapper} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                                            <Text style={[styles.datePickerText, !tempDate && { color: '#A3A3A3' }]}>
                                                {tempDate || "בחר תאריך מהרשימה"}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={16} color="#A3A3A3" style={styles.inputIcon} />
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={tempDate ? (() => {
                                                    const [d, m, y] = tempDate.split('/');
                                                    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                                                })() : new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowDatePicker(false);
                                                    if (selectedDate) {
                                                        const day = String(selectedDate.getDate()).padStart(2, '0');
                                                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                                        const year = selectedDate.getFullYear();
                                                        setTempDate(`${day}/${month}/${year}`);
                                                    }
                                                }}
                                            />
                                        )}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>סטטוס תשלום</Text>
                                        <View style={styles.toggleRow}>
                                            <TouchableOpacity style={[styles.toggleBtn, tempPaid === 'paid' && styles.activePaidBtn]} onPress={() => setTempPaid(tempPaid === 'paid' ? 'all' : 'paid')} activeOpacity={0.8}>
                                                <Text style={[styles.toggleText, tempPaid === 'paid' && styles.activeToggleText]}>שולם</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.toggleBtn, tempPaid === 'unpaid' && styles.activeUnpaidBtn]} onPress={() => setTempPaid(tempPaid === 'unpaid' ? 'all' : 'unpaid')} activeOpacity={0.8}>
                                                <Text style={[styles.toggleText, tempPaid === 'unpaid' && styles.activeToggleText]}>לא שולם</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                </View>
                            </ScrollView>

                            <TouchableOpacity style={styles.primaryModalButton} onPress={onApply} activeOpacity={0.9}><Text style={styles.primaryButtonText}>החל סינון</Text></TouchableOpacity>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '85%' },
    modalHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    resetText: { fontSize: 15, color: '#019cbb', fontWeight: '600' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
    closeButtonCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    modalScrollView: { flexGrow: 0 },
    scrollContent: { paddingBottom: 10 },
    modalBody: { paddingTop: 4 },
    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 10, textAlign: 'right' },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, height: 54 },
    modalInput: { flex: 1, fontSize: 14, color: '#1A1A1A', marginRight: 10, height: '100%' },
    datePickerText: { flex: 1, fontSize: 14, color: '#1A1A1A', textAlign: 'right', marginRight: 10 },
    inputIcon: { marginLeft: 2 },
    toggleRow: { flexDirection: 'row-reverse', gap: 12 },
    toggleBtn: { flex: 1, height: 48, backgroundColor: '#F3F4F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    toggleText: { fontSize: 14, fontWeight: '600', color: '#737373' },
    activePaidBtn: { backgroundColor: '#E6F4EA', borderWidth: 1, borderColor: '#137333' },
    activeUnpaidBtn: { backgroundColor: '#FCE8E6', borderWidth: 1, borderColor: '#C5221F' },
    activeToggleText: { color: '#1A1A1A' },
    primaryModalButton: { backgroundColor: '#111111', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});