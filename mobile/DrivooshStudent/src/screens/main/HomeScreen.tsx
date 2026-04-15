// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import React, { useState, useCallback } from 'react';
// import { Alert, FlatList, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
// import apiClient from '../../api/apiClient';
// import LoadingScreen from '@/src/components/LoadingScreen';

// const getGreetingByTime = () => {
//   const currentHour = new Date().getHours();
//   if (currentHour < 12) return 'בוקר טוב';
//   if (currentHour < 18) return 'צהריים טובים';
//   return 'ערב טוב';
// };

// const getDayName = (dateStr: string) => {
//   const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
//   const d = new Date(dateStr);
//   return days[d.getDay()];
// };

// export default function HomeScreen({ navigation }: any) {
//   const [userName, setUserName] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [nextLesson, setNextLesson] = useState<any>(null);
//   const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
//   const [completedCount, setCompletedCount] = useState(0);

//   useFocusEffect(
//     useCallback(() => {
//       const fetchData = async () => {
//         try {
//           const name = await AsyncStorage.getItem('userName');
//           setUserName(name);

//           const response = await apiClient.get('/booking/myHistory');
//           const bookings = response.data;

//           const now = new Date();

//           const future = bookings
//             .filter((b: any) => {
//               const lessonFullDate = new Date(`${b.lessonDate.split('T')[0]}T${b.startTime}`);
//               const isFuture = lessonFullDate > now;
//               const isValidStatus = b.status === 'confirmed' || b.status === 'pending';
//               return isFuture && isValidStatus;
//             })
//             .sort((a: any, b: any) => new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime());

//           if (future.length > 0) {
//             setNextLesson(future[0]);
//             setUpcomingLessons(future.slice(1));
//           } else {
//             setNextLesson(null);
//             setUpcomingLessons([]);
//           }

//           const completed = bookings.filter((b: any) => b.status === 'completed' || new Date(`${b.lessonDate.split('T')[0]}T${b.endTime}`) < now).length;
//           setCompletedCount(completed);

//         } catch (error) {
//           console.error("טעינת נתונים מהשרת נכשלה", error);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchData();
//     }, [])
//   );

//   const handleLessonCancel = (lessonId?: string) => {
//     Alert.alert("ביטול שיעור", "האם אתה בטוח שברצונך לבטל את השיעור?");
//   };

//   const formatDate = (dateStr: string) => {
//     const d = new Date(dateStr);
//     return d.toLocaleDateString('he-IL');
//   };

//   const renderTeacherAvatar = (user: any) => {
//     if (user?.profileImage) {
//       return <Image source={{ uri: user.profileImage }} style={styles.teacherAvatar} />;
//     }
//     const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?';
//     return (
//       <View style={[styles.teacherAvatar, styles.avatarPlaceholder]}>
//         <Text style={styles.avatarInitial}>{initial}</Text>
//       </View>
//     );
//   };

//   if (loading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
//       <ScrollView contentContainerStyle={styles.scrollContent}>

//         <Text style={styles.headerTitle}>{`${getGreetingByTime()}, ${userName}`}</Text>

//         <View style={styles.sectionCard}>
//           <View style={styles.sectionHeaderRow}>
//             <TouchableOpacity><Text style={styles.blueLink}>לצפייה</Text></TouchableOpacity>
//             <Text style={styles.sectionTitle}>טופס מטרות</Text>
//           </View>
//           <Text style={styles.goalsProgressText}>
//             {`${completedCount} מתוך 52 הושלמו`}
//           </Text>
//         </View>

//         {nextLesson && (
//           <View style={styles.sectionCard}>
//             <View style={styles.sectionHeaderRow}>
//               <TouchableOpacity onPress={() => handleLessonCancel(nextLesson?.id)}>
//                 <Text style={styles.blueLink}>ביטול</Text>
//               </TouchableOpacity>
//               <Text style={styles.sectionTitle}>שיעור הבא</Text>
//             </View>

//             <View style={styles.nextLessonDetails}>
//               <View style={styles.detailRow}>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.detailText}>
//                     {`${getDayName(nextLesson.lessonDate)}, ${formatDate(nextLesson.lessonDate)}`}
//                   </Text>
//                   <Text style={[styles.detailText, { color: '#666', fontSize: 14 }]}>
//                     {`${nextLesson.startTime.slice(0, 5)} - ${nextLesson.endTime.slice(0, 5)}`}
//                   </Text>
//                 </View>
//                 <Ionicons name="time-outline" size={22} color="#555" style={styles.detailIcon} />
//               </View>

//               <LessonDetailRow icon="location-outline" text={`איסוף: ${nextLesson.pickupLocation}`} />

//               <View style={styles.teacherRow}>
//                 <Text style={styles.detailText}>
//                   {`${nextLesson.Tutor?.User?.firstName} ${nextLesson.Tutor?.User?.lastName}`}
//                 </Text>
//                 {renderTeacherAvatar(nextLesson.Tutor?.User)}
//               </View>

//               <LessonDetailRow
//                 icon="cash-outline"
//                 text={`${Math.floor(nextLesson.priceAtBooking)} ש"ח לשיעור`}
//               />
//             </View>
//           </View>
//         )}

//         {upcomingLessons.length > 0 && (
//           <View style={styles.sectionCard}>
//             <Text style={[styles.sectionTitle, { textAlign: 'right', marginBottom: 15 }]}>
//               שיעורים הבאים
//             </Text>

//             <FlatList
//               data={upcomingLessons}
//               keyExtractor={(item) => item.id}
//               scrollEnabled={false}
//               renderItem={({ item }) => (
//                 <View style={styles.upcomingLessonRow}>
//                   <TouchableOpacity onPress={() => handleLessonCancel(item.id)}>
//                     <Text style={styles.blueLink}>ביטול</Text>
//                   </TouchableOpacity>
//                   <View style={styles.upcomingLessonText}>
//                     <Text style={styles.upcomingTime}>
//                       {`${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}`}
//                     </Text>
//                     <Text style={styles.upcomingDayDate}>
//                       {formatDate(item.lessonDate)}
//                     </Text>
//                   </View>
//                 </View>
//               )}
//             />
//           </View>
//         )}

//         <View style={styles.sectionCard}>
//           <Text style={[styles.sectionTitle, { textAlign: 'right', marginBottom: 15 }]}>שיעורים שבוצעו</Text>
//           <TouchableOpacity
//             style={styles.prevLessonsRow}
//             onPress={() => navigation.navigate('History')}
//           >
//             <Ionicons name="chevron-back-outline" size={20} color="#0194b1" />
//             <Text style={styles.blueLink}>היסטוריית שיעורים קודמים</Text>
//           </TouchableOpacity>
//         </View>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const LessonDetailRow = ({ icon, text }: { icon: any, text: string }) => (
//   <View style={styles.detailRow}>
//     <Text style={styles.detailText}>{text}</Text>
//     <Ionicons name={icon} size={22} color="#555" style={styles.detailIcon} />
//   </View>
// );

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
//   headerTitle: { textAlign: 'right', fontSize: 15, fontWeight: '600', color: '#018aa6', paddingTop: 15, paddingBottom: 15 },
//   sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, },
//   sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
//   sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
//   blueLink: { color: '#0194b1', fontSize: 14, fontWeight: '600' },
//   goalsProgressText: { fontSize: 16, color: '#666', textAlign: 'right' },
//   nextLessonDetails: { gap: 12 },
//   detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
//   detailText: { textAlign: 'right', fontSize: 15, color: '#444' },
//   detailIcon: { marginLeft: 15 },
//   teacherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 5 },
//   teacherAvatar: { width: 22, height: 22, borderRadius: 15, marginLeft: 15 },
//   avatarPlaceholder: { backgroundColor: '#0194b1', justifyContent: 'center', alignItems: 'center' },
//   avatarInitial: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
//   upcomingLessonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
//   upcomingLessonText: { alignItems: 'flex-end' },
//   upcomingTime: { fontSize: 15, fontWeight: '600', color: '#222' },
//   upcomingDayDate: { fontSize: 13, color: '#888', marginTop: 2 },
//   prevLessonsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5, justifyContent: 'space-between' },
// });

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';


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
  status: 'confirmed' | 'pending' | 'completed' | string;
  pickupLocation: string;
  priceAtBooking: number;
  Tutor?: UserType;
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
  ['יום ראשון','יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי','יום שבת'][new Date(d).getDay()];

/* ================= COMPONENT ================= */

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        if (active) setUserName(name);

        const { data } = await apiClient.get('/booking/myHistory');
        const bookings: Lesson[] = data;

        const now = new Date();

        const future = bookings
          .filter(b =>
            getLessonDateTime(b) > now &&
            (b.status === 'confirmed' || b.status === 'pending')
          )
          .sort(
            (a, b) =>
              getLessonDateTime(a).getTime() - getLessonDateTime(b).getTime()
          );

        if (active) {
          setNextLesson(future[0] || null);
          setUpcomingLessons(future.slice(1));

          setCompletedCount(
            bookings.filter(b =>
              b.status === 'completed' ||
              new Date(`${b.lessonDate.split('T')[0]}T${b.endTime}`) < now
            ).length
          );
        }
      } catch (e) {
        console.error('שגיאה בטעינת נתונים', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, []));

  const handleLessonCancel = (id?: string) => {
    Alert.alert('ביטול שיעור', 'האם אתה בטוח שברצונך לבטל את השיעור', [
      { text: 'לא', style: 'cancel' },
      { text: 'כן', onPress: () => console.log('cancel', id) }
    ]);
  };

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

        <Text style={styles.headerTitle}>
          {`${getGreetingByTime()}${userName ? `, ${userName}` : ''}`}
        </Text>

        <Section
          title="טופס מטרות"
          action={<TouchableOpacity><Text style={styles.blueLink}>לצפייה</Text></TouchableOpacity>}
        >
          <Text style={styles.goalsProgressText}>
            {`${completedCount} מתוך 52 הושלמו`}
          </Text>
        </Section>

        {nextLesson && (
          <Section
            title="שיעור הבא"
            action={
              <TouchableOpacity onPress={() => handleLessonCancel(nextLesson.id)}>
                <Text style={styles.blueLink}>ביטול</Text>
              </TouchableOpacity>
            }
          >
            <View style={styles.nextLessonDetails}>

              <Row
                icon="time-outline"
                text={`${getDayName(nextLesson.lessonDate)}, ${formatDate(nextLesson.lessonDate)} | ${nextLesson.startTime.slice(0, 5)} - ${nextLesson.endTime.slice(0, 5)}`}
              />

              <Row icon="location-outline" text={`איסוף: ${nextLesson.pickupLocation}`} />

              <View style={styles.teacherRow}>
                <Text style={styles.detailText}>
                  {`${nextLesson.Tutor?.firstName || ''} ${nextLesson.Tutor?.lastName || ''}`}
                </Text>
                {renderAvatar(nextLesson.Tutor)}
              </View>

              <Row icon="cash-outline" text={`${Math.floor(nextLesson.priceAtBooking)} ש"ח`} />
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
                <View style={styles.upcomingLessonRow}>
                  <TouchableOpacity onPress={() => handleLessonCancel(item.id)}>
                    <Text style={styles.blueLink}>ביטול</Text>
                  </TouchableOpacity>

                  <View style={styles.upcomingLessonText}>
                    <Text style={styles.upcomingTime}>
                      {`${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}`}
                    </Text>
                    <Text style={styles.upcomingDayDate}>
                      {formatDate(item.lessonDate)}
                    </Text>
                  </View>
                </View>
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

const Row = ({ icon, text }: { icon: any; text: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailText}>{text}</Text>
    <Ionicons name={icon} size={22} color="#555" style={styles.detailIcon} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  headerTitle: { textAlign: 'right', fontSize: 15, fontWeight: '600', color: '#018aa6', paddingVertical: 15 },
  sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#eee' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  blueLink: { color: '#0194b1', fontWeight: '600' },
  goalsProgressText: { textAlign: 'right', color: '#666' },
  nextLessonDetails: { gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  detailText: { textAlign: 'right' },
  detailIcon: { marginLeft: 10 },
  teacherRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  teacherAvatar: { width: 24, height: 24, borderRadius: 12, marginLeft: 10 },
  avatarPlaceholder: { backgroundColor: '#0194b1', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 12 },
  upcomingLessonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  upcomingLessonText: { alignItems: 'flex-end' },
  upcomingTime: { fontWeight: '600' },
  upcomingDayDate: { color: '#888' },
  prevLessonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});