import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiClient from '../../../api/apiClient';

export default function FinalFormSealScreen({ route, navigation }: any) {
    const { studentId, headerData } = route.params;
    const [lessonsCount, setLessonsCount] = useState(String(headerData?.totalLessonsCount || '28'));
    const [otherTutorLessons, setOtherTutorLessons] = useState(String(headerData?.totalLessonsOtherTutor || '0'));
    const [downloading, setDownloading] = useState(false);
    const [formExported, setFormExported] = useState(false);

    const handleFinalSubmit = async () => {
        try {
            // עדכון החלק הממוסגר בשרת[cite: 1]
            await apiClient.post('/student/updateFormHeader', {
                studentId,
                fields: {
                    totalLessonsCount: parseInt(lessonsCount) || 28,
                    totalLessonsOtherTutor: parseInt(otherTutorLessons) || 0,
                    isTutorApproved: true,
                    tutorApprovedAt: new Date()
                }
            });
            setFormExported(true);
            Alert.alert('הצלחה', 'הטופס ננעל בהצלחה! ניתן כעת לייצא ולהוריד אותו למכשיר.');
        } catch (error) {
            Alert.alert('שגיאה', 'נעילת הטופס נכשלה');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const pdfUrl = `${apiClient.defaults.baseURL}/student/exportPDF/${studentId}`;
            //   const fileUri = `${FileSystem.documentDirectory}driving_goals_form_${studentId}.pdf`;
            const docDir = (FileSystem as any)['documentDirectory'];
            const fileUri = `${docDir}driving_goals_form_${studentId}.pdf`;

            // הורדת הקובץ דינמית לטלפון[cite: 1]
            const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri, {
                headers: {
                    'Authorization': apiClient.defaults.headers.common['Authorization'] as string
                }
            });

            if (downloadResult.status === 200) {
                Alert.alert('הצלחה', 'הקובץ הורד בהצלחה!');
                // פתיחת חלונית שיתוף/שמירה של מערכת ההפעלה
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadResult.uri);
                }
            }
        } catch (error) {
            Alert.alert('שגיאה', 'הורדת הקובץ נכשלה');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>חתימה ואישור סילבוס</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={28} color="#00A8B5" />
                    <Text style={styles.infoTitle}>אישור מורה מוסמך</Text>
                    <Text style={styles.infoSub}>הצהרה על ביצוע מינימום 28 שיעורים לפי דרישות משרד הרישוי[cite: 1]</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>סה"כ שיעורי נהיגה שבוצעו אצלך:[cite: 1]</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={lessonsCount}
                        onChangeText={setLessonsCount}
                        placeholder="לדוגמה: 28"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>שיעורים שבוצעו אצל מורה אחר (אם יש):[cite: 1]</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={otherTutorLessons}
                        onChangeText={setOtherTutorLessons}
                        placeholder="הזן 0 אם לא היו"
                    />
                </View>

                {formExported && (
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewTitle}>הטופס מוכן לייצוא!</Text>
                        <Ionicons name="document-text-outline" size={70} color="#00A8B5" style={{ marginVertical: 15 }} />
                        <Text style={styles.previewSub}>הטופס חתום וממולא כחוק ומוכן לשליחה למשרד הרישוי.[cite: 1]</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {!formExported ? (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleFinalSubmit}>
                        <Text style={styles.buttonText}>נעילת טופס ואישור הצהרה[cite: 1]</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#FF8C00' }]} onPress={handleDownloadPDF} disabled={downloading}>
                        <Text style={styles.buttonText}>{downloading ? "מוריד קובץ..." : "הורדת טופס PDF לייצוא[cite: 1]"}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 55 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F0F0F0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    body: { padding: 24 },
    infoBox: { backgroundColor: '#E0F7FA', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 25 },
    infoTitle: { fontSize: 16, fontWeight: '700', color: '#00A8B5', marginTop: 10 },
    infoSub: { fontSize: 13, color: '#555', textAlign: 'center', marginTop: 5, lineHeight: 18 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8, textAlign: 'right' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 15, fontSize: 16, textAlign: 'right' },
    previewContainer: { alignItems: 'center', marginTop: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#00A8B5', borderRadius: 16, padding: 20 },
    previewTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    previewSub: { fontSize: 13, color: '#777', textAlign: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#F0F0F0' },
    primaryButton: { backgroundColor: '#00A8B5', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});