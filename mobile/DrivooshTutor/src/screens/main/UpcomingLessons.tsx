import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import LoadingScreen from '@/src/components/LoadingScreen';
import UpcomingLessonModal from '@/src/components/UpcomingLessonModal';
import apiClient from '../../api/apiClient';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImage: string | null;
  city: string;
}

interface Booking {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  pickupLocation: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priceAtBooking: string;
  notes: string | null;
  student: Student;
}

interface DayItem {
  dateString: string;
  dayName: string;
  dayNum: string;
  isToday: boolean;
  fullDate: Date;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed';

export default function UpcomingLessons({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayItem | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const checkScale = useRef(new Animated.Value(0)).current;

  const generateWeekDays = () => {
    const weekDays: DayItem[] = [];
    const daysOfWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const current = new Date();
      current.setDate(today.getDate() + i);

      const dayName = i === 0 ? 'היום' : daysOfWeek[current.getDay()];
      const dayNum = String(current.getDate()).padStart(2, '0');

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const dayStr = String(current.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;

      weekDays.push({
        dateString,
        dayName,
        dayNum,
        isToday: i === 0,
        fullDate: current,
      });
    }
    setDays(weekDays);
    setSelectedDay(weekDays[0]);
  };

  const fetchSchedule = async () => {
    try {
      const response = await apiClient.get('tutor/weeklySchedule');
      if (response.data.success) {
        setAllBookings(response.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    generateWeekDays();
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (!selectedDay) return;

    let filtered = allBookings.filter(b => b.lessonDate.substring(0, 10) === selectedDay.dateString);

    if (activeFilter !== 'all') {
      filtered = filtered.filter(b => b.status === activeFilter);
    }

    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setDayBookings(filtered);
  }, [selectedDay, allBookings, activeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  useEffect(() => {
    if (!bookingConfirmed) return;

    checkScale.setValue(0);

    Animated.spring(checkScale, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();

  }, [bookingConfirmed]);

  const handleApproveLesson = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const response = await apiClient.put(`booking/confirm/${bookingId}`);

      if (response.data.success) {
        setBookingConfirmed(true);
        fetchSchedule();
      }
    } catch (error: any) {
      console.log('Error approving lesson:', error);

      const errorData = error.response?.data;
      const serverMessage = errorData?.message;
      const subErrorCode = errorData?.subErrorCode;

      if (subErrorCode === 'GOALS_NOT_FILLED') {
        const studentId = errorData.studentId;
        const studentName = selectedBooking ? `${selectedBooking.student?.firstName} ${selectedBooking.student?.lastName}` : 'התלמיד';

        setModalVisible(false);

        Alert.alert(
          'חיווי חסר בטופס המטרות',
          serverMessage || 'יש למלא מטרות עבור השיעור האחרון לפני אישור שיעור חדש.',
          [
            { text: 'ביטול', style: 'cancel' },
            {
              text: 'למילוי מטרות',
              style: 'default',
              onPress: () => {
                if (navigation) {
                  navigation.navigate("AllStudents", {
                    screen: "ProgressFormScreen",
                    params: { studentId, studentName }
                  });
                }
              }
            }
          ],
          { cancelable: true }
        );
      } else {
        const finalFallbackMessage = serverMessage || 'לא ניתן לאשר את השיעור כעת';
        Alert.alert('שגיאה באישור השיעור', finalFallbackMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleNavigateToApp = (address: string, app: 'waze' | 'google' | 'moovit') => {
    if (!address) return;
    const encodedAddress = encodeURIComponent(address);

    let url = '';

    switch (app) {
      case 'waze':
        url = `waze://?q=${encodedAddress}&navigate=yes`;
        break;
      case 'google':
        url = Platform.select({
          ios: `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`,
          android: `google.navigation:q=${encodedAddress}`,
        }) || `https://maps.google.com/?daddr=${encodedAddress}`;
        break;
      case 'moovit':
        url = `moovit://directions?dest_name=${encodedAddress}`;
        break;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          if (app === 'waze') {
            Linking.openURL(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`);
          } else if (app === 'moovit') {
            Alert.alert('אפליקציה לא נמצאה', 'Moovit אינה מותקנת במכשיר זה');
          } else {
            Linking.openURL(`https://maps.google.com/?daddr=${encodedAddress}`);
          }
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const getDynamicDayTitle = () => {
    if (!selectedDay) return '';
    if (selectedDay.isToday) return 'היום';

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (selectedDay.dateString === tomorrowStr) return 'מחר';

    const parts = selectedDay.dateString.split('-');
    return `ב-${parts[2]}.${parts[1]}`;
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const studentName = `${item.student?.firstName || ''} ${item.student?.lastName || ''}`;
    const startTimeClean = item.startTime.substring(0, 5);
    const endTimeClean = item.endTime ? item.endTime.substring(0, 5) : '';

    let statusColor = '#F1F5F9';
    let statusDot = '#64748B';
    if (item.status === 'confirmed') {
      statusColor = '#E2E8F0';
      statusDot = '#0F172A';
    } else if (item.status === 'completed') {
      statusColor = '#F8FAFC';
      statusDot = '#94A3B8';
    }

    return (
      <TouchableOpacity
        style={styles.compactCard}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedBooking(item);
          setBookingConfirmed(false);
          setModalVisible(true);
        }}
      >
        <View style={styles.compactTimeSection}>
          <Text style={styles.compactTimeText}>{startTimeClean}</Text>
          <Text style={styles.compactEndTimeText}>{endTimeClean}</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.compactContentSection}>
          <View style={styles.studentMetaRow}>
            <Text style={styles.compactStudentName}>{studentName}</Text>
            <View style={[styles.statusDotLabel, { backgroundColor: statusColor }]}>
              <View style={[styles.dot, { backgroundColor: statusDot }]} />
              <Text style={[styles.statusDotText, { color: statusDot }]}>
                {item.status === 'confirmed' ? 'מאושר' : item.status === 'completed' ? 'בוצע' : 'ממתין'}
              </Text>
            </View>
          </View>

          <View style={styles.compactLocationRow}>
            <Ionicons name="location" size={13} color="#9CA3AF" style={{ marginLeft: 4 }} />
            <Text style={styles.compactLocationText} numberOfLines={1}>{item.pickupLocation}</Text>
          </View>
        </View>

        <Ionicons name="chevron-back" size={18} color="#D1D5DB" style={styles.chevronStyle} />
      </TouchableOpacity>
    );
  };

  const currentDayTotal = allBookings.filter(b => b.lessonDate.substring(0, 10) === selectedDay?.dateString);
  const completedCount = currentDayTotal.filter(b => b.status === 'completed').length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>יומן שיעורים</Text>
        <Text style={styles.headerSubtitle}>ניהול הלו"ז השבועי שלך</Text>
      </View>

      <View style={styles.calendarStripContainer}>
        <FlatList
          horizontal
          inverted
          data={days}
          keyExtractor={(item) => item.dateString}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStrip}
          renderItem={({ item: day }) => {
            const isSelected = selectedDay?.dateString === day.dateString;

            return (
              <TouchableOpacity
                style={[styles.dayButton, isSelected && styles.dayButtonActive,]}
                onPress={() => { setSelectedDay(day); setActiveFilter('all'); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayNameText, isSelected && styles.dayNameTextActive,]}>{day.dayName}</Text>
                <Text style={[styles.dayNumText, isSelected && styles.dayNumTextActive,]}>{day.dayNum}</Text>
                {day.isToday && !isSelected && (<View style={styles.todayDot} />)}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>
            {currentDayTotal.length} שיעורים {getDynamicDayTitle()} ({completedCount} בוצעו)
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          <TouchableOpacity style={[styles.chip, activeFilter === 'all' && styles.chipActive]} onPress={() => setActiveFilter('all')}>
            <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>הכל</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, activeFilter === 'confirmed' && styles.chipActive]} onPress={() => setActiveFilter('confirmed')}>
            <Text style={[styles.chipText, activeFilter === 'confirmed' && styles.chipTextActive]}>מאושרים</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, activeFilter === 'pending' && styles.chipActive]} onPress={() => setActiveFilter('pending')}>
            <Text style={[styles.chipText, activeFilter === 'pending' && styles.chipTextActive]}>ממתינים</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, activeFilter === 'completed' && styles.chipActive]} onPress={() => setActiveFilter('completed')}>
            <Text style={[styles.chipText, activeFilter === 'completed' && styles.chipTextActive]}>בוצעו</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={dayBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#019cbb']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={42} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? 'לא נמצאו שיעורים'
                : 'אין שיעורים התואמים לסינון זה'}
            </Text>
          </View>
        }
      />

      <UpcomingLessonModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setBookingConfirmed(false); }}
        selectedBooking={selectedBooking}
        bookingConfirmed={bookingConfirmed}
        checkScale={checkScale}
        actionLoading={actionLoading}
        onApproveLesson={handleApproveLesson}
        onRefreshData={fetchSchedule}
        onNavigateToApp={handleNavigateToApp}
        onOpenProgress={() => {
          setModalVisible(false);
          if (navigation && selectedBooking) {
            navigation.navigate("AllStudents", {
              screen: "ProgressFormScreen",
              params: {
                studentId: selectedBooking.student?.id,
                studentName: `${selectedBooking.student?.firstName} ${selectedBooking.student?.lastName}`
              }
            });
          }
        }}
        onCallStudent={(phoneNumber) => Linking.openURL(`tel:${phoneNumber}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 55 : 20, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'right' },
  headerSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 2 },
  calendarStripContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 14 },
  calendarStrip: { paddingHorizontal: 16, gap: 8 },
  dayButton: { width: 48, height: 64, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  dayButtonActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  dayNameText: { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  dayNameTextActive: { color: '#94A3B8', fontWeight: '600' },
  dayNumText: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
  dayNumTextActive: { color: '#FFFFFF' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#019cbb', marginTop: 2 },
  filterSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  summaryBadge: { alignItems: 'flex-end', marginBottom: 8 },
  summaryText: { fontSize: 12, fontWeight: '600', color: '#475569', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipsContainer: { alignItems: 'flex-end', width: '100%', flexDirection: 'row-reverse', gap: 6, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#019cbb', borderColor: '#019cbb' },
  chipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },
  compactCard: { backgroundColor: '#FFFFFF', borderColor: '#dddddd', borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 },
  compactTimeSection: { width: 50, alignItems: 'center', justifyContent: 'center' },
  compactTimeText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  compactEndTimeText: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  verticalDivider: { width: 1, backgroundColor: '#F1F5F9', height: '100%', marginHorizontal: 12 },
  compactContentSection: { flex: 1, justifyContent: 'center' },
  studentMetaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  compactStudentName: { fontSize: 14, fontWeight: '600', color: '#1E293B', textAlign: 'right' },
  statusDotLabel: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  statusDotText: { fontSize: 10, fontWeight: '700' },
  compactLocationRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  compactLocationText: { fontSize: 12, color: '#64748B', textAlign: 'right', flex: 1 },
  chevronStyle: { marginRight: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 120, gap: 10 },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});