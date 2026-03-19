import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const BASE_URL = 'http://localhost:4000/api/';
// const BASE_URL = "http://192.168.1.7:4000/api/";

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor להוספת ה-Token באופן אוטומטי לכל בקשה
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Interceptor לטיפול בשגיאות גלובליות (למשל אם ה-Token פג תוקף)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // אם קיבלנו 401 (Unauthorized), כדאי לנתק את המשתמש
            await AsyncStorage.removeItem('userToken');
            // כאן אפשר להוסיף לוגיקה של ניווט חזרה למסך הלוגין
        }
        return Promise.reject(error);
    }
);

export default apiClient;