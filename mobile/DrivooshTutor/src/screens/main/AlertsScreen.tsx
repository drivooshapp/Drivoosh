import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';

interface NotificationItem {
  id: string;
  content: string;
  status: 'pending' | 'resolved';
  type: string;
  createdAt?: string;
}

export default function AlertsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notification/notifications');
      const allNotifications: NotificationItem[] = response.data.notifications || [];

      const pendingNotifications = allNotifications.filter(
        (item) => item.status === 'pending'
      );

      setNotifications(pendingNotifications);
    } catch (error) {
      console.log('Error fetching alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useEffect(() => {
  //   fetchNotifications();
  // }, []);
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL');
    } catch {
      return dateString;
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
          colors={['#00C2E8']}
          tintColor="#00C2E8"
        />
      }
    >
      <View style={styles.topHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeTitle}>התראות המערכת</Text>
          <Text style={styles.welcomeSub}>כל העדכונים והפעולות הממתינים לטיפולך</Text>
        </View>
        {notifications.length > 0 && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{notifications.length}</Text>
          </View>
        )}
      </View>

      {notifications.length > 0 ? (
        notifications.map((item) => (
          <View key={item.id} style={styles.alertCard}>
            {item.createdAt && (
              <View style={styles.cardHeaderRow}>
                <Ionicons name="notifications-outline" size={18} color="#00C2E8" />
                <Text style={styles.dateText}>התקבלה ב {formatDate(item.createdAt)}</Text>
              </View>
            )}

            <View style={styles.cardBodyRow}>
              <Text style={styles.alertText}>{item.content}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="checkmark-done-outline" size={32} color="#00C2E8" />
          </View>
          <Text style={styles.emptyTitle}>הכל מעודכן</Text>
          <Text style={styles.emptyText}>אין התראות חדשות שממתינות לטיפולך כרגע</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  topHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTextContainer: { alignItems: 'flex-end', flex: 1 },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  welcomeSub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  counterBadge: { paddingLeft: 5 },
  counterText: { color: '#a7a7a7', fontSize: 17 },
  alertCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#dfdfdf' },
  cardHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 6 },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  cardBodyRow: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
  alertText: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '500', color: '#1E293B', lineHeight: 20 },
  emptyBox: { padding: 40, borderRadius: 20, alignItems: 'center', marginTop: 20 },
  emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
});