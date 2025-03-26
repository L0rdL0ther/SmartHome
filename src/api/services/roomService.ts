import axios from 'axios';
import { API_URLS, RoomEndpoints, combineUrls } from '../endpoints';
import { PaginatedResponse } from '../types';
import { CRoom, RRoom, URoom, ExceptionModel } from '../models/content.type';

const roomAxios = axios.create();

roomAxios.interceptors.request.use((config) => {
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

export const roomService = {
    async createRoom(roomData: CRoom): Promise<RRoom> {
        const url = combineUrls(API_URLS.BASE_URL, RoomEndpoints.CREATE_ROOM);
        try {
            const response = await roomAxios.post<RRoom>(url, roomData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to create room. Please try again.');
        }
    },

    async getRoomById(id: number): Promise<RRoom> {
        const url = combineUrls(API_URLS.BASE_URL, RoomEndpoints.GET_ROOM(id));
        try {
            const response = await roomAxios.get<RRoom>(url);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to get room. Please try again.');
        }
    },

    async updateRoom(id: number, roomData: URoom): Promise<RRoom> {
        const url = combineUrls(API_URLS.BASE_URL, RoomEndpoints.UPDATE_ROOM(id));
        try {
            const response = await roomAxios.put<RRoom>(url, roomData);
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to update room. Please try again.');
        }
    },

    async getAllRoomsByHomeId(
        homeId: number,
        page: number = 0, 
        size: number = 10,
        sortOrder?: 'ASC' | 'DESC',
        sortBy?: string,
        param: any = {}
    ): Promise<PaginatedResponse<RRoom>> {
        const url = combineUrls(API_URLS.BASE_URL, RoomEndpoints.GET_ALL_ROOMS_BY_HOME(homeId));
        const updatedParam = {
            ...param,
            page: page ?? param.page,
            size: size ?? param.size,
            sortOrder: sortOrder ?? param.sortOrder,
            sortBy: sortBy ?? param.sortBy
        };
        try {
            const response = await roomAxios.post<PaginatedResponse<RRoom>>(url, updatedParam, {
                params: { page, size, sortOrder, sortBy }
            });
            return response.data;
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to fetch rooms. Please try again.');
        }
    },

    async deleteRoom(id: number): Promise<void> {
        const url = combineUrls(API_URLS.BASE_URL, RoomEndpoints.DELETE_ROOM(id));
        try {
            await roomAxios.delete(url);
        } catch (error: unknown) {
            return handleAxiosError(error, 'Failed to delete room. Please try again.');
        }
    }
}; 