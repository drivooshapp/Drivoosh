import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../api/apiClient';
import LoadingScreen from '../../components/LoadingScreen';

export default function TutorDetails({ route, navigation }: any) {
    const { tutorId } = route.params;
    const [tutor, setTutor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTutorDetails(); }, [tutorId]);

    const fetchTutorDetails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/tutor/getTutor/${tutorId}`);
            setTutor(response.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!tutor) return <View style={styles.center}><Text>המורה לא נמצא</Text></View>;

    const handleCall = () => {
        const clean = tutor.User.phoneNumber.replace(/[^0-9+]/g, '');
        Linking.openURL(`tel:${clean}`);
    };

    const handleOpenMap = () => {
        const address = `${tutor.User?.street}, ${tutor.User?.city}`;
        const url = Platform.select({
            ios: `maps:0,0?q=${address}`,
            android: `geo:0,0?q=${address}`
        }) || `https://www.google.com/maps/search/?api=1&query=${address}`;

        Linking.openURL(url);
    };

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
                        {tutor.User?.profileImage ? (
                            <Image source={{ uri: tutor.User.profileImage }} style={styles.img} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.initial}>
                                    {tutor.User?.firstName?.charAt(0)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>{tutor.User?.firstName} {tutor.User?.lastName}</Text>
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

                    <Text style={[styles.title, { marginTop: 30 }]}>פרטי קשר</Text>

                    <View style={styles.card}>

                        <TouchableOpacity style={styles.row} onPress={handleOpenMap}>
                            <Text style={styles.text}>{tutor.User?.street}, {tutor.User?.city}</Text>
                            <Icon name="location-outline" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={handleCall}>
                            <Text style={styles.text}>{tutor.User?.phoneNumber}</Text>
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

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btn} onPress={handleCall}>
                    <Text style={styles.btnText}>בחר מורה</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const Stat = ({ icon, label, value }: any) => (
    <View style={styles.stat}>
        <Ionicons name={icon} size={22} color="#00C2E8" style={styles.statIcon} />
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
    placeholder: { flex: 1, backgroundColor: '#00C2E8', justifyContent: 'center', alignItems: 'center' },
    initial: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
    name: { fontSize: 24, fontWeight: 'bold' },
    sub: { color: '#888', marginBottom: 2 },
    stats: { flexDirection: 'row-reverse', marginHorizontal: 20, backgroundColor: '#F9F9F9', borderRadius: 20, padding: 15, justifyContent: 'space-between', alignItems: 'flex-start' },
    stat: { flex: 1, alignItems: 'center' },
    statIcon: { marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#999' },
    statValue: { fontWeight: 'bold', textAlign: 'center' },
    divider: { width: 1, height: '100%', backgroundColor: '#E0E0E0' },
    info: { padding: 20, paddingBottom: 105 },
    title: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', paddingTop: 20 },
    bio: { color: '#555', textAlign: 'right', marginTop: 10 },
    card: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 15, marginTop: 15 },
    row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginVertical: 8 },
    text: { marginRight: 10, color: '#444' },
    icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff' },
    btn: { backgroundColor: '#111', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingTop: 0 },
    btnText: { color: '#fff', fontWeight: 'bold' }
});