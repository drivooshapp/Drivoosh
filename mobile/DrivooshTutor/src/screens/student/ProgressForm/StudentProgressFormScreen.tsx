import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../../api/apiClient';
import LessonReview from '../../../components/FormModal/LessonReview';

type StageType = 'A' | 'B' | 'C' | 'D';

interface GoalProgress {
    goalId: string;
    isChecked: boolean;
    rating: number;
    notes: string;
    goalDetails: {
        title: string;
        stage: StageType;
        chapter: string;
        goalNumber: number;
    };
}

const STAGE_NAMES: Record<StageType, string> = {
    A: 'תפעול הרכב',
    B: 'הדרך',
    C: 'התנועה',
    D: 'משימות נהיגה מיוחדות'
};

export default function StudentGoalsFormScreen({ route, navigation }: any) {
    const { studentId, studentName } = route.params || {};;
    const [activeStage, setActiveStage] = useState<StageType>('A');
    const [progressData, setProgressData] = useState<GoalProgress[]>([]);
    const [headerData, setHeaderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<GoalProgress | null>(null);

    useEffect(() => {
        fetchFormDetails();
    }, [studentId]);

    const fetchFormDetails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/goalForm/goalsForm/${studentId}`);
            setProgressData(response.data.progress || []);
            setHeaderData(response.data.header || null);
        } catch (error) {
            Alert.alert('שגיאה', 'לא ניתן היה לקרוא את נתוני הטופס');
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const getSortedGroupedGoals = (goals: GoalProgress[]) => {
        const grouped = goals.reduce((acc: { [key: string]: GoalProgress[] }, item) => {
            const chapterName = item.goalDetails?.chapter || 'פרק כללי';
            if (!acc[chapterName]) {
                acc[chapterName] = [];
            }
            acc[chapterName].push(item);
            return acc;
        }, {});

        Object.keys(grouped).forEach(chapter => {
            grouped[chapter].sort((a, b) => {
                const numA = a.goalDetails?.goalNumber ?? 0;
                const numB = b.goalDetails?.goalNumber ?? 0;
                return numA - numB;
            });
        });

        return Object.entries(grouped).sort(([nameA], [nameB]) => {
            return nameA.localeCompare(nameB, 'he', { numeric: true });
        });
    };

    const isEverySingleGoalChecked = progressData.length > 0 && progressData.every(item => item.isChecked);

    const isStudentFullySigned = headerData?.signedStageD_ChapterB === true;

    const handleUpdatePress = () => {
        if (isEverySingleGoalChecked) {
            if (!isStudentFullySigned) {
                Alert.alert(
                    'חתימה חסרה',
                    'על התלמיד לחתום קודם על אישור פרק ב׳ בשלב ד׳ באפליקציה שלו לפני שתוכל לבצע עדכון סופי לטופס.'
                );
                return;
            }
            navigation.navigate('FinalFormSealScreen', { studentId, headerData, studentName });
        } else {
            Alert.alert('בוצע', 'נתוני ההתקדמות נשמרו בהצלחה במערכת');
        }
    };

    const handleSaveGoalProgress = async (rating: number, notes: string, isChecked: boolean) => {
        if (!selectedGoal) return;
        try {
            await apiClient.post('/goalForm/updateGoalProgress', {
                studentId,
                goalId: selectedGoal.goalId,
                rating,
                notes,
                isChecked
            });
            setModalVisible(false);
            fetchFormDetails();
        } catch (e) {
            console.log(e);
            Alert.alert('שגיאה', 'שמירת ההתקדמות נכשלה');
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#00A8B5" /></View>;
    }

    const currentStageGoals = progressData.filter(g => g.goalDetails.stage === activeStage);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>טופס מטרות לימוד</Text>
                <View style={{ width: 26 }} />
            </View>

            <View style={styles.studentCard}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{studentName ? studentName[0] : ''}</Text>
                </View>
                <View style={{ marginRight: 15, flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.studentName}>{studentName}</Text>
                    <Text style={styles.studentDetailsSub}>מסלול ידני • דרגה B</Text>
                </View>
            </View>

            <View style={styles.tabBar}>
                {(['D', 'C', 'B', 'A'] as StageType[]).map((stage) => (
                    <TouchableOpacity
                        key={stage}
                        style={[styles.tabItem, activeStage === stage && styles.tabActive]}
                        onPress={() => setActiveStage(stage)}
                    >
                        <Text style={[styles.tabText, activeStage === stage && styles.tabTextActive]}>
                            שלב {stage === 'A' ? 'א' : stage === 'B' ? 'ב' : stage === 'C' ? 'ג' : 'ד'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                <View style={styles.stageTitleContainer}>
                    <Text style={styles.stageTitleText}>{STAGE_NAMES[activeStage]}</Text>
                </View>

                {getSortedGroupedGoals(currentStageGoals).map(([chapterName, items]) => (
                    <View key={chapterName} style={styles.chapterContainer}>

                        <View style={styles.chapterHeaderContainer}>
                            <Text style={styles.chapterTitle}>{chapterName}</Text>
                            <View style={styles.line} />
                        </View>

                        {items.map((item) => (
                            <TouchableOpacity
                                key={item.goalId}
                                style={styles.goalCard}
                                onPress={() => {
                                    setSelectedGoal(item);
                                    setModalVisible(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.goalLeft}>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3].map(s => (
                                            <Ionicons
                                                key={s}
                                                name={item.rating >= s ? "star" : "star-outline"}
                                                size={16}
                                                color="#FFD700"
                                            />
                                        ))}
                                    </View>
                                    {item.isChecked && (
                                        <View style={styles.vBadge}>
                                            <Ionicons name="checkmark-circle" size={18} color="#00A8B5" />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.goalRight}>
                                    <Text style={styles.goalNumber}>.{item.goalDetails.goalNumber}</Text>
                                    <Text style={styles.goalTitle} numberOfLines={2}>{item.goalDetails.title}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.actionButton, isEverySingleGoalChecked ? styles.finalButton : styles.regularButton]}
                    onPress={handleUpdatePress}
                >
                    <Text style={styles.actionButtonText}>
                        {isEverySingleGoalChecked ? "נעילת טופס ועדכון אחרון" : "עדכון הטופס"}
                    </Text>
                </TouchableOpacity>
            </View>

            {selectedGoal && (
                <LessonReview
                    visible={modalVisible}
                    goalTitle={selectedGoal.goalDetails.title}
                    initialRating={selectedGoal.rating}
                    initialNotes={selectedGoal.notes || ''}
                    initialChecked={selectedGoal.isChecked}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSaveGoalProgress}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 55 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F0F0F0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    studentCard: { flexDirection: 'row-reverse', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F7FA', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#00A8B5', fontWeight: 'bold', fontSize: 16 },
    studentName: { fontSize: 16, fontWeight: '700', color: '#333' },
    studentDetailsSub: { fontSize: 12, color: '#777', marginTop: 2 },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F0F0F0' },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 3, borderColor: 'transparent' },
    tabActive: { borderColor: '#00A8B5' },
    tabText: { fontSize: 14, color: '#888', fontWeight: '600' },
    tabTextActive: { color: '#00A8B5', fontWeight: '700' },
    scrollContainer: { padding: 16, paddingBottom: 110 },
    stageTitleContainer: { alignItems: 'center', marginTop: 5, marginBottom: 5, paddingVertical: 2 },
    stageTitleText: { fontSize: 15, fontWeight: '600', color: '#666', textAlign: 'center' },
    chapterContainer: { marginBottom: 15, width: '100%' },
    chapterHeaderContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginVertical: 12, paddingHorizontal: 4 },
    chapterTitle: { fontSize: 14, fontWeight: '700', color: '#00A8B5', marginLeft: 10, textAlign: 'right' },
    line: { flex: 1, height: 1, backgroundColor: '#EAEAEA' },
    goalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
    goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    starsRow: { flexDirection: 'row', gap: 2 },
    vBadge: { backgroundColor: '#E0F7FA', padding: 2, borderRadius: 10 },
    goalRight: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, marginLeft: 15 },
    goalNumber: { fontSize: 15, fontWeight: '700', color: '#00A8B5', marginLeft: 8 },
    goalTitle: { fontSize: 14, color: '#444', fontWeight: '500', textAlign: 'right', flexShrink: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#F0F0F0' },
    actionButton: { paddingVertical: 15, borderRadius: 14, marginBottom: 30, alignItems: 'center', justifyContent: 'center' },
    regularButton: { backgroundColor: '#00A8B5' },
    finalButton: { backgroundColor: '#FF8C00' },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});