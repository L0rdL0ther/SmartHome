import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LightbulbOff, 
  Thermometer, 
  Wind, 
  Droplet, 
  Power,
  X,
  RefreshCw
} from 'lucide-react';
import { RDevice, Label, ControlType } from '../../api/models/content.type';
import { deviceService } from '../../api/services';

interface DeviceWidgetProps {
  device: RDevice;
  roomName: string;
  homeName: string;
  onRemove: () => void;
  onRefresh: () => void;
}

const DeviceWidget = ({ device, roomName, homeName, onRemove, onRefresh }: DeviceWidgetProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<RDevice>(device);
  const [error, setError] = useState<string | null>(null);

  // Cihaz durumunu yenileme fonksiyonu
  const refreshDeviceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const refreshedDevice = await deviceService.getDeviceById(device.id);
      setCurrentDevice(refreshedDevice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh device data');
      console.error('Error refreshing device:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // İlk yüklemede cihaz bilgisini al
  useEffect(() => {
    refreshDeviceData();
  }, [device.id]);

  // Cihaz kontrolünü yönet
  const handleDeviceControl = async (deviceId: number, value: string) => {
    setIsLoading(true);
    try {
      await deviceService.writeDeviceData(deviceId, value);
      
      setTimeout(async () => {
        try {
          const updatedDevice = await deviceService.getDeviceById(deviceId);
          setCurrentDevice(updatedDevice);
          onRefresh();
        } catch (err) {
          console.error('Error fetching updated device data:', err);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to control device');
      setIsLoading(false);
    }
  };

  // Cihaz türüne göre simge getir
  const getDeviceIcon = (type: Label) => {
    switch (type) {
      // Lighting Systems
      case Label.LIGHT:
      case Label.DIMMER:
      case Label.RGB_LIGHT:
      case Label.MOTION_LIGHT:
        return <LightbulbOff size={20} className="text-yellow-400" />;
      
      // Climate & Temp related
      case Label.TEMPERATURE_SENSOR:
      case Label.THERMOSTAT:
      case Label.HEATER:
        return <Thermometer size={20} className="text-red-400" />;
      
      // Air related
      case Label.AC:
      case Label.FAN:
      case Label.AIR_PURIFIER:
        return <Wind size={20} className="text-blue-400" />;
      
      // Humidity related
      case Label.HUMIDITY_SENSOR:
      case Label.HUMIDIFIER:
      case Label.DEHUMIDIFIER:
        return <Droplet size={20} className="text-blue-400" />;
      
      // Power related
      case Label.SMART_PLUG:
      case Label.POWER_STRIP:
        return <Power size={20} className="text-green-400" />;
      
      // Default for all other types
      default:
        return <Power size={20} className="text-gray-400" />;
    }
  };

  // Cihaz kontrolü UI oluştur
  const renderDeviceControl = () => {
    switch (currentDevice.controlType) {
      case ControlType.SWITCH:
        // Cihazın mevcut değeri 1 ise açık, 0 veya başka bir değer ise kapalı olarak kabul edelim
        const isOn = currentDevice.currentValue === "1";
        return (
          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={() => handleDeviceControl(currentDevice.id, isOn ? "0" : "1")}
              className={`relative inline-flex h-5 w-10 items-center rounded-full ${isOn ? 'bg-blue-600' : 'bg-gray-700'} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isLoading}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'ml-1'}`} />
            </button>
            <span className={`text-xs ${isOn ? 'text-blue-400' : 'text-gray-400'}`}>{isOn ? 'Açık' : 'Kapalı'}</span>
          </div>
        );
      
      case ControlType.SLIDER:
        const sliderValue = currentDevice.currentValue ? parseInt(currentDevice.currentValue) : 50;
        return (
          <div className="w-full pt-2">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => handleDeviceControl(currentDevice.id, e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              disabled={isLoading}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0%</span>
              <span className="text-xs text-blue-400">{sliderValue}%</span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        );
      
      case ControlType.NUMERIC_INPUT:
        const numValue = currentDevice.currentValue ? parseInt(currentDevice.currentValue) : 24;
        return (
          <div className="flex items-center pt-2">
            <button 
              className="bg-gray-800 text-gray-300 px-2 py-1 rounded-l-lg text-xs"
              onClick={() => handleDeviceControl(currentDevice.id, (numValue - 1).toString())}
              disabled={numValue <= 0 || isLoading}
            >-</button>
            <div className="bg-gray-700 px-4 py-1 text-xs">{numValue}°C</div>
            <button 
              className="bg-gray-800 text-gray-300 px-2 py-1 rounded-r-lg text-xs"
              onClick={() => handleDeviceControl(currentDevice.id, (numValue + 1).toString())}
              disabled={isLoading}
            >+</button>
          </div>
        );
      
      default:
        return (
          <div className="text-gray-400 text-xs pt-2">
            {currentDevice.currentValue || 'No value'}
          </div>
        );
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-xl overflow-hidden border border-gray-800 shadow-lg backdrop-blur-sm"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-2 flex items-center justify-center">
              {getDeviceIcon(currentDevice.type)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{currentDevice.name}</h3>
              <div className="text-xs text-gray-400">
                {roomName} • {homeName}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={refreshDeviceData} 
              className="text-gray-400 hover:text-gray-300 p-1 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={onRemove} 
              className="text-gray-400 hover:text-gray-300 p-1 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/30 text-red-300 text-xs p-2 rounded-lg mb-2">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg p-2">
          {renderDeviceControl()}
        </div>
      </div>
    </motion.div>
  );
};

export default DeviceWidget; 