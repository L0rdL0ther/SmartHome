import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Search, Zap, Thermometer, LightbulbOff, Power, Wind, Droplet, Cpu, MoreVertical, Edit, Trash, X, RefreshCw } from 'lucide-react';
import { deviceService, espService } from '../../api/services';
import { RDevice, RRoom, RHome, Label, ControlType, REsp } from '../../api/models/content.type';

interface DeviceDashboardProps {
  selectedRoom: RRoom;
  selectedHome: RHome;
  onBackToRooms: () => void;
}

const DeviceDashboard = ({ selectedRoom, selectedHome, onBackToRooms }: DeviceDashboardProps) => {
  const [devices, setDevices] = useState<RDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    name: '',
    type: Label.LIGHT,
    controlType: ControlType.SWITCH,
    esp32DeviceId: 0
  });
  const [espDevices, setEspDevices] = useState<REsp[]>([]);
  const [loadingEsp, setLoadingEsp] = useState(false);
  const [activeMenuDevice, setActiveMenuDevice] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [deviceToUpdate, setDeviceToUpdate] = useState<RDevice | null>(null);
  const [updatedDeviceData, setUpdatedDeviceData] = useState({
    name: '',
    type: Label.LIGHT,
    controlType: ControlType.SWITCH,
    esp32DeviceId: 0
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingDevices, setRefreshingDevices] = useState<number[]>([]);
  const [controllingDevices, setControllingDevices] = useState<number[]>([]);
  
  // Menu dışında bir yere tıklandığında menüyü kapatmak için kullanılacak ref
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Menü dışına tıklandığında menüyü kapat
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuDevice(null);
      }
    };

    // Event listener'ı ekle
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchESP32Devices();
  }, [selectedRoom.id]);

  useEffect(() => {
    // ESP32 cihazları yüklendiğinde, form varsayılan değerini ilk ESP32 ID'sine ayarla
    if (espDevices.length > 0) {
      setNewDeviceData(prevData => ({
        ...prevData,
        esp32DeviceId: espDevices[0].id
      }));
    }
  }, [espDevices]);

  // Cihaz güncelleme modalını açtığımızda, cihaz bilgilerini forma yükle
  useEffect(() => {
    if (deviceToUpdate) {
      setUpdatedDeviceData({
        name: deviceToUpdate.name,
        type: deviceToUpdate.type,
        controlType: deviceToUpdate.controlType,
        esp32DeviceId: deviceToUpdate.esp32DeviceId || 0
      });
    }
  }, [deviceToUpdate]);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the getDevicesByRoomId method with room ID and pagination
      const response = await deviceService.getDevicesByRoomId(selectedRoom.id, 0, 100);
      // İsme göre sırala
      const sortedDevices = (response.content || []).sort((a, b) => a.name.localeCompare(b.name));
      setDevices(sortedDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchESP32Devices = async () => {
    setLoadingEsp(true);
    try {
      const response = await espService.getAllEsps(0, 100);
      setEspDevices(response.content || []);
    } catch (err) {
      console.error('Error fetching ESP32 devices:', err);
    } finally {
      setLoadingEsp(false);
    }
  };

  const handleCreateDevice = async () => {
    if (!newDeviceData.name.trim()) {
      setError('Device name is required');
      return;
    }

    if (espDevices.length === 0) {
      setError('No ESP32 controller available. Please add one first from the ESP32 Controllers section.');
      return;
    }

    if (!newDeviceData.esp32DeviceId) {
      setError('Please select an ESP32 controller for your device');
      return;
    }

    try {
      const newDevice = await deviceService.createDevice({
        roomId: selectedRoom.id,
        name: newDeviceData.name,
        type: newDeviceData.type,
        controlType: newDeviceData.controlType,
        currentValue: null,
        esp32DeviceId: newDeviceData.esp32DeviceId
      });
      setShowCreateModal(false);
      // Form resetlendiğinde son seçilen esp32 ID'sini koru
      const currentEsp32Id = espDevices.length > 0 ? newDeviceData.esp32DeviceId : 1;
      setNewDeviceData({
        name: '',
        type: Label.LIGHT,
        controlType: ControlType.SWITCH,
        esp32DeviceId: currentEsp32Id
      });
      
      // Yeni cihazı ekle ve isime göre sırala
      setDevices(prev => [...prev, newDevice].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device');
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await deviceService.deleteDevice(deviceId);
      setShowDeleteConfirm(false);
      setActiveMenuDevice(null);
      
      // Silinen cihazı doğrudan listeden çıkar, fetchDevices() çağırmak yerine
      setDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateDevice = async () => {
    if (!deviceToUpdate) return;
    
    if (!updatedDeviceData.name.trim()) {
      setError('Device name is required');
      return;
    }

    if (!updatedDeviceData.esp32DeviceId) {
      setError('Please select an ESP32 controller for your device');
      return;
    }

  
    setError(null);
    try {
      const updatedDevice = await deviceService.updateDevice(deviceToUpdate.id, {
        name: updatedDeviceData.name,
        type: updatedDeviceData.type,
        controlType: updatedDeviceData.controlType,
        esp32DeviceId: updatedDeviceData.esp32DeviceId
      });
      setShowUpdateModal(false);
      setDeviceToUpdate(null);
      
      // Güncellenmiş cihazı ekle ve isime göre sırala
      setDevices(prev => 
        prev.map(device => device.id === updatedDevice.id ? updatedDevice : device)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
    } finally {
     
    }
  };

  const handleDeviceControl = async (deviceId: number, value: string) => {
    if (controllingDevices.includes(deviceId)) return;
    
    setControllingDevices(prev => [...prev, deviceId]);
    try {
      await deviceService.writeDeviceData(deviceId, value);
      
      // Tüm cihazları yenilemek yerine sadece değiştirilen cihazı 500ms sonra yenile
      setTimeout(async () => {
        try {
          const updatedDevice = await deviceService.getDeviceById(deviceId);
          
          // Cihazlar dizisini güncelle, sadece değiştirilen cihazı yenile
          setDevices(prev => 
            prev.map(device => device.id === deviceId ? updatedDevice : device)
              .sort((a, b) => a.name.localeCompare(b.name)) // İsme göre sırala
          );
        } catch (err) {
          console.error('Error fetching updated device data:', err);
        } finally {
          setControllingDevices(prev => prev.filter(id => id !== deviceId));
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to control device');
      setControllingDevices(prev => prev.filter(id => id !== deviceId));
    }
  };

  // Belirli bir cihazı yenileme işlevi
  const refreshDevice = async (deviceId: number) => {
    if (refreshingDevices.includes(deviceId)) return;
    
    setRefreshingDevices(prev => [...prev, deviceId]);
    try {
      const updatedDevice = await deviceService.getDeviceById(deviceId);
      setDevices(prev => 
        prev.map(device => device.id === deviceId ? updatedDevice : device)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      console.error('Error refreshing device:', err);
    } finally {
      setRefreshingDevices(prev => prev.filter(id => id !== deviceId));
    }
  };

  // Cihazları yenileme işlevi
  const refreshDevices = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await deviceService.getDevicesByRoomId(selectedRoom.id, 0, 100);
      const sortedDevices = (response.content || []).sort((a, b) => a.name.localeCompare(b.name));
      setDevices(sortedDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh devices');
      console.error('Error refreshing devices:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtre uygulamadan önce cihazları isme göre sırala
  const filteredDevices = devices
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(device => 
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Get appropriate icon for a device type
  const getDeviceIcon = (type: Label) => {
    switch (type) {
      // Lighting Systems
      case Label.LIGHT:
      case Label.DIMMER:
      case Label.RGB_LIGHT:
      case Label.MOTION_LIGHT:
        return <LightbulbOff size={24} className="text-yellow-400" />;
      
      // Climate & Temp related
      case Label.TEMPERATURE_SENSOR:
      case Label.THERMOSTAT:
      case Label.HEATER:
        return <Thermometer size={24} className="text-red-400" />;
      
      // Air related
      case Label.AC:
      case Label.FAN:
      case Label.AIR_PURIFIER:
        return <Wind size={24} className="text-blue-400" />;
      
      // Humidity related
      case Label.HUMIDITY_SENSOR:
      case Label.HUMIDIFIER:
      case Label.DEHUMIDIFIER:
        return <Droplet size={24} className="text-blue-400" />;
      
      // Power related
      case Label.SMART_PLUG:
      case Label.POWER_STRIP:
        return <Power size={24} className="text-green-400" />;
      
      // Default for all other types
      default:
        return <Power size={24} className="text-gray-400" />;
    }
  };

  // Generate control UI based on device type
  const renderDeviceControl = (device: RDevice) => {
    switch (device.controlType) {
      case ControlType.SWITCH:
        // Cihazın mevcut değeri 1 ise açık, 0 veya başka bir değer ise kapalı olarak kabul edelim
        const isOn = device.currentValue === "1";
        const isControlling = controllingDevices.includes(device.id);
        return (
          <div className="flex items-center justify-between">
            <button 
              onClick={() => handleDeviceControl(device.id, isOn ? "0" : "1")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${isOn ? 'bg-blue-600' : 'bg-gray-700'} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isControlling}
            >
              {isControlling ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'ml-1'}`} />
              )}
            </button>
            <span className={`text-sm ${isOn ? 'text-blue-400' : 'text-gray-400'}`}>
              {isControlling ? (
                <div className="flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" />
                  {isOn ? 'Kapatılıyor...' : 'Açılıyor...'}
                </div>
              ) : (
                isOn ? 'Açık' : 'Kapalı'
              )}
            </span>
          </div>
        );
      
      case ControlType.SLIDER:
        const sliderValue = device.currentValue ? parseInt(device.currentValue) : 50;
        const isSliderControlling = controllingDevices.includes(device.id);
        return (
          <div className="w-full">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => handleDeviceControl(device.id, e.target.value)}
                className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isSliderControlling ? 'opacity-50' : ''}`}
                disabled={isSliderControlling}
              />
              {isSliderControlling && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <RefreshCw size={16} className="animate-spin text-blue-400" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0%</span>
              <span className="text-xs text-blue-400">
                {isSliderControlling ? (
                  <div className="flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" />
                    Ayarlanıyor...
                  </div>
                ) : (
                  `${sliderValue}%`
                )}
              </span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        );
      
      case ControlType.NUMERIC_INPUT:
        const numValue = device.currentValue ? parseInt(device.currentValue) : 24;
        const isNumericControlling = controllingDevices.includes(device.id);
        return (
          <div className="flex items-center">
            <button 
              className="bg-gray-800 text-gray-300 px-2 py-1 rounded-l-lg"
              onClick={() => handleDeviceControl(device.id, (numValue - 1).toString())}
              disabled={numValue <= 0 || isNumericControlling}
            >-</button>
            <div className="bg-gray-700 px-4 py-1 relative">
              {isNumericControlling ? (
                <div className="flex items-center justify-center gap-1 min-w-[50px]">
                  <RefreshCw size={12} className="animate-spin text-blue-400" />
                  <span className="text-blue-400">...</span>
                </div>
              ) : (
                `${numValue}°C`
              )}
            </div>
            <button 
              className="bg-gray-800 text-gray-300 px-2 py-1 rounded-r-lg"
              onClick={() => handleDeviceControl(device.id, (numValue + 1).toString())}
              disabled={isNumericControlling}
            >+</button>
          </div>
        );
      
      default:
        // Sensör değerleri için özel görünüm
        if (device.type === Label.TEMPERATURE_SENSOR || device.type === Label.HUMIDITY_SENSOR) {
          const value = device.currentValue ? parseFloat(device.currentValue) : 0;
          const isRefreshing = refreshingDevices.includes(device.id);
          
          return (
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className={`text-3xl font-bold ${device.type === Label.TEMPERATURE_SENSOR ? 'text-red-400' : 'text-blue-400'}`}>
                  {isRefreshing ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>...</span>
                    </div>
                  ) : (
                    <>
                      {value.toFixed(1)}
                      <span className="text-xl ml-1">
                        {device.type === Label.TEMPERATURE_SENSOR ? '°C' : '%'}
                      </span>
                    </>
                  )}
                </div>
                <div className="absolute -top-2 -right-2">
                  {device.type === Label.TEMPERATURE_SENSOR ? (
                    <Thermometer size={16} className="text-red-400" />
                  ) : (
                    <Droplet size={16} className="text-blue-400" />
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {device.type === Label.TEMPERATURE_SENSOR ? 'Sıcaklık' : 'Nem'} Sensörü
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-gray-400 text-sm">
            {device.currentValue || 'No value'}
          </div>
        );
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500 rounded-full filter blur-[150px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500 rounded-full filter blur-[150px] opacity-10"></div>
      </div>

      {/* Header - Glass Morphism */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/40 border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToRooms}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {selectedRoom.name}
                </h1>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm">{selectedHome.name}</span>
              </div>
              <p className="text-gray-500 text-sm">{selectedRoom.description || 'No description'}</p>
            </div>
            <button 
              onClick={refreshDevices}
              disabled={isRefreshing || isLoading}
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${isRefreshing ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white'} transition-colors`}
              title="Cihazları Yenile"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h2 className="text-2xl font-bold">Devices</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <span>Room ID: {selectedRoom.id}</span>
              <span>•</span>
              <span>{filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}</span>
              {searchTerm && <span>• Filtered results</span>}
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl py-3 pl-12 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
              />
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-5 py-3 flex items-center gap-2 transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-800/50"
            >
              <Plus size={18} />
              <span className="hidden sm:inline font-medium">Add Device</span>
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-800/50 text-red-200 p-5 rounded-xl mb-6 backdrop-blur-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading ? (
          <motion.div 
            className="flex flex-col justify-center items-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-purple-500 animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-400">Loading devices...</p>
          </motion.div>
        ) : (
          <>
            {/* Empty State */}
            {filteredDevices.length === 0 && !isLoading && (
              <motion.div 
                className="bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl p-10 text-center border border-gray-800 shadow-xl backdrop-blur-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 inline-flex p-6 rounded-full mb-6 backdrop-blur-lg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Zap size={40} className="text-blue-400" />
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {searchTerm ? "No matches found" : "No devices yet"}
                </motion.h3>
                <motion.p 
                  className="text-gray-400 mb-8 max-w-md mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {searchTerm 
                    ? "No devices match your search criteria. Try different keywords or clear your search."
                    : "You haven't added any devices to this room yet. Add your first device to start controlling your smart home."}
                </motion.p>
                {!searchTerm && (
                  <motion.button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-8 py-4 inline-flex items-center gap-3 transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-800/50 font-medium"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={20} />
                    Add Your First Device
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Device Cards Grid */}
            {filteredDevices.length > 0 && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredDevices.map((device) => (
                  <motion.div 
                    key={device.id}
                    variants={itemVariants}
                    className="group bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-800/60 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-blue-900/10"
                    whileHover={{ y: -5 }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 flex items-center justify-center">
                            {getDeviceIcon(device.type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{device.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-sm">{device.type.toString().replace('_', ' ').toLowerCase()}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 text-xs">ID: {device.id}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="bg-green-900/20 text-green-400 text-xs font-medium px-2 py-1 rounded-full">
                            Online
                          </div>
                          <div className="bg-purple-900/20 text-purple-400 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <Cpu size={10} />
                            <span>
                              {device.esp32DeviceId ? 
                                (espDevices.find(esp => esp.id === device.esp32DeviceId)?.title || `ESP32 #${device.esp32DeviceId}`) :
                                'No ESP32'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Refresh Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshDevice(device.id);
                              }}
                              className={`flex items-center justify-center w-7 h-7 rounded-lg ${refreshingDevices.includes(device.id) ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800/70 hover:bg-gray-700/80 text-gray-400 hover:text-white'} transition-colors`}
                              aria-label="Refresh device"
                              title="Cihazı Yenile"
                              disabled={refreshingDevices.includes(device.id)}
                            >
                              <RefreshCw size={14} className={refreshingDevices.includes(device.id) ? "animate-spin" : ""} />
                            </button>
                            
                            {/* Options Menu Button */}
                            <div className="relative" ref={activeMenuDevice === device.id ? menuRef : undefined}>
                              <button
                                onClick={() => setActiveMenuDevice(activeMenuDevice === device.id ? null : device.id)}
                                className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-800/70 hover:bg-gray-700/80 transition-colors"
                                aria-label="Device options"
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {/* Options Menu */}
                              {activeMenuDevice === device.id && (
                                <div className="absolute right-0 top-9 z-20 w-44 bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
                                  <div className="py-1">
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-200 hover:bg-gray-700"
                                      onClick={() => {
                                        setDeviceToUpdate(device);
                                        setShowUpdateModal(true);
                                        setActiveMenuDevice(null);
                                      }}
                                    >
                                      <Edit size={14} className="text-blue-400" />
                                      Düzenle
                                    </button>
                                    
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-200 hover:bg-gray-700"
                                      onClick={() => {
                                        setDeviceToUpdate(device);
                                        setShowDeleteConfirm(true);
                                      }}
                                    >
                                      <Trash size={14} className="text-red-400" />
                                      Sil
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4">
                        {renderDeviceControl(device)}
                      </div>
                      
                      {/* Technical Details */}
                      <div className="mt-4 pt-4 border-t border-gray-800/70">
                        <div className="flex justify-between">
                          <div className="text-gray-400 text-xs">
                            <span className="font-medium">Device ID:</span> {device.id}
                          </div>
                          
                          <div className="text-gray-400 text-xs text-right">
                            <div className="mb-1">
                              <span className="font-medium">Type:</span> {device.type}
                            </div>
                            <div>
                              <span className="font-medium">Control:</span> {device.controlType}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add Device Card */}
                <motion.div 
                  variants={itemVariants}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-8 h-full min-h-[200px] hover:border-blue-600/50 transition-all cursor-pointer backdrop-blur-sm"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-full p-4 mb-4">
                    <Plus size={30} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Add New Device</h3>
                  <p className="text-gray-400 text-center max-w-xs">Connect a new smart device to this room</p>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Create Device Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-xl overflow-hidden"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Add New Device</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                  <span>Room:</span>
                  <span className="font-medium text-blue-400">{selectedRoom.name}</span>
                  <span className="text-gray-500">•</span>
                  <span>ID: {selectedRoom.id}</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="deviceName" className="block text-sm font-medium text-gray-300 mb-1">
                      Device Name
                    </label>
                    <input
                      id="deviceName"
                      type="text"
                      value={newDeviceData.name}
                      onChange={(e) => setNewDeviceData({...newDeviceData, name: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="Living Room Light"
                    />
                    <p className="mt-1 text-xs text-blue-400">
                      <span className="text-gray-400">Not:</span> Cihaz oluşturulduğunda otomatik olarak bir ID atanacaktır.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="deviceType" className="block text-sm font-medium text-gray-300 mb-1">
                      Device Type
                    </label>
                    <select
                      id="deviceType"
                      value={newDeviceData.type}
                      onChange={(e) => setNewDeviceData({...newDeviceData, type: e.target.value as Label})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                    >
                      {/* Lighting Systems */}
                      <optgroup label="Lighting Systems">
                        <option value={Label.LIGHT}>Light</option>
                        <option value={Label.DIMMER}>Dimmer</option>
                        <option value={Label.RGB_LIGHT}>RGB Light</option>
                        <option value={Label.MOTION_LIGHT}>Motion Light</option>
                      </optgroup>

                      {/* Climate Control */}
                      <optgroup label="Climate Control">
                        <option value={Label.THERMOSTAT}>Thermostat</option>
                        <option value={Label.AC}>Air Conditioner</option>
                        <option value={Label.HEATER}>Heater</option>
                        <option value={Label.FAN}>Fan</option>
                        <option value={Label.HUMIDIFIER}>Humidifier</option>
                        <option value={Label.DEHUMIDIFIER}>Dehumidifier</option>
                        <option value={Label.AIR_PURIFIER}>Air Purifier</option>
                      </optgroup>

                      {/* Sensors */}
                      <optgroup label="Sensors">
                        <option value={Label.TEMPERATURE_SENSOR}>Temperature Sensor</option>
                        <option value={Label.HUMIDITY_SENSOR}>Humidity Sensor</option>
                        <option value={Label.MOTION_SENSOR}>Motion Sensor</option>
                        <option value={Label.LIGHT_SENSOR}>Light Sensor</option>
                      </optgroup>

                      {/* Power Management */}
                      <optgroup label="Power Management">
                        <option value={Label.SMART_PLUG}>Smart Plug</option>
                        <option value={Label.POWER_STRIP}>Power Strip</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="controlType" className="block text-sm font-medium text-gray-300 mb-1">
                      Control Type
                    </label>
                    <select
                      id="controlType"
                      value={newDeviceData.controlType}
                      onChange={(e) => setNewDeviceData({...newDeviceData, controlType: e.target.value as ControlType})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                    >
                      <option value={ControlType.SWITCH}>Switch (On/Off)</option>
                      <option value={ControlType.SLIDER}>Slider</option>
                      <option value={ControlType.NUMERIC_INPUT}>Numeric Input</option>
                      <option value={ControlType.BUTTON_GROUP}>Button Group</option>
                      <option value={ControlType.RGB_PICKER}>RGB Color Picker</option>
                      <option value={ControlType.TEXT_DISPLAY}>Text Display</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="esp32DeviceId" className="block text-sm font-medium text-gray-300 mb-1">
                      ESP32 Controller <span className="text-blue-400">*</span>
                    </label>
                    <div className="relative">
                      {loadingEsp && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <select
                        id="esp32DeviceId"
                        value={newDeviceData.esp32DeviceId || ''}
                        onChange={(e) => setNewDeviceData({...newDeviceData, esp32DeviceId: parseInt(e.target.value)})}
                        className={`bg-gray-800/50 border ${newDeviceData.esp32DeviceId ? 'border-gray-700' : 'border-amber-700'} rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200`}
                        disabled={loadingEsp}
                        required
                      >
                        <option value="" disabled>ESP32 Kontrolcü Seçiniz...</option>
                        {espDevices.length === 0 ? (
                          <option value="" disabled>Aktif ESP32 bulunamadı</option>
                        ) : (
                          espDevices.map(esp => (
                            <option key={esp.id} value={esp.id}>
                              {esp.title || `ESP32 #${esp.id}`} 
                              {esp.token ? " (Online)" : " (Offline)"}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    {espDevices.length === 0 && !loadingEsp && (
                      <div className="mt-2 text-sm bg-amber-900/30 border border-amber-800/50 p-3 rounded-lg text-amber-300">
                        <p className="font-semibold mb-1">ESP32 Kontrolcü Gerekli!</p>
                        <p>
                          Cihaz eklemek için önce bir ESP32 kontrolcü eklemeniz gerekir. Üst menüdeki 
                          <span className="inline-flex items-center mx-1 px-2 py-1 bg-purple-900/30 rounded text-purple-300">
                            <Cpu size={12} className="mr-1" /> ESP32 Controllers
                          </span> 
                          bölümüne gidin ve bir ESP32 kontrolcü ekleyin.
                        </p>
                      </div>
                    )}
                    {espDevices.length > 0 && !newDeviceData.esp32DeviceId && (
                      <p className="mt-1 text-xs text-amber-400">
                        Bu cihazı kontrol edecek ESP32 kontrolcüyü seçmelisiniz
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateDevice}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20"
                >
                  Create Device
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Device Modal */}
      <AnimatePresence>
        {showUpdateModal && deviceToUpdate && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-xl overflow-hidden"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Cihazı Düzenle</h2>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="deviceName" className="block text-sm font-medium text-gray-300 mb-1">
                      Device Name
                    </label>
                    <input
                      id="deviceName"
                      type="text"
                      value={updatedDeviceData.name}
                      onChange={(e) => setUpdatedDeviceData({...updatedDeviceData, name: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="Living Room Light"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="deviceType" className="block text-sm font-medium text-gray-300 mb-1">
                      Device Type
                    </label>
                    <select
                      id="deviceType"
                      value={updatedDeviceData.type}
                      onChange={(e) => setUpdatedDeviceData({...updatedDeviceData, type: e.target.value as Label})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                    >
                      {/* Lighting Systems */}
                      <optgroup label="Lighting Systems">
                        <option value={Label.LIGHT}>Light</option>
                        <option value={Label.DIMMER}>Dimmer</option>
                        <option value={Label.RGB_LIGHT}>RGB Light</option>
                        <option value={Label.MOTION_LIGHT}>Motion Light</option>
                      </optgroup>

                      {/* Climate Control */}
                      <optgroup label="Climate Control">
                        <option value={Label.THERMOSTAT}>Thermostat</option>
                        <option value={Label.AC}>Air Conditioner</option>
                        <option value={Label.HEATER}>Heater</option>
                        <option value={Label.FAN}>Fan</option>
                        <option value={Label.HUMIDIFIER}>Humidifier</option>
                        <option value={Label.DEHUMIDIFIER}>Dehumidifier</option>
                        <option value={Label.AIR_PURIFIER}>Air Purifier</option>
                      </optgroup>

                      {/* Sensors */}
                      <optgroup label="Sensors">
                        <option value={Label.TEMPERATURE_SENSOR}>Temperature Sensor</option>
                        <option value={Label.HUMIDITY_SENSOR}>Humidity Sensor</option>
                        <option value={Label.MOTION_SENSOR}>Motion Sensor</option>
                        <option value={Label.LIGHT_SENSOR}>Light Sensor</option>
                      </optgroup>

                      {/* Power Management */}
                      <optgroup label="Power Management">
                        <option value={Label.SMART_PLUG}>Smart Plug</option>
                        <option value={Label.POWER_STRIP}>Power Strip</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="controlType" className="block text-sm font-medium text-gray-300 mb-1">
                      Control Type
                    </label>
                    <select
                      id="controlType"
                      value={updatedDeviceData.controlType}
                      onChange={(e) => setUpdatedDeviceData({...updatedDeviceData, controlType: e.target.value as ControlType})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                    >
                      <option value={ControlType.SWITCH}>Switch (On/Off)</option>
                      <option value={ControlType.SLIDER}>Slider</option>
                      <option value={ControlType.NUMERIC_INPUT}>Numeric Input</option>
                      <option value={ControlType.BUTTON_GROUP}>Button Group</option>
                      <option value={ControlType.RGB_PICKER}>RGB Color Picker</option>
                      <option value={ControlType.TEXT_DISPLAY}>Text Display</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="esp32DeviceId" className="block text-sm font-medium text-gray-300 mb-1">
                      ESP32 Controller <span className="text-blue-400">*</span>
                    </label>
                    <div className="relative">
                      {loadingEsp && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <select
                        id="esp32DeviceId"
                        value={updatedDeviceData.esp32DeviceId || ''}
                        onChange={(e) => setUpdatedDeviceData({...updatedDeviceData, esp32DeviceId: parseInt(e.target.value)})}
                        className={`bg-gray-800/50 border ${updatedDeviceData.esp32DeviceId ? 'border-gray-700' : 'border-amber-700'} rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200`}
                        disabled={loadingEsp}
                        required
                      >
                        <option value="" disabled>ESP32 Kontrolcü Seçiniz...</option>
                        {espDevices.length === 0 ? (
                          <option value="" disabled>Aktif ESP32 bulunamadı</option>
                        ) : (
                          espDevices.map(esp => (
                            <option key={esp.id} value={esp.id}>
                              {esp.title || `ESP32 #${esp.id}`} 
                              {esp.token ? " (Online)" : " (Offline)"}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    {espDevices.length === 0 && !loadingEsp && (
                      <div className="mt-2 text-sm bg-amber-900/30 border border-amber-800/50 p-3 rounded-lg text-amber-300">
                        <p className="font-semibold mb-1">ESP32 Kontrolcü Gerekli!</p>
                        <p>
                          Cihaz eklemek için önce bir ESP32 kontrolcü eklemeniz gerekir. Üst menüdeki 
                          <span className="inline-flex items-center mx-1 px-2 py-1 bg-purple-900/30 rounded text-purple-300">
                            <Cpu size={12} className="mr-1" /> ESP32 Controllers
                          </span> 
                          bölümüne gidin ve bir ESP32 kontrolcü ekleyin.
                        </p>
                      </div>
                    )}
                    {espDevices.length > 0 && !updatedDeviceData.esp32DeviceId && (
                      <p className="mt-1 text-xs text-amber-400">
                        Bu cihazı kontrol edecek ESP32 kontrolcüyü seçmelisiniz
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => setShowUpdateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                >
                  İptal
                </button>
                <button 
                  onClick={handleUpdateDevice}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20"
                >
                  Cihazı Güncelle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deviceToUpdate && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-xl overflow-hidden"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Cihazı Sil</h2>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="bg-red-900/20 text-red-300 p-4 rounded-xl border border-red-800/30 mb-6">
                  <p className="text-sm">
                    <strong>Uyarı:</strong> Bu cihazı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Silinecek cihaz:</h3>
                  <div className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-700">
                      {getDeviceIcon(deviceToUpdate.type)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{deviceToUpdate.name}</p>
                      <p className="text-sm text-gray-400">ID: {deviceToUpdate.id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={isDeleting}
                >
                  İptal
                </button>
                <button 
                  onClick={() => handleDeleteDevice(deviceToUpdate.id)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-red-900/20 flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash size={16} className="mr-2" />
                      Cihazı Sil
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeviceDashboard; 