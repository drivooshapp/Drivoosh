import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/src/api/apiClient';
import HistoryFilters from '../../components/HistoryFilters';

interface HistoryLesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  pickupLocation: string;
  status: 'completed' | 'cancelled';
  priceAtBooking: string;
  notes: string | null;
  isPaid?: boolean; // שדה תשלום מדומה
  student?: {
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
}

export default function AllHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<HistoryLesson[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [paidStatus, setPaidStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  const [tempName, setTempName] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [tempPaid, setTempPaid] = useState<'all' | 'paid' | 'unpaid'>('all');

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('tutor/allHistory');
      const lessons = response.data.history;

      setHistory(lessons);
      applyClientFilters(lessons, searchName, searchCity, searchDate, paidStatus);
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const applyClientFilters = (data: HistoryLesson[], name: string, city: string, date: string, paid: string) => {
    let updated = [...data];
    if (name.trim()) {
      updated = updated.filter(item => `${item.student?.firstName || ''} ${item.student?.lastName || ''}`.toLowerCase().includes(name.toLowerCase()));
    }
    if (city.trim()) {
      updated = updated.filter(item => item.pickupLocation?.toLowerCase().includes(city.toLowerCase()));
    }
    if (date.trim()) {
      updated = updated.filter(item => formatDate(item.lessonDate).includes(date));
    }
    if (paid !== 'all') {
      const target = paid === 'paid';
      updated = updated.filter(item => (item.isPaid === true) === target);
    }
    setFilteredHistory(updated);
  };

  const applyFilters = () => {
    setSearchName(tempName);
    setSearchCity(tempCity);
    setSearchDate(tempDate);
    setPaidStatus(tempPaid);
    applyClientFilters(history, tempName, tempCity, tempDate, tempPaid);
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    setTempName(''); setTempCity(''); setTempDate(''); setTempPaid('all');
    setSearchName(''); setSearchCity(''); setSearchDate(''); setPaidStatus('all');
    setFilteredHistory(history);
    setIsFilterModalVisible(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const renderHistoryItem = ({ item }: { item: HistoryLesson }) => {
    const isPaid = item.isPaid === true;
    const studentName = item.student
      ? `${item.student.firstName} ${item.student.lastName}`
      : 'תלמיד לשעבר';

    return (
      <View style={styles.rowItem}>
        <View style={styles.leftContainer}>
          <Text style={styles.priceText}>₪{parseInt(item.priceAtBooking)}</Text>
          <View style={[styles.statusBadge, isPaid ? styles.badgeCompleted : styles.badgeCancelled]}>
            <Text style={[styles.statusText, isPaid ? styles.textCompleted : styles.textCancelled]}>
              {isPaid ? 'שולם' : 'לא שולם'}
            </Text>
          </View>
        </View>

        <View style={styles.rowContent}>
          <View style={styles.textGroup}>

            <View style={styles.titleInlineRow}>
              <Text style={styles.nameText}>{studentName}</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="time-outline" size={14} color="#737373" style={styles.locationIcon} />
              <Text style={styles.subText}>
                {formatDate(item.lessonDate)} • {formatTime(item.startTime)}-{formatTime(item.endTime)}</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#737373" style={styles.locationIcon} />
              <Text style={styles.locationText} numberOfLines={1}>{item.pickupLocation}</Text>
            </View>
          </View>

          {item.student?.profileImage ? (
            <Image source={{ uri: item.student.profileImage }} style={styles.miniAvatar} />
          ) : (
            <View style={styles.miniAvatarInitials}>
              <Text style={styles.initialsText}>
                {item.student?.firstName ? item.student.firstName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#019cbb" />
      </View>
    );
  }

  const hasActiveFilters = searchName.trim() !== '' || searchCity.trim() !== '' || searchDate.trim() !== '' || paidStatus !== 'all';

  return (
    <View style={styles.container}>
      <View style={styles.topHeaderBar}>
        <TouchableOpacity style={styles.filterTriggerButton} onPress={() => setIsFilterModalVisible(true)} activeOpacity={0.7}>
          <Ionicons
            name="funnel-outline"
            size={16}
            color={hasActiveFilters ? "#019cbb" : "#737373"}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.filterTriggerText, { color: hasActiveFilters ? "#019cbb" : "#737373" }]}>
            סינון שיעורים
          </Text>
        </TouchableOpacity>

        <View style={styles.countBadge}>
          <Text style={styles.totalCountText}>נמצאו {filteredHistory.length} שיעורים</Text>
        </View>
      </View>

      <HistoryFilters
        isVisible={isFilterModalVisible} onClose={() => setIsFilterModalVisible(false)}
        tempName={tempName} setTempName={setTempName} tempCity={tempCity} setTempCity={setTempCity}
        tempDate={tempDate} setTempDate={setTempDate} tempPaid={tempPaid} setTempPaid={setTempPaid}
        onApply={applyFilters} onClear={clearFilters}
      />

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#019cbb']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}><Ionicons name="time-outline" size={28} color="#A3A3A3" /></View>
            <Text style={styles.emptyText}>לא נמצאו שיעורים</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  filterButtonContainer: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6, alignItems: 'flex-start' },
  topHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6 },
  filterTriggerButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  filterTriggerText: { fontSize: 14, fontWeight: '500' },
  countBadge: {
    backgroundColor: '#F3F4F6', // רקע אפור בהיר תואם
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20, // מעגל את הפינות לצורת קפסולה מושלמת
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCountText: { fontSize: 13, color: '#737373', fontWeight: '500' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  listContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 75 },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  leftContainer: { alignItems: 'flex-start', justifyContent: 'center', minWidth: 70 },
  miniAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F5F5F5' },
  miniAvatarInitials: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e3fafc', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 15, fontWeight: '700', color: '#019cbb' },
  textGroup: { marginRight: 14, alignItems: 'flex-end', flex: 1 },
  titleInlineRow: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  subText: { fontSize: 13, color: '#737373' },
  dotDivider: { fontSize: 11, color: '#A3A3A3', marginHorizontal: 5 },
  locationRow: { flexDirection: 'row-reverse', alignItems: 'center', maxWidth: '95%' },
  locationIcon: { marginLeft: 4 },
  locationText: { fontSize: 12, color: '#737373', textAlign: 'right' },
  priceText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4, textAlign: 'left' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeCompleted: { backgroundColor: '#E6F4EA' },
  badgeCancelled: { backgroundColor: '#FCE8E6' },
  statusText: { fontSize: 11, fontWeight: '600' },
  textCompleted: { color: '#137333' },
  textCancelled: { color: '#C5221F' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#A3A3A3', textAlign: 'center' },
});