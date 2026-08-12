import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, RefreshControl, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import apiClient from '../../api/apiClient';
import LoadingScreen from '@/src/components/LoadingScreen';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TutorData {
  firstName: string;
  lastName?: string;
  stats: { todayLessons: number; completedToday: number; totalPending: number; };
  nextLesson: { pickupLocation: string; startTime: string; endTime: string; date?: string; studentName?: string } | null;
  urgentAlerts: { hasPendingGoals: boolean; pendingGoalsStudentId: string | null; totalPendingRequests: number; };
}

interface NotificationItem {
  id: string;
  content: string;
  status: 'pending' | 'resolved';
  type: string;
  createdAt?: string;
}

const AnimatedCoffeeIcon = () => {
  const steam1 = useRef(new Animated.Value(0)).current;
  const steam2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createSteamAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createSteamAnimation(steam1, 0);
    const anim2 = createSteamAnimation(steam2, 800);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, []);

  const getSteamStyle = (animValue: Animated.Value, translateXOffset: number) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.8, 0],
    }),
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [2, -8],
        }),
      },
      {
        translateX: animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [translateXOffset, translateXOffset + 2, translateXOffset - 1],
        }),
      },
    ],
  });

  return (
    <View style={styles.coffeeContainer}>
      <Animated.View style={[styles.steamLine, getSteamStyle(steam1, -2)]} />
      <Animated.View style={[styles.steamLine, getSteamStyle(steam2, 2)]} />
      <Ionicons name="cafe-outline" size={17} color="#00C2E8" />
    </View>
  );
};

export default function HomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const percentPopAnim = useRef(new Animated.Value(0.9)).current;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'בוקר טוב';
    if (hour >= 12 && hour < 18) return 'צהריים טובים';
    if (hour >= 18 && hour < 22) return 'ערב טוב';
    return 'לילה טוב';
  };

  const getStatusDetails = (percentage: number) => {
    if (percentage === 0) return { text: 'פותחים את היום ', icon: 'coffee' };
    if (percentage < 50) return { text: 'נכנסים לעניינים ', icon: 'key-outline' };
    if (percentage < 80) return { text: 'התקדמות מצוינת ', icon: 'compass-outline' };
    if (percentage < 100) return { text: 'ממש לקראת הסוף ', icon: 'flag-outline' };
    return { text: 'היום הושלם בהצלחה ', icon: 'medal-outline' };
  };

  const formatLessonDate = (dateString?: string) => {
    if (!dateString) return 'היום';
    const lessonDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(lessonDate);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = compareDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'מחר';
    return `${lessonDate.getDate()}.${lessonDate.getMonth() + 1}`;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    if (timeString.includes('T')) {
      const dateObj = new Date(timeString);
      return dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }
    const parts = timeString.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeString;
  };

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, notificationsRes] = await Promise.all([
        apiClient.get('/tutor/dashboard'),
        apiClient.get('/notification/notifications').catch(() => ({ data: { notifications: [] } }))
      ]);

      setTutor(dashboardRes.data.tutor);
      const allNotifications: NotificationItem[] = notificationsRes.data.notifications || [];
      const pendingOnly = allNotifications.filter(n => n.status === 'pending');
      setNotifications(pendingOnly);

    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useEffect(() => {
  //   fetchDashboard();
  // }, []);
  useFocusEffect(
  useCallback(() => {
    fetchDashboard();
  }, [])
);

  useEffect(() => {
    if (tutor) {
      const total = tutor.stats.todayLessons || 0;
      const completed = tutor.stats.completedToday || 0;
      const targetPercent = total > 0 ? completed / total : 0;
      progressAnim.setValue(0);
      Animated.parallel([
        Animated.timing(progressAnim, { toValue: Math.min(targetPercent, 1), duration: 1400, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false, }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 9, tension: 40, useNativeDriver: true, }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true, }),
        Animated.spring(percentPopAnim, {
          toValue: 1, friction: 7, tension: 50, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [tutor]);

  const totalLessons = tutor?.stats.todayLessons || 0;
  const completedLessons = tutor?.stats.completedToday || 0;
  const remainingLessons = Math.max(totalLessons - completedLessons, 0);
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const size = 110;
  const strokeWidth = 6;
  const center = size / 2;
  const radius = (size - strokeWidth - 12) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const carX = progressAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [center, center + radius, center, center - radius, center],
  });

  const carY = progressAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [center - radius, center, center + radius, center, center - radius],
  });

  const carRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const status = getStatusDetails(percent);

  const totalPendingNotificationsCount = notifications.length;

  if (loading) return <LoadingScreen />;

  if (!tutor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8F9FA' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e200', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={32} color="#00C2E8" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8, textAlign: 'center' }}>
          התרחשה שגיאה בטעינת הנתונים
        </Text>
        <Text style={{ textAlign: 'center', fontSize: 14, color: '#4B5563', marginBottom: 24, lineHeight: 22, maxWidth: '85%' }}>
          אנא נסה להתנתק ולהתחבר מחדש לחשבונך.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchDashboard(); }}
          colors={['#00C2E8']}
          tintColor="#00C2E8"
        />
      }
    >
      <View style={styles.topHeader}>
        <Text style={styles.welcomeTitle}>{getGreeting()}, {tutor?.firstName || 'מורה'}</Text>
        <Text style={styles.welcomeSub}>מבט מהיר על הלו"ז להיום</Text>
      </View>

      <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        <View style={styles.cardHeaderRow}>
          <View style={styles.titleWrapper}>
            <Text style={styles.cardTitle}>התקדמות יומית</Text>
            {/* <Text style={styles.cardSubTitle}>{completedLessons} מתוך {totalLessons} שיעורים הושלמו</Text> */}
            <Text style={styles.cardSubTitle}>{completedLessons}/{totalLessons} שיעורים הושלמו</Text>
          </View>
          <Ionicons name="analytics-outline" size={18} color="#00C2E8" />
        </View>

        <View style={styles.centerSection}>
          <View style={styles.ringWrapper}>
            <View style={styles.ambientGlow}>
              <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                  <RadialGradient id="glowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor="#00C2E8" stopOpacity="0.15" />
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx={center} cy={center} r={radius + 5} fill="url(#glowGrad)" />
              </Svg>
            </View>

            <Svg width={size} height={size} style={styles.svgRing}>
              <Circle cx={center} cy={center} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none" />
              <AnimatedCircle
                cx={center} cy={center} r={radius} stroke="#00C2E8" strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                rotation="-90" origin={`${center}, ${center}`}
              />
            </Svg>

            <Animated.View
              style={[
                styles.movingCar,
                {
                  left: carX,
                  top: carY,
                  transform: [
                    { translateX: -10 },
                    { translateY: -10 },
                    { rotate: carRotation }
                  ]
                }
              ]}
            >
              <Ionicons name="car-sport" size={17} color="#000000" />
            </Animated.View>

            <Animated.View style={[styles.centerContent, { transform: [{ scale: percentPopAnim }] }]}>
              <Text style={styles.percentText}>{percent}%</Text>
            </Animated.View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{status.text}</Text>
            {status.icon === 'coffee' ? (
              <AnimatedCoffeeIcon />
            ) : (
              <Ionicons name={status.icon as any} size={16} color="#00C2E8" style={{ marginLeft: 6 }} />
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#00C2E8" style={styles.statIcon} />
            <Text style={styles.statNumber}>{completedLessons}</Text>
            <Text style={styles.statLabel}>בוצעו</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={16} color="#64748B" style={styles.statIcon} />
            <Text style={styles.statNumber}>{remainingLessons}</Text>
            <Text style={styles.statLabel}>נותרו</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={16} color="#64748B" style={styles.statIcon} />
            <Text style={styles.statNumber}>{totalLessons}</Text>
            <Text style={styles.statLabel}>סה״כ</Text>
          </View>
        </View>
      </Animated.View>

      <Text style={styles.sectionLabel}>השיעור הקרוב</Text>
      {tutor?.nextLesson ? (
        <TouchableOpacity style={styles.lessonCard} activeOpacity={0.7} onPress={() => navigation?.navigate('UpcomingLessons')}>
          <View style={styles.lessonTimeBadge}>
            <Text style={styles.dateTagText}>{formatLessonDate(tutor.nextLesson.date)}</Text>
            <Text style={styles.timeText}>{formatTime(tutor.nextLesson.startTime)}</Text>
            <Text style={styles.timeSubText}>{formatTime(tutor.nextLesson.endTime)}</Text>
          </View>

          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle}>{tutor.nextLesson.studentName || 'שיעור נהיגה'}</Text>
            <Text style={styles.lessonSub} numberOfLines={1}>{tutor.nextLesson.pickupLocation}</Text>
          </View>

          <Ionicons name="chevron-back" size={16} color="#94A3B8" />
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>אין שיעורים נוספים להיום</Text>
        </View>
      )}

      {totalPendingNotificationsCount > 0 && (
        <>
          <Text style={styles.sectionLabel}>התראות</Text>
          <TouchableOpacity
            style={styles.alertRow}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={16} color="#00C2E8" />
            <Text style={styles.alertText}>{totalPendingNotificationsCount}  התראות חדשות</Text>
            <Ionicons name="chevron-back" size={14} color="#64748B" />
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', marginBottom: 30 },
  content: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  topHeader: { alignItems: 'flex-end', marginBottom: 30 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  welcomeSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  heroCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  titleWrapper: { alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSubTitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  centerSection: { alignItems: 'center', marginBottom: 20 },
  ringWrapper: { width: 110, height: 110, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  ambientGlow: { position: 'absolute' },
  svgRing: { position: 'absolute' },
  movingCar: { position: 'absolute', width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  percentText: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 10 },
  statusLabel: { fontSize: 13, fontWeight: '600', color: '#00C2E8' },
  coffeeContainer: { position: 'relative', width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  steamLine: { position: 'absolute', top: 1, width: 2, height: 6, backgroundColor: '#00C2E8', borderRadius: 1 },
  statsGrid: { flexDirection: 'row-reverse', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FAFAFA', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statIcon: { marginBottom: 4 },
  statNumber: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textAlign: 'right', marginBottom: 10, textTransform: 'uppercase' },
  lessonCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', gap: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  lessonTimeBadge: { backgroundColor: '#FAFAFA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', minWidth: 62 },
  dateTagText: { fontSize: 10, fontWeight: '700', color: '#00C2E8', marginBottom: 2 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  timeSubText: { fontSize: 10, color: '#94A3B8' },
  lessonInfo: { flex: 1, alignItems: 'flex-end' },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  lessonSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  emptyBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed', marginBottom: 20 },
  emptyText: { fontSize: 12, color: '#94A3B8' },
  alertRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, gap: 10, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8 },
  alertText: { flex: 1, textAlign: 'right', fontSize: 12.5, fontWeight: '600', color: '#0F172A' },
});