import LoadingScreen from '@/src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import apiClient from '../../api/apiClient';

type UserType = {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
};

interface Lesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  pickupLocation: string;
  priceAtBooking: number;
  tutor?: { user: UserType };
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

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(false as any);

  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/booking/myHistory');
      const bookings: Lesson[] = response.data || [];
      const now = new Date();
      const past = bookings.filter((b) => {
        if (!b.lessonDate || !b.endTime) return false;
        const end = new Date(`${b.lessonDate.split('T')[0]}T${b.endTime}`);
        return !isNaN(end.getTime()) && (b.status === 'completed' || end < now);
      });
      past.sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());
      setHistory(past);
    } catch (error) {
      console.error('שגיאה בטעינת היסטוריה', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonGoals = async (lessonId: string) => {
    try {
      setGoalsLoading(true);
      const response = await apiClient.get(`/booking/getGoals/${lessonId}`);
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error("Error fetching lesson goals for student:", error);
      setGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLessonPress = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setModalVisible(true);
    fetchLessonGoals(lesson.id);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('he-IL');

  const renderAvatar = (user?: UserType, customStyle = styles.avatar) => (
    user?.profileImage
      ? <Image source={{ uri: user.profileImage }} style={customStyle} />
      : <View style={[customStyle, styles.avatarPlaceholder]}>
        <Text style={styles.avatarInitial}>{user?.firstName?.[0]?.toUpperCase() || '?'}</Text>
      </View>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>שיעורים שבוצעו</Text>
          <Text style={styles.countText}>{history.length}</Text>
        </View>
      </View>
      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyCard}
              onPress={() => handleLessonPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.statusBadge}><Text style={styles.statusText}>בוצע</Text></View>
                <Text style={styles.dateText}>{formatDate(item.lessonDate)}</Text>
              </View>
              <View style={styles.cardMainRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.teacherName}>
                    {item.tutor?.user?.firstName || 'לא ידוע'} {item.tutor?.user?.lastName || ''}
                  </Text>
                  <Text style={styles.timeText}>{item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}</Text>
                </View>
                {renderAvatar(item.tutor?.user)}
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.moreDetails}>
                  <Ionicons name="information-circle-outline" size={22} color="#00A8B5" style={{ marginLeft: 6, marginTop: 2 }} />
                  <Text style={styles.detailsLink}>סיכום שיעור</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>אין שיעורים קודמים</Text>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>סיכום שיעור</Text>

            {selectedLesson && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalTutorRow}>
                  <View style={{ alignItems: 'flex-end', marginRight: 12, flex: 1 }}>
                    <Text style={styles.modalTeacherName}>
                      {selectedLesson.tutor?.user?.firstName || 'לא ידוע'} {selectedLesson.tutor?.user?.lastName || ''}
                    </Text>
                    <Text style={styles.modalDateText}>
                      {selectedLesson.startTime?.slice(0, 5)} - {selectedLesson.endTime?.slice(0, 5)} | {formatDate(selectedLesson.lessonDate)}
                    </Text>
                  </View>
                  {renderAvatar(selectedLesson.tutor?.user, styles.modalAvatar)}
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>נושאים, מדדים והערות</Text>

                {goalsLoading ? (
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
                  <Text style={styles.modalPriceLabel}>סכום ששולם:</Text>
                  <Text style={styles.modalPriceValue}>₪ {Math.floor(selectedLesson.priceAtBooking || 0)}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitleContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  countText: { color: '#a9a9a9', fontWeight: '500', marginRight: 15, fontSize: 15 },
  listContent: { padding: 20, paddingBottom: 50 },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { backgroundColor: '#E6F6F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#00A8B5', fontWeight: '600' },
  dateText: { color: '#888' },
  cardMainRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 5, marginBottom: 5 },
  infoColumn: { alignItems: 'flex-end', flex: 1 },
  teacherName: { fontWeight: '700', fontSize: 16 },
  timeText: { color: '#666' },
  avatar: { width: 45, height: 45, borderRadius: 25, marginLeft: 10 },
  avatarPlaceholder: { backgroundColor: '#0194b1', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: 'bold' },
  detailsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderColor: '#ececec' },
  detailsLink: { fontSize: 14, color: '#7d7d7d', includeFontPadding: false, textAlignVertical: 'center' },
  moreDetails: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', marginTop: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#bbb', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '85%', width: '100%' },
  closeButton: { position: 'absolute', left: 20, top: 20, backgroundColor: '#f1f5f9', padding: 7, borderRadius: 20, zIndex: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  modalBody: { width: '100%' },
  modalTutorRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 },
  modalAvatar: { width: 50, height: 50, borderRadius: 25, marginLeft: 12 },
  modalTeacherName: { fontSize: 17, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  modalDateText: { fontSize: 13.5, color: '#64748b', fontWeight: '500', textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: '#1e293b', textAlign: 'right', marginBottom: 10 },
  goalsListContainer: { marginBottom: 10, gap: 10 },
  goalCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  goalHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  goalTitleText: { color: '#334155', fontSize: 13.5, fontWeight: '600', textAlign: 'right', flex: 1 },
  triangleStarsContainer: { alignItems: 'center', justifyContent: 'center', },
  topStarRow: { alignItems: 'center', marginBottom: -2, },
  bottomStarsRow: { flexDirection: 'row-reverse', gap: 1, },
  noteBox: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#edf2f7' },
  noteItemText: { color: '#64748b', fontSize: 13, textAlign: 'right', flex: 1, lineHeight: 18 },
  noGoalsText: { color: '#94a3b8', fontSize: 13, textAlign: 'right', marginBottom: 15 },
  modalPriceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 20 },
  modalPriceLabel: { fontSize: 14, color: '#64748b' },
  modalPriceValue: { fontSize: 18, fontWeight: '700', color: '#00A8B5' }
});