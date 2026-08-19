import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import LoadingScreen from '../../components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/src/api/apiClient';
import StudentFilterModal from '../../components/StudentFilters';

interface Booking {
  id: string;
  lessonDate: string;
  status: string;
  isPaid: boolean;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  street: string;
  profileImage: string | null;
  bookings?: Booking[];
}

export default function ViewStudentsScreen({ navigation }: any) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempInactiveOnly, setTempInactiveOnly] = useState(false);
  const [tempUnpaidOnly, setTempUnpaidOnly] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('tutor/allStudents');
      if (response.data && response.data.students) {
        setStudents(response.data.students);
        setFilteredStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const filtered = students.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesName = fullName.includes(searchQuery.toLowerCase());

      const bookings = student.bookings || [];
      const activeStatuses = ['completed', 'confirmed', 'pending'];
      const hasRecentActivity = bookings.some(booking => {
        const lessonDate = new Date(booking.lessonDate);
        return activeStatuses.includes(booking.status) && lessonDate >= threeWeeksAgo;
      });
      const isInactive = !hasRecentActivity;

      const hasUnpaidLessons = bookings.some(booking => booking.isPaid === false && booking.status !== 'cancelled');

      if (inactiveOnly && !isInactive) return false;
      if (unpaidOnly && !hasUnpaidLessons) return false;

      return matchesName;
    });

    setFilteredStudents(filtered);
  }, [searchQuery, inactiveOnly, unpaidOnly, students]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const openFilterModal = () => {
    setTempSearchQuery(searchQuery);
    setTempInactiveOnly(inactiveOnly);
    setTempUnpaidOnly(unpaidOnly);
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSearchQuery(tempSearchQuery);
    setInactiveOnly(tempInactiveOnly);
    setUnpaidOnly(tempUnpaidOnly);
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    setTempSearchQuery('');
    setTempInactiveOnly(false);
    setTempUnpaidOnly(false);
    setSearchQuery('');
    setInactiveOnly(false);
    setUnpaidOnly(false);
    setIsFilterModalVisible(false);
  };

  const hasActiveFilters = searchQuery !== '' || inactiveOnly || unpaidOnly;

  const renderStudentRow = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.rowItem}
      activeOpacity={0.6}
      onPress={() => navigation.navigate("StudentCart", { studentId: item.id })}
    >
      <Ionicons name="chevron-back" size={14} color="#A3A3A3" />

      <View style={styles.rowContent}>
        <View style={styles.textGroup}>
          <Text style={styles.nameText}>{item.firstName} {item.lastName}</Text>

          <View style={styles.metaRow}>
            {item.phoneNumber ? <Text style={styles.subText}>{item.phoneNumber}</Text> : null}
            {item.phoneNumber && item.city ? <Text style={styles.dotDivider}>•</Text> : null}
            {item.city ? (<Text style={styles.subText}>{item.city}</Text>) : null}
          </View>
        </View>

        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.miniAvatar} />
        ) : (
          <View style={styles.miniAvatarInitials}>
            <Text style={styles.initialsText}>{item.firstName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.topActionsSection}>
        <View style={styles.resultsBadge}>
          <Text style={styles.resultsBadgeText}>נמצאו {filteredStudents.length} תלמידים</Text>
        </View>

        <TouchableOpacity
          style={styles.minimalFilterButton}
          onPress={openFilterModal}
          activeOpacity={0.7}
        >
          <Ionicons name="funnel-outline" size={16} color={hasActiveFilters ? '#019cbb' : '#737373'} />
          <Text style={[styles.filterButtonText, hasActiveFilters ? styles.activeFilterText : null]}>
            {hasActiveFilters ? 'מסונן' : 'סינון תלמידים'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#019cbb']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>לא נמצאו תלמידים</Text>
          </View>
        }
      />

      <StudentFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        tempSearchQuery={tempSearchQuery}
        setTempSearchQuery={setTempSearchQuery}
        tempInactiveOnly={tempInactiveOnly}
        setTempInactiveOnly={setTempInactiveOnly}
        tempUnpaidOnly={tempUnpaidOnly}
        setTempUnpaidOnly={setTempUnpaidOnly}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topActionsSection: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  minimalFilterButton: { flexDirection: 'row-reverse', alignItems: 'center', height: 40 },
  filterButtonText: { fontSize: 14, color: '#737373', marginRight: 6, fontWeight: '500' },
  activeFilterText: { color: '#019cbb', fontWeight: '600' },
  resultsBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resultsBadgeText: { fontSize: 13, color: '#737373', fontWeight: '500' },
  listContent: { paddingHorizontal: 24 },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  miniAvatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F5F5F5' },
  miniAvatarInitials: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#d0f5f9', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 15, fontWeight: '700', color: '#019cbb' },
  textGroup: { marginRight: 14, alignItems: 'flex-end', flex: 1 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap' },
  subText: { fontSize: 13, color: '#737373' },
  dotDivider: { fontSize: 11, color: '#A3A3A3', marginHorizontal: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#A3A3A3' },
});