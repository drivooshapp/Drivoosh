import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Modal, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import apiClient from '@/src/api/apiClient';

export default function NewBookingScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    // נתוני הטופס
    const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState("10:00");
    const [pickupLocation, setPickupLocation] = useState('');

    // יצירת רשימת שעות מהירה (07:00 עד 21:00)
    const timeSlots = [];
    for (let i = 7; i <= 21; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        if (i < 21) timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    // פונקציה להוספת תווים מפרידים בתאריך (DD/MM/YYYY)
    const handleDateTyping = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        setLessonDate(formatted);
    };

    const handleBooking = async () => {
        // המרה לפורמט YYYY-MM-DD לפני שליחה לשרת
        let finalDate = lessonDate;
        if (lessonDate.includes('/')) {
            const [day, month, year] = lessonDate.split('/');
            finalDate = `${year}-${month}-${day}`;
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            Alert.alert("שגיאה", "נא להזין שעה תקינה (HH:mm)");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const currentUserId = await AsyncStorage.getItem('currentUserId');

            const [hours, minutes] = startTime.split(':').map(Number);
            const endTime = `${(hours + 1) % 24}:${minutes.toString().padStart(2, '0')}`;

            const bookingData = {
                lessonDate: finalDate,
                startTime,
                endTime,
                tutorId: "dfdc0458-448f-44b0-be1a-6d6be7cbef19",
                pickupLocation,
            };

            const response = await apiClient.post(`/booking/${currentUserId}/newBooking`, bookingData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                Alert.alert("הצלחה!", "השיעור נקבע בהצלחה");
                navigation.goBack();
            }
        } catch (error: any) {
            Alert.alert("שגיאה", error.response?.data?.message || "ודאי שהפרטים תקינים");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>קביעת שיעור נהיגה</Text>

            <Text style={styles.label}>תאריך השיעור</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={lessonDate}
                    onChangeText={handleDateTyping}
                    placeholder="DD/MM/YYYY"
                    keyboardType="numeric"
                    maxLength={10}
                    textAlign="right"
                />
                <TouchableOpacity onPress={() => setShowCalendar(true)}>
                    <Ionicons name="calendar-outline" size={24} color="#00C2E8" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>שעת התחלה</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeList}>
                {timeSlots.map((slot) => (
                    <TouchableOpacity
                        key={slot}
                        style={[styles.timeTag, startTime === slot && styles.timeTagSelected]}
                        onPress={() => setStartTime(slot)}
                    >
                        <Text style={[styles.timeTagText, startTime === slot && styles.timeTagTextSelected]}>
                            {slot}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={(text) => {
                        if (text.length === 2 && !text.includes(':') && text.length > startTime.length) {
                            setStartTime(text + ':');
                        } else {
                            setStartTime(text);
                        }
                    }}
                    placeholder="HH:mm"
                    maxLength={5}
                    keyboardType="numeric"
                    textAlign="right"
                />
                <Ionicons name="time-outline" size={24} color="#00C2E8" />
            </View>

            <Text style={styles.label}>מיקום איסוף</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="כתובת איסוף..."
                    textAlign="right"
                />
                <Ionicons name="location-outline" size={24} color="#00C2E8" />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleBooking} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>קבע שיעור</Text>}
            </TouchableOpacity>

            <Modal visible={showCalendar} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <Calendar
                            onDayPress={(day: any) => {
                                setLessonDate(day.dateString);
                                setShowCalendar(false);
                            }}
                            markedDates={{ [lessonDate]: { selected: true, selectedColor: '#00C2E8' } }}
                            theme={{ todayTextColor: '#00C2E8', arrowColor: '#00C2E8' }}
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
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'right', marginBottom: 25 },
    label: { fontSize: 16, fontWeight: '600', color: '#555', textAlign: 'right', marginBottom: 8, marginTop: 15 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        paddingHorizontal: 15,
        height: 55
    },
    input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
    timeList: { flexDirection: 'row', marginVertical: 8 },
    timeTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    timeTagSelected: { backgroundColor: '#00C2E8', borderColor: '#00C2E8' },
    timeTagText: { color: '#555', fontWeight: '600' },
    timeTagTextSelected: { color: '#fff' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        width: '90%',
        elevation: 10
    },
    closeButton: { marginTop: 15, alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10 },
    closeButtonText: { color: '#333', fontWeight: 'bold' },
    submitButton: {
        backgroundColor: '#00C2E8',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 40
    },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});