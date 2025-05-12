import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid, Home, Plus, Search, Sun, Moon, Thermometer, Droplets, Power, ChevronRight, Settings } from 'lucide-react';
import { roomService } from '../../api/services';
import { RRoom, RHome } from '../../api/models/content.type';
import DeviceDashboard from './DeviceDashboard';

interface RoomDashboardProps {
  selectedHome: RHome;
  onBackToHomes: () => void;
}

const RoomDashboard = ({ selectedHome, onBackToHomes }: RoomDashboardProps) => {
  const [rooms, setRooms] = useState<RRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', description: '' });
  const [selectedRoom, setSelectedRoom] = useState<RRoom | null>(null);
  const [activeMenuRoom, setActiveMenuRoom] = useState<number | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToUpdate, setRoomToUpdate] = useState<RRoom | null>(null);
  const [updatedRoomData, setUpdatedRoomData] = useState({ name: '', description: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add an effect to handle browser history changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (!pathname.includes('/rooms')) {
        // We've navigated back to the homes page
        onBackToHomes();
      } else if (!pathname.includes('/devices') && selectedRoom) {
        // We've navigated back from devices to rooms
        setSelectedRoom(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBackToHomes, selectedRoom]);

  // Check URL for room ID on load
  useEffect(() => {
    const pathname = window.location.pathname;
    const matches = pathname.match(/\/homes\/\d+\/rooms\/(\d+)\/devices/);
    
    if (matches && matches[1]) {
      const roomId = parseInt(matches[1]);
      const savedRoomData = sessionStorage.getItem('selectedRoomData');
      
      if (savedRoomData) {
        try {
          const parsedRoomData = JSON.parse(savedRoomData);
          setSelectedRoom(parsedRoomData);
        } catch (e) {
          console.error('Failed to parse saved room data', e);
        }
      }
      
      if (selectedHome?.id) {
        fetchRooms().then(() => {
          if (!selectedRoom) {
            const matchingRoom = rooms.find(r => r.id === roomId);
            if (matchingRoom) {
              setSelectedRoom(matchingRoom);
            }
          }
        });
      }
    } else if (selectedHome?.id) {
      fetchRooms();
    }
  }, [selectedHome?.id]);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roomService.getAllRoomsByHomeId(
        selectedHome.id,
        0,
        100
      );
      setRooms(response.content || []);
      
      // Check URL for room ID if we don't have a selected room yet
      const pathname = window.location.pathname;
      const matches = pathname.match(/\/homes\/\d+\/rooms\/(\d+)\/devices/);
      
      if (matches && matches[1] && !selectedRoom) {
        const roomId = parseInt(matches[1]);
        const matchingRoom = response.content?.find(r => r.id === roomId);
        if (matchingRoom) {
          setSelectedRoom(matchingRoom);
        }
      }
      
      return response.content || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
      console.error('Error fetching rooms:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      await roomService.createRoom({
        homeId: selectedHome.id,
        name: newRoomData.name,
        description: newRoomData.description
      });
      setShowCreateModal(false);
      setNewRoomData({ name: '', description: '' });
      fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleViewRoom = (room: RRoom) => {
    // Update URL without reloading page
    window.history.pushState({}, '', `/homes/${selectedHome.id}/rooms/${room.id}/devices`);
    
    // Save selected room data for persistence
    sessionStorage.setItem('selectedRoomData', JSON.stringify(room));
    
    setSelectedRoom(room);
  };

  const handleBackToRooms = () => {
    // Update URL without reloading page
    window.history.pushState({}, '', `/homes/${selectedHome.id}/rooms`);
    
    // Clear saved room data
    sessionStorage.removeItem('selectedRoomData');
    
    setSelectedRoom(null);
  };

  const handleUpdateRoom = async () => {
    if (!roomToUpdate) return;
    
    if (!updatedRoomData.name.trim()) {
      setError('Room name is required');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      const updated = await roomService.updateRoom(roomToUpdate.id, {
        name: updatedRoomData.name,
        description: updatedRoomData.description
      });
      
      // Update local state
      setRooms(prev => 
        prev.map(room => room.id === roomToUpdate.id ? 
          {...room, name: updated.name, description: updated.description} : room
        )
      );
      
      setShowUpdateModal(false);
      setRoomToUpdate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update room');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await roomService.deleteRoom(roomId);
      
      // Remove from local state
      setRooms(prev => prev.filter(room => room.id !== roomId));
      setShowDeleteConfirm(false);
      setActiveMenuRoom(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const openUpdateModal = (room: RRoom) => {
    setRoomToUpdate(room);
    setUpdatedRoomData({ 
      name: room.name, 
      description: room.description || '' 
    });
    setShowUpdateModal(true);
    setActiveMenuRoom(null);
  };

  const openDeleteConfirm = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setRoomToUpdate(room);
      setShowDeleteConfirm(true);
      setActiveMenuRoom(null);
    }
  };

  // If a room is selected, show the device dashboard
  if (selectedRoom) {
    return <DeviceDashboard selectedRoom={selectedRoom} selectedHome={selectedHome} onBackToRooms={handleBackToRooms} />;
  }

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Room type icons mapping
  const getRoomIcon = (name: string) => {
    const roomTypeMappings: Record<string, React.ReactNode> = {
      'living': <Home size={24} className="text-indigo-400" />,
      'bedroom': <Moon size={24} className="text-purple-400" />,
      'kitchen': <Thermometer size={24} className="text-orange-400" />,
      'bathroom': <Droplets size={24} className="text-blue-400" />,
      'office': <Settings size={24} className="text-cyan-400" />,
      'garden': <Sun size={24} className="text-green-400" />,
      'garage': <Power size={24} className="text-red-400" />,
    };

    const lowerName = name.toLowerCase();
    
    for (const [key, icon] of Object.entries(roomTypeMappings)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    
    return <Grid size={24} className="text-gray-400" />;
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

  // Generate a random gradient for each room card
  const getRandomGradient = (id: number) => {
    const gradients = [
      'from-indigo-600 to-blue-700',
      'from-purple-600 to-indigo-700',
      'from-blue-500 to-cyan-600',
      'from-cyan-600 to-teal-700',
      'from-teal-600 to-green-700',
      'from-amber-600 to-orange-700',
      'from-rose-600 to-pink-700',
    ];
    return gradients[id % gradients.length];
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
              onClick={onBackToHomes}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {selectedHome.name}
              </h1>
              <p className="text-gray-400 text-sm">{selectedHome.address}</p>
            </div>
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
          <h2 className="text-2xl font-bold">Rooms</h2>
          
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search rooms..."
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
              <span className="hidden sm:inline font-medium">Add Room</span>
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
            <p className="mt-6 text-gray-400">Loading rooms...</p>
          </motion.div>
        ) : (
          <>
            {/* Empty State */}
            {filteredRooms.length === 0 && !isLoading && (
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
                  <Grid size={40} className="text-blue-400" />
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {searchTerm ? "No matches found" : "No rooms yet"}
                </motion.h3>
                <motion.p 
                  className="text-gray-400 mb-8 max-w-md mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {searchTerm 
                    ? "No rooms match your search criteria. Try different keywords or clear your search."
                    : "You haven't added any rooms to this home yet. Add your first room to start controlling your smart devices."}
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
                    Add Your First Room
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Room Cards Grid */}
            {filteredRooms.length > 0 && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    variants={itemVariants}
                    className="relative bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl border border-gray-800 hover:border-blue-800/60 transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-blue-900/10"
                    whileHover={{ y: -5 }}
                  >
                    {/* Üç nokta menü */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuRoom(activeMenuRoom === room.id ? null : room.id);
                        }}
                        className="w-8 h-8 bg-gray-900/60 hover:bg-gray-800 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                      
                      {/* Açılır menü */}
                      {activeMenuRoom === room.id && (
                        <div className="absolute top-full right-0 mt-1 w-36 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUpdateModal(room);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Düzenle
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteConfirm(room.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-red-900/50 hover:text-red-200 transition-colors flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Sil
                          </button>
                        </div>
                      )}
                    </div>

                    <div 
                      className={`h-40 bg-gradient-to-r ${getRandomGradient(room.id)} flex items-center justify-center relative`}
                      onClick={() => handleViewRoom(room)}
                    >
                      <div className="text-center z-10">
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-3 inline-flex mb-1 shadow-xl">
                          {getRoomIcon(room.name)}
                        </div>
                        <h3 className="font-bold text-white text-lg">{room.name}</h3>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      {room.description && (
                        <p className="text-gray-400 text-sm mb-4">{room.description}</p>
                      )}
                      
                      <button
                        onClick={() => handleViewRoom(room)}
                        className="w-full bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/40 hover:to-blue-600/40 border border-blue-700/30 rounded-xl py-2.5 text-blue-300 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                      >
                        View Devices
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add Room Card */}
                <motion.div 
                  variants={itemVariants}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-8 h-full min-h-[280px] hover:border-blue-600/50 transition-all cursor-pointer backdrop-blur-sm"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-full p-4 mb-4">
                    <Plus size={30} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Add New Room</h3>
                  <p className="text-gray-400 text-center max-w-xs">Add a new room to manage your smart devices</p>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Create Room Modal */}
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
                <h2 className="text-2xl font-bold mb-6">Add New Room</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-1">
                      Room Name
                    </label>
                    <input
                      id="roomName"
                      type="text"
                      value={newRoomData.name}
                      onChange={(e) => setNewRoomData({...newRoomData, name: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="Living Room"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="roomDescription"
                      value={newRoomData.description}
                      onChange={(e) => setNewRoomData({...newRoomData, description: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full h-24 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200 resize-none"
                      placeholder="Main living area with TV and sofa..."
                    />
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
                  onClick={handleCreateRoom}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20"
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Room Modal */}
      <AnimatePresence>
        {showUpdateModal && (
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
                <h2 className="text-2xl font-bold mb-6">Update Room</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="updateRoomName" className="block text-sm font-medium text-gray-300 mb-1">
                      Room Name
                    </label>
                    <input
                      id="updateRoomName"
                      type="text"
                      value={updatedRoomData.name}
                      onChange={(e) => setUpdatedRoomData({...updatedRoomData, name: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="Living Room"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="updateRoomDescription" className="block text-sm font-medium text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="updateRoomDescription"
                      value={updatedRoomData.description}
                      onChange={(e) => setUpdatedRoomData({...updatedRoomData, description: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200 min-h-[100px]"
                      placeholder="A cozy space for the family"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowUpdateModal(false);
                    setRoomToUpdate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateRoom}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Room"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && roomToUpdate && (
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
                <div className="flex items-center justify-center mb-4 text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-center">Delete Room</h2>
                <p className="text-gray-300 mb-6 text-center">
                  Are you sure you want to delete <span className="font-semibold text-white">{roomToUpdate.name}</span>? This action cannot be undone.
                </p>
                <p className="text-red-300 mb-6 text-center text-sm bg-red-900/20 p-3 rounded-xl">
                  All devices in this room will also be deleted.
                </p>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRoomToUpdate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteRoom(roomToUpdate.id)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-red-900/20 flex items-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Room"
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

export default RoomDashboard; 