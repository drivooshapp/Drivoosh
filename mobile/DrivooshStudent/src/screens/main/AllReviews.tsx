import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';

export default function AllReviews({ route, navigation }: any) {
    const { tutorId } = route.params;
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await apiClient.get(`/review/tutor/${tutorId}`);
                setReviews(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [tutorId]);

    const calculateAverage = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const averageRating = calculateAverage();

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>תלמידים ממליצים</Text>
                    {reviews.length > 0 && (
                        <View style={styles.averageRow}>
                            <Text style={styles.averageText}>({reviews.length} ביקורות)</Text>
                            <Text style={styles.averageNumber}>{averageRating}</Text>
                            <Ionicons name="star" size={14} color="#ffc400" style={{ marginLeft: 4 }} />
                        </View>
                    )}
                </View>
            </View>

            <FlatList
                data={reviews}
                keyExtractor={(item: any) => item.id.toString()}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }: any) => (
                    <View style={styles.reviewCard}>
                        <View style={styles.row}>
                             <Text style={styles.name}>{item.reviewer?.firstName} {item.reviewer?.lastName}</Text>
                             <View style={styles.stars}>
                                {[...Array(5)].map((_, i) => (
                                    <Ionicons key={i} name={i < item.rating ? "star" : "star-outline"} size={16} color="#ffc400" />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('he-IL')}</Text>
                        <Text style={styles.content}>{item.content}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>אין עדיין המלצות למורה זה.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { position: 'absolute', left: 15, zIndex: 10, top: 25 },
    titleContainer: { flex: 1, alignItems: 'flex-end' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    averageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    averageNumber: { fontSize: 15, fontWeight: '600', color: '#333' },
    averageText: { fontSize: 13, color: '#888', marginRight: 6 },
    reviewCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 15 },
    row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    stars: { flexDirection: 'row', gap: 2 },
    date: { fontSize: 12, color: '#999', marginBottom: 8, textAlign: 'right' },
    content: { color: '#444', textAlign: 'right',fontStyle: 'italic', lineHeight: 22, fontSize: 15 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});