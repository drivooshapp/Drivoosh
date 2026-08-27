import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function LegalContentScreen({ route, navigation }: any) {
    const { type } = route.params || { type: 'terms' };
    const isPrivacy = type === 'privacy';
    const title = isPrivacy ? 'מדיניות פרטיות' : 'תנאי שימוש';
    const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.docSubtitle}>עדכון אחרון: אוגוסט 2026</Text>

                {sections.map((section, index) => (
                    <View key={index} style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionText}>{section.content}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const PRIVACY_SECTIONS = [
    {
        title: '1. מבוא ומדיניות כללית',
        content: 'ברוכים הבאים לדרייבוש (Drivoosh). אנו מכבדים את פרטיותך ומחויבים להגן על המידע האישי שלך. מדיניות פרטיות זו מפרטת את סוגי המידע שאנו אוספים, אופן השימוש בו, האמצעים שננקטים לאבטחתו, ואת הזכויות העומדות לרשותך.'
    },
    {
        title: '2. המידע שאנו אוספים',
        content: 'במסגרת השימוש בשירותי הפלטפורמה, אנו עשויים לאסוף את הנתונים הבאים:\n• פרטי זיהוי והתקשרות: שם מלא, כתובת דוא"ל ומספר טלפון.\n• נתוני מיקום: נתוני מיקום (GPS) הנאספים לצורך תיאום נקודות איסוף מדויקות לשיעורי נהיגה וייעול החיבור בין מורים לתלמידים.\n• נתוני פעילות: היסטוריית שיעורים, טפסי מטרות דיגיטליים ותיעוד התנהלות שוטפת במערכת.'
    },
    {
        title: '3. השימוש במידע',
        content: 'המידע הנאסף משמש אך ורק למטרות הבאות:\n• מתן, הפעלה ותחזוקה שוטפת של השירותים.\n• ניהול מערך תיאום שיעורי הנהיגה ומעקב אחר התקדמות הלימודים.\n• שליחת הודעות מערכתיות, עדכונים טכניים והתראות שירות חיוניות.\nאנו לא מוכרים, משכירים או מעבירים את פרטיך האישיים לצדדים שלישיים למטרות שיווקיות.'
    },
    {
        title: '4. אבטחת מידע',
        content: 'דרייבוש מיישמת מערכות ונהלים לאבטחת מידע מהמתקדמים בתעשייה. אנו עושים שימוש בהצפנות, ניהול הרשאות גישה קפדני ובקרה טכנולוגית כדי להגן על המידע שלך מפני גישה, שינוי או חשיפה בלתי מורשים.'
    },
    {
        title: '5. יצירת קשר',
        content: 'לכל שאלה, הערה או בקשה בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו בכל עת דרך ערוצי התמיכה באפליקציה.'
    }
];

const TERMS_SECTIONS = [
    {
        title: '1. תנאי שימוש כלליים',
        content: 'השימוש באפליקציית ובפלטפורמת הניהול של דרייבוש (Drivoosh) כפוף להסכמה מלאה לתנאים המפורטים במסמך זה. עצם ההרשמה והשימוש במערכת מהווים אישור והסכמה בלתי מותנית לתנאים אלו.'
    },
    {
        title: '2. כשירות ושימוש מורשה',
        content: 'השירות מיועד אך ורק למורי נהיגה מורשים ולתלמידי נהיגה רשומים. המשתמש מתחייב למסור פרטים נכונים, מדויקים ומלאים בעת ההרשמה, ולהימנע מכל שימוש שאינו חוקי או שאינו מורשה במערכת.'
    },
    {
        title: '3. אופי השירות ואחריות',
        content: 'דרייבוש פועלת כפלטפורמה טכנולוגית לניהול, תיאום ומעקב אחר שיעורי נהיגה ומטרות לימוד. תיאום השיעורים בפועל, ביטולָם וההתנהלות המסחרית מתבצעים באחריות הישירה של המורה והתלמיד. הפלטפורמה אינה צד להסכמים הכספיים שבין הצדדים.'
    },
    {
        title: '4. קניין רוחני',
        content: 'כל זכויות הקניין הרוחני, לרבות העיצוב, הקוד, המותג והתכנים בפלטפורמה, הינם קניינה הבלעדי של דרייבוש. אין להעתיק, לשכפל או לעשות בהם שימוש מסחרי ללא אישור מראש ובכתב.'
    },
    {
        title: '5. שינויים והפסקת שירות',
        content: 'הנהלת דרייבוש שומרת לעצמה את הזכות לעדכן מעת לעת את תנאי השימוש, וכן לחסום או להשבית גישה למשתמשים המפרים את תנאי הפלטפורמה.'
    }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#111827' },
    backButton: { padding: 4 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 60 },
    docTitle: { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'right', marginBottom: 6 },
    docSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'left', marginBottom: 20 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginBottom: 24 },
    sectionBlock: { marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111827', textAlign: 'right', marginBottom: 8 },
    sectionText: { fontSize: 14, color: '#4B5563', textAlign: 'right', lineHeight: 22 }
});