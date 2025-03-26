import axios from 'axios';
import { API_URLS, DeviceEndpoints, combineUrls } from '../endpoints';
import { PaginatedResponse } from '../types';
import { CDevice, RDevice, UDevice, ExceptionModel } from '../models/content.type';

const deviceAxios = axios.create();

deviceAxios.interceptors.request.use((config) => {
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

export const deviceService = {
    async createDevice(deviceData: CDevice): Promise<RDevice> {
        const url = combineUrls(API_URLS.BASE_URL, DeviceEndpoints.CREATE_DEVICE);
        try {
            const response = await deviceAxios.post<RDevice>(url, deviceData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to create device. Please try again.');
        }
    },


    async writeDeviceData(id: number, data: string): Promise<void> {
        const url = combineUrls(API_URLS.BASE_URL, DeviceEndpoints.WRITE_DEVICE_DATA(id));
        try {
            await deviceAxios.put(url, null, {
                params: { data }
            });
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to write device data. Please try again.');
        }
    },

    async getDeviceById(id: number): Promise<RDevice> {
        const url = combineUrls(API_URLS.BASE_URL, DeviceEndpoints.GET_DEVICE(id));
        try {
            const response = await deviceAxios.get<RDevice>(url);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to get device. Please try again.');
        }
    },

    async updateDevice(id: number, deviceData: UDevice): Promise<RDevice> {
        const url = combineUrls(API_URLS.BASE_URL, DeviceEndpoints.UPDATE_DEVICE(id));
        try {
            const response = await deviceAxios.put<RDevice>(url, deviceData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to update device. Please try again.');
        }
    },

    async deleteDevice(id: number): Promise<void> {
        const url = combineUrls(API_URLS.BASE_URL, DeviceEndpoints.DELETE_DEVICE(id));
        try {
            await deviceAxios.delete(url);
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to delete device. Please try again.');
        }
    },

    async getDevicesByRoomId(roomId: number, page: number = 0, size: number = 100): Promise<PaginatedResponse<RDevice>> {
        const url = combineUrls(API_URLS.BASE_URL, DeviceEndpoints.GET_DEVICES_BY_ROOM_ID(roomId));
        try {
            const response = await deviceAxios.post<PaginatedResponse<RDevice>>(url, {
                params: { page, size }
            });
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to fetch devices for this room. Please try again.');
        }
    }
}; 