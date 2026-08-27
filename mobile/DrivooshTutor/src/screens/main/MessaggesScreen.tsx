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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleAddNote = async () => {
    setError('');
    if (!newNoteText.trim()) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post('/tutorNote/addNote', { content: newNoteText });
      setNewNoteText('');
      if (res.data?.note) setNotes(prev => [res.data.note, ...prev]);
      else fetchNotes();
    } catch (err: any) {
      const statusCode = err.response?.status;
      if (statusCode === 422) Alert.alert("שגיאה", err.response?.data?.message);
      else setError(`${err.response?.data?.message}\nנסה שוב מאוחר יותר`);
    } finally { setActionLoading(false); }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("מחיקת עדכון", "האם למחוק את ההודעה לצמיתות?", [
      { text: "ביטול", style: "cancel" },
      { text: "מחק", style: "destructive", onPress: async () => {
          try {
            await apiClient.delete(`/tutorNote/deleteNote/${noteId}`);
            setNotes(p => p.filter(n => n.id !== noteId));
          } catch (e) { console.error(e); }
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>לוח עדכונים</Text>
        <Text style={styles.headerSubtitle}>שתף הודעות, שינויים ועדכונים שוטפים עם התלמידים שלך</Text>
      </View>

      <View style={styles.composerContainer}>
        <TextInput
          value={newNoteText}
          onChangeText={setNewNoteText}
          placeholder="כתוב עדכון חדש לתלמידים..."
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
            <TouchableOpacity style={[styles.sendBtn, !newNoteText.trim() && styles.sendBtnDisabled]} onPress={handleAddNote} disabled={!newNoteText.trim() || actionLoading}>
              {actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="arrow-up" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.charCounter}>{newNoteText.length}/400</Text>
          </View>
        </View>
      </View>

      {loading ? <LoadingScreen /> : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={notes.length > 0 ? <Text style={styles.sectionHeader}>עדכונים אחרונים</Text> : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Text>
                <TouchableOpacity onPress={() => handleDeleteNote(item.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="trash-outline" size={15} color="#94A3B8" />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerBar: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 50 : 24, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'right', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'right', marginTop: 4, lineHeight: 20 },
  composerContainer: { backgroundColor: '#FAFAFA', marginHorizontal: 24, marginBottom: 25, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E5E7EB' },
  input: { fontSize: 15, color: '#111827', textAlign: 'right', minHeight: 75, textAlignVertical: 'top', padding: 0, lineHeight: 24 },
  charCounter: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  sendBtn: { backgroundColor: '#019cbb', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#E5E7EB', opacity: 0.7 },
  composerFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  errorContainer: { flex: 1, paddingLeft: 12 },
  errorText: { color: '#EF4444', fontSize: 12, textAlign: 'right', lineHeight: 16 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'right', marginBottom: 12, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  cardText: { fontSize: 15, color: '#1F2937', textAlign: 'right', lineHeight: 24 }
});