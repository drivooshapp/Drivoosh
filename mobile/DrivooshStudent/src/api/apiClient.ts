import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


// const BASE_URL = process.env.EXPO_PUBLIC_URL_SERVER || "https://drivoosh-1.onrender.com/api/";
const BASE_URL = __DEV__ ? 'http://192.168.1.100:3000/api' : 'https://drivoosh-backend.onrender.com/api';
// const BASE_URL = process.env.EXPO_PUBLIC_URL_SERVER;
// const BASE_URL = 'http://localhost:4000/api/';
// const BASE_URL = "http://192.168.1.7:4000/api/";

console.log("Connect to API at:", BASE_URL);

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            await AsyncStorage.removeItem('userToken');
        }
        return Promise.reject(error);
    }
);

export default apiClient;