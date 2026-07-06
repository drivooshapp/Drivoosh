import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


interface EditProfileModalProps {
    isVisible: boolean;
    onClose: () => void;
    tempProfile: any;
    setTempProfile: (profile: any) => void;
    errors: any;
    setErrors: (errors: any) => void;
    loading: boolean;
    handleSave: () => void;
    handleBufferPress: () => void;
    showStartPicker: boolean;
    setShowStartPicker: (val: boolean) => void;
    showEndPicker: boolean;
    setShowEndPicker: (val: boolean) => void;
    parseTimeToDate: (time: string) => Date;
    formatRequiredTime: (date: Date) => string;
    DateTimePickerModalComponent: any;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isVisible,
    onClose,
    tempProfile,
    setTempProfile,
    errors,
    setErrors,
    loading,
    handleSave,
    handleBufferPress,
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    parseTimeToDate,
    formatRequiredTime,
    DateTimePickerModalComponent: DateTimePickerModal
}) => {
    return (
        <Modal visible={isVisible} animationType="fade" transparent={true} statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalHeader}>עדכון פרטים</Text>
                    <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                        {[
                            { key: 'firstName', placeholder: 'שם פרטי', keyboard: 'default' },
                            { key: 'lastName', placeholder: 'שם משפחה', keyboard: 'default' },
                            { key: 'identityNumber', placeholder: 'מספר זהות', keyboard: 'phone-pad' },
                            { key: 'phoneNumber', placeholder: 'טלפון', keyboard: 'phone-pad' },
                            { key: 'city', placeholder: 'עיר', keyboard: 'default' },
                            { key: 'street', placeholder: 'רחוב', keyboard: 'default' },
                            { key: 'experienceYears', placeholder: 'מספר שנות ניסיון', keyboard: 'number-pad' },
                            { key: 'carModel', placeholder: 'דגם רכב', keyboard: 'default' },
                            { key: 'pricePerLesson', placeholder: 'מחיר לשיעור (₪)', keyboard: 'number-pad' },
                            { key: 'lessonDuration', placeholder: 'משך שיעור בדקות\n(ברירת מחדל 45)', keyboard: 'number-pad' },
                            { key: 'BufferTime', placeholder: 'מרווח בין שיעורים בדקות\n(ברירת מחדל 15)', keyboard: 'number-pad' },
                            { key: 'bio', placeholder: 'קצת עליי', keyboard: 'default', multiline: true },
                        ].map((field) => {
                            const isBio = field.key === 'bio';
                            const isBuffer = field.key === 'BufferTime';

                            return (
                                <View key={field.key} style={{ width: '100%', marginBottom: 15 }}>
                                    <View style={[
                                        isBio ? styles.bioInputWrapper : styles.modalInputWrapper,
                                        errors[field.key] && (isBio ? { borderColor: '#D32F2F' } : { borderBottomColor: '#D32F2F' })
                                    ]}>
                                        <Ionicons
                                            name="pencil-sharp"
                                            size={14}
                                            color="#cccccc"
                                            style={[
                                                { marginRight: 6 },
                                                isBio && { marginTop: Platform.OS === 'ios' ? 4 : 6 }
                                            ]}
                                        />

                                        {isBuffer ? (
                                            <TouchableOpacity
                                                onPress={handleBufferPress}
                                                style={[styles.modalInput, { justifyContent: 'center', height: 40 }]}
                                            >
                                                <Text style={{
                                                    textAlign: 'right',
                                                    color: tempProfile.BufferTime !== undefined && tempProfile.BufferTime !== null ? '#333' : '#BDBDBD',
                                                    fontSize: 16
                                                }}>
                                                    {tempProfile.BufferTime !== undefined && tempProfile.BufferTime !== null
                                                        ? (tempProfile.BufferTime === 0 ? 'ללא הפסקה' : `${tempProfile.BufferTime} דקות`)
                                                        : 'לחץ לבחירת מרווח זמן'}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TextInput
                                                style={[
                                                    styles.modalInput,
                                                    {
                                                        color: (String(tempProfile[field.key] || '')).trim() ? '#333' : '#BDBDBD',
                                                        textAlign: 'right'
                                                    },
                                                    isBio && {
                                                        height: '100%',
                                                        textAlignVertical: 'top',
                                                        paddingTop: 0,
                                                        paddingBottom: 0
                                                    }
                                                ]}
                                                placeholder={field.placeholder}
                                                placeholderTextColor="#b3b3b3"
                                                value={tempProfile[field.key] !== undefined && tempProfile[field.key] !== null ? String(tempProfile[field.key]) : ''}
                                                keyboardType={field.keyboard as KeyboardTypeOptions}
                                                multiline={field.multiline}
                                                onChangeText={(val) => {
                                                    if (errors[field.key]) {
                                                        setErrors((prev: any) => { const copy = { ...prev }; delete copy[field.key]; return copy; });
                                                    }
                                                    setTempProfile({ ...tempProfile, [field.key]: val });
                                                }}
                                            />
                                        )}
                                    </View>
                                    {errors[field.key] ? (
                                        <Text style={styles.errorText}>{errors[field.key]}</Text>
                                    ) : null}
                                </View>
                            );
                        })}

                        <Text style={styles.modalSubHeader}>שעות פעילות</Text>

                        <View style={styles.timePickersRow}>
                            <View style={{ flex: 0.48 }}>
                                <Text style={{ fontSize: 12, color: '#727272', textAlign: 'center', marginBottom: 4 }}>סיום</Text>
                                <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowEndPicker(true)}>
                                    <Ionicons name="time-outline" size={18} color="#0194b1" />
                                    <Text style={styles.timePickerButtonText}>
                                        {tempProfile.workEndHour || '20:00'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 0.48 }}>
                                <Text style={{ fontSize: 12, color: '#727272', textAlign: 'center', marginBottom: 4 }}>התחלה</Text>
                                <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowStartPicker(true)}>
                                    <Ionicons name="time-outline" size={18} color="#0194b1" />
                                    <Text style={styles.timePickerButtonText}>
                                        {tempProfile.workStartHour || '08:00'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {showStartPicker && (
                            <DateTimePickerModal
                                isVisible={showStartPicker}
                                mode="time"
                                is24Hour={true}
                                date={parseTimeToDate(tempProfile.workStartHour)}
                                onValueChange={(selectedDate: Date) => {
                                    if (selectedDate) {
                                        setTempProfile({ ...tempProfile, workStartHour: formatRequiredTime(selectedDate) });
                                    }
                                }}
                                onDismiss={() => setShowStartPicker(false)}
                                onCancel={() => setShowStartPicker(false)}
                                confirmTextIOS="אישור"
                                cancelTextIOS="ביטול"
                                buttonTextColorIOS="#00C2E8"
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePickerModal
                                isVisible={showEndPicker}
                                mode="time"
                                is24Hour={true}
                                date={parseTimeToDate(tempProfile.workEndHour)}
                                onValueChange={(selectedDate: Date) => {
                                    if (selectedDate) {
                                        setTempProfile({ ...tempProfile, workStartHour: formatRequiredTime(selectedDate) });
                                    }
                                }}
                                onDismiss={() => setShowStartPicker(false)}
                                onCancel={() => setShowEndPicker(false)}
                                confirmTextIOS="אישור"
                                cancelTextIOS="ביטול"
                                buttonTextColorIOS="#00C2E8"
                            />
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.saveBtn, loading && { opacity: 0.7 }, { marginTop: 15 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>שמור שינויים</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelText}>ביטול</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 15, padding: 25, elevation: 10 },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#d7d7d7', borderBottomWidth: 1.5, marginBottom: 15, paddingHorizontal: 5 },
    modalInput: { flex: 1, paddingVertical: 8, textAlign: 'right', fontSize: 15, color: '#333' },
    bioInputWrapper: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 8, backgroundColor: '#f1f1f1', paddingHorizontal: 12, paddingVertical: 10, height: 80, },
    modalSubHeader: { fontSize: 14, fontWeight: 'bold', color: '#4ba1b2', marginTop: 10, marginBottom: 10, textAlign: 'right' },
    timePickersRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    timePickerButton: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00C2E8', borderRadius: 10, paddingVertical: 12, backgroundColor: '#f9fefg' },
    timePickerButtonText: { marginLeft: 6, fontSize: 13, color: '#0194b1', fontWeight: '500' },
    errorText: { color: '#D32F2F', fontSize: 12, fontWeight: '500', textAlign: 'right', marginTop: 0.5, paddingRight: 5 },
    saveBtn: { backgroundColor: '#1A1A1A', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    cancelText: { color: '#01829b', fontWeight: '600', textAlign: 'center', marginTop: 15 },
    footerSection: { margin: 40, alignItems: 'center', paddingHorizontal: 30 },
    deleteAccountBtn: { flexDirection: 'row', alignItems: 'center' },
    deleteAccountText: { color: '#FF4A4A', fontSize: 14, fontWeight: '500', marginRight: 8 },
    pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', },
    pickerModalContainer: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, maxHeight: 350, },
    pickerModalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#333', },
    pickerOptionButton: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', width: '100%', },
    pickerOptionText: { fontSize: 16, textAlign: 'center', color: '#444', },
    pickerCancelButton: { marginTop: 15, paddingVertical: 10, alignItems: 'center', },
    pickerCancelText: { fontSize: 16, color: '#FF3B30', fontWeight: '600', },
});