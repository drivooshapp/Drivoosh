import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
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
  status: string;
  pickupLocation: string;
  priceAtBooking: number;
  tutor?: { user: UserType };
}

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const profileRes = await apiClient.get('/student/myProfile');
      const tutorId = profileRes.data?.chosenTutor?.id;
      if (!tutorId) {
        setHistory([]);
        return;
      }
      const response = await apiClient.get(`/booking/myHistory/${tutorId}`);
      const bookings: Lesson[] = response.data || [];
      const now = new Date();
      const past = bookings.filter((b) => {
        if (!b.lessonDate || !b.endTime) return false;
        const end = new Date(`${b.lessonDate.split('T')[0]}T${b.endTime}`);
        return !isNaN(end.getTime()) && (b.status === 'completed' || end < now);
      });
      past.sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());
      setHistory(past);
    } catch (error) {
      console.error('שגיאה בטעינת היסטוריה', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('he-IL');

  const renderAvatar = (user?: UserType) => (
    user?.profileImage
      ? <Image source={{ uri: user.profileImage }} style={styles.avatar} />
      : <View style={[styles.avatar, styles.avatarPlaceholder]}>
        <Text style={styles.avatarInitial}>{user?.firstName?.[0]?.toUpperCase() || '?'}</Text>
      </View>
  );

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          שיעורים שבוצעו
          <Text style={styles.countText}> {history.length}</Text>
        </Text>
      </View>
      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.statusBadge}><Text style={styles.statusText}>בוצע</Text></View>
                <Text style={styles.dateText}>{formatDate(item.lessonDate)}</Text>
              </View>
              <View style={styles.cardMainRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.teacherName}>
                    {item.tutor?.user?.firstName || 'לא ידוע'} {item.tutor?.user?.lastName || ''}
                  </Text>
                  <Text style={styles.timeText}>{item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}</Text>
                  <Text style={styles.locationText}>{item.pickupLocation || ''}</Text>
                </View>
                {renderAvatar(item.tutor?.user)}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{Math.floor(item.priceAtBooking)} ש״ח</Text>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>אין שיעורים קודמים</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  countText: { color: '#999', fontWeight: '400', marginRight: 7 },
  listContent: { padding: 20 },
  historyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#f0f0f0' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { backgroundColor: '#E6F6F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#00A8B5', fontWeight: '600' },
  dateText: { color: '#888' },
  cardMainRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  infoColumn: { alignItems: 'flex-end', flex: 1 },
  teacherName: { fontWeight: '700', fontSize: 16 },
  timeText: { color: '#666' },
  locationText: { color: '#999' },
  avatar: { width: 45, height: 45, borderRadius: 25, marginLeft: 10 },
  avatarPlaceholder: { backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, borderTopWidth: 1, borderColor: '#f5f5f5', paddingTop: 10 },
  priceText: { fontWeight: '700', marginRight: 5 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#bbb', marginTop: 10 }
});