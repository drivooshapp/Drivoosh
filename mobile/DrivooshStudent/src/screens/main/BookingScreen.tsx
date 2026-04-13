import apiClient from '@/src/api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import LoadingScreen from '@/src/components/LoadingScreen';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


export default function NewBookingScreen({ navigation }: any) {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [lessonDate, setLessonDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // const tutorId = "075e76af-360b-48eb-a8b6-36227e8c9c3a";
    const tutorId = "6bb1eb75-58a2-429d-a98a-82ab65761a4e";

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiClient.get('/student/myProfile');
            const street = response.data.street;
            const city = response.data.city;
            const fullAddress = `${street}, ${city}`;

            setAddress(fullAddress);
            setPickupLocation(fullAddress);
        } catch (error) {
            console.error("שגיאה בטעינת הפרופיל:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setStartTime('');
            setAvailableSlots([]);

            if (lessonDate.length === 10) {
                fetchAvailableSlots();
            }
        }, [lessonDate])
    );

    useEffect(() => {
        if (lessonDate.length === 10) {
            fetchAvailableSlots();
        }
    }, [lessonDate]);

    const fetchAvailableSlots = async () => {
        if (lessonDate.length < 10) return;

        setFetchingSlots(true);
        try {
            let dateParam = lessonDate;
            if (lessonDate.includes('/')) {
                const [day, month, year] = lessonDate.split('/');
                dateParam = `${year}-${month}-${day}`;
            }
            const response = await apiClient.get(`/booking/tutor/${tutorId}/availableSlots?date=${dateParam}`);
            setAvailableSlots(response.data);
        } catch (error) {
            console.error("Error fetching slots:", error);
            setAvailableSlots([]);
        } finally {
            setFetchingSlots(false);
        }
    };

    const getTextColor = (value: string) => (value ? '#333' : '#999');

    const handleDateTyping = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        setLessonDate(formatted);
    };

    const handleTimeTyping = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length >= 3) formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
        const hours = parseInt(cleaned.slice(0, 2));
        const mins = parseInt(cleaned.slice(2, 4));
        if (hours > 23) formatted = '23' + (formatted.length > 2 ? formatted.slice(2) : '');
        if (mins > 59) formatted = formatted.slice(0, 3) + '59';
        setStartTime(formatted);
    };

    const handleBooking = async () => {
        if (!lessonDate || !startTime || !pickupLocation) {
            Alert.alert("שגיאה", "נא למלא תאריך, שעה ומיקום איסוף");
            return;
        }

        if (availableSlots.length > 0 && !availableSlots.includes(startTime)) {
            Alert.alert("שעה לא חוקית", "השעה שהזנת אינה פנויה. נא לבחור שעה מהרשימה.");
            return;
        }

        const now = new Date();
        const [d, m, y] = lessonDate.split('/');
        const selectedDate = new Date(`${y}-${m}-${d}`);
        const isToday = selectedDate.toDateString() === now.toDateString();

        if (isToday) {
            const [selH, selM] = startTime.split(':').map(Number);
            if (selH < now.getHours() || (selH === now.getHours() && selM <= now.getMinutes())) {
                Alert.alert("שגיאה", "לא ניתן לקבוע שעה שכבר עברה היום");
                return;
            }
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const currentUserId = await AsyncStorage.getItem('currentUserId');
            let finalDate = `${y}-${m}-${d}`;

            const bookingData = { lessonDate: finalDate, startTime, tutorId, pickupLocation, notes };

            const response = await apiClient.post(`/booking/${currentUserId}/newBooking`, bookingData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 201) {
                Alert.alert("הצלחה", "פרטי השיעור הועברו לאישור המורה");
                setLessonDate('');
                setStartTime('');
                setPickupLocation('');
                setNotes('');

                navigation.goBack();
            }
        } catch (error: any) {
            Alert.alert("שגיאה", error.response?.data?.message || "שגיאה ביצירת הזמנה");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>קביעת שיעור נהיגה</Text>

            <Text style={styles.label}>תאריך השיעור</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, { color: getTextColor(lessonDate), outline: 'none' }]}
                    value={lessonDate}
                    onChangeText={handleDateTyping}
                    placeholder="DD/MM/YYYY"
                    keyboardType="numeric"
                    maxLength={10}
                />
                <TouchableOpacity onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar-outline" size={24} color="#00C2E8" />
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>שעות פנויות</Text>
            <View style={{ minHeight: 60 }}>
                {fetchingSlots ? (
                    <ActivityIndicator color="#00C2E8" style={{ alignSelf: 'center', marginTop: 10 }} />
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.timeList}
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: availableSlots.length > 0 ? 'flex-start' : 'flex-end'
                        }}
                    >
                        {availableSlots.length > 0 ? (
                            availableSlots.map((slot) => (
                                <TouchableOpacity
                                    key={slot}
                                    style={[styles.timeTag, startTime === slot && styles.timeTagSelected]}
                                    onPress={() => setStartTime(slot)}
                                >
                                    <Text style={[styles.timeTagText, startTime === slot && styles.timeTagTextSelected]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={{ color: '#999', textAlign: 'right', width: '100%' }}>
                                {lessonDate.length === 10 ? "אין שעות פנויות לתאריך זה" : "בחר תאריך כדי לראות שעות"}
                            </Text>
                        )}
                    </ScrollView>
                )}
            </View>

            <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                <TextInput
                    style={[styles.input, { color: getTextColor(startTime), outline: 'none' }]}
                    value={startTime}
                    onChangeText={handleTimeTyping}
                    placeholder="HH:MM"
                    keyboardType="numeric"
                    maxLength={5}
                />
                <Ionicons name="time-outline" size={24} color="#00C2E8" />
            </View>

            <Text style={styles.label}>מיקום איסוף</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, { color: getTextColor(pickupLocation), outline: 'none' }]}
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="(עיר, רחוב)"
                />
                <Ionicons name="location-outline" size={24} color="#00C2E8" />
            </View>
            {/* <Text style={styles.label}>מיקום איסוף</Text>
            <View style={[styles.inputWrapper, { zIndex: 1000, height: 'auto', minHeight: 55 }]}>
                <GooglePlacesAutocomplete
                    placeholder="חפש עיר ורחוב..."
                    onPress={(data, details = null) => {
                        setPickupLocation(data.description);
                    }}
                    query={{
                        key: 'YOUR_GOOGLE_API_KEY', // כאן שמים את המפתח מגוגל
                        language: 'iw', // עברית
                        components: 'country:il', // הגבלה לישראל בלבד
                    }}
                    styles={{
                        container: { flex: 1, width: '100%' },
                        textInput: {
                            height: 50,
                            color: '#1A1A1A',
                            fontSize: 16,
                            textAlign: 'right',
                            backgroundColor: 'transparent',
                        },
                        description: { textAlign: 'right' },
                        predefinedPlacesDescription: { color: '#00C2E8' },
                        listView: { backgroundColor: '#fff', borderRadius: 10, elevation: 3, zIndex: 999 },
                    }}
                    enablePoweredByContainer={false} // מסיר את הלוגו של גוגל למטה
                    fetchDetails={false}
                    nearbyPlacesAPI="GooglePlacesSearch"
                    debounce={400} // מחכה חצי שניה בין הקלדות כדי לחסוך קריאות ל-API
                />
                <Ionicons name="location-outline" size={24} color="#00A8B5" style={{ marginLeft: 10 }} />
            </View> */}

            <Text style={styles.label}>הערות למורה (אופציונלי)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                    style={[styles.input, styles.textArea, { color: getTextColor(notes), outline: 'none' }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="דגשים מיוחדים לשיעור..."
                    multiline
                    numberOfLines={3}
                />
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#00C2E8" style={{ marginTop: 10 }} />
            </View>

            <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleBooking}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>הזמן שיעור</Text>}
            </TouchableOpacity>

            <Modal visible={showCalendar} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <Calendar
                            onDayPress={(day: any) => {
                                setLessonDate(day.dateString.split('-').reverse().join('/'));
                                setShowCalendar(false);
                            }}
                            markedDates={{
                                [lessonDate.split('/').reverse().join('-')]: {
                                    selected: true,
                                    selectedColor: '#00C2E8'
                                }
                            }}
                            minDate={new Date().toISOString().split('T')[0]}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
                            <Text style={styles.closeButtonText}>ביטול</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 25 },
    title: { fontSize: 21, fontWeight: 'bold', color: '#333', textAlign: 'right', marginBottom: 5 },
    label: { fontSize: 16, fontWeight: '600', color: '#555', textAlign: 'right', marginBottom: 8, marginTop: 30 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 15, height: 55 },
    textAreaWrapper: { height: 100, alignItems: 'flex-start' },
    input: { flex: 1, textAlign: 'right', paddingRight: 10, fontSize: 16, writingDirection: 'rtl' },
    textArea: { textAlignVertical: 'top', paddingTop: 15 },
    timeList: { flexDirection: 'row', marginVertical: 8 },
    timeTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd', height: 45, justifyContent: 'center' },
    timeTagSelected: { backgroundColor: '#00C2E8', borderColor: '#00C2E8' },
    timeTagText: { color: '#555', fontWeight: '600' },
    timeTagTextSelected: { color: '#fff' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    calendarContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 15, width: '90%' },
    closeButton: { marginTop: 15, alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10 },
    closeButtonText: { color: '#333', fontWeight: 'bold' },
    submitButton: { backgroundColor: '#00C2E8', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40, marginBottom: 20 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});