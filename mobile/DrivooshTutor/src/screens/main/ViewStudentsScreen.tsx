import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/src/api/apiClient';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  street: string;
  profileImage: string | null;
}

export default function ViewStudentsScreen({ navigation }: any) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempCityQuery, setTempCityQuery] = useState('');

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
    const filtered = students.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const studentCity = (student.city || '').toLowerCase();

      const matchesName = fullName.includes(searchQuery.toLowerCase());
      const matchesCity = studentCity.includes(cityQuery.toLowerCase());

      return matchesName && matchesCity;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, cityQuery, students]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const openFilterModal = () => {
    setTempSearchQuery(searchQuery);
    setTempCityQuery(cityQuery);
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSearchQuery(tempSearchQuery);
    setCityQuery(tempCityQuery);
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    setTempSearchQuery('');
    setTempCityQuery('');
    setSearchQuery('');
    setCityQuery('');
    setIsFilterModalVisible(false);
  };

  const hasActiveFilters = searchQuery !== '' || cityQuery !== '';

  const renderStudentRow = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.rowItem}
      activeOpacity={0.6}
      onPress={() => navigation.navigate("StudentCart", { studentId: item.id })}    >
      <Ionicons name="chevron-back" size={14} color="#A3A3A3" />

      <View style={styles.rowContent}>
        <View style={styles.textGroup}>
          <Text style={styles.nameText}>{item.firstName} {item.lastName}</Text>

          <View style={styles.metaRow}>
            {item.phoneNumber ? <Text style={styles.subText}>{item.phoneNumber}</Text> : null}
            {item.phoneNumber && item.street ? <Text style={styles.dotDivider}>•</Text> : null}
            {item.city ? (<Text>{item.city}</Text>) : null}
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#019cbb" />
      </View>
    );
  }

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

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
              >
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                    <Text style={styles.resetText}>נקה הכל</Text>
                  </TouchableOpacity>

                  <Text style={styles.modalTitle}>מסננים</Text>

                  <TouchableOpacity
                    style={styles.closeButtonCircle}
                    onPress={() => setIsFilterModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#1A1A1A" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>שם התלמיד</Text>
                    <View style={styles.modalInputWrapper}>
                      <Ionicons name="person-outline" size={16} color="#A3A3A3" />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="חפש לפי שם"
                        placeholderTextColor="#A3A3A3"
                        value={tempSearchQuery}
                        onChangeText={setTempSearchQuery}
                        textAlign="right"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>עיר / אזור</Text>
                    <View style={styles.modalInputWrapper}>
                      <Ionicons name="map-outline" size={16} color="#A3A3A3" />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="איפה התלמיד גר?"
                        placeholderTextColor="#A3A3A3"
                        value={tempCityQuery}
                        onChangeText={setTempCityQuery}
                        textAlign="right"
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryModalButton}
                  onPress={applyFilters}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>החל סינון</Text>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  topActionsSection: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  minimalFilterButton: { flexDirection: 'row-reverse', alignItems: 'center', height: 40 },
  filterButtonText: { fontSize: 14, color: '#737373', marginRight: 6, fontWeight: '500' },
  activeFilterText: { color: '#019cbb', fontWeight: '600' },
  resultsBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resultsBadgeText: { fontSize: 13, color: '#737373', fontWeight: '500' },
  listContent: { paddingHorizontal: 24 },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  miniAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5' },
  miniAvatarInitials: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#d0f5f9', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 15, fontWeight: '700', color: '#019cbb' },
  textGroup: { marginRight: 14, alignItems: 'flex-end', flex: 1 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap' },
  subText: { fontSize: 13, color: '#737373' },
  dotDivider: { fontSize: 11, color: '#A3A3A3', marginHorizontal: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#A3A3A3' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
  modalHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  resetText: { fontSize: 14, color: '#019cbb', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  closeButtonCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  modalBody: { marginBottom: 24, gap: 16 },
  inputGroup: { width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, textAlign: 'right' },
  modalInputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  modalInput: { flex: 1, height: '100%', fontSize: 14, color: '#1A1A1A', marginRight: 8 },
  primaryModalButton: { backgroundColor: '#1A1A1A', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});