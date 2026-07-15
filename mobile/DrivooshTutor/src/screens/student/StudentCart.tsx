import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../../src/api/apiClient";
import ECGChart from "../../../src/components/ECGChart";

interface StudentProfileProps { route: any; navigation: any; }

export default function StudentProfile({ route, navigation }: StudentProfileProps) {
  const { studentId } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [chartVisibleData, setChartVisibleData] = useState<{ label: string, count: number }[]>([]);
  const [hiddenMonthsCount, setHiddenMonthsCount] = useState(0);

  useEffect(() => {
    apiClient.get(`student/getStudent/${studentId}`)
      .then(res => {
        setData(res.data);
        const rawChartData = res.data?.chartData || [];
        setChartVisibleData(rawChartData);
        setHiddenMonthsCount(0);
      })
      .catch(err => console.log("Error loading student:", err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="small" color="#00C2E8" /></View>;
  if (!data) return <View style={styles.center}><Text style={styles.infoText}>לא נמצאו נתונים עבור תלמיד זה</Text></View>;

  const student = data.student || {};
  const statistics = data.statistics || { completedLessons: 0, pendingLessons: 0, cancelledLessons: 0 };
  const financials = data.financials || { totalPaid: 0 };
  const nextLesson = data.nextLesson;
  const lastLesson = data.lastLesson;
  const lastGoalsForm = data.lastGoalsForm || { exists: true };

  const joinDate = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
    : '';

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const STATUS_TRANSLATIONS: Record<string, string> = {
    pending: "ממתין",
    confirmed: "מאושר",
    cancelled: "בוטל",
    completed: "בוצע"
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroRow}>
        <View style={styles.heroText}>
          <Text style={styles.name}>{student.firstName || ''} {student.lastName || ''}</Text>
          {joinDate ? <Text style={styles.subText}>איתך מ-{joinDate}</Text> : null}
        </View>
        {student.profileImage ? (
          <Image source={{ uri: student.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{student.firstName ? student.firstName[0] : ''}</Text>
          </View>
        )}
      </View>

      <View style={styles.thinDivider} />

      <View style={styles.quickInfoRow}>
        <View style={styles.quickInfoItem}>
          <Text style={styles.quickInfoLabel}>שולמו עד כה</Text>
          <Text style={styles.quickInfoVal}>₪{financials.totalPaid || 0}</Text>
        </View>
        <View style={styles.quickInfoDivider} />
        <View style={styles.quickInfoItem}>
          <Text style={styles.quickInfoLabel}>תעריף לשיעור</Text>
          <Text style={styles.quickInfoVal}>₪{student.lessonPrice || 0}</Text>
        </View>
        <View style={styles.quickInfoDivider} />
        <View style={styles.quickInfoItem}>
          <Text style={styles.quickInfoLabel}>סך שיעורים</Text>
          <Text style={styles.quickInfoVal}>{statistics.totalLessonsCount || 0}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>התקדמות הלמידה</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{statistics.completedLessons}</Text>
          <Text style={styles.statLabel}>הושלמו</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxInactive]}>
          <Text style={[styles.statNum, styles.textDark]}>{statistics.pendingLessons}</Text>
          <Text style={styles.statLabel}>ממתינים</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxInactive]}>
          <Text style={[styles.statNum, styles.textMuted]}>{statistics.cancelledLessons}</Text>
          <Text style={styles.statLabel}>בוטלו</Text>
        </View>
      </View>

      {chartVisibleData.length > 0 && (
        <View style={{ width: '100%' }}>
          <ECGChart data={chartVisibleData} />

          {hiddenMonthsCount > 0 && (
            <TouchableOpacity
              style={styles.hiddenMonthsBadge}
              onPress={() => navigation.navigate("StudentHistory", { studentId })}
            >
              <Text style={styles.hiddenMonthsText}>+{hiddenMonthsCount} חודשים נוספים בהיסטוריה</Text>
              <Ionicons name="time-outline" size={12} color="#00C2E8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.timelineContainer}>
        <Text style={styles.timelineLabel}>שיעור אחרון שהיה</Text>
        {lastLesson ? (
          <View style={styles.lessonRowCard}>
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonDate}>
                {formatDate(lastLesson.date)}  •  {formatTime(lastLesson.startTime)}-{formatTime(lastLesson.endTime)}
              </Text>
              <View style={styles.badgeCompleted}>
                <Text style={styles.badgeCompletedText}>
                  {STATUS_TRANSLATIONS[lastLesson?.status?.toLowerCase()] || lastLesson?.status}
                </Text>
              </View>
            </View>
            {lastLesson.pickupLocation ? (
              <View style={styles.lessonLocation}>
                <Ionicons name="location-outline" size={13} color="#64748b" />
                <Text style={styles.locationText} numberOfLines={1}>{lastLesson.pickupLocation}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyLessonCard}>
            <Text style={styles.emptyLessonText}>טרם התבצעו שיעורים</Text>
          </View>
        )}

        {!lastGoalsForm.exists && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate("ViewProgressForm")}
            activeOpacity={0.8}
          >
            <View style={styles.alertRightContent}>
              <View style={styles.alertIconBg}>
                <Ionicons name="warning" size={14} color="#D97706" />
              </View>
              <Text style={styles.alertText}>טרם מולא משוב פדגוגי לשיעור האחרון</Text>
            </View>
            <View style={styles.alertLeftAction}>
              <Text style={styles.alertActionText}>למילוי</Text>
              <Ionicons name="chevron-back" size={14} color="#D97706" />
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.timelineLabel, { marginTop: 16 }]}>השיעור הבא</Text>
        {nextLesson ? (
          <View style={styles.lessonRowCard}>
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonDate}>
                {formatDate(nextLesson.date)}  •  {formatTime(nextLesson.startTime)}-{formatTime(nextLesson.endTime)}
              </Text>
              <View style={styles.badgePending}>
                <Text style={styles.badgePendingText}>
                  {STATUS_TRANSLATIONS[nextLesson?.status?.toLowerCase()] || nextLesson?.status}
                </Text>
              </View>
            </View>
            <View style={styles.lessonLocation}>
              <Ionicons name="location-outline" size={13} color="#64748b" />
              <Text style={styles.locationText} numberOfLines={1}>{nextLesson.pickupLocation}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyLessonCard}>
            <Text style={styles.emptyLessonText}>לא מתוזמן שיעור עתידי</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.historyLinkButton}
          onPress={() => navigation.navigate("StudentHistory", { studentId })}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#64748b" />
          <Text style={styles.historyLinkText}>לכל היסטוריית השיעורים והתשלומים</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>פרטי התקשרות</Text>
      <View style={styles.infoBlock}>
        <View style={styles.infoLine}>
          <Text style={styles.infoVal}>{student.phoneNumber || "-"}</Text>
          <Ionicons name="call-outline" size={18} color="#64748b" style={styles.infoIcon} />
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoVal}>{student.email || "-"}</Text>
          <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.infoIcon} />
        </View>
        {student.city || student.street ? (
          <View style={styles.infoLine}>
            <Text style={styles.infoVal}>{student.street || ""}, {student.city || ""}</Text>
            <Ionicons name="location-outline" size={18} color="#64748b" style={styles.infoIcon} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 20, alignItems: 'flex-start' },
  backBtn: { paddingVertical: 8 },
  heroRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginVertical: 15 },
  heroText: { alignItems: 'flex-end', marginRight: 16 },
  name: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  subText: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { backgroundColor: '#f1f5f9', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#0f172a', fontSize: 20, fontWeight: '700' },
  thinDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  quickInfoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  quickInfoItem: { flex: 1, alignItems: 'center' },
  quickInfoDivider: { width: 1, height: 28, backgroundColor: '#f1f5f9' },
  quickInfoLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 4 },
  quickInfoVal: { fontSize: 14, fontWeight: '700', color: '#334155' },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textAlign: 'right', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  statsContainer: { flexDirection: 'row-reverse', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#f0fdfa', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ccfbf1' },
  statBoxInactive: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#00C2E8' },
  textDark: { color: '#0f172a' },
  textMuted: { color: '#64748b' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 4 },
  hiddenMonthsBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center', marginTop: 8 },
  hiddenMonthsText: { fontSize: 11, fontWeight: '700', color: '#00C2E8' },
  timelineContainer: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', marginVertical: 8 },
  timelineLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textAlign: 'right', marginBottom: 8, textTransform: 'uppercase' },
  alertBanner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFBEB', borderColor: '#efcba2', borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 10 },
  alertRightContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 },
  alertIconBg: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  alertText: { fontSize: 12.5, fontWeight: '700', color: '#92400E', textAlign: 'right', flex: 1 },
  alertLeftAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  alertActionText: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  lessonRowCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  lessonHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  lessonDate: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  lessonLocation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 8 },
  locationText: { fontSize: 12, color: '#64748b', fontWeight: '500', flex: 1, textAlign: 'right' },
  badgePending: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePendingText: { color: '#0369a1', fontSize: 10, fontWeight: '700' },
  badgeCompleted: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeCompletedText: { color: '#15803d', fontSize: 10, fontWeight: '700' },
  emptyLessonCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed', alignItems: 'center' },
  emptyLessonText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  historyLinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  historyLinkText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  infoBlock: { gap: 16, backgroundColor: '#fafafa', borderRadius: 16, padding: 16, borderColor: '#f1f5f9', borderWidth: 1, marginBottom: 36 },
  infoLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  infoVal: { fontSize: 14, fontWeight: '600', color: '#334155' },
  infoIcon: { width: 20, textAlign: 'center' },
  infoText: { color: '#64748b' }
});