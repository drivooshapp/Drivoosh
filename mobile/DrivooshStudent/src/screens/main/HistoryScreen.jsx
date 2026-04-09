import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import apiClient from '../../api/apiClient';

export default function HistoryScreen({ navigation }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/booking/myHistory');
            const bookings = response.data;

            const now = new Date();

            const past = bookings
                .filter((b) => {
                    const lessonEndDate = new Date(`${b.lessonDate.split('T')[0]}T${b.endTime}`);
                    return b.status === 'completed' || lessonEndDate < now;
                })
                .sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());

            setHistory(past);
        } catch (error) {
            console.error("שגיאה בטעינת היסטוריה", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('he-IL');
    };

    const renderTeacherAvatar = (user) => {
        if (user?.profileImage) {
            return <Image source={{ uri: user.profileImage }} style={styles.avatar} />;
        }
        const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?';
        return (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#0194b1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back-outline" size={28} color="#333" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    שיעורים שבוצעו
                    <Text style={styles.countText}>{history.length} </Text>
                </Text>
            </View>

            {history.length > 0 ? (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.historyCard}>
                            <View style={styles.cardTopRow}>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>בוצע</Text>
                                </View>
                                <Text style={styles.dateText}>{formatDate(item.lessonDate)}</Text>
                            </View>

                            <View style={styles.cardMainRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.teacherName}>
                                        {`${item.Tutor?.User?.firstName} ${item.Tutor?.User?.lastName}`}
                                    </Text>
                                    <Text style={styles.timeText}>
                                        {`${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}`}
                                    </Text>
                                    <Text style={styles.locationText}>{item.pickupLocation}</Text>
                                </View>
                                {renderTeacherAvatar(item.Tutor?.User)}
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={styles.priceText}>{`${Math.floor(item.priceAtBooking)} ש"ח`}</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            </View>
                        </View>
                    )}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>טרם בוצעו שיעורים</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'right', flex: 1 },
    countText: { color: '#888', fontWeight: 'normal', marginRight: 10 },
    listContent: { padding: 20 },
    historyCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
    dateText: { fontSize: 14, color: '#888', fontWeight: '500' },
    cardMainRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    infoColumn: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
    teacherName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    timeText: { fontSize: 14, color: '#666', marginBottom: 2 },
    locationText: { fontSize: 13, color: '#999' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, marginLeft: 10 },
    avatarPlaceholder: { backgroundColor: '#0194b1', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5', },
    priceText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginRight: 5 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 15, fontSize: 16, color: '#999' },
});