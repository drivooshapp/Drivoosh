import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '@/src/api/apiClient';

interface TutorNote {
  id: string;
  tutorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentMessagesScreen() {
  const [notes, setNotes] = useState<TutorNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNotes = async () => {
    try {
      const res = await apiClient.get<TutorNote[]>(`/tutorNote/allNotes`);
      setNotes(res.data);
    } catch (err) {
      console.error("Error fetching student notes:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>לוח עדכונים</Text>
        <Text style={styles.headerSubtitle}>הודעות, שינויים ועדכונים שוטפים מהמורה שלך</Text>
      </View>

      {/* Notes Stream */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#019cbb" />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#019cbb"]} tintColor="#019cbb" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-outline" size={60} color="#94A3B8" />
              <Text style={styles.emptyTitle}>אין עדכונים חדשים</Text>
              <Text style={styles.emptySubtitle}>כשהמורה שלך יפרסם הודעה או עדכון, הם יופיעו כאן.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Text style={styles.cardDate}>
                    {new Date(item.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardText}>{item.content}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header Style
  headerBar: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'right', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 4, lineHeight: 18 },

  // Feed List
  list: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, flexGrow: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e3e3e3' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  cardDate: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  cardText: { fontSize: 14.5, color: '#334155', textAlign: 'right', lineHeight: 23, fontWeight: '400' },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 6, textAlign: 'center', lineHeight: 20 }
});