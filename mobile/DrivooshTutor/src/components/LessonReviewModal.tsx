import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/api/apiClient';

interface Lesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  pickupLocation: string;
  priceAtBooking: number;
}

interface GoalProgress {
  id: string;
  isChecked: boolean;
  rating: number;
  notes: string;
  goalDetails?: {
    title: string;
  };
}

interface LessonReviewModalProps {
  visible: boolean;
  lesson: Lesson | null;
  onClose: () => void;
}

export default function LessonReviewModal({ visible, lesson, onClose }: LessonReviewModalProps) {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && lesson?.id) {
      fetchLessonGoals(lesson.id);
    } else {
      setGoals([]);
    }
  }, [visible, lesson]);

  const fetchLessonGoals = async (lessonId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/booking/getGoals/${lessonId}`);
      const fetchedGoals = response.data.goals || [];
      setGoals(fetchedGoals);
    } catch (error) {
      console.error("Error fetching lesson goals:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>סיכום שיעור</Text>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalDateText}>
                {lesson.startTime?.slice(0, 5)} - {lesson.endTime?.slice(0, 5)}  •  {formatDate(lesson.lessonDate)}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>נושאים, מדדים והערות</Text>

            {loading ? (
              <ActivityIndicator size="small" color="#00A8B5" style={{ marginVertical: 20 }} />
            ) : goals.length > 0 ? (
              <View style={styles.goalsListContainer}>
                {goals.map((item) => (
                  <View key={item.id} style={styles.goalCard}>
                    <View style={styles.goalHeaderRow}>
                      <Text style={styles.goalTitleText}>{item.goalDetails?.title || 'מטרה'}</Text>

                      <View style={styles.triangleStarsContainer}>
                        <View style={styles.topStarRow}>
                          <Ionicons
                            name={1 <= (item.rating || 0) ? "star" : "star-outline"}
                            size={13}
                            color="#F59E0B"
                          />
                        </View>
                        <View style={styles.bottomStarsRow}>
                          <Ionicons
                            name={2 <= (item.rating || 0) ? "star" : "star-outline"}
                            size={13}
                            color="#F59E0B"
                          />
                          <Ionicons
                            name={3 <= (item.rating || 0) ? "star" : "star-outline"}
                            size={13}
                            color="#F59E0B"
                            style={{ marginRight: 4 }}
                          />
                        </View>
                      </View>
                    </View>

                    {item.notes && item.notes.trim().length > 0 && (
                      <View style={styles.noteBox}>
                        <Ionicons name="chatbubble-outline" size={12} color="#718096" style={{ marginLeft: 6, marginTop: 2 }} />
                        <Text style={styles.noteItemText}>{item.notes}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noGoalsText}>לא הוזנו מטרות לשיעור זה</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.modalPriceRow}>
              <Text style={styles.modalPriceLabel}>סכום שנגבה עבור השיעור:</Text>
              <Text style={styles.modalPriceValue}>₪ {Math.floor(lesson.priceAtBooking || 0)}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '85%', width: '100%' },
  closeButton: { position: 'absolute', left: 20, top: 20, backgroundColor: '#f1f5f9', padding: 7, borderRadius: 20, zIndex: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  modalBody: { width: '100%' },
  modalMetaRow: { alignItems: 'flex-end' },
  modalDateText: { fontSize: 13.5, color: '#64748b', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: '#1e293b', textAlign: 'right', marginBottom: 10 },
  goalsListContainer: { marginBottom: 10, gap: 10 },
  goalCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  goalHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  goalTitleText: { color: '#334155', fontSize: 13.5, fontWeight: '600', textAlign: 'right', flex: 1 },
  triangleStarsContainer: { alignItems: 'center', justifyContent: 'center', },
  topStarRow: { alignItems: 'center', marginBottom: -2, },
  bottomStarsRow: { flexDirection: 'row-reverse', gap: 4, },
  noteBox: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#edf2f7' },
  noteItemText: { color: '#64748b', fontSize: 13, textAlign: 'right', flex: 1, lineHeight: 18 },
  noGoalsText: { color: '#94a3b8', fontSize: 13, textAlign: 'right', marginBottom: 15 },
  modalPriceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 20 },
  modalPriceLabel: { fontSize: 14, color: '#64748b' },
  modalPriceValue: { fontSize: 18, fontWeight: '700', color: '#00A8B5' }
});