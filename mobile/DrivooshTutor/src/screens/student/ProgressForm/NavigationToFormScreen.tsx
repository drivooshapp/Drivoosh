import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProgressFormScreen({ route, navigation }: any) {
    const { studentId, studentName } = route.params;
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back-outline" size={24} color="#0f172a" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>טופס מטרות לימוד</Text>
                <Text style={styles.subtitle}>בחר את הפעולה הרצויה לצפייה בהישגי התלמיד או לעדכון מיומנויות הלמידה שלו בקורס.</Text>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("ViewProgressForm")}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="eye-outline" size={24} color="#007890" />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>צפייה בטופס</Text>
                        <Text style={styles.cardDesc}>הצג את מצב המטרות הנוכחי ושלבי הלמידה שכבר בוצעו.</Text>
                    </View>
                    <Ionicons name="chevron-back" size={16} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardPrimary]}
                    onPress={() => navigation.navigate("GoalsForm", { studentId, studentName})}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, styles.iconContainerPrimary]}>
                        <Ionicons name="create-outline" size={24} color="#007890" />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>מילוי/ עדכון הטופס</Text>
                        <Text style={styles.cardDesc}>עדכן מיומנויות חדשות, סמן מטרות שהושגו והזן משוב ודירוג.</Text>
                    </View>
                    <Ionicons name="chevron-back" size={16} color="#94a3b8" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingHorizontal: 24, alignItems: 'flex-start' },
    backBtn: { paddingVertical: 8 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'right', marginBottom: 8, letterSpacing: -0.3 },
    subtitle: { fontSize: 14, color: '#64748b', textAlign: 'right', marginBottom: 32, lineHeight: 20 },
    actionCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 20, padding: 20, marginBottom: 16 },
    actionCardPrimary: { backgroundColor: '#eefcff', borderColor: '#a7e4f1' },
    iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
    iconContainerPrimary: { backgroundColor: '#cff3fb' },
    cardTextContainer: { flex: 1, alignItems: 'flex-end', marginLeft: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    cardDesc: { fontSize: 12.5, color: '#64748b', textAlign: 'right', lineHeight: 17 }
});