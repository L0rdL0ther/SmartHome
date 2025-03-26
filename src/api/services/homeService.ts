import axios from 'axios';
import { API_URLS, HomeEndpoints, combineUrls } from '../endpoints';
import { PaginatedResponse } from '../types';
import { CHome, RHome, UHome, ExceptionModel } from '../models/content.type';

const homeAxios = axios.create();

homeAxios.interceptors.request.use((config) => {
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

export const homeService = {
    async createHome(homeData: CHome): Promise<RHome> {
        const url = combineUrls(API_URLS.BASE_URL, HomeEndpoints.CREATE_HOME);
        try {
            const response = await homeAxios.post<RHome>(url, homeData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to create home. Please try again.');
        }
    },

    async getHomeById(id: number): Promise<RHome> {
        const url = combineUrls(API_URLS.BASE_URL, HomeEndpoints.GET_HOME(id));
        try {
            const response = await homeAxios.get<RHome>(url);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to get home. Please try again.');
        }
    },

    async updateHome(id: number, homeData: UHome): Promise<RHome> {
        const url = combineUrls(API_URLS.BASE_URL, HomeEndpoints.UPDATE_HOME(id));
        try {
            const response = await homeAxios.put<RHome>(url, homeData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to update home. Please try again.');
        }
    },

    async getAllHomes(page: number = 0, size: number = 10, param: any = {}): Promise<PaginatedResponse<RHome>> {
        const url = combineUrls(API_URLS.BASE_URL, HomeEndpoints.GET_ALL_HOMES);
        try {
            console.log('Making request to:', url);
            console.log('With params:', { page, size, param });
            const response = await homeAxios.post<PaginatedResponse<RHome>>(url, {
                params: { page, size, ...param }
            });
            console.log('Raw API response:', response);
            console.log('Response data:', response.data);
            return response.data;
        } catch (error: unknown) {
            console.error('Error in getAllHomes:', error);
            return handleAxiosError(error, 'Failed to fetch homes. Please try again.');
        }
    },

    async deleteHome(id: number): Promise<void> {
        const url = combineUrls(API_URLS.BASE_URL, HomeEndpoints.DELETE_HOME(id));
        try {
            await homeAxios.delete(url);
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to delete home. Please try again.');
        }
    }
}; 