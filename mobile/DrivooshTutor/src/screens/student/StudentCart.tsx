import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../../src/api/apiClient";
import ECGChart from "../../../src/components/ECGChart";
import { EditExternalLessonsModal } from "../../components/EditExternalLessonsModal";
import LoadingScreen from "@/src/components/LoadingScreen";

interface StudentProfileProps { route: any; navigation: any; }

export default function StudentProfile({ route, navigation }: StudentProfileProps) {
  const { studentId } = route.params;
  const [data, setData] = useState<any>(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [chartVisibleData, setChartVisibleData] = useState<{ label: string, count: number }[]>([]);
  const [hiddenMonthsCount, setHiddenMonthsCount] = useState(0);

  const fetchStudentData = () => {
    apiClient.get(`student/getStudent/${studentId}`)
      .then(res => {
        setData(res.data);
        setStudentName(`${res.data.student.firstName} ${res.data.student.lastName}`);
        const rawChartData = res.data?.chartData || [];
        setChartVisibleData(rawChartData);
        setHiddenMonthsCount(0);
      })
      .catch(err => console.log("Error loading student:", err))
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudentData();
    }, [studentId])
  );

  if (loading) return <LoadingScreen />;
  if (!data) return <View style={styles.center}><Text style={styles.infoText}>שגיאה בטעינת הנתונים עבור תלמיד זה</Text></View>;

  const student = data.student || {};
  const statistics = data.statistics || {
    completedLessons: 0,
    pendingLessons: 0,
    cancelledLessons: 0,
    completedWithCurrentTutor: 0,
    previousLessonsCount: 0,
    externalLessonsCount: 0,
    externalLessonsProofUrl: null,
    isExternalLessonsVerified: false,
    totalOverallCompletedLessons: 0,
    hasUncompletedPastConfirmedLesson: false
  };
  const financials = data.financials || { totalPaid: 0 };
  const nextLesson = data.nextLesson;
  const lastLesson = data.lastLesson;
  const dateToDisplay = student?.studentFields?.tutorSelectedAt || student?.createdAt;
  const joinDate = dateToDisplay ? new Date(dateToDisplay).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) : '';

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const handleSaveExternalLessons = async (data: {
    externalLessonsCount: number;
    isVerified: boolean;
    proofUrl?: string | null;
    selectedFile?: any | null;
  }) => {
    try {
      let response;

      // if (data.selectedFile) {
      //   const formData = new FormData();

      //   formData.append("externalLessonsCount", String(data.externalLessonsCount));
      //   formData.append("isVerified", String(data.isVerified));
      //   formData.append("proofDocument", {
      //     uri: data.selectedFile.uri,
      //     name: data.selectedFile.name || "proof_document.pdf",
      //     type: data.selectedFile.mimeType || "application/pdf",
      //   } as any);

      //   response = await apiClient.put(
      //     `student/updateExternalLessons/${studentId}`,
      //     formData,
      //     {
      //       headers: {
      //         "Content-Type": "multipart/form-data",
      //       },
      //     }
      //   );
      // }

      // else {
      response = await apiClient.put(
        `student/updateExternalLessons/${studentId}`,
        {
          externalLessonsCount: data.externalLessonsCount,
          isVerified: data.isVerified,
          externalLessonsProofUrl: data.proofUrl,
        }
      );
      // }

      const updatedFields = response.data?.studentFields || {};
      const updatedProofUrl = response.data?.proofUrl || data.proofUrl;

      setData((prev: any) => ({
        ...prev,
        student: {
          ...prev.student,
          studentFields: {
            ...prev.student?.studentFields,
            externalLessonsCount: data.externalLessonsCount,
            isExternalLessonsVerified: data.isVerified,
            externalLessonsProofUrl: updatedProofUrl,
          },
        },
        statistics: {
          ...prev.statistics,
          previousLessonsCount: data.externalLessonsCount,
          externalLessonsCount: data.externalLessonsCount,
          isExternalLessonsVerified: data.isVerified,
          externalLessonsProofUrl: updatedProofUrl,
          totalOverallCompletedLessons:
            (prev.statistics?.completedWithCurrentTutor || 0) + data.externalLessonsCount,
        },
      }));

      Alert.alert("בוצע", "נתוני השיעורים עודכנו בהצלחה");
    } catch (error: any) {
      console.error("Failed to update external lessons:", error);
      Alert.alert("שגיאה", error.response?.data?.message || "נכשל בעדכון הנתונים");
      throw error;
    }
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
          <Text style={styles.quickInfoVal}>{statistics.totalOverallCompletedLessons || 0}</Text>
        </View>
      </View>

      <View style={styles.previousLessonsCard}>
        <View style={styles.previousLessonsTopRow}>
          <View style={styles.previousLessonsRight}>
            <View style={styles.previousIconBadge}>
              <Ionicons name="school-outline" size={18} color="#007890" />
            </View>
            <View>
              <Text style={styles.previousLessonsTitle}>שיעורים/ בתי ספר קודמים</Text>
              <Text style={styles.previousLessonsValue}>
                {statistics.previousLessonsCount || 0} שיעורים אושרו על ידך
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editExternalBtn}
            onPress={() => setIsEditModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={14} color="#80eaff" />
            <Text style={styles.editExternalBtnText}>עדכן</Text>
          </TouchableOpacity>
        </View>

        {statistics.externalLessonsProofUrl ? (
          <View style={styles.proofRowWrapper}>
            <TouchableOpacity
              style={styles.proofBadge}
              onPress={() => Linking.openURL(statistics.externalLessonsProofUrl)}
              activeOpacity={0.6}
            >
              <Text style={styles.proofBadgeText}>צפה באישור המצורף</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>התקדמות הלמידה</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{statistics.completedWithCurrentTutor ?? statistics.completedLessons}</Text>
          <Text style={styles.statLabel}>הושלמו אצלך</Text>
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
        <Text style={styles.timelineLabel}>שיעור אחרון שבוצע</Text>
        {lastLesson ? (
          <View style={styles.lessonRowCard}>
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonDate}>
                {formatTime(lastLesson.startTime)}-{formatTime(lastLesson.endTime)}  •  {formatDate(lastLesson.date)}
              </Text>
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

        {(() => {
          if (!lastLesson) {
            return null;
          }

          if (statistics?.hasUncompletedPastConfirmedLesson) {
            return (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={() => navigation.navigate("ProgressFormScreen", { studentId, studentName })}
                activeOpacity={0.8}
              >
                <View style={styles.alertRightContent}>
                  <View style={styles.alertIconBg}>
                    <Ionicons name="warning" size={14} color="#D97706" />
                  </View>
                  <Text style={styles.alertText}>טרם מולא משוב בטופס המטרות לשיעורים שחלפו</Text>
                </View>
                <View style={styles.alertLeftAction}>
                  <Text style={styles.alertActionText}>{"מלא\nעכשיו"}</Text>
                  <Ionicons name="chevron-back" size={14} color="#D97706" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <View style={styles.formCardHeaderRight}>
                  <Ionicons name="document-text-outline" size={20} color="#007890" />
                  <Text style={styles.formCardTitle}>טופס מטרות לימוד</Text>
                </View>
              </View>

              <Text style={styles.formCardSubtext}>
                צפייה, מילוי ועדכון שלבי הלמידה והמיומנויות של התלמיד בקורס.
              </Text>

              <View style={styles.statusBadge}>
                {lastLesson.status === 'completed' && (
                  <>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusLabelText}>
                      {'סטטוס שיעור אחרון: '}
                      <Text style={styles.statusValueText}>מעודכן</Text>
                    </Text>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.formCardButton}
                onPress={() => navigation.navigate("ProgressFormScreen", { studentId, studentName })}
                activeOpacity={0.7}
              >
                <Text style={styles.formCardButtonText}>לטופס</Text>
                <Ionicons name="chevron-back" size={12} color="#007890" />
              </TouchableOpacity>
            </View>
          );
        })()}

        <Text style={[styles.timelineLabel, { marginTop: 16 }]}>השיעור הבא</Text>
        {nextLesson ? (
          <View style={styles.lessonRowCard}>
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonDate}>
                {formatTime(nextLesson.startTime)}-{formatTime(nextLesson.endTime)}  •  {formatDate(nextLesson.date)}
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

        <EditExternalLessonsModal
          isVisible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          initialCount={statistics.externalLessonsCount || statistics.previousLessonsCount || 0}
          initialVerified={statistics.isExternalLessonsVerified}
          proofUrl={statistics.externalLessonsProofUrl}
          onSave={handleSaveExternalLessons}
        />
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
  statBoxInactive: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' },
  statBox: { flex: 1, backgroundColor: '#f0fdfa', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#ccfbf1', justifyContent: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#00C2E8' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 4, textAlign: 'center' },
  statSubText: { fontSize: 9.5, fontWeight: '700', color: '#0891b2', backgroundColor: '#e0fcfd', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  previousLessonsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginVertical: 20, gap: 8 },
  previousLessonsTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  previousLessonsRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  proofRowWrapper: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'flex-end' },
  proofBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#E6F4F8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  proofBadgeText: { fontSize: 12, color: '#007890', fontWeight: '600' },
  previousIconBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E6F4F8', justifyContent: 'center', alignItems: 'center' },
  previousLessonsTitle: { fontSize: 12, fontWeight: '700', color: '#0f172a', textAlign: 'right' },
  previousLessonsValue: { fontSize: 11, fontWeight: '600', color: '#64748b', textAlign: 'right', marginTop: 2 },
  editExternalBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#000000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editExternalBtnText: { fontSize: 12, fontWeight: '700', color: '#80eaff' },
  textDark: { color: '#0f172a' },
  textMuted: { color: '#64748b' },
  hiddenMonthsBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center', marginTop: 8 },
  hiddenMonthsText: { fontSize: 11, fontWeight: '700', color: '#00C2E8' },
  timelineContainer: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', marginVertical: 8 },
  timelineLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textAlign: 'right', marginBottom: 8, textTransform: 'uppercase' },
  alertBanner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFBEB', borderColor: '#efcba2', borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 10 },
  alertRightContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 },
  alertIconBg: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  alertText: { fontSize: 12.5, fontWeight: '700', color: '#92400E', textAlign: 'right', flex: 1 },
  alertLeftAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  alertActionText: { fontSize: 12, fontWeight: '800', color: '#D97706', textAlign: 'center' },
  formCard: { backgroundColor: '#eefcff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#a7e4f1', marginVertical: 10 },
  formCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  formCardHeaderRight: { flexDirection: 'row-reverse', alignItems: 'center' },
  formCardTitle: { fontSize: 16, fontWeight: '700', color: '#007890', marginRight: 8 },
  statusBadge: { flexDirection: 'row-reverse', paddingBottom: 10, alignItems: 'center' },
  statusDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', marginLeft: 6 },
  statusLabelText: { fontSize: 12, fontWeight: '500', color: '#334155' },
  statusValueText: { color: '#16A34A' },
  formCardSubtext: { fontSize: 13, color: '#343f4d', textAlign: 'right', marginBottom: 12, lineHeight: 18 },
  formCardButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', backgroundColor: '#cff3fb', height: 32, paddingHorizontal: 14, borderRadius: 8, gap: 4 },
  formCardButtonText: { fontSize: 13, fontWeight: '700', color: '#007890' },
  lessonRowCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  lessonHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  lessonDate: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  lessonLocation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2, marginTop: 8 },
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