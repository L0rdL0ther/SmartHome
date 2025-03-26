// Base URLs for different services
export const API_URLS = {
  BASE_URL: 'http://localhost:8080'
} as const;

// User Endpoints
export const UserEndpoints = {
  REGISTER: '/api/users/register',
  LOGIN: '/api/users/login'
} as const;

// Home Endpoints
export const HomeEndpoints = {
  CREATE_HOME: '/api/homes',
  GET_HOME: (id: number) => `/api/homes/${id}`,
  GET_ALL_HOMES: '/api/homes/all',
  UPDATE_HOME: (id: number) => `/api/homes/${id}`,
  DELETE_HOME: (id: number) => `/api/homes/${id}`
} as const;

// Room Endpoints
export const RoomEndpoints = {
  CREATE_ROOM: '/api/rooms',
  GET_ROOM: (id: number) => `/api/rooms/${id}`,
  GET_ALL_ROOMS_BY_HOME: (homeId: number) => `/api/rooms/all/${homeId}`,
  UPDATE_ROOM: (id: number) => `/api/rooms/${id}`,
  DELETE_ROOM: (id: number) => `/api/rooms/${id}`
} as const;

// Device Endpoints
export const DeviceEndpoints = {
  CREATE_DEVICE: '/api/devices',
  GET_DEVICE: (id: number) => `/api/devices/${id}`,
  UPDATE_DEVICE: (id: number) => `/api/devices/${id}`,
  DELETE_DEVICE: (id: number) => `/api/devices/${id}`,
  WRITE_DEVICE_DATA: (id: number) => `/api/devices/${id}/write`,
  GET_DEVICES_BY_ROOM_ID: (roomId: number) => `/api/devices/all/${roomId}`
} as const;

// ESP32 Endpoints
export const ESP32Endpoints = {
  CREATE_ESP: '/api/v1/esp32',
  GET_ESP: (id: number) => `/api/v1/esp32/${id}`,
  GET_ALL_ESPS: '/api/v1/esp32/all',
  UPDATE_ESP: (id: number) => `/api/v1/esp32/${id}`,
  DELETE_ESP: (id: number) => `/api/v1/esp32/${id}`
} as const;

// Helper function to replace URL parameters
export function replaceUrlParams(
  url: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
    url
  );
}

// URL combining helper function
export function combineUrls(baseUrl: string, endpoint: string): string {
    return `${baseUrl}${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
} 