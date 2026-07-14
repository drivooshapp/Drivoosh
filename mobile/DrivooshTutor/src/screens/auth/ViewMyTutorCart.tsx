import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';


export default function ViewMyTutorCart({ navigation }: any) {
    const [tutor, setTutor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyProfile();
    }, []);

    const fetchMyProfile = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/tutor/myProfile');
            const tutorData = response.data;

            if (tutorData) {
                let reviewsData = [];
                try {
                    const reviewsResponse = await apiClient.get(`/review/reviews/${tutorData.id}`);
                    reviewsData = reviewsResponse.data || [];
                } catch (reviewErr) {
                    console.log("Error fetching reviews specifically:", reviewErr);
                }

                setTutor({
                    ...tutorData,
                    reviews: reviewsData
                });
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const calculateAverage = () => {
        if (!tutor?.reviews || tutor.reviews.length === 0) return "0.0";
        const sum = tutor.reviews.reduce((acc: number, item: any) => acc + item.rating, 0);
        return (sum / tutor.reviews.length).toFixed(1);
    };

    const averageRating = calculateAverage();

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

                            setTutor((prevTutor: any) => {
                                if (!prevTutor) return null;
                                const updatedReviews = prevTutor.reviews.map((r: any) => {
                                    if (r.id === reviewId) {
                                        return { ...r, content: "" };
                                    }
                                    return r;
                                });
                                return {
                                    ...prevTutor,
                                    reviews: updatedReviews
                                };
                            });

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

    if (loading) return <LoadingScreen />;
    if (!tutor) return <View style={styles.center}><Text>הפרופיל שלך לא נמצא במערכת</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back-outline" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profile}>
                    <View style={styles.imgBox}>
                        {tutor.user?.profileImage ? (
                            <Image source={{ uri: tutor.user.profileImage }} style={styles.img} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.initial}>
                                    {tutor.user?.firstName?.charAt(0)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.name}>{tutor.user?.firstName} {tutor.user?.lastName}</Text>
                </View>

                <View style={styles.stats}>
                    <Stat icon="star-outline" label="דירוג" value={averageRating} />
                    <Divider />
                    <Stat icon="cash-outline" label="שיעור" value={`₪${tutor.pricePerLesson}`} />
                    <Divider />
                    <Stat icon="car-sport-outline" label="רכב" value={tutor.carModel} />
                </View>

                <View style={styles.info}>
                    <Text style={styles.title}>קצת עלי</Text>
                    <Text style={styles.bio}>{tutor.bio || 'אין מידע זמין כרגע.'}</Text>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.title}>המלצות תלמידים</Text>
                        {tutor.reviews?.length > 0 && (
                            <TouchableOpacity onPress={() => navigation.navigate('AllReviews', { tutorId: tutor.id })}>
                                <Text style={styles.linkText}>הצג הכל ({tutor.reviews.length})</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {tutor.reviews && tutor.reviews.length > 0 ? (
                        <View style={styles.reviewPreview}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.stars}>
                                    {[...Array(5)].map((_, i) => (
                                        <Ionicons
                                            key={i}
                                            name={i < tutor.reviews[0].rating ? "star" : "star-outline"}
                                            size={14}
                                            color="#EBB10F"
                                        />
                                    ))}
                                </View>
                                <Text style={styles.reviewerName}>
                                    {tutor.reviews[0].reviewer?.firstName} {tutor.reviews[0].reviewer?.lastName}
                                </Text>
                            </View>
                            <View style={styles.contentAndIcon}>
                                {tutor.reviews[0].content ? (
                                    <TouchableOpacity onPress={() => handleDeleteReview(tutor.reviews[0].id)} style={styles.deleteReviewBtn}>
                                        <Ionicons name="trash-outline" size={15} color="#000000" />
                                    </TouchableOpacity>
                                ) : <View />}
                                <Text style={styles.reviewContent} numberOfLines={3}>
                                    {tutor.reviews[0].content ? `"${tutor.reviews[0].content}"` : "תוכן ההמלצה נמחק"}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.noReviews}>אין עדיין המלצות בפרופיל שלך.</Text>
                    )}

                    <Text style={[styles.title, { marginTop: 30 }]}>פרטי קשר ופעילות</Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.text}>{tutor.user?.street}, {tutor.user?.city}</Text>
                            <Icon name="location-outline" />
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.text}>{tutor.user?.phoneNumber}</Text>
                            <Icon name="call-outline" />
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.text}>
                                {tutor.workStartHour} - {tutor.workEndHour}
                            </Text>
                            <Icon name="time-outline" />
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footerContainer}>
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('ProfileTab')}>
                    <Ionicons name="create-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    <Text style={styles.editButtonText}>עריכת הפרופיל</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const Stat = ({ icon, label, value }: any) => (
    <View style={styles.stat}>
        <Ionicons name={icon} size={22} color="#017f98" style={styles.statIcon} />
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const Divider = () => <View style={styles.divider} />;

const Icon = ({ name }: any) => (
    <View style={styles.icon}>
        <Ionicons name={name} size={18} color="#666" />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 10 },
    backBtn: { padding: 5 },
    profile: { alignItems: 'center', marginVertical: 19 },
    imgBox: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', marginBottom: 7 },
    img: { width: 110, height: 110, marginBottom: 7 },
    placeholder: { flex: 1, backgroundColor: '#017f98', justifyContent: 'center', alignItems: 'center' },
    initial: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
    name: { fontSize: 24, fontWeight: 'bold' },
    stats: { flexDirection: 'row-reverse', marginHorizontal: 20, backgroundColor: '#F9F9F9', borderRadius: 20, padding: 15, justifyContent: 'space-between', alignItems: 'flex-start' },
    stat: { flex: 1, alignItems: 'center' },
    statIcon: { marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#999' },
    statValue: { fontWeight: 'bold', textAlign: 'center' },
    divider: { width: 1, height: '100%', backgroundColor: '#E0E0E0' },
    info: { padding: 20, paddingBottom: 105 },
    bio: { color: '#555', textAlign: 'right', marginTop: 10 },
    sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 10, width: '100%', },
    title: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', paddingTop: 30, },
    linkText: { color: '#017f98', fontWeight: 'bold', paddingTop: 30, },
    reviewPreview: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 15, marginTop: 15 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewerName: { fontWeight: 'bold', fontSize: 13.5, color: '#5f5f5f' },
    stars: { flexDirection: 'row', gap: 2 },
    contentAndIcon: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, },
    reviewContent: { flex: 1, color: '#444', textAlign: 'right', fontSize: 15, lineHeight: 22, marginLeft: 8 },
    deleteReviewBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
    noReviews: { color: '#999', textAlign: 'right', marginTop: 15 },
    card: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 15, marginTop: 15 },
    row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginVertical: 8 },
    text: { marginRight: 10, color: '#444' },
    icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    footerContainer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: '#fff', marginTop: -90 },
    editButton: { backgroundColor: '#069cba', height: 56, borderRadius: 12, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.5 }
});