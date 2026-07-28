import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/src/api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';

interface TutorNote {
  id: string;
  tutorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function MessagesScreen({ navigation }: any) {
  const [notes, setNotes] = useState<TutorNote[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<TutorNote[]>(`/tutorNote/allNotes`);
      setNotes(res.data);
    }
    catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    setError('');
    if (!newNoteText.trim()) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post('/tutorNote/addNote', { content: newNoteText });
      setNewNoteText('');
      if (res.data?.note) {
        setNotes(prev => [res.data.note, ...prev]);
      } else {
        fetchNotes();
      }
    } catch (err: any) {
      const statusCode = err.response?.status;
      if (statusCode === 422)
        Alert.alert("שגיאה", err.response?.data?.message)
      else
        setError(`${err.response?.data?.message}\nנסה שוב מאוחר יותר`)
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("מחיקת עדכון", "האם למחוק את ההודעה לצמיתות?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק", style: "destructive", onPress: async () => {
          try {
            await apiClient.delete(`/tutorNote/deleteNote/${noteId}`);
            setNotes(p => p.filter(n => n.id !== noteId));
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>לוח עדכונים</Text>
        <Text style={styles.headerSubtitle}>שתף הודעות, שינויים ועדכונים שוטפים עם התלמידים שלך</Text>
      </View>

      <View style={styles.composerContainer}>
        <TextInput
          value={newNoteText}
          onChangeText={setNewNoteText}
          placeholder="שלח עדכון חדש לתלמידים..."
          placeholderTextColor="#94A3B8"
          style={styles.input}
          multiline
          maxLength={400}
        />

        <View style={styles.composerFooter}>
          <View style={styles.errorContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.footerLeft}>
            <TouchableOpacity
              style={[styles.sendBtn, !newNoteText.trim() && styles.sendBtnDisabled]}
              onPress={handleAddNote}
              disabled={!newNoteText.trim() || actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <Text style={styles.charCounter}>{newNoteText.length}/400</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Text style={styles.cardDate}>
                    {new Date(item.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteNote(item.id)}
                  style={styles.deleteAction}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="trash-outline" size={15} color="#767676" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardText}>{item.content}</Text>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'right', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 4, lineHeight: 18 },
  composerContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 24, marginTop: 8, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#dddddd' },
  input: { fontSize: 15, color: '#000000', textAlign: 'right', minHeight: 70, textAlignVertical: 'top', padding: 0, lineHeight: 22 },
  charCounter: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  sendBtn: { backgroundColor: '#019cbb', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', shadowColor: '#019cbb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  sendBtnDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0, opacity: 0.7 },
  composerFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  errorContainer: { flex: 1, paddingLeft: 8, },
  errorText: { color: '#EF4444', fontSize: 12, textAlign: 'right', lineHeight: 16 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  list: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  card: { backgroundColor: '#ddf4f9', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#c2ecf5' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateBadge: { backgroundColor: '#caeef5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, },
  cardDate: { fontSize: 11, color: '#475569', fontWeight: '600' },
  deleteAction: { justifyContent: 'center' },
  cardText: { fontSize: 14.5, color: '#334155', textAlign: 'right', lineHeight: 23, fontWeight: '400' }
});