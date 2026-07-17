import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, RefreshControl, TouchableOpacity, ScrollView, Platform, Modal, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import apiClient from '../../api/apiClient';
import moovitLogo from "../../../assets/navigateLogos/moovitLogo.png";
import googleMapsLogo from "../../../assets/navigateLogos/googleMapsLogo.png";
import wazeLogo from "../../../assets/navigateLogos/wazeLogo.png";

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

  // const handleApproveLesson = async (bookingId: string) => {
  //   setActionLoading(true);
  //   try {
  //     const response = await apiClient.put(`booking/confirm/${bookingId}`);

  //     if (response.data.success) {
  //       setBookingConfirmed(true);
  //       setSelectedBooking(prev => prev ? { ...prev, status: 'confirmed' } : prev);
  //       await fetchSchedule();
  //     }
  //   } catch (error) {
  //     console.log('Error approving lesson:', error);
  //     Alert.alert('שגיאה', 'לא ניתן לאשר את השיעור כעת');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };
const handleApproveLesson = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const response = await apiClient.put(`booking/confirm/${bookingId}`);

      if (response.data.success) {
        setBookingConfirmed(true);
        setSelectedBooking(prev => prev ? { ...prev, status: 'confirmed' } : prev);
        await fetchSchedule();
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
      } 
      else {
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#019cbb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>יומן שיעורים</Text>
        <Text style={styles.headerSubtitle}>ניהול הלו"ז השבועי שלך</Text>
      </View>

      <View style={styles.calendarStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
          {days.map((day) => {
            const isSelected = selectedDay?.dateString === day.dateString;
            return (
              <TouchableOpacity
                key={day.dateString}
                style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                onPress={() => {
                  setSelectedDay(day);
                  setActiveFilter('all');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayNameText, isSelected && styles.dayNameTextActive]}>{day.dayName}</Text>
                <Text style={[styles.dayNumText, isSelected && styles.dayNumTextActive]}>{day.dayNum}</Text>
                {day.isToday && !isSelected ? <View style={styles.todayDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
            <Text style={styles.emptyText}>אין שיעורים התואמים לסינון זה</Text>
          </View>
        }
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => { setModalVisible(false); setBookingConfirmed(false) }}>
              <Ionicons name="close" size={18} color="#0F172A" />
            </TouchableOpacity>

            {selectedBooking && (
              <ScrollView style={styles.modalInnerBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalUserHeader}>
                  {selectedBooking.student?.profileImage ? (
                    <Image source={{ uri: selectedBooking.student.profileImage }} style={styles.largeAvatar} />
                  ) : (
                    <View style={styles.largeAvatarPlaceholder}>
                      <Text style={styles.largeAvatarText}>{selectedBooking.student?.firstName?.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.modalStudentNameContainer}>
                    <Text style={styles.modalStudentName}>
                      {selectedBooking.student?.firstName} {selectedBooking.student?.lastName}
                    </Text>
                    <Text style={styles.modalTimeSub}>
                      {selectedBooking.startTime.substring(0, 5)} - {selectedBooking.endTime?.substring(0, 5)}
                    </Text>
                  </View>
                </View>

                {selectedBooking.status === 'pending' && !bookingConfirmed && (
                  <TouchableOpacity
                    style={[styles.urgentApproveButton, actionLoading && { opacity: 0.6 }]}
                    onPress={() => handleApproveLesson(selectedBooking.id)}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.urgentButtonContent}>
                        <Ionicons name="checkmark-done-outline" style={styles.pulsingIcon} />
                        <Text style={styles.urgentButtonText}>אשר שיעור זה כעת</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {bookingConfirmed && (
                  <View style={styles.successContainer}>
                    <Animated.View style={{ marginLeft: 8, transform: [{ scale: checkScale }] }}   >
                      <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                    </Animated.View>
                    <Text style={styles.successText}>השיעור מאושר</Text>
                  </View>
                )}

                <View style={styles.premiumCard}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="location-outline" size={16} color="#0F172A" />
                    <Text style={styles.premiumCardTitle}>מיקום איסוף</Text>
                  </View>
                  <View style={styles.cardContentInnerVertical}>
                    <Text style={styles.cleanAddressText}>{selectedBooking.pickupLocation}</Text>

                    <View style={styles.premiumNavigationRow}>
                      <Text style={styles.premiumNavLabel}>ניווט מהיר באמצעות</Text>
                      <View style={styles.premiumIconsGroup}>
                        <TouchableOpacity style={styles.appIconWrapper} onPress={() => handleNavigateToApp(selectedBooking.pickupLocation, 'waze')}>
                          <Image source={wazeLogo} style={styles.appIconImage} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.appIconWrapper} onPress={() => handleNavigateToApp(selectedBooking.pickupLocation, 'google')}>
                          <Image source={googleMapsLogo} style={styles.appIconImage} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.appIconWrapper} onPress={() => handleNavigateToApp(selectedBooking.pickupLocation, 'moovit')}>
                          <Image source={moovitLogo} style={styles.appIconImage} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.premiumCard}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="document-text-outline" size={16} color="#0F172A" />
                    <Text style={styles.premiumCardTitle}>הערות מיוחדות מהתלמיד</Text>
                  </View>
                  <View style={styles.cardContentInnerVertical}>
                    <Text style={{ textAlign: 'right', color: '#8794a6', fontStyle: 'italic' }}>
                      {selectedBooking.notes || 'אין הערות לשיעור זה'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.premiumCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setModalVisible(false);

                    if (navigation) navigation.navigate("AllStudents", {
                      screen: "ProgressFormScreen",
                      params: {
                        studentId: selectedBooking.student?.id,
                        studentName: `${selectedBooking.student?.firstName} ${selectedBooking.student?.lastName}`
                      }
                    });
                  }}
                >
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="sparkles-outline" size={16} color="#0F172A" />
                    <Text style={styles.premiumCardTitle}>מטרות לימוד והתקדמות</Text>
                  </View>
                  <View style={styles.cardContentInner}>
                    <Text style={styles.premiumCardSub}>לחץ לצפייה בכרטיס התלמיד, ניהול יעדים וסימון מדדים</Text>
                    <Ionicons name="chevron-back" size={14} color="#64748B" style={styles.cardLeftArrow} />
                  </View>
                </TouchableOpacity>

                <View style={styles.modalActionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.actionSecondaryCallButton}
                    onPress={() => Linking.openURL(`tel:${selectedBooking.student?.phoneNumber}`)}
                  >
                    <Ionicons name="call-outline" size={16} color="#0F172A" style={{ marginLeft: 6 }} />
                    <Text style={styles.actionSecondaryButtonText}>ליצירת קשר טלפוני</Text>
                  </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  headerBar: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 55 : 20, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'right' },
  headerSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 2 },

  calendarStripContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 14 },
  calendarStrip: { flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 8 },
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16, maxHeight: '88%' },
  modalDragHandle: { width: 40, height: 1, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalCloseButton: { position: 'absolute', top: 16, left: 20, backgroundColor: '#F1F5F9', borderRadius: 20, padding: 6 },
  modalInnerBody: { width: '100%' },
  successContainer: { width: '100%', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 16, paddingVertical: 15, marginBottom: 20, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', },
  successText: { fontSize: 15, fontWeight: '700', color: '#15803D', },

  modalUserHeader: { flexDirection: 'row-reverse', alignItems: 'center', paddingBottom: 16, marginBottom: 16 },
  largeAvatar: { width: 52, height: 52, borderRadius: 26 },
  largeAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#d0f5f9', justifyContent: 'center', alignItems: 'center' },
  largeAvatarText: { fontSize: 20, fontWeight: '700', color: '#019cbb' },

  modalStudentNameContainer: { marginRight: 14, flex: 1, alignItems: 'flex-end' },
  modalStudentName: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  modalTimeSub: { fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: '600' },

  urgentApproveButton: { width: '100%', backgroundColor: '#019cbb', borderRadius: 16, paddingVertical: 15, marginBottom: 20, shadowColor: '#019cbb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  urgentButtonContent: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
  urgentButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  pulsingIcon: { fontSize: 18, color: "#FFFFFF", marginLeft: 8, alignItems: 'center' },

  premiumCard: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 8, marginBottom: 10 },
  premiumCardTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', letterSpacing: 0.3 },
  cardContentInner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  cardContentInnerVertical: { width: '100%', alignItems: 'flex-end' },
  premiumCardSub: { fontSize: 13, color: '#64748B', textAlign: 'right', flex: 1, lineHeight: 18, paddingLeft: 16 },
  cardLeftArrow: { alignSelf: 'center' },

  cleanAddressText: { fontSize: 15, fontWeight: '600', color: '#1E293B', textAlign: 'right', marginBottom: 12 },
  premiumNavigationRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 },
  premiumNavLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  premiumIconsGroup: { flexDirection: 'row-reverse', gap: 10 },

  appIconWrapper: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  appIconImage: { width: '100%', height: '100%', resizeMode: 'contain' },

  cleanNotesText: { fontSize: 14, color: '#334155', lineHeight: 20, textAlign: 'right', fontWeight: '500' },

  modalActionButtonsContainer: { width: '100%', marginTop: 10 },
  actionSecondaryCallButton: { width: '100%', backgroundColor: '#00d5ff', paddingVertical: 14, borderRadius: 16, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center' },
  actionSecondaryButtonText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 120, gap: 10 },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});