import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const mockGoals = { completed: 3, total: 52 };
const mockNextLesson = {
  day: 'יום ראשון',
  date: '02.01.2022',
  startTime: '08:00',
  endTime: '09:00',
  pickupLocation: 'פתח תקווה, רחוב תקווה 8',
  teacher: { name: 'משה כהן', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  car: 'טויוטה קורולה, אוטומט',
  price: 120,
};
const mockUpcomingLessons = [
  { id: '1', day: 'יום ראשון', date: '02.01.2022', time: '09:00 - 10:00' },
  { id: '2', day: 'יום ראשון', date: '02.01.2022', time: '09:00 - 10:00' },
  { id: '3', day: 'יום ראשון', date: '02.01.2022', time: '09:00 - 10:00' },
];

const getGreetingByTime = () => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) return 'בוקר טוב';
  if (currentHour < 18) return 'צהריים טובים';
  return 'ערב טוב';
};

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        setUserName(name);
      } catch (error) {
        console.error("טעינת שם משתמש נכשלה", error);
      }
    };
    checkUser();
  }, []);

  const handleLessonCancel = (lessonId?: string) => {
    Alert.alert("ביטול שיעור", "האם אתה בטוח שברצונך לבטל את השיעור?");
  };

  const greeting = getGreetingByTime();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.headerTitle}>{`${greeting}, ${userName}`}</Text>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity><Text style={styles.blueLink}>לצפייה</Text></TouchableOpacity>
            <Text style={styles.sectionTitle}>טופס מטרות</Text>
          </View>
          <Text style={styles.goalsProgressText}>
            {`${mockGoals.completed} מתוך ${mockGoals.total} הושלמו`}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity onPress={() => handleLessonCancel()}><Text style={styles.blueLink}>ביטול</Text></TouchableOpacity>
            <Text style={styles.sectionTitle}>שיעור הבא</Text>
          </View>

          <View style={styles.nextLessonDetails}>
            <LessonDetailRow icon="time-outline" text={`${mockNextLesson.day}, ${mockNextLesson.date}, ${mockNextLesson.startTime} - ${mockNextLesson.endTime}`} />
            <LessonDetailRow icon="location-outline" text={`איסוף: ${mockNextLesson.pickupLocation}`} />
            <View style={styles.teacherRow}>
              <Text style={styles.detailText}>{mockNextLesson.teacher.name}</Text>
              <Image source={{ uri: mockNextLesson.teacher.image }} style={styles.teacherAvatar} />
              <Ionicons name="person-circle-outline" size={24} color="#555" style={{ marginLeft: -30, opacity: 0 }} /> {/* פלייסהולדר כדי לשמור על האייקונים ישרים */}
            </View>
            <LessonDetailRow icon="car-outline" text={mockNextLesson.car} />
            <LessonDetailRow icon="cash-outline" text={`${mockNextLesson.price} ש"ח לשיעור`} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: 'right', marginBottom: 15 }]}>שיעורים הבאים</Text>
          <FlatList
            data={mockUpcomingLessons}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.upcomingLessonRow}>
                <TouchableOpacity onPress={() => handleLessonCancel(item.id)}><Text style={styles.blueLink}>ביטול</Text></TouchableOpacity>
                <View style={styles.upcomingLessonText}>
                  <Text style={styles.upcomingTime}>{item.time}</Text>
                  <Text style={styles.upcomingDayDate}>{`${item.day} ${item.date}`}</Text>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: 'right', marginBottom: 15 }]}>שיעורים שבוצעו</Text>
          <TouchableOpacity style={styles.prevLessonsRow}>
            <Ionicons name="chevron-back-outline" size={20} color="#0194b1" />
            <Text style={styles.blueLink}>היסטוריית שיעורים קודמים</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const LessonDetailRow = ({ icon, text }: { icon: any, text: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailText}>{text}</Text>
    <Ionicons name={icon} size={22} color="#555" style={styles.detailIcon} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { textAlign: 'right', fontSize: 15, fontWeight: '600', color: '#018aa6', paddingTop: 15, paddingBottom: 15 },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  blueLink: { color: '#0194b1', fontSize: 14, fontWeight: '600' },
  goalsProgressText: { fontSize: 16, color: '#666', textAlign: 'right' },
  nextLessonDetails: { gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  detailText: { flex: 1, textAlign: 'right', fontSize: 15, color: '#444' },
  detailIcon: { marginLeft: 15 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  teacherAvatar: { width: 25, height: 25, borderRadius: 15, marginLeft: 15, marginRight: 4.5 },
  upcomingLessonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  upcomingLessonText: { alignItems: 'flex-end' },
  upcomingTime: { fontSize: 15, fontWeight: '600', color: '#222' },
  upcomingDayDate: { fontSize: 13, color: '#888', marginTop: 2 },
  prevLessonsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5, justifyContent: 'space-between' },
});