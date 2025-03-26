import axios from 'axios';
import { API_URLS, UserEndpoints, combineUrls } from '../endpoints';
import { CUser, LUser, RUser, ExceptionModel } from '../models/content.type';

const userAxios = axios.create();

userAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const handleAxiosError = (error: unknown, defaultMessage: string): never => {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            const errorData = error.response.data as ExceptionModel;
            if (errorData?.message) {
                throw new Error(errorData.message);
            } else if (error.response.status === 503) {
                throw new Error('Service is temporarily unavailable. Please try again later.');
            }
        } else if (error.request) {
            throw new Error('No response received from server. Please check your connection.');
        }
    }
    throw new Error(defaultMessage);
};

export const userService = {
    async register(userData: CUser): Promise<RUser> {
        const url = combineUrls(API_URLS.BASE_URL, UserEndpoints.REGISTER);
        try {
            const response = await userAxios.post<RUser>(url, userData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to register user. Please try again.');
        }
    },

    async login(loginData: LUser): Promise<RUser> {
        const url = combineUrls(API_URLS.BASE_URL, UserEndpoints.LOGIN);
        try {
            const response = await userAxios.post<RUser>(url, loginData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to login. Please check your credentials and try again.');
        }
    }
}; 