import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';

const THEME_COLOR = '#0194b1';
const BG_COLOR = '#f4f7f8';

export default function SearchTutors({ navigation }: any) {
  const [tutors, setTutors] = useState<any[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchName, setSearchName] = useState('');
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState('ישראל ישראלי');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [maxPrice, setMaxPrice] = useState(300);
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(300);
  const [minPrice, setMinPrice] = useState(100);
  const [absoluteMinPrice, setAbsoluteMinPrice] = useState(100);

  const lastIndexRef = useRef<number>(-1);

  useEffect(() => {
    fetchTutors();
  }, []);

  useEffect(() => {
    if (!isFilterVisible || tutors.length === 0) return;

    const updateName = () => {
      if (isNameFocused || searchName) return;

      let nextIndex = Math.floor(Math.random() * tutors.length);

      if (tutors.length > 1) {
        while (nextIndex === lastIndexRef.current) {
          nextIndex = Math.floor(Math.random() * tutors.length);
        }
      }

      lastIndexRef.current = nextIndex;

      const selectedTutor = tutors[nextIndex];

      if (selectedTutor?.user) {
        setDynamicPlaceholder(
          `${selectedTutor.user.firstName} ${selectedTutor.user.lastName}`
        );
      }
    };

    updateName();

    const interval = setInterval(updateName, 1500);

    return () => clearInterval(interval);
  }, [isFilterVisible, tutors, isNameFocused, searchName]);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/tutor/allTutors');
      const allData = response.data;

      setTutors(allData);
      setFilteredTutors(allData);

      if (allData.length > 0) {
        const validPrices = allData
          .map((t: any) => Number(t.pricePerLesson))
          .filter((p: any) => Number.isFinite(p));

        const highestPrice = validPrices.length > 0 ? Math.max(...validPrices) : 300;
        const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 100;

        setAbsoluteMaxPrice(highestPrice);
        setMaxPrice(highestPrice);

        setAbsoluteMinPrice(lowestPrice);
        setMinPrice(lowestPrice);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const updatedList = tutors.filter((t) => {
      const fullName = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
      const city = (t.user?.city || '').toLowerCase();

      const matchesName =
        !searchName || fullName.includes(searchName.toLowerCase());

      const matchesCity =
        !searchCity || city.includes(searchCity.toLowerCase());

      const price = Number(t.pricePerLesson);

      const matchesPrice =
        Number.isFinite(price) && price >= minPrice && price <= maxPrice;

      return matchesName && matchesCity && matchesPrice;
    });

    setFilteredTutors(updatedList);
    setFilterVisible(false);
  };

  const resetFilters = () => {
    setSearchName('');
    setSearchCity('');
    setMaxPrice(absoluteMaxPrice);
    setMinPrice(absoluteMinPrice);
    setFilteredTutors(tutors);
    setFilterVisible(false);
  };

  const getInitials = (name: string) =>
    name ? name.charAt(0).toUpperCase() : '?';

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          style={styles.filterBtn}
        >
          <Ionicons name="options-outline" size={20} color={THEME_COLOR} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>חיפוש מורה נהיגה</Text>
      </View>

      <FlatList
        data={filteredTutors}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>לא נמצאו מורים מתאימים</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tutorCard}
            onPress={() =>
              navigation.navigate('TutorDetails', {
                tutorId: item.id || item._id,
              })
            }
          >
            <View style={styles.avatarContainer}>
              {item.user?.profileImage ? (
                <Image
                  source={{ uri: item.user.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarImage, styles.initialsContainer]}>
                  <Text style={styles.initialsText}>
                    {getInitials(item.user?.firstName)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>
                {`${item.user?.firstName || ''} ${item.user?.lastName || ''}`}
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.detailText}>{item.carModel}</Text>
                <Ionicons name="car-sport-outline" size={15} color="#888" />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.detailText}>
                  {item.user?.city || 'מיקום לא צוין'}
                </Text>
                <Ionicons name="location-outline" size={15} color="#888" />
              </View>

              <View style={styles.priceTag}>
                <Text style={styles.priceValue}>₪{item.pricePerLesson}</Text>
                <Text style={styles.priceLabel}> / שיעור</Text>
              </View>
            </View>

            <Ionicons name="chevron-back" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={isFilterVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>סינון חיפוש</Text>

              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetTextSmall}>איפוס</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>שם המורה</Text>

              <View style={styles.fakeInputWrapper}>
                {!searchName && !isNameFocused && (
                  <Text style={styles.fakePlaceholder}>
                    {dynamicPlaceholder}
                  </Text>
                )}

                <TextInput
                  style={styles.input}
                  value={searchName}
                  onChangeText={setSearchName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  textAlign="right"
                />
                <Ionicons name="person-outline" size={20} color="#94A3B8" />
              </View>

              <Text style={styles.sectionLabel}>עיר / אזור</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="איפה תרצה ללמוד?"
                  value={searchCity}
                  onChangeText={setSearchCity}
                  textAlign="right"
                />
                <Ionicons name="map-outline" size={20} color="#94A3B8" />
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.priceDisplay}>₪{maxPrice}</Text>
                <Text style={styles.sectionLabel}>מחיר מקסימלי</Text>
              </View>

              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={absoluteMinPrice}
                maximumValue={absoluteMaxPrice}
                step={5}
                minimumTrackTintColor={THEME_COLOR}
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor={THEME_COLOR}
                value={maxPrice}
                onValueChange={setMaxPrice}
              />

              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>הצג מורים</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  filterBtn: { padding: 8, backgroundColor: '#f0f9ff', borderRadius: 12 },
  listContent: { padding: 16 },
  tutorCard: { flexDirection: 'row-reverse', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  avatarContainer: { marginLeft: 16 },
  avatarImage: { width: 64, height: 64, borderRadius: 17 },
  initialsContainer: { backgroundColor: THEME_COLOR, justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  tutorInfo: { flex: 1, alignItems: 'flex-end' },
  tutorName: { fontSize: 16, fontWeight: 'bold', marginBottom: 7 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginRight: 6 },
  priceTag: { flexDirection: 'row-reverse', marginTop: 7 },
  priceValue: { color: THEME_COLOR, fontWeight: 'bold' },
  priceLabel: { fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  resetTextSmall: { color: THEME_COLOR },
  sectionLabel: { marginBottom: 6, fontWeight: '600', textAlign: 'right' },
  fakeInputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, height: 52, borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center' },
  fakePlaceholder: { position: 'absolute', right: 15, color: '#9CA3AF', fontSize: 15 },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, marginBottom: 15, height: 50 },
  input: { flex: 1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceDisplay: { color: THEME_COLOR, fontWeight: 'bold' },
  applyBtn: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  applyBtnText: { color: '#fff', fontWeight: 'bold' },
});