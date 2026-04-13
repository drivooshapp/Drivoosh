


import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';

interface TutorUser { firstName: string; lastName: string; profileImage?: string; city?: string; }
interface Tutor { id: string; carModel: string; gearbox: 'manual' | 'automatic'; pricePerLesson: number; User: TutorUser; }

export default function SearchTutors({ navigation }: any) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [gearboxFilter, setGearboxFilter] = useState<'manual' | 'automatic' | null>(null);

  useEffect(() => { fetchTutors(); }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/tutor/allTutors');
      setTutors(response.data);
      setFilteredTutors(response.data);
    } catch (error) {
      console.error("Error fetching tutors:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let updatedList = [...tutors];
    if (searchCity) { updatedList = updatedList.filter(t => t.User?.city?.toLowerCase().includes(searchCity.toLowerCase())); }
    if (gearboxFilter) { updatedList = updatedList.filter(t => t.gearbox === gearboxFilter); }
    setFilteredTutors(updatedList);
    setFilterVisible(false);
  };

  const resetFilters = () => {
    setSearchCity('');
    setGearboxFilter(null);
    setFilteredTutors(tutors);
    setFilterVisible(false);
  };

  const getInitials = (firstName: string) => {
    if (!firstName) return '?';
    return firstName.charAt(0).toUpperCase();
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>חיפוש מורים</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterBtn}>
          <Ionicons name="search-outline" size={22} color="#000000" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredTutors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tutorCard} onPress={() => navigation.navigate('TutorDetails', { tutorId: item.id })}>
            <View style={styles.avatarContainer}>
              {item.User?.profileImage ? <Image source={{ uri: item.User.profileImage }} style={styles.avatarImage} /> : <View style={[styles.avatarImage, styles.initialsContainer]}><Text style={styles.initialsText}>{getInitials(item.User?.firstName)}</Text></View>}
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{`${item.User?.firstName} ${item.User?.lastName}`}</Text>
              <View style={styles.detailRow}><Text style={styles.detailText}>{item.carModel}</Text><Ionicons name="car-sport-outline" size={16} color="#00C2E8" style={styles.icon} /></View>
              <View style={styles.detailRow}><Text style={styles.detailText}>{item.gearbox === 'automatic' ? 'אוטומט' : 'ידני'}</Text><Ionicons name="settings-outline" size={16} color="#00C2E8" style={styles.icon} /></View>
              <View style={styles.detailRow}><Text style={styles.detailText}>{item.User?.city || 'מיקום לא צוין'}</Text><Ionicons name="location-outline" size={16} color="#00C2E8" style={styles.icon} /></View>
              <View style={styles.priceContainer}><Text style={styles.priceValue}>₪{item.pricePerLesson}</Text><Text style={styles.priceLabel}>לשיעור</Text></View>
            </View>
          </TouchableOpacity>
        )}
      />
      <Modal visible={isFilterVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>סינון תוצאות</Text>
            <View style={styles.inputWrapper}>
              {/* ה-TextInput בא קודם */}
              <TextInput
                style={styles.input}
                placeholder="בחר עיר"
                value={searchCity}
                onChangeText={setSearchCity}
                textAlign="right" // דואג שהסמן והטקסט יתחילו מימין
              />
              {/* האייקון יופיע מימין לטקסט בגלל ה-row-reverse */}
              <Ionicons name="map-outline" size={20} color="#AAA" style={styles.inputIcon} />
            </View>
            <View style={styles.filterRow}>
              <TouchableOpacity style={[styles.filterOption, gearboxFilter === 'manual' && styles.activeOption]} onPress={() => setGearboxFilter('manual')}><Text style={[styles.optionText, gearboxFilter === 'manual' && styles.activeOptionText]}>ידני</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.filterOption, gearboxFilter === 'automatic' && styles.activeOption]} onPress={() => setGearboxFilter('automatic')}><Text style={[styles.optionText, gearboxFilter === 'automatic' && styles.activeOptionText]}>אוטומט</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}><Text style={styles.applyBtnText}>הצג תוצאות</Text></TouchableOpacity>
            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}><Text style={styles.resetText}>נקה הכל</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F8' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  filterBtn: { padding: 10, backgroundColor: '#fafafa', borderRadius: 30 },
  listContent: { padding: 15 },
  tutorCard: { flexDirection: 'row-reverse', backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, alignItems: 'center' },
  avatarContainer: { marginLeft: 15 },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  initialsContainer: { backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  initialsText: { color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  tutorInfo: { flex: 1, alignItems: 'flex-end' },
  tutorName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, justifyContent: 'flex-end' },
  detailText: { fontSize: 13, color: '#666', marginRight: 8 },
  icon: { width: 20 },
  priceContainer: { marginTop: 10, flexDirection: 'row-reverse', alignItems: 'baseline' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  priceLabel: { fontSize: 12, color: '#666', marginRight: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 15, paddingHorizontal: 15, marginBottom: 20 },
  input: { flex: 1, height: 50, color: '#333', writingDirection: 'rtl', },
  inputIcon: { marginLeft: 10, },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  filterOption: { flex: 1, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
  activeOption: { backgroundColor: '#00C2E8', borderColor: '#00C2E8' },
  optionText: { color: '#666', fontWeight: 'bold' },
  activeOptionText: { color: '#FFF' },
  applyBtn: { backgroundColor: '#1A1A1A', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  applyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  resetBtn: { marginTop: 15 },
  resetText: { textAlign: 'center', color: '#01829b', fontWeight: 600 }
});