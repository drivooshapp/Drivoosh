import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen({ navigation }: any) {
    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/972548704450');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@drivoosh.com?subject=פנייה לשירות הלקוחות של דרייבוש');
    };

    const handleSms = () => {
        Linking.openURL('sms:972548704450');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>תמיכה ושירות לקוחות</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.docTitle}>צריכ/ה עזרה? אנחנו כאן.</Text>
                <Text style={styles.docSubtitle}>בין אם יש לך שאלה קטנה או צורך בהכוונת מערכת, נשמח לעזור לך בכל דרך שתבחר.</Text>

                <View style={styles.listContainer}>
                    <TouchableOpacity style={styles.rowItem} onPress={handleWhatsApp} activeOpacity={0.7}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={styles.rowTitle}>הודעת וואטסאפ</Text>
                            <Text style={styles.rowSubtitle}>שיחה עם נציג אנושי</Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Ionicons name="logo-whatsapp" size={20} color="#00C2E8" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.rowItem} onPress={handleEmail} activeOpacity={0.7}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={styles.rowTitle}>שליחת אימייל</Text>
                            <Text style={styles.rowSubtitle}>support@drivoosh.com</Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Ionicons name="mail-outline" size={20} color="#00C2E8" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.rowItem, { borderBottomWidth: 0 }]} onPress={handleSms} activeOpacity={0.7}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={styles.rowTitle}>הודעת SMS</Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Ionicons name="chatbubble-outline" size={20} color="#00C2E8" />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#111827' },
    backButton: { padding: 4 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60 },
    docTitle: { fontSize: 20, fontWeight: '600', color: '#111827', textAlign: 'right', marginBottom: 20 },
    docSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'right', marginBottom: 50, lineHeight: 20 },
    listContainer: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#cbcdd0', overflow: 'hidden' },
    rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 22, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#cbcdd0' },
    rowRight: { flex: 1, alignItems: 'flex-end' },
    rowLeft: { justifyContent: 'center', alignItems: 'center' },
    iconContainer: { marginLeft: 14, width: 32, alignItems: 'center' },
    rowTitle: { fontSize: 15, fontWeight: '500', color: '#111827', textAlign: 'right', marginBottom: 2 },
    rowSubtitle: { fontSize: 12, color: '#6B7280', textAlign: 'right' }
});