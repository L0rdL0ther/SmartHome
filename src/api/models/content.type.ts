// Enums
export enum Permission {
    CREATE_HOME = "create:home",
    CREATE_ROOM = "create:room",
    INVITE_USER = "invite:user",
    REMOVE_USER = "remove:user",
    DELETE_HOME = "delete:home",
    DELETE_ROOM = "delete:room",
    ADD_NEW_PRODUCT = "add:product",
    REMOVE_PRODUCT = "remove:product",
    UPDATE_PRODUCT = "update:product",
}

export enum Role {
    HOME_ADMIN = "HOME_ADMIN"
}

export interface ExceptionModel {
    timestamp: string;  // LocalDateTime string olarak gelecek
    status: number;
    message: string;
    path: string;
}


export const RolePermissions = {
    [Role.HOME_ADMIN]: [
        Permission.CREATE_HOME,
        Permission.CREATE_ROOM,
        Permission.INVITE_USER,
        Permission.REMOVE_USER,
        Permission.DELETE_HOME,
        Permission.DELETE_ROOM,
        Permission.ADD_NEW_PRODUCT,
        Permission.REMOVE_PRODUCT,
        Permission.UPDATE_PRODUCT
    ]
};

export enum Label {
    // Lighting Systems
    LIGHT = "LIGHT",
    DIMMER = "DIMMER",
    RGB_LIGHT = "RGB_LIGHT",
    MOTION_LIGHT = "MOTION_LIGHT",

    // Climate & Environment Sensors
    TEMPERATURE_SENSOR = "TEMPERATURE_SENSOR",
    HUMIDITY_SENSOR = "HUMIDITY_SENSOR",
    PRESSURE_SENSOR = "PRESSURE_SENSOR",
    CO2_SENSOR = "CO2_SENSOR",
    AIR_QUALITY_SENSOR = "AIR_QUALITY_SENSOR",
    UV_SENSOR = "UV_SENSOR",
    LIGHT_SENSOR = "LIGHT_SENSOR",
    RAIN_SENSOR = "RAIN_SENSOR",
    WIND_SENSOR = "WIND_SENSOR",

    // Climate Control
    AC = "AC",
    HEATER = "HEATER",
    THERMOSTAT = "THERMOSTAT",
    FAN = "FAN",
    HUMIDIFIER = "HUMIDIFIER",
    DEHUMIDIFIER = "DEHUMIDIFIER",
    AIR_PURIFIER = "AIR_PURIFIER",

    // Security & Access
    DOOR_LOCK = "DOOR_LOCK",
    WINDOW_LOCK = "WINDOW_LOCK",
    GARAGE_DOOR = "GARAGE_DOOR",
    GATE = "GATE",
    SECURITY_CAMERA = "SECURITY_CAMERA",
    DOORBELL = "DOORBELL",
    MOTION_SENSOR = "MOTION_SENSOR",

    // Appliances
    REFRIGERATOR = "REFRIGERATOR",
    DISHWASHER = "DISHWASHER",
    WASHING_MACHINE = "WASHING_MACHINE",
    DRYER = "DRYER",
    OVEN = "OVEN",

    // Window & Blinds
    CURTAIN = "CURTAIN",
    BLIND = "BLIND",
    WINDOW = "WINDOW",

    // Entertainment
    TV = "TV",
    SPEAKER = "SPEAKER",
    MEDIA_PLAYER = "MEDIA_PLAYER",

    // Other Systems
    IRRIGATION = "IRRIGATION",
    POOL_SYSTEM = "POOL_SYSTEM",
    VACUUM_ROBOT = "VACUUM_ROBOT",
    ENERGY_METER = "ENERGY_METER",
    WATER_LEAK_SENSOR = "WATER_LEAK_SENSOR",
    SMOKE_DETECTOR = "SMOKE_DETECTOR",
    GAS_DETECTOR = "GAS_DETECTOR",

    // Power Management
    SMART_PLUG = "SMART_PLUG",
    POWER_STRIP = "POWER_STRIP",
    SOLAR_PANEL = "SOLAR_PANEL",
    BATTERY_SYSTEM = "BATTERY_SYSTEM",

    // Weather Station Components
    WEATHER_STATION = "WEATHER_STATION",
    BAROMETER = "BAROMETER",
    ANEMOMETER = "ANEMOMETER",
    RAIN_GAUGE = "RAIN_GAUGE",

    // Water Management
    WATER_METER = "WATER_METER",
    WATER_QUALITY_SENSOR = "WATER_QUALITY_SENSOR",
    WATER_TEMPERATURE_SENSOR = "WATER_TEMPERATURE_SENSOR",

    // Soil Monitoring
    SOIL_MOISTURE_SENSOR = "SOIL_MOISTURE_SENSOR",
    SOIL_PH_SENSOR = "SOIL_PH_SENSOR",
    SOIL_TEMPERATURE_SENSOR = "SOIL_TEMPERATURE_SENSOR"
}

export enum ControlType {
    SWITCH = "SWITCH",
    SLIDER = "SLIDER",
    RGB_PICKER = "RGB_PICKER",
    BUTTON_GROUP = "BUTTON_GROUP",
    NUMERIC_INPUT = "NUMERIC_INPUT",
    TEXT_DISPLAY = "TEXT_DISPLAY",
    DROPDOWN = "DROPDOWN",
    SCHEDULE = "SCHEDULE"
}

// Device Interfaces
export interface CDevice {
    roomId: number;
    name: string;
    type: Label;
    currentValue: string | null;
    controlType: ControlType;
    esp32DeviceId: number;
}

export interface RDevice {
    id: number;
    name: string;
    type: Label;
    currentValue: string | null;
    controlType: ControlType;
    esp32DeviceId?: number;
}

export interface UDevice {
    name?: string;
    type?: Label;
    currentValue?: string;
    controlType?: ControlType;
}

// ESP Interfaces
export interface CEsp {
    title: string;
}

export interface REsp {
    id: number;
    title: string | null;
    token: string | null;
}

export interface UEsp {
    title?: string;
}

// Home Interfaces
export interface CHome {
    name: string;
    address: string;
}

export interface RHome {
    id: number;
    name: string;
    address: string;
}

export interface UHome {
    name?: string;
    address?: string;
}

// Room Interfaces
export interface CRoom {
    homeId: number;
    name: string;
    description?: string;
    imageUrl?: string;
}

export interface RRoom {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
}

export interface URoom {
    name?: string;
    description?: string;
    imageUrl?: string;
}

// User Interfaces
export interface CUser {
    username?: string;
    email?: string;
    password?: string;
}

export interface LUser {
    email: string;
    password: string;
}

export interface RUser {
    username?: string;
    email?: string;
    token?: string;
}

export interface UUser {
    username?: string;
    password?: string;
}
