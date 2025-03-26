import axios from 'axios';
import { API_URLS, ESP32Endpoints, combineUrls } from '../endpoints';
import { PaginatedResponse } from '../types';
import { CEsp, REsp, UEsp, ExceptionModel } from '../models/content.type';

const espAxios = axios.create();

espAxios.interceptors.request.use((config) => {
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

export const espService = {
    async createEsp(espData: CEsp): Promise<REsp> {
        const url = combineUrls(API_URLS.BASE_URL, ESP32Endpoints.CREATE_ESP);
        try {
            const response = await espAxios.post<REsp>(url, espData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to create ESP32 device. Please try again.');
        }
    },

    async getEspById(id: number): Promise<REsp> {
        const url = combineUrls(API_URLS.BASE_URL, ESP32Endpoints.GET_ESP(id));
        try {
            const response = await espAxios.get<REsp>(url);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to get ESP32 device. Please try again.');
        }
    },

    async updateEsp(id: number, espData: UEsp): Promise<REsp> {
        const url = combineUrls(API_URLS.BASE_URL, ESP32Endpoints.UPDATE_ESP(id));
        try {
            const response = await espAxios.put<REsp>(url, espData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to update ESP32 device. Please try again.');
        }
    },

    async deleteEsp(id: number): Promise<void> {
        const url = combineUrls(API_URLS.BASE_URL, ESP32Endpoints.DELETE_ESP(id));
        try {
            await espAxios.delete(url);
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to delete ESP32 device. Please try again.');
        }
    },

    async getAllEsps(page: number = 0, size: number = 10, param: any = {}): Promise<PaginatedResponse<REsp>> {
        const url = combineUrls(API_URLS.BASE_URL, ESP32Endpoints.GET_ALL_ESPS);
        try {
            const response = await espAxios.post<PaginatedResponse<REsp>>(url, param, {
                params: { page, size }
            });
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to fetch ESP32 devices. Please try again.');
        }
    }
}; 