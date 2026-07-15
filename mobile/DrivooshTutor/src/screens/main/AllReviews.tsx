import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';


export default function AllReviews({ route, navigation }: any) {
    // const { tutorId } = route.params;
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await apiClient.get("/review/reviews");
                setReviews(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const calculateAverage = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const handleDeleteReview = async (reviewId: string) => {
        Alert.alert(
            "הסרת המלצה",
            "האם אתה בטוח שברצונך למחוק את ההמלצה הזו? (הדירוג יישמר ורק התוכן יימחק)",
            [
                { text: "ביטול", style: "cancel" },
                {
                    text: "אישור",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiClient.put(`/review/deleteReview/${reviewId}`);

                            setReviews((prevReviews) =>
                                prevReviews.map((r) =>
                                    r.id === reviewId ? { ...r, content: "" } : r
                                )
                            );

                            Alert.alert("הצלחה", "תוכן ההמלצה נמחק בהצלחה.");
                        } catch (err) {
                            console.error(err);
                            Alert.alert("שגיאה", "מחיקת תוכן ההמלצה נכשלה.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const averageRating = calculateAverage();

    if (loading) return <LoadingScreen />;

    return (
        <View style={styles.container}>
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
                contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
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

                        <View style={styles.contentAndIcon}>
                            {item.content ? (
                                <TouchableOpacity onPress={() => handleDeleteReview(item.id)} style={styles.deleteReviewBtn}>
                                    <Ionicons name="trash-outline" size={15} color="#8E8E93" />
                                </TouchableOpacity>
                            ) : <View />}

                            <Text style={styles.content}>
                                {item.content ? `"${item.content}"` : "תוכן ההמלצה נמחק"}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>אין עדיין המלצות למורה זה.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { height: 85, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: {},
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
    contentAndIcon: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
    content: { flex: 1, color: '#444', textAlign: 'right', fontStyle: 'italic', lineHeight: 22, fontSize: 15, marginLeft: 8, paddingHorizontal: 4 },
    deleteReviewBtn: { justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});