import LoadingScreen from '@/src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

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

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLessonPress = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setModalVisible(true);
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
                  <Ionicons name="information-circle-outline" size={22} color="#00A8B5" style={{ marginLeft: 6, marginTop:2}} />
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
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>סיכום שיעור</Text>

            {selectedLesson && (
              <View style={styles.modalBody}>
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

                <Text style={styles.sectionTitle}>מה תרגלנו בשיעור?</Text>
                <View style={styles.topicsContainer}>
                  <View style={styles.topicTag}><Text style={styles.topicTagText}>חניה במקביל</Text></View>
                  <View style={styles.topicTag}><Text style={styles.topicTagText}>נסיעה בינעירונית</Text></View>
                  <View style={styles.topicTag}><Text style={styles.topicTagText}>השתלבות בתנועה</Text></View>
                  <View style={styles.topicTag}><Text style={styles.topicTagText}>זינוק בעלייה</Text></View>
                </View>

                <Text style={styles.sectionTitle}>הערות המורה:</Text>
                <Text style={styles.notesText}>
                  "הפגנת שליטה טובה מאוד בהגה ובתכנון הנסיעה קדימה. יש לשים לב יותר למראות בזמן מעבר נתיב ולהאט קצת יותר לפני כיכרות. סך הכל שיעור מצוין!"
                </Text>

                <View style={styles.divider} />

                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalPriceLabel}>סכום ששולם:</Text>
                  <Text style={styles.modalPriceValue}>₪ {Math.floor(selectedLesson.priceAtBooking)}</Text>
                </View>
              </View>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', },
  countText: { color: '#a9a9a9', fontWeight: '500', marginRight: 15, fontSize: 15 },
  listContent: { padding: 20 },
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
  moreDetails: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', marginTop: 12, },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#bbb', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'hsla(0, 0%, 0%, 0.50)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '55%', alignItems: 'center' },
  closeButton: { position: 'absolute', left: 20, top: 20, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  modalBody: { width: '100%' },
  modalTutorRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 15 },
  modalAvatar: { width: 55, height: 55, borderRadius: 30, marginLeft: 12 },
  modalTeacherName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalDateText: { fontSize: 14, color: '#666', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', textAlign: 'right', marginBottom: 10 },
  topicsContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 15 },
  topicTag: { backgroundColor: '#f0f2f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 8, marginBottom: 8 },
  topicTagText: { color: '#4a5568', fontSize: 13, fontWeight: '500' },
  notesText: { color: '#4a5568', textAlign: 'right', fontSize: 14, lineHeight: 22, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12 },
  modalPriceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  modalPriceLabel: { fontSize: 15, color: '#666' },
  modalPriceValue: { fontSize: 18, fontWeight: 'bold', color: '#00A8B5' }
});