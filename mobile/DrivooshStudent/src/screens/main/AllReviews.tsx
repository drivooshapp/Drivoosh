import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';

export default function AllReviews({ route, navigation }: any) {
    const { tutorId } = route.params;
    const [reviews, setReviews] = useState([]);
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

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>כל ההמלצות</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={reviews}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }: any) => (
                    <View style={styles.reviewCard}>
                        <View style={styles.row}>
                            <View style={styles.stars}>
                                {[...Array(5)].map((_, i) => (
                                    <Ionicons key={i} name={i < item.rating ? "star" : "star-outline"} size={16} color="#FFD700" />
                                ))}
                            </View>
                            <Text style={styles.name}>{item.reviewer?.firstName} {item.reviewer?.lastName}</Text>
                        </View>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('he-IL')}</Text>
                        <Text style={styles.content}>{item.content}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
    reviewCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontWeight: 'bold', fontSize: 16 },
    stars: { flexDirection: 'row' },
    date: { fontSize: 12, color: '#999', marginBottom: 8, textAlign: 'right' },
    content: { color: '#444', textAlign: 'right', lineHeight: 20 }
});