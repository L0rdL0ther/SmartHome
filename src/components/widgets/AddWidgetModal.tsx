import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Search, ChevronRight } from 'lucide-react';
import { homeService, roomService, deviceService } from '../../api/services';
import { RHome, RRoom, RDevice } from '../../api/models/content.type';

interface AddWidgetModalProps {
  onClose: () => void;
  onAddWidget: (device: RDevice, roomName: string, homeName: string) => void;
}

const AddWidgetModal = ({ onClose, onAddWidget }: AddWidgetModalProps) => {
  // State for selection
  const [homes, setHomes] = useState<RHome[]>([]);
  const [rooms, setRooms] = useState<RRoom[]>([]);
  const [devices, setDevices] = useState<RDevice[]>([]);
  
  // Selection tracking
  const [selectedHome, setSelectedHome] = useState<RHome | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RRoom | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<RDevice | null>(null);
  
  // Step tracking (1: Select Home, 2: Select Room, 3: Select Device)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch homes on initial load
  useEffect(() => {
    fetchHomes();
  }, []);

  // Fetch rooms when home is selected
  useEffect(() => {
    if (selectedHome && currentStep === 2) {
      fetchRooms(selectedHome.id);
    }
  }, [selectedHome, currentStep]);

  // Fetch devices when room is selected
  useEffect(() => {
    if (selectedRoom && currentStep === 3) {
      fetchDevices(selectedRoom.id);
    }
  }, [selectedRoom, currentStep]);

  const fetchHomes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await homeService.getAllHomes();
      setHomes(response.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load homes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async (homeId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roomService.getAllRoomsByHomeId(homeId, 0, 100);
      setRooms(response.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevices = async (roomId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await deviceService.getDevicesByRoomId(roomId, 0, 100);
      setDevices(response.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHomeSelect = (home: RHome) => {
    setSelectedHome(home);
    setSelectedRoom(null);
    setSelectedDevice(null);
    setCurrentStep(2);
  };

  const handleRoomSelect = (room: RRoom) => {
    setSelectedRoom(room);
    setSelectedDevice(null);
    setCurrentStep(3);
  };

  const handleDeviceSelect = (device: RDevice) => {
    setSelectedDevice(device);
  };

  const handleAddWidget = () => {
    if (selectedDevice && selectedRoom && selectedHome) {
      onAddWidget(selectedDevice, selectedRoom.name, selectedHome.name);
    }
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      setSelectedDevice(null);
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedRoom(null);
    } else {
      onClose();
    }
  };

  // Filter items based on search term
  const filteredHomes = homes.filter(home => 
    home.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render the appropriate content based on current step
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-10">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Yükleniyor...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 p-4 rounded-xl m-4">
          {error}
          <button 
            onClick={() => {
              setError(null);
              if (currentStep === 1) fetchHomes();
              else if (currentStep === 2 && selectedHome) fetchRooms(selectedHome.id);
              else if (currentStep === 3 && selectedRoom) fetchDevices(selectedRoom.id);
            }}
            className="bg-red-700 hover:bg-red-600 text-white rounded-lg px-3 py-1 ml-4 text-sm"
          >
            Yeniden Dene
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Ev Seçin</h3>
            {filteredHomes.length === 0 ? (
              <div className="text-center p-6 text-gray-400">
                {searchTerm ? 'Aramanızla eşleşen ev bulunamadı.' : 'Henüz ev eklenmemiş.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredHomes.map(home => (
                  <button
                    key={home.id}
                    onClick={() => handleHomeSelect(home)}
                    className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-medium text-white">{home.name}</h4>
                      <p className="text-sm text-gray-400">{home.address}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Oda Seçin</h3>
            {filteredRooms.length === 0 ? (
              <div className="text-center p-6 text-gray-400">
                {searchTerm ? 'Aramanızla eşleşen oda bulunamadı.' : 'Bu evde henüz oda eklenmemiş.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-medium text-white">{room.name}</h4>
                      {room.description && <p className="text-sm text-gray-400">{room.description}</p>}
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Cihaz Seçin</h3>
            {filteredDevices.length === 0 ? (
              <div className="text-center p-6 text-gray-400">
                {searchTerm ? 'Aramanızla eşleşen cihaz bulunamadı.' : 'Bu odada henüz cihaz eklenmemiş.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDevices.map(device => (
                  <button
                    key={device.id}
                    onClick={() => handleDeviceSelect(device)}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      selectedDevice?.id === device.id 
                        ? 'bg-blue-900/40 border border-blue-700' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-left">
                      <h4 className="font-medium text-white">{device.name}</h4>
                      <p className="text-sm text-gray-400">{device.type}</p>
                    </div>
                    {selectedDevice?.id === device.id && (
                      <div className="rounded-full bg-blue-500 p-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Breadcrumb navigation
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center text-sm text-gray-400 px-4 pt-2">
        <button 
          onClick={() => setCurrentStep(1)}
          className={`${currentStep >= 1 ? 'text-blue-400' : 'text-gray-500'}`}
        >
          Ev
        </button>
        
        <span className="mx-2">/</span>
        
        <button 
          onClick={() => currentStep > 1 && setCurrentStep(2)}
          className={`${currentStep >= 2 ? 'text-blue-400' : 'text-gray-500'}`}
          disabled={currentStep < 2}
        >
          {selectedHome ? selectedHome.name : 'Oda'}
        </button>
        
        {currentStep >= 3 && (
          <>
            <span className="mx-2">/</span>
            <button 
              onClick={() => setCurrentStep(3)}
              className="text-blue-400"
            >
              {selectedRoom ? selectedRoom.name : 'Cihaz'}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-xl overflow-hidden"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Widget Ekle</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Breadcrumbs */}
        {renderBreadcrumbs()}
        
        {/* Search Bar */}
        <div className="p-4 pb-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={`Ara...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200 text-sm"
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            {currentStep === 1 ? 'İptal' : 'Geri'}
          </button>
          
          {currentStep === 3 && (
            <button
              onClick={handleAddWidget}
              disabled={!selectedDevice}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                selectedDevice
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus size={16} />
              Widget Ekle
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddWidgetModal; 