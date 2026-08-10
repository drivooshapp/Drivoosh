import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import LoadingScreen from '@/src/components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/src/api/apiClient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STAGES = [
    { label: 'א', value: 'A' },
    { label: 'ב', value: 'B' },
    { label: 'ג', value: 'C' },
    { label: 'ד', value: 'D' },
];

export default function ViewProgressForm({ route }: any) {
    const { studentId, studentName } = route.params || {};
    const [activeStage, setActiveStage] = useState('A');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        apiClient.get(`/goalForm/goalsForm/${studentId}`).then(res => {
            setData(res.data.progress || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [studentId]);

    const totalGoalsCount = data.length;
    const completedTotalCount = data.filter(g => g.isChecked).length;
    const totalPercentage = totalGoalsCount > 0 ? Math.round((completedTotalCount / totalGoalsCount) * 100) : 0;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: totalPercentage,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [totalPercentage]);

  if (loading) return <LoadingScreen />;

    const getSortedGroupedGoals = (goals: any[]) => {
        const grouped = goals.reduce((acc: { [key: string]: any[] }, item) => {
            const chapterName = item.goalDetails?.chapter || 'פרק כללי';
            if (!acc[chapterName]) {
                acc[chapterName] = [];
            }
            acc[chapterName].push(item);
            return acc;
        }, {});

        Object.keys(grouped).forEach(chapter => {
            grouped[chapter].sort((a: any, b: any) => {
                const numA = a.goalDetails?.goalNumber ?? 0;
                const numB = b.goalDetails?.goalNumber ?? 0;
                return numA - numB;
            });
        });

        return Object.entries(grouped).sort(([nameA], [nameB]) => {
            return nameA.localeCompare(nameB, 'he', { numeric: true });
        });
    };

    const currentStageGoals = data.filter(g => g.goalDetails?.stage === activeStage);
    const sortedGroupedGoals = getSortedGroupedGoals(currentStageGoals);

    const toggleExpand = (id: string, isChecked: boolean) => {
        if (!isChecked) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const animatedWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={s2.container}>
            <View style={s2.headerBar}>
                {STAGES.map(st => (
                    <TouchableOpacity
                        key={st.value}
                        style={[s2.btn, activeStage === st.value && s2.btnActive]}
                        onPress={() => { setActiveStage(st.value); setExpandedId(null); }}
                    >
                        <Text style={[s2.btnText, activeStage === st.value && s2.btnTextActive]}>שלב {st.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s2.progressContainer}>
                <View style={s2.progressInfoRow}>
                    <Text style={s2.progressTitle}>התקדמות כללית</Text>
                    <Text style={s2.progressPercent}>{totalPercentage}%</Text>
                </View>
                <View style={s2.progressBarTrack}>
                    <Animated.View style={[s2.progressBarFill, { width: animatedWidth }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={s2.scroll}>
                {sortedGroupedGoals.map(([chapterName, items]) => (
                    <View key={chapterName} style={s2.chapterContainer}>
                        <View style={s2.chapterHeaderContainer}>
                            <Text style={s2.chapterTitle}>{chapterName}</Text>
                            <View style={s2.line} />
                        </View>

                        <View style={s2.formSheet}>
                            {items.map((item: any, idx: number) => {
                                const isExpanded = expandedId === item.id;
                                const hasExtraDetails = item.isChecked;

                                return (
                                    <View
                                        key={item.id || item.goalId}
                                        style={[
                                            s2.rowContainer,
                                            idx === items.length - 1 && !isExpanded && { borderBottomWidth: 0 }
                                        ]}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={hasExtraDetails ? 0.7 : 1}
                                            style={s2.formRow}
                                            onPress={() => toggleExpand(item.id || item.goalId, item.isChecked)}
                                        >
                                            <View style={[s2.statusDot, item.isChecked && s2.statusDotDone]} />
                                            <Text style={[s2.goalNumberText]}>.{item.goalDetails?.goalNumber}</Text>
                                            <Text style={[s2.formText, item.isChecked && s2.formTextDone]}>
                                                {item.goalDetails?.title}
                                            </Text>

                                            {hasExtraDetails && (
                                                <Ionicons
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={14}
                                                    color="#6B7280"
                                                    style={s2.chevron}
                                                />
                                            )}
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View style={s2.expandedDetails}>
                                                <View style={s2.detailItem}>
                                                    <Text style={s2.detailLabel}>תאריך סימון:</Text>
                                                    <Text style={s2.detailValue}>
                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('he-IL') : 'לא צוין'}
                                                    </Text>
                                                </View>

                                                <View style={s2.detailItem}>
                                                    <Text style={s2.detailLabel}>הערות המורה:</Text>
                                                    <Text style={s2.detailValue}>{item.notes || 'אין הערות'}</Text>
                                                </View>

                                                <View style={s2.detailItem}>
                                                    <Text style={s2.detailLabel}>דירוג:</Text>
                                                    <Text style={s2.detailValue}>{item.rating ? `${item.rating} / 3` : 'לא דורג'}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const s2 = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F8' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBar: { flexDirection: 'row-reverse', backgroundColor: '#FFFFFF', padding: 8, borderBottomWidth: 1, borderColor: '#E5E7EB', gap: 6 },
    btn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    btnActive: { backgroundColor: '#00A8B5' },
    btnText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    btnTextActive: { color: '#FFFFFF' },
    progressContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    progressInfoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    progressTitle: { fontSize: 12, fontWeight: '700', color: '#374151' },
    progressPercent: { fontSize: 12, fontWeight: '800', color: '#00A8B5' },
    progressBarTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#00A8B5', borderRadius: 3 },
    scroll: { padding: 16, paddingBottom: 45 },
    chapterContainer: { marginBottom: 15, width: '100%' },
    chapterHeaderContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginVertical: 8, paddingHorizontal: 4 },
    chapterTitle: { fontSize: 13, fontWeight: '700', color: '#00A8B5', marginLeft: 10, textAlign: 'right' },
    line: { flex: 1, height: 1, backgroundColor: '#EAEAEA' },
    formSheet: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12 },
    rowContainer: { borderBottomWidth: 1, borderColor: '#F3F4F6' },
    formRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB', marginLeft: 10 },
    statusDotDone: { backgroundColor: '#00A8B5' },
    goalNumberText: { fontSize: 13, fontWeight: '700', color: '#00A8B5', marginLeft: 8 },
    formText: { fontSize: 13, color: '#374151', textAlign: 'right', flex: 1, fontWeight: '500' },
    formTextDone: { color: '#0F5132', fontWeight: '600' },
    chevron: { marginRight: 8 },
    expandedDetails: { backgroundColor: '#FAFAFA', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#EEFEF0', gap: 6 },
    detailItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
    detailValue: { fontSize: 11, color: '#374151', fontWeight: '500' }
});