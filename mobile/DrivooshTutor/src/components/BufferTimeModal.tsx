import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const BUFFER_DISPLAY_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 45, 60];

interface BufferTimeModalProps {
    isVisible: boolean;
    onClose: () => void;
    currentBuffer: number | null | undefined;
    onSelectBuffer: (opt: number) => void;
}

export const BufferTimeModal: React.FC<BufferTimeModalProps> = ({
    isVisible,
    onClose,
    currentBuffer,
    onSelectBuffer
}) => {
    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.pickerModalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.pickerModalContainer}>
                    <Text style={styles.pickerModalTitle}>מרווח זמן בין שיעורים</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {BUFFER_DISPLAY_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={styles.pickerOptionButton}
                                onPress={() => {
                                    onSelectBuffer(opt);
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.pickerOptionText,
                                    currentBuffer === opt && { color: '#0194b1', fontWeight: 'bold' }
                                ]}>
                                    {opt === 0 ? 'ללא הפסקה (0 דקות)' : `${opt} דקות`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.pickerCancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.pickerCancelText}>ביטול</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', },
    pickerModalContainer: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, maxHeight: 350, },
    pickerModalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#333', },
    pickerOptionButton: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', width: '100%', },
    pickerOptionText: { fontSize: 16, textAlign: 'center', color: '#444', },
    pickerCancelButton: { marginTop: 15, paddingVertical: 10, alignItems: 'center', },
    pickerCancelText: { fontSize: 16, color: '#FF3B30', fontWeight: '600', },
});