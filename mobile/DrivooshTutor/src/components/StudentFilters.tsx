import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudentFilterModalProps {
  visible: boolean;
  onClose: () => void;
  tempSearchQuery: string;
  setTempSearchQuery: (query: string) => void;
  tempInactiveOnly: boolean;
  setTempInactiveOnly: (val: boolean) => void;
  tempUnpaidOnly: boolean;
  setTempUnpaidOnly: (val: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}

export default function StudentFilterModal({
  visible,
  onClose,
  tempSearchQuery,
  setTempSearchQuery,
  tempInactiveOnly,
  setTempInactiveOnly,
  tempUnpaidOnly,
  setTempUnpaidOnly,
  onApply,
  onClear,
}: StudentFilterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
                  <Text style={styles.resetText}>נקה הכל</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>סינון תלמידים</Text>

                <TouchableOpacity
                  style={styles.closeButtonCircle}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#1A1A1A" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>חיפוש לפי שם</Text>
                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="person-outline" size={16} color="#A3A3A3" />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="שם פרטי או משפחה"
                      placeholderTextColor="#A3A3A3"
                      value={tempSearchQuery}
                      onChangeText={setTempSearchQuery}
                      textAlign="right"
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>מיקוד לפי קטגוריות</Text>
                <View style={styles.gridContainer}>
                  <TouchableOpacity
                    style={[styles.gridBox, tempInactiveOnly && styles.activeGridBox]}
                    onPress={() => setTempInactiveOnly(!tempInactiveOnly)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash-off-outline" size={22} color={tempInactiveOnly ? '#019cbb' : '#737373'} />
                    <Text style={[styles.gridBoxText, tempInactiveOnly && styles.activeGridBoxText]}>
                      לא פעילים
                    </Text>
                    <Text style={styles.gridBoxSub}>מעל 3 שבועות</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.gridBox, tempUnpaidOnly && styles.activeGridBox]}
                    onPress={() => setTempUnpaidOnly(!tempUnpaidOnly)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="card-outline" size={22} color={tempUnpaidOnly ? '#019cbb' : '#737373'} />
                    <Text style={[styles.gridBoxText, tempUnpaidOnly && styles.activeGridBoxText]}>
                      לא שולם
                    </Text>
                    <Text style={styles.gridBoxSub}>שיעורים פתוחים</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryModalButton}
                onPress={onApply}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>החל סינון</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
  modalHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  resetText: { fontSize: 14, color: '#019cbb', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  closeButtonCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  modalBody: { marginBottom: 24, gap: 16 },
  inputGroup: { width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, textAlign: 'right' },
  modalInputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  modalInput: { flex: 1, height: '100%', fontSize: 14, color: '#1A1A1A', marginRight: 8 },
  gridContainer: { flexDirection: 'row-reverse', gap: 12 },
  gridBox: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'flex-end', borderWidth: 1, borderColor: 'transparent' },
  activeGridBox: { backgroundColor: '#F0FBFC', borderColor: '#019cbb' },
  gridBoxText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginTop: 8, marginBottom: 2 },
  activeGridBoxText: { color: '#019cbb' },
  gridBoxSub: { fontSize: 11, color: '#737373' },
  primaryModalButton: { backgroundColor: '#1A1A1A', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});