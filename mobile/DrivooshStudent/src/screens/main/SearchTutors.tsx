import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';

interface TutorUser {
  firstName: string;
  lastName: string;
  profileImage?: string;
  city?: string;
}

interface Tutor {
  id: string;
  carModel: string;
  gearbox: 'manual' | 'automatic';
  pricePerLesson: number;
  experienceYears: number;
  workStartHour: string;
  workEndHour: string;
  user: TutorUser;
}

export default function SearchTutors({ navigation }: any) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [gearboxFilter, setGearboxFilter] = useState<'manual' | 'automatic' | null>(null);
  const [minExperience, setMinExperience] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState(300);
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(300);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/tutor/allTutors');
      const allData = response.data;

      setTutors(allData);
      setFilteredTutors(allData);

      if (allData.length > 0) {
        const highestPrice = Math.max(...allData.map((t: Tutor) => t.pricePerLesson));
        setAbsoluteMaxPrice(highestPrice);
        setMaxPrice(highestPrice);
      }
    } catch (error) {
      console.error("Error fetching tutors:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let updatedList = [...tutors];

    if (searchCity) {
      updatedList = updatedList.filter(t => t.user?.city?.toLowerCase().includes(searchCity.toLowerCase()));
    }
    if (gearboxFilter) {
      updatedList = updatedList.filter(t => t.gearbox === gearboxFilter);
    }
    updatedList = updatedList.filter(t => t.pricePerLesson <= maxPrice);

    if (minExperience !== null) {
      updatedList = updatedList.filter(t => t.experienceYears >= minExperience);
    }

    setFilteredTutors(updatedList);
    setFilterVisible(false);
  };

  const resetFilters = () => {
    setSearchCity('');
    setGearboxFilter(null);
    setMaxPrice(absoluteMaxPrice);
    setMinExperience(null);
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
        <Text style={styles.headerTitle}>סינון מורים</Text>
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
          <TouchableOpacity
            style={styles.tutorCard}
            onPress={() => navigation.navigate('TutorDetails', { tutorId: item.id })}          >
            <View style={styles.avatarContainer}>
              {item.user?.profileImage ? (
                <Image source={{ uri: item.user.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.initialsContainer]}>
                  <Text style={styles.initialsText}>{getInitials(item.user?.firstName)}</Text>
                </View>
              )}
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{`${item.user?.firstName} ${item.user?.lastName}`}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>{item.carModel}</Text>
                <Ionicons name="car-sport-outline" size={16} color="#017f98" style={styles.icon} />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>{item.gearbox === 'automatic' ? 'אוטומט' : 'ידני'}</Text>
                <Ionicons name="settings-outline" size={16} color="#017f98" style={styles.icon} />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>{item.user?.city || 'מיקום לא צוין'}</Text>
                <Ionicons name="location-outline" size={16} color="#017f98" style={styles.icon} />
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceValue}>₪{item.pricePerLesson}</Text>
                <Text style={styles.priceLabel}>לשיעור</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>סינון תוצאות</Text>

              <Text style={styles.sectionLabel}>חפש עיר</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="תל אביב"
                  value={searchCity}
                  onChangeText={setSearchCity}
                  placeholderTextColor="#9CA3AF"
                  textAlign="right"
                />
                <Ionicons name="map-outline" size={20} color="#AAA" />
              </View>

              <Text style={styles.sectionLabel}>סוג גיר</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterOption, gearboxFilter === 'manual' && styles.activeOption]}
                  onPress={() => setGearboxFilter('manual')}
                >
                  <Text style={[styles.optionText, gearboxFilter === 'manual' && styles.activeOptionText]}>ידני</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, gearboxFilter === 'automatic' && styles.activeOption]}
                  onPress={() => setGearboxFilter('automatic')}
                >
                  <Text style={[styles.optionText, gearboxFilter === 'automatic' && styles.activeOptionText]}>אוטומט</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.priceDisplay}>₪{maxPrice}</Text>
                <Text style={styles.sectionLabel}>מחיר מקסימלי</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={100}
                maximumValue={absoluteMaxPrice}
                step={5}
                minimumTrackTintColor="#00C2E8"
                maximumTrackTintColor="#EEE"
                thumbTintColor="#00C2E8"
                value={maxPrice}
                onValueChange={(val) => setMaxPrice(val)}
              />

              <Text style={styles.sectionLabel}>ותק המורה</Text>
              <View style={styles.filterRow}>
                {[5, 10, 15].map((years) => (
                  <TouchableOpacity
                    key={years}
                    style={[styles.filterOption, minExperience === years && styles.activeOption]}
                    onPress={() => setMinExperience(years)}
                  >
                    <Text style={[styles.optionText, minExperience === years && styles.activeOptionText]}>{years}+</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>הצג תוצאות</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Text style={styles.resetText}>נקה הכל</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 21, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  filterBtn: { padding: 10, backgroundColor: '#fafafa', borderRadius: 30 },
  listContent: { padding: 15 },
  tutorCard: { flexDirection: 'row-reverse', backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, alignItems: 'center' },
  avatarContainer: { marginLeft: 15 },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  initialsContainer: { backgroundColor: '#017f98', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  initialsText: { color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  tutorInfo: { flex: 1, alignItems: 'flex-end' },
  tutorName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, justifyContent: 'flex-end' },
  detailText: { fontSize: 13, color: '#666', marginRight: 8 },
  icon: { width: 20 },
  priceContainer: { marginTop: 10, flexDirection: 'row-reverse', alignItems: 'baseline' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  priceLabel: { fontSize: 12, color: '#666', marginRight: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 10, textAlign: 'right' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  priceDisplay: { color: '#00C2E8', fontWeight: 'bold', fontSize: 16 },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 15, paddingHorizontal: 15, marginBottom: 20, height: 50 },
  input: { flex: 1, height: '100%', color: '#333', writingDirection: 'rtl' },
  filterRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 20 },
  filterOption: { flex: 1, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
  activeOption: { backgroundColor: '#00C2E8', borderColor: '#00C2E8' },
  optionText: { color: '#666', fontWeight: 'bold' },
  activeOptionText: { color: '#FFF' },
  applyBtn: { backgroundColor: '#1A1A1A', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  applyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  resetBtn: { marginTop: 15, marginBottom: 20 },
  resetText: { textAlign: 'center', color: '#01829b', fontWeight: '600' }
});