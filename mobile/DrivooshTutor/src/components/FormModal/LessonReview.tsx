import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LessonReviewProps {
    visible: boolean;
    goalTitle: string;
    initialRating: number;
    initialNotes: string;
    initialChecked: boolean;
    onClose: () => void;
    onSave: (rating: number, notes: string, isChecked: boolean) => void;
}

export default function LessonReview({
    visible,
    goalTitle,
    initialRating,
    initialNotes,
    initialChecked,
    onClose,
    onSave
}: LessonReviewProps) {
    const [rating, setRating] = useState(initialRating < 1 ? 1 : initialRating);
    const [notes, setNotes] = useState(initialNotes);
    const [isChecked, setIsChecked] = useState(initialChecked);

    const [showError, setShowError] = useState(false);

    useEffect(() => {
        setRating(initialRating < 1 ? 1 : initialRating);
        setNotes(initialNotes);
        setIsChecked(initialChecked);
        setShowError(false);
    }, [initialRating, initialNotes, initialChecked, visible]);

    const handleSave = () => {
        if (!isChecked) {
            setShowError(true);
            return;
        }

        setShowError(false);
        onSave(rating, notes, isChecked);
        onClose();
    };

    const handleCheckboxToggle = () => {
        const newValue = !isChecked;
        setIsChecked(newValue);
        if (newValue) {
            setShowError(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={22} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>הערכת יעד לימודי</Text>

                    <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                        <Text style={styles.goalTitleText}>{goalTitle}</Text>

                        <View style={styles.divider} />

                        {showError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={18} color="#e53e3e" style={{ marginLeft: 6 }} />
                                <Text style={styles.errorText}>חובה לסמן את התיבה על מנת לשמור את השינויים בטופס</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.checkboxRow,
                                showError && styles.checkboxRowError
                            ]}
                            onPress={handleCheckboxToggle}
                        >
                            <Text style={styles.checkboxLabel}>סומן כהושלם בטופס הירוק</Text>
                            <View style={[
                                styles.checkbox,
                                isChecked && styles.checkboxActive,
                                showError && { borderColor: '#e53e3e' }
                            ]}>
                                {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.sectionTitle}>רמת שליטה (1-3 כוכבים)</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    onPress={() => setRating(num)}
                                    style={styles.starTouch}
                                >
                                    <Ionicons
                                        name={num <= rating ? "star" : "star-outline"}
                                        size={32}
                                        color={num <= rating ? "#FFD700" : "#CCC"}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>משוב והערות על השיעור (אופציונלי)</Text>
                        <TextInput
                            style={styles.notesInput}
                            multiline
                            numberOfLines={4}
                            placeholder="רשום כאן דגשים, נקודות לשיפור או לשימור לתלמיד..."
                            placeholderTextColor="#999"
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>שמור שינויים</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', alignItems: 'center' },
    closeButton: { position: 'absolute', left: 20, top: 20, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 20, zIndex: 10 },
    modalTitle: { fontSize: 19, fontWeight: '700', color: '#333', marginBottom: 10, textAlign: 'center' },
    goalTitleText: { fontSize: 15, fontWeight: '600', color: '#4a5568', textAlign: 'center', paddingHorizontal: 10, lineHeight: 22 },
    modalBody: { width: '100%', marginTop: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', textAlign: 'right', marginBottom: 8, marginTop: 12 },
    checkboxRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 8, marginBottom: 10, borderRadius: 8, paddingHorizontal: 4 },
    checkboxRowError: { backgroundColor: '#fff5f5' },
    checkboxLabel: { fontSize: 14, color: '#4a5568', marginRight: 10, fontWeight: '600' },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#00A8B5', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#00A8B5' },
    starsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 15, marginVertical: 10 },
    starTouch: { padding: 5 },
    notesInput: { backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, height: 100, textAlign: 'right', fontSize: 14, color: '#333', textAlignVertical: 'top' },
    saveButton: { backgroundColor: '#00A8B5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: Platform.OS === 'ios' ? 20 : 10 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    errorContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff5f5', borderColor: '#feb2b2', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10, },
    errorText: { color: '#c53030', fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 }
});