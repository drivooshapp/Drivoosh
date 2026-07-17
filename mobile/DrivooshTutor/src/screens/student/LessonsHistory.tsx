import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';
import LessonReviewModal from '../../components/LessonReviewModal';

interface Lesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  pickupLocation: string;
  priceAtBooking: number;
}

export default function LessonsHistory({ route, navigation }: any) {
  const { studentId } = route.params || {};
  const [history, setHistory] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const fetchHistory = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/student/studentHistory/${studentId}`);
      setHistory(response.data || []);
    } catch (error) {
      console.error('שגיאה בטעינת ההיסטוריה', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  const handleLessonPress = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setModalVisible(true);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('he-IL');

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyCard}
              onPress={() => handleLessonPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>בוצע</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.lessonDate)}</Text>
              </View>

              <View style={styles.cardMainRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.timeText}>
                    {item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}
                  </Text>
                  {item.pickupLocation ? (
                    <Text style={styles.locationText} numberOfLines={1}>
                      מיקום: {item.pickupLocation}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.moreDetails}>
                  <Ionicons name="information-circle-outline" size={20} color="#00A8B5" />
                  <Text style={styles.detailsLink}>סיכום שיעור</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={55} color="#ccc" />
          <Text style={styles.emptyText}>לא נמצאו שיעורים קודמים עם תלמיד זה</Text>
        </View>
      )}

      <LessonReviewModal 
        visible={modalVisible}
        lesson={selectedLesson}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitleContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  countText: { color: '#a9a9a9', fontWeight: '600', marginRight: 12, fontSize: 15 },
  backBtn: { padding: 4 },
  listContent: { padding: 20, paddingBottom: 60 },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: '#E6F6F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#00A8B5', fontWeight: '600', fontSize: 13 },
  dateText: { color: '#888', fontSize: 13 },
  cardMainRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  infoColumn: { alignItems: 'flex-end', flex: 1 },
  timeText: { fontSize: 16, fontWeight: '700', color: '#333' },
  locationText: { color: '#666', fontSize: 13.5, marginTop: 4 },
  detailsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderColor: '#ececec', paddingTop: 10 },
  moreDetails: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 6 },
  detailsLink: { fontSize: 13.5, color: '#00A8B5', fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#bbb', marginTop: 10, fontSize: 14 }
});