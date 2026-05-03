import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';


export default function TutorDetails({ route, navigation }: any) {
    const { tutorId } = route.params;
    const [tutor, setTutor] = useState<any>(null);
    const [tutorOfUser, setTutorOfUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isReviewModalVisible, setReviewModalVisible] = useState(false);
    const [isStudentOfTutor, setIsStudentOfTutor] = useState(false);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');

    useEffect(() => {
        fetchTutorDetails();
        checkStudentStatus();
    }, [tutorId]);

    const fetchTutorDetails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/tutor/getTutor/${tutorId}`);
            setTutor(response.data);
        } catch (e) {
            console.error(e);
            Alert.alert('שגיאה', 'לא הצלחנו לטעון את פרטי המורה. נסי שוב.');
        } finally {
            setLoading(false);
        }
    };

    const checkStudentStatus = async () => {
        try {
            const response = await apiClient.get('/student/myProfile');
            const currentUser = response.data;

            const currentSelectedId = currentUser.chosenTutor ? currentUser.chosenTutor.id : null;
            setTutorOfUser(currentSelectedId);

            if (currentSelectedId === tutorId) {
                setIsStudentOfTutor(true);
            } else {
                setIsStudentOfTutor(false);
            }
        } catch (e) {
            console.error("Error checking student status:", e);
        }
    };

    const handleSubmitReview = async () => {
        if (!content.trim()) {
            Alert.alert("שגיאה", "נא למלא תוכן להמלצה");
            return;
        }

        try {
            await apiClient.post('/review/addReview', { tutorId: tutor.id, content, rating });
            setReviewModalVisible(false);
            setContent('');
            setRating(5);
            fetchTutorDetails();

        } catch (error) {
            console.error(error);
            Alert.alert('שגיאה', 'הוספת ההמלצה נכשלה, נסה שוב מאוחר יותר');
        }
    };

    const handleSelectTutor = async () => {
        const executeSelection = async () => {
            try {
                setLoading(true);
                const response = await apiClient.put(`/student/selectTutor/${tutor.id}`);
                if (response.status === 200) {
                    Alert.alert('בהצלחה!', `בחרת ב${tutor.user?.firstName} כמורה שלך.`);
                    await checkStudentStatus();
                }
            } catch (e) {
                console.error(e);
                Alert.alert('שגיאה', 'בחירת המורה נכשלה');
            } finally {
                setLoading(false);
            }
        };

        if (tutorOfUser) {
            // Alert.alert(
            //     'החלפת מורה',
            //     `שים לב שאתה כבר משויך למורה אחר. האם ברצונך להחליף אותו ב${tutor.user?.firstName}?`,
            //     [
            //         { text: 'ביטול', style: 'cancel' },
            //         {
            //             text: 'כן, החלף מורה',
            //             style: 'destructive',
            //             onPress: executeSelection
            //         }
            //     ]
            // );
            executeSelection();
        }
        else {
            executeSelection();
        }
    };

    const handleUnselectTutor = async () => {
        // Alert.alert(
        //     "ביטול בחירת מורה",
        //     "האם אתה בטוח שברצונך לבטל את השיוך למורה? פעולה זו עשויה להשפיע על תיאום השיעורים שלך.",
        //     [
        //         { text: "ביטול", style: "cancel" },
        //         {
        //             text: "כן, בטל שיוך",
        //             style: "destructive",
        //             onPress: async () => {
        //                 try {
        //                     await apiClient.put(`/student/unselectTutor`);
        //                     setIsStudentOfTutor(false);
        //                     Alert.alert("השיוך בוטל", "כעת ניתן לבחור מורה חדש.");
        //                 } catch (e) {
        //                     Alert.alert("שגיאה", "הסרת מורה נכשלה");
        //                 }
        //             }
        //         }
        //     ]
        // );
        try {
            await apiClient.put(`/student/unselectTutor`);
            setIsStudentOfTutor(false);
            setTutorOfUser(null);
            Alert.alert("השיוך בוטל", "כעת ניתן לבחור מורה חדש.");
        } catch (e) {
            Alert.alert("שגיאה", "הסרת מורה נכשלה");
        }
    };

    const handleCall = async () => {
        try {
            await Linking.openURL(`tel:${tutor.user.phoneNumber}`);

        } catch (err) {
            Alert.alert('שגיאה', 'אירעה תקלה בניסיון לבצע שיחה');
        }
    };

    const handleOpenMap = async () => {
        try {
            const address = `${tutor.User?.street}, ${tutor.User?.city}`;
            const url =
                Platform.select({
                    ios: `maps:0,0?q=${address}`,
                    android: `geo:0,0?q=${address}`,
                }) || `https://www.google.com/maps/search/?api=1&query=${address}`;

            const supported = await Linking.canOpenURL(url);

            if (!supported) {
                Alert.alert('שגיאה', 'לא ניתן לפתוח מפה במכשיר זה');
                return;
            }

            await Linking.openURL(url);
        } catch {
            Alert.alert('שגיאה', 'אירעה תקלה בפתיחת המפה');
        }
    };

    if (loading) return <LoadingScreen />;
    if (!tutor) return <View style={styles.center}><Text>המורה לא נמצא</Text></View>;

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
                    <Text style={styles.sub}>לימוד נהיגה • {tutor.experienceYears} שנות ניסיון</Text>
                </View>

                <View style={styles.stats}>
                    <Stat icon="settings-outline" label="גיר" value={tutor.gearbox === 'automatic' ? 'אוטומט' : 'ידני'} />
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
                            <Text style={styles.reviewContent} numberOfLines={2}>
                                "{tutor.reviews[0].content}"
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.noReviews}>אין עדיין המלצות למורה זה.</Text>
                    )}

                    {isStudentOfTutor && (<TouchableOpacity
                        style={styles.addReviewBtn}
                        onPress={() => setReviewModalVisible(true)}
                    >
                        <Text style={styles.addReviewText}>+ הוסף המלצה</Text>
                    </TouchableOpacity>)}

                    <Text style={[styles.title, { marginTop: 30 }]}>פרטי קשר</Text>

                    <View style={styles.card}>

                        <TouchableOpacity style={styles.row} onPress={handleOpenMap}>
                            <Text style={styles.text}>{tutor.user?.street}, {tutor.user?.city}</Text>
                            <Icon name="location-outline" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={handleCall}>
                            <Text style={styles.text}>{tutor.user?.phoneNumber}</Text>
                            <Icon name="call-outline" />
                        </TouchableOpacity>

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
                {isStudentOfTutor ? (
                    <View>
                        <View style={styles.statusBadge}>
                            <Ionicons name="checkmark-circle" size={24} color="#949494" />
                            <Text style={styles.statusText}>המורה הנבחר שלך</Text>
                        </View>
                        <TouchableOpacity style={styles.unselectLink} onPress={handleUnselectTutor}>
                            <Text style={styles.unselectText}>הסרת המורה מהפרופיל שלי</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.submitButton} onPress={handleSelectTutor}>
                        <Text style={styles.submitButtonText}>
                            {tutorOfUser ? 'החלף מורה' : 'בחר מורה'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <Modal visible={isReviewModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={26} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>איך היה השיעור ?</Text>
                        <Text style={styles.modalDescription}>נשמח לשמוע את דעתך על המורה והתהליך.</Text>

                        <View style={styles.ratingSection}>
                            <View style={styles.starsWrapper}>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <TouchableOpacity key={num} onPress={() => setRating(num)}>
                                        <Ionicons
                                            name={num <= rating ? "star" : "star-outline"}
                                            size={28}
                                            color={num <= rating ? "#EBB10F" : "#D1D1D1"}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="מורה מקצועי, קשוב וסבלני מאוד..."
                                multiline
                                value={content}
                                onChangeText={setContent}
                                textAlign="right"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
                            <Text style={styles.submitButtonText}>פרסם המלצה</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
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
    sub: { color: '#888', marginBottom: 2 },
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
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    reviewerName: { fontWeight: 'bold', fontSize: 13.5, color: '#5f5f5f' },
    stars: { flexDirection: 'row', gap: 2 },
    reviewContent: { color: '#666', fontSize: 13, textAlign: 'right', fontStyle: 'italic' },
    noReviews: { color: '#999', textAlign: 'right', marginTop: 15 },
    addReviewBtn: { alignSelf: 'center', marginTop: 15 },
    addReviewText: { color: '#00C2E8', fontWeight: '600' },
    card: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 15, marginTop: 15 },
    row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginVertical: 8 },
    text: { marginRight: 10, color: '#444' },
    icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff' },
    btn: { backgroundColor: '#111', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingTop: 0 },
    btnText: { color: '#fff', fontWeight: 'bold' },
    selectedBtn: { backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E6E8EB', shadowOpacity: 0 },
    footerContainer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderColor: '#F2F2F7', backgroundColor: '#fff', marginTop: -70 },
    statusBadge: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F5', borderRadius: 16, height: 60, gap: 10 },
    statusText: { color: '#48484A', fontWeight: 'bold', fontSize: 17 },
    unselectLink: { alignSelf: 'center', marginTop: 15, padding: 5 },
    unselectText: { color: '#FF3B30', fontSize: 13, fontWeight: '500', opacity: 0.7, letterSpacing: -0.2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, minHeight: 480 },
    closeButton: { alignSelf: 'flex-start', padding: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginTop: 10, color: '#1A1A1A' },
    modalDescription: { fontSize: 15, color: '#666', textAlign: 'right', marginTop: 5, marginBottom: 35, lineHeight: 20 },
    ratingSection: { alignItems: 'center', marginBottom: 35 },
    starsWrapper: { flexDirection: 'row-reverse', gap: 10 },
    inputContainer: { marginBottom: 25 },
    textArea: { backgroundColor: '#F7F8F9', borderRadius: 12, height: 140, padding: 16, textAlignVertical: 'top', fontSize: 16, color: '#000', textAlign: 'right', writingDirection: 'rtl', borderColor: '#E6E8EB', borderWidth: 1 },
    submitButton: { backgroundColor: '#111111', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.5 }
});