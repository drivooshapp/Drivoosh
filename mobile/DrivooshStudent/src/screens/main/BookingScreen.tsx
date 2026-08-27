import apiClient from '@/src/api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


export default function NewBookingScreen({ navigation }: any) {
    const [token, setToken] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [tutorId, setTutorId] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [lessonDate, setLessonDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [lessonDuration, setLessonDuration] = useState<number | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    const getTextColor = (value: string) => (value ? '#333' : '#999');

    useFocusEffect(
        useCallback(() => {
            const initializeData = async () => {
                setLoading(true);
                try {
                    const savedToken = await AsyncStorage.getItem('userToken');
                    const savedId = await AsyncStorage.getItem('currentUserId');

                    if (savedToken && savedId) {
                        setToken(savedToken);
                        setCurrentUserId(savedId);

                        const success = await fetchProfile();

                        if (!success) {
                            setLoading(false);
                            return;
                        }
                    } else {
                        Alert.alert("שגיאה", "שגיאה בטעינת הנתונים. נסה להתחבר שוב");
                        setLoading(false);
                        return;
                    }

                    setLoading(false);
                } catch (err) {
                    console.error(err);
                    setLoading(false);
                }
            };
            initializeData();

            return () => { };
        }, [])
    );

    const fetchProfile = async () => {
        try {
            const response = await apiClient.get('/student/myProfile');
            const tutor = response.data?.chosenTutor?.id;
            setLessonDuration(response.data?.chosenTutor?.lessonDuration);

            if (!tutor) {
                Alert.alert(
                    "אין מורה משויך",
                    "כדי לקבוע שיעור עליך לבחור מורה תחילה.",
                    [
                        {
                            text: "עבור לחיפוש",
                            onPress: () => navigation.navigate('SearchTutorsStack')
                        }
                    ],
                    { cancelable: false }
                );
                return false;
            }

            setTutorId(tutor);
            const street = response.data?.street || '';
            const city = response.data?.city || '';
            setPickupLocation(`${street}, ${city}`);
            return true;

        } catch (error) {
            console.error("שגיאה בטעינת הפרופיל:", error);
            Alert.alert("שגיאה", "בעיה בטעינת הפרופיל");
            navigation.navigate('History');
            return false;
        }
    };

    useEffect(() => {
        if (!tutorId || lessonDate.length !== 10) return;

        const timeout = setTimeout(() => {
            fetchAvailableSlots(tutorId, lessonDate);
        }, 400);

        return () => clearTimeout(timeout);
    }, [tutorId, lessonDate]);

    const requestIdRef = useRef(0);

    const fetchAvailableSlots = async (id: string, date: string) => {
        if (!id || date.length !== 10) return;

        const requestId = ++requestIdRef.current;

        setFetchingSlots(true);

        try {
            let dateParam = date;

            if (date.includes('/')) {
                const [day, month, year] = date.split('/');
                dateParam = `${year}-${month}-${day}`;
            }

            const response = await apiClient.get(
                `/booking/tutor/${id}/availableSlots?date=${dateParam}`
            );

            if (requestId !== requestIdRef.current) return;

            const slots = Array.isArray(response.data)
                ? response.data
                : response.data?.slots || [];

            setAvailableSlots(slots);

        } catch (error) {
            if (requestId !== requestIdRef.current) return;

            console.error("Error fetching slots:", error);
            setAvailableSlots([]);
            Alert.alert("שגיאה", "לא ניתן לטעון שעות פנויות");

        } finally {
            if (requestId === requestIdRef.current) {
                setFetchingSlots(false);
            }
        }
    };

    const today = new Date();
    const minDateStr = today.toISOString().split('T')[0];

    const maxDateObj = new Date();
    maxDateObj.setDate(today.getDate() + 6);
    const maxDateStr = maxDateObj.toISOString().split('T')[0];

    const selectedDateFormatted = lessonDate.split('/').reverse().join('-');

    const validateAndSetDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        if (parts.length !== 3 || parts[2].length !== 4) return;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        const inputDate = new Date(year, month, day);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const maxLimit = new Date();
        maxLimit.setDate(now.getDate() + 6);
        maxLimit.setHours(23, 59, 59, 999);

        const isValidDate = inputDate.getFullYear() === year &&
            inputDate.getMonth() === month &&
            inputDate.getDate() === day;

        if (!isValidDate) {
            Alert.alert('שגיאה', 'נא להזין תאריך תקין בלוח השנה');
            setLessonDate('');
            setAvailableSlots([]);
            return;
        }

        if (inputDate < now || inputDate > maxLimit) {
            Alert.alert('טווח לא חוקי', 'ניתן להזמין שיעור רק לשבוע הקרוב');
            setLessonDate('');
            setAvailableSlots([]);
            return;
        }
    };

    const handleDateTyping = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length <= 2) {
            formatted = cleaned;
        } else if (cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        } else {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        }

        setLessonDate(formatted);

        if (cleaned.length === 8) {
            validateAndSetDate(formatted);
        }
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

        const normalizeTime = (time: string) => time.padStart(5, '0');

        if (availableSlots.length > 0) {
            const normalizedStart = normalizeTime(startTime);
            const normalizedAvailable = availableSlots.map(s => normalizeTime(s));

            if (!normalizedAvailable.includes(normalizedStart)) {
                Alert.alert("שעה לא חוקית", "השעה אינה פנויה ברשימה המעודכנת");
                return;
            }
        }

        const [d, m, y] = lessonDate.split('/');
        const formattedDateForServer = `${y}-${m}-${d}`;
        const selectedDate = new Date(formattedDateForServer);
        const now = new Date();

        if (selectedDate.toDateString() === now.toDateString()) {
            const [h, min] = startTime.split(':').map(Number);
            if (h < now.getHours() || (h === now.getHours() && min <= now.getMinutes())) {
                Alert.alert("שגיאה", "לא ניתן לקבוע שעה שכבר עברה היום");
                return;
            }
        }

        setLoading(true);

        const bookingData = {
            lessonDate: formattedDateForServer,
            startTime: normalizeTime(startTime),
            tutorId,
            pickupLocation,
            notes
        };

        try {
            const response = await apiClient.post(
                `/booking/${currentUserId}/newBooking`,
                bookingData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201) {
                Alert.alert("בוצע", "הבקשה נשלחה לאישור המורה");

                setLessonDate('');
                setStartTime('');
                setPickupLocation('');
                setNotes('');
                setAvailableSlots([]);

                navigation.goBack();
            }
        } catch (error: any) {
            if (error.response) {
                const serverMessage = error.response.data?.message || "שגיאה בלוגיקת השרת";
                const serverDetails = error.response.data?.details || "";

                Alert.alert("שגיאה מהשרת", `${serverMessage} ${serverDetails}`);
            } else if (error.request) {
                Alert.alert("שגיאת תקשורת", "השרת לא מגיב. בדוק את החיבור לאינטרנט.");
            } else {
                Alert.alert("שגיאה", "תקלה לא צפויה בשליחת הבקשה");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>שנתאם שיעור חדש?</Text>

            <Text style={styles.label}>תאריך השיעור</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, { color: getTextColor(lessonDate) }]}
                    value={lessonDate}
                    onChangeText={handleDateTyping}
                    placeholder="DD/MM/YYYY"
                    keyboardType="numeric"
                    maxLength={10}
                />
                <TouchableOpacity onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar-outline" style={styles.inputIcon} />
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
                    style={[styles.input, { color: getTextColor(startTime) }]}
                    value={startTime}
                    onChangeText={handleTimeTyping}
                    placeholder="HH:MM"
                    keyboardType="numeric"
                    maxLength={5}
                />
                <Ionicons name="time-outline" style={styles.inputIcon} />
            </View>

            {lessonDuration && (
                <View style={styles.durationRow}>
                    <Text style={styles.durationValue}>{lessonDuration} דקות</Text>
                    <Text style={styles.durationHint}>  •  משך השיעור</Text>
                </View>
            )}

            <Text style={styles.label}>מיקום איסוף</Text>

            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, { color: getTextColor(pickupLocation) }]}
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="(עיר, רחוב)"
                />
                <Ionicons name="location-outline" style={styles.inputIcon} />
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
                <Ionicons name="location-outline" style={styles.inputIcon} />
            </View> */}

            <Text style={styles.label}>הערות למורה (אופציונלי)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                    style={[styles.input, styles.textArea, { color: getTextColor(notes) }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="דגשים מיוחדים לשיעור..."
                    multiline
                    numberOfLines={3}
                />
                <Ionicons name="chatbubble-ellipses-outline" style={styles.inputAreaIcon} />
            </View>

            <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleBooking}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>קבע שיעור</Text>}
            </TouchableOpacity>

            <Modal visible={showCalendar} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <Calendar
                            minDate={minDateStr}
                            maxDate={maxDateStr}

                            onDayPress={(day: any) => {
                                const formattedDate = day.dateString.split('-').reverse().join('/');
                                setLessonDate(formattedDate);
                                setShowCalendar(false);
                            }}

                            markedDates={{
                                [selectedDateFormatted]: {
                                    selected: true,
                                    selectedColor: '#00C2E8',
                                    disableTouchEvent: false,
                                }
                            }}

                            theme={{
                                todayTextColor: '#00C2E8',
                                arrowColor: '#00C2E8',
                                textDisabledColor: '#d9e1e8',
                                selectedDayBackgroundColor: '#00C2E8',
                                selectedDayTextColor: '#ffffff',
                            }}
                        />

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowCalendar(false)}
                        >
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
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1, borderColor: '#eee', height: 55 },
    textAreaWrapper: { height: 100, alignItems: 'flex-start' },
    input: { flex: 1, textAlign: 'right', fontSize: 16, writingDirection: 'rtl' },
    textArea: { textAlignVertical: 'top', paddingTop: 15 },
    inputIcon: { fontSize: 24, color: '#00C2E8', marginLeft: 10, marginRight: 10 },
    inputAreaIcon: { fontSize: 24, color: '#00C2E8', marginLeft: 10, marginRight: 10, marginTop: 10 },
    timeList: { flexDirection: 'row', marginVertical: 8 },
    timeTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd', height: 45, justifyContent: 'center' },
    timeTagSelected: { backgroundColor: '#00C2E8', borderColor: '#00C2E8' },
    timeTagText: { color: '#555', fontWeight: '600' },
    timeTagTextSelected: { color: '#fff' },
    durationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 6, marginBottom: 2, },
    durationHint: { fontSize: 13, color: '#aaaaaa', textAlign: 'right', includeFontPadding: false, lineHeight: 16, },
    durationValue: { fontSize: 13, fontWeight: '700', color: '#00C2E8', includeFontPadding: false, lineHeight: 16, },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    calendarContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 15, width: '90%' },
    closeButton: { marginTop: 15, alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10 },
    closeButtonText: { color: '#333', fontWeight: 'bold' },
    submitButton: { backgroundColor: '#00C2E8', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40, marginBottom: 40 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});