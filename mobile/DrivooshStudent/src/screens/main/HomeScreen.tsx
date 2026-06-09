import LoadingScreen from '@/src/components/LoadingScreen';
import ProgressCircle from '@/src/components/ProgressCircle';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  tutor?: {
    user: UserType;
  };
}

const getGreetingByTime = () => {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 18) return 'צהריים טובים';
  return 'ערב טוב';
};

const getLessonDateTime = (l: Lesson) =>
  new Date(`${l.lessonDate.split('T')[0]}T${l.startTime}`);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('he-IL');

const getDayName = (d: string) =>
  ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'][new Date(d).getDay()];

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState<string | null>('');
  const [tutorId, setTutorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openLessonDetails = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setModalVisible(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const profileRes = await apiClient.get('/student/myProfile');
      setUserName(profileRes.data?.firstName);
      const tutor = profileRes.data?.chosenTutor?.id;

      setTutorId(tutor);

      const lessonsRes = await apiClient.get(`/booking/myHistory/${tutor}`);

      const bookings: Lesson[] = lessonsRes.data || [];

      const now = new Date();

      const future = bookings
        .filter(b =>
          getLessonDateTime(b) > now &&
          (b.status === 'confirmed' || b.status === 'pending')
        )
        .sort((a, b) =>
          getLessonDateTime(a).getTime() - getLessonDateTime(b).getTime()
        );

      setNextLesson(future[0] || null);
      setUpcomingLessons(future.slice(1));

      setCompletedCount(
        bookings.filter(b =>
          b.status === 'completed' ||
          new Date(`${b.lessonDate.split('T')[0]}T${b.endTime}`) < now
        ).length
      );

    } catch (e) {
      console.error(e);
      Alert.alert("שגיאה", "בעיה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const STATUS_TRANSLATIONS: Record<string, string> = {
    pending: 'ממתין לאישור',
    confirmed: 'מאושר',
    completed: 'בוצע',
    cancelled: 'בוטל',
  };

  const getStatusColor = (status: string) => {
    return status === 'confirmed' ? '#18875b' : '#000000';
  };

  const handleLessonCancel = async (bookingId: string) => {
    Alert.alert('ביטול שיעור', 'האם אתה בטוח שברצונך לבטל את השיעור', [

      { text: 'חזור', style: 'cancel' },
      {
        text: 'בטל שיעור',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.put(`/booking/cancel/${bookingId}`);
            Alert.alert('בוצע', 'השיעור בוטל בהצלחה');
            fetchData();

          } catch (e: any) {
            console.error(e);
            const errorMessage = e.response?.data?.message || 'נסה שוב מאוחר יותר';
            Alert.alert('שגיאה', errorMessage);

          } finally {
            setLoading(false);
          }
        }
      }
    ])
  }

  const renderAvatar = (u?: UserType) =>
    u?.profileImage
      ? <Image source={{ uri: u.profileImage }} style={styles.teacherAvatar} />
      : (
        <View style={[styles.teacherAvatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>
            {u?.firstName?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      );

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.welcomeContainer}>
          <Text style={styles.headerTitle}>
            {getGreetingByTime()}
            {userName && (<><Text>, </Text>
              <Text style={styles.userNameText}>{userName}</Text></>)}
          </Text>
          <Text style={styles.headerSubtitle}>
            מה היעד הבא שלנו?
          </Text>
        </View>

        <Section
          title="לוח יעדים"
          action={
            <TouchableOpacity >
              <Ionicons name="eye-outline" size={22} color="#0194b1" />
            </TouchableOpacity>
          }
        >
          <View style={styles.progressWrapper}>
            <ProgressCircle
              progress={(completedCount / 52) * 100}
              size={135}
              strokeWidth={8}
            />

            <Text style={styles.goalsProgressText}>
              {`${completedCount} מתוך 52 הושלמו`}
            </Text>
          </View>
        </Section>

        {nextLesson && (
          <Section
            title="השיעור הקרוב"
            action={
              <TouchableOpacity onPress={() => handleLessonCancel(nextLesson.id)}>
                <Text style={styles.blueLink}>ביטול</Text>
              </TouchableOpacity>
            }
          >
            <View style={styles.nextLessonDetails}>

              <Row
                icon="time-outline"
                text={`${getDayName(nextLesson.lessonDate)}, ${formatDate(nextLesson.lessonDate)}\n${nextLesson.startTime.slice(0, 5)} - ${nextLesson.endTime.slice(0, 5)}`}
              />

              <Row icon="location-outline" text={nextLesson.pickupLocation} />

              <Row
                icon="information-circle-outline"
                text={
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>סטטוס: </Text>
                    <Text style={{ fontWeight: 'bold', color: getStatusColor(nextLesson.status) }}>
                      {STATUS_TRANSLATIONS[nextLesson.status] || nextLesson.status}
                    </Text>
                  </Text>
                }
              />
            </View>
          </Section>
        )}

        {upcomingLessons.length > 0 && (
          <Section title="שיעורים הבאים">
            <FlatList
              data={upcomingLessons}
              keyExtractor={i => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.upcomingLessonRow} onPress={() => openLessonDetails(item)}>
                  <Ionicons name="chevron-back" size={18} color="#ccc" />
                  <View style={styles.upcomingLessonText}>
                    <Text style={styles.upcomingTime}>
                      {`${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}`}
                    </Text>
                    <Text style={styles.upcomingDayDate}>
                      {formatDate(item.lessonDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Section>
        )}

        <Section title="שיעורים שבוצעו">
          <TouchableOpacity
            style={styles.prevLessonsRow}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="chevron-back-outline" size={20} color="#0194b1" />
            <Text style={styles.blueLink}>היסטוריית שיעורים קודמים</Text>
          </TouchableOpacity>
        </Section>

      </ScrollView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent //כיסוי מלא של המודל על המסך
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedLesson && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>פרטי שיעור</Text>
                </View>

                <View style={styles.modalBody}>
                  <Row icon="calendar-outline" text={`${getDayName(selectedLesson.lessonDate)}, ${formatDate(selectedLesson.lessonDate)}`} />
                  <Row icon="time-outline" text={`${selectedLesson.startTime.slice(0, 5)} - ${selectedLesson.endTime.slice(0, 5)}`} />
                  <Row icon="location-outline" text={selectedLesson.pickupLocation} />

                  <View style={styles.separator} />

                  <View style={styles.statusRowModal}>
                    <Row
                      icon="information-circle-outline"
                      text={
                        <View style={{ justifyContent: 'center' }}>
                          <Text style={{ fontWeight: 'bold', lineHeight: 24 }}>
                            <Text style={{ fontWeight: 'bold' }}>סטטוס: </Text>
                            <Text style={{ color: getStatusColor(selectedLesson.status) }}>
                              {STATUS_TRANSLATIONS[selectedLesson.status] || selectedLesson.status}</Text>
                          </Text>
                        </View>
                      }
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      handleLessonCancel(selectedLesson.id);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>ביטול שיעור</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Section = ({ title, children, action }: any) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeaderRow}>
      {action || <View />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Row = ({ icon, text }: { icon: any; text: any }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailText}>{text}</Text>
    <Ionicons name={icon} size={22} color="#555" style={styles.detailIcon} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  welcomeContainer: { paddingHorizontal: 24, paddingTop: 25, paddingBottom: 20, alignItems: 'flex-end', },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', textAlign: 'right', },
  userNameText: { color: '#0194b1', },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: '#aaafb0', marginTop: 4, textAlign: 'right', },
  progressWrapper: { alignItems: 'center', paddingVertical: 10 },
  goalsProgressText: { textAlign: 'center', color: '#666', marginTop: 10 },
  nextLessonCard: { backgroundColor: '#f0f9ff', borderColor: '#b3e5fc', borderWidth: 1.5 },
  sectionCard: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginTop: 15, borderWidth: 1, borderColor: '#edf2f400' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  blueLink: { color: '#0194b1', fontWeight: '700', fontSize: 15 },
  nextLessonDetails: { gap: 14, marginTop: 9 },
  detailRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  detailText: { textAlign: 'right', fontSize: 15, color: '#444', lineHeight: 22 },
  detailIcon: { marginLeft: 12 },
  teacherRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 5 },
  teacherAvatar: { width: 22, height: 22, borderRadius: 14, marginLeft: 10 },
  avatarPlaceholder: { backgroundColor: '#017f98', width: 22, height: 22, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  upcomingLessonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', alignItems: 'center' },
  upcomingLessonText: { alignItems: 'flex-end' },
  upcomingTime: { fontWeight: '700', color: '#333' },
  upcomingDayDate: { color: '#777', fontSize: 13 },
  prevLessonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 5, },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#018aa6', },
  modalBody: { gap: 15, },
  separator: { height: 1, backgroundColor: '#c5c5c5', marginVertical: 5, },
  statusRowModal: { alignItems: 'flex-end' },
  statusRow: { justifyContent: 'center', alignItems: 'center' },
  statusLabel: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#333', },
  cancelButton: { marginTop: 15, alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10 },
  cancelButtonText: { color: '#333', fontWeight: 'bold' },
});