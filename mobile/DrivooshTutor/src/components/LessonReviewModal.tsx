import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Lesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  pickupLocation: string;
  priceAtBooking: number;
}

interface LessonReviewModalProps {
  visible: boolean;
  lesson: Lesson | null;
  onClose: () => void;
}

export default function LessonReviewModal({ visible, lesson, onClose }: LessonReviewModalProps) {
  if (!lesson) return null;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('he-IL');

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>סיכום שיעור</Text>

          <View style={styles.modalBody}>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalDateText}>
                {lesson.startTime?.slice(0, 5)} - {lesson.endTime?.slice(0, 5)}  •  {formatDate(lesson.lessonDate)}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>נושאים שתורגלו</Text>
            <View style={styles.topicsContainer}>
              <View style={styles.topicTag}><Text style={styles.topicTagText}>חניה במקביל</Text></View>
              <View style={styles.topicTag}><Text style={styles.topicTagText}>נסיעה בינעירונית</Text></View>
              <View style={styles.topicTag}><Text style={styles.topicTagText}>השתלבות בתנועה</Text></View>
            </View>

            <Text style={styles.sectionTitle}>הערות שנרשמו</Text>
            <Text style={styles.notesText}>
              "הפגנת שליטה טובה מאוד בהגה ובתכנון הנסיעה קדימה. יש לשים לב יותר למראות בזמן מעבר נתיב ולהאט קצת יותר לפני כיכרות."
            </Text>

            <View style={styles.divider} />

            <View style={styles.modalPriceRow}>
              <Text style={styles.modalPriceLabel}>סכום שנגבה עבור השיעור:</Text>
              <Text style={styles.modalPriceValue}>₪ {Math.floor(lesson.priceAtBooking || 0)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '52%', alignItems: 'center' },
  closeButton: { position: 'absolute', left: 20, top: 20, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 20 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#333', marginBottom: 25, textAlign: 'center' },
  modalBody: { width: '100%' },
  modalMetaRow: { alignItems: 'flex-end' },
  modalDateText: { fontSize: 14, color: '#666' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', textAlign: 'right', marginBottom: 10 },
  topicsContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 15 },
  topicTag: { backgroundColor: '#f0f2f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 8, marginBottom: 8 },
  topicTagText: { color: '#4a5568', fontSize: 13, fontWeight: '500' },
  notesText: { color: '#4a5568', textAlign: 'right', fontSize: 13.5, lineHeight: 22, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, overflow: 'hidden' },
  modalPriceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  modalPriceLabel: { fontSize: 14, color: '#666' },
  modalPriceValue: { fontSize: 18, fontWeight: '700', color: '#00A8B5' }
});