import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';


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
        return <LoadingScreen />;
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'right', flex: 1 },
    countText: { color: '#9e9e9e', fontWeight: '400', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 7 },
    listContent: { padding: 20 },
    historyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#00C2E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F0F9FA' },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { backgroundColor: '#E6F6F7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    statusText: { color: '#00A8B5', fontSize: 12, fontWeight: '600' },    dateText: { fontSize: 13, color: '#8e8e93', fontWeight: '600' },
    cardMainRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    infoColumn: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
    teacherName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
    timeText: { fontSize: 14, color: '#666', marginBottom: 2 },
    locationText: { fontSize: 13, color: '#999' },
    avatar: { width: 50, height: 50, borderRadius: 30, marginLeft: 10 },
    avatarPlaceholder: { backgroundColor: '#0194b1', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F9F9F9' },
    priceText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginRight: 5 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { marginTop: 15, fontSize: 16, color: '#BDBDBD' },
});