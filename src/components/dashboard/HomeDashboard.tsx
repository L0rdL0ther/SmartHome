import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plus, LogOut, Search, Settings, Menu, X, ChevronRight, Cpu } from 'lucide-react';
import { homeService, roomService } from '../../api/services';
import { RHome } from '../../api/models/content.type';
import RoomDashboard from './RoomDashboard';
import ESP32Dashboard from './ESP32Dashboard';
import WidgetContainer from '../widgets/WidgetContainer';

// Add interface for home stats
interface HomeStats {
  [homeId: number]: {
    roomCount: number;
    deviceCount?: number;
    isLoading: boolean;
  }
}

interface HomeDashboardProps {
  onLogout: () => void;
}

const HomeDashboard = ({ onLogout }: HomeDashboardProps) => {
  const [homes, setHomes] = useState<RHome[]>([]);
  const [homeStats, setHomeStats] = useState<HomeStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoverCard, setHoverCard] = useState<number | null>(null);
  const [selectedHome, setSelectedHome] = useState<RHome | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHomeData, setNewHomeData] = useState({ name: '', address: '' });
  const [showESP32Dashboard, setShowESP32Dashboard] = useState(false);
  const [activeMenuHome, setActiveMenuHome] = useState<number | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [homeToUpdate, setHomeToUpdate] = useState<RHome | null>(null);
  const [updatedHomeData, setUpdatedHomeData] = useState({ name: '', address: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Parse URL path on initial load
  useEffect(() => {
    const pathname = window.location.pathname;
    
    if (pathname.includes('/esp32')) {
      setShowESP32Dashboard(true);
    } else if (pathname.match(/\/homes\/(\d+)\/rooms/)) {
      const matches = pathname.match(/\/homes\/(\d+)\/rooms/);
      if (matches && matches[1]) {
        const savedHomeId = parseInt(matches[1]);
        const savedHomeData = sessionStorage.getItem('selectedHomeData');
        
        if (savedHomeData) {
          try {
            const parsedHomeData = JSON.parse(savedHomeData);
            setSelectedHome(parsedHomeData);
          } catch (e) {
            console.error('Failed to parse saved home data', e);
            // Will load from API in fetchHomes
          }
        } else if (savedHomeId) {
          fetchHomes().then(() => {
            const matchingHome = homes.find(h => h.id === savedHomeId);
            if (matchingHome) {
              setSelectedHome(matchingHome);
            }
          });
        }
      }
    } else {
      fetchHomes();
    }
  }, []);

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (pathname.includes('/esp32')) {
        setShowESP32Dashboard(true);
        setSelectedHome(null);
      } else if (pathname.match(/\/homes\/(\d+)\/rooms/)) {
        setShowESP32Dashboard(false);
        // Home and room handling logic is already in place
      } else {
        setShowESP32Dashboard(false);
        setSelectedHome(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch room counts for all homes
  useEffect(() => {
    if (homes.length > 0) {
      fetchHomeStats();
    }
  }, [homes]);

  const fetchHomeStats = async () => {
    // Initialize stats for all homes
    const initialStats: HomeStats = {};
    homes.forEach(home => {
      initialStats[home.id] = { roomCount: 0, deviceCount: 0, isLoading: true };
    });
    setHomeStats(initialStats);

    // Fetch room counts for each home
    for (const home of homes) {
      try {
        const roomsResponse = await roomService.getAllRoomsByHomeId(home.id, 0, 100);
        const roomCount = roomsResponse.content?.length || 0;
        
        // Update stats for this home
        setHomeStats(prevStats => ({
          ...prevStats,
          [home.id]: {
            ...prevStats[home.id],
            roomCount,
            isLoading: false
          }
        }));
      } catch (err) {
        console.error(`Error fetching rooms for home ${home.id}:`, err);
        setHomeStats(prevStats => ({
          ...prevStats,
          [home.id]: {
            ...prevStats[home.id],
            roomCount: 0,
            isLoading: false
          }
        }));
      }
    }
  };

  const fetchHomes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await homeService.getAllHomes();
      setHomes(response.content || []);
      
      // If we have a home ID from URL but no data yet
      const pathname = window.location.pathname;
      const matches = pathname.match(/\/homes\/(\d+)\/rooms/);
      
      if (matches && matches[1] && !selectedHome) {
        const homeId = parseInt(matches[1]);
        const matchingHome = response.content?.find(h => h.id === homeId);
        if (matchingHome) {
          setSelectedHome(matchingHome);
        }
      }
      
      return response.content || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load homes');
      console.error('Error fetching homes:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHome = (home: RHome) => {
    // Update URL without reloading page
    window.history.pushState({}, '', `/homes/${home.id}/rooms`);
    
    // Save selected home data for persistence
    sessionStorage.setItem('selectedHomeData', JSON.stringify(home));
    
    setSelectedHome(home);
  };

  const handleBackToHomes = () => {
    // Update URL without reloading page
    window.history.pushState({}, '', '/');
    
    // Clear saved home data
    sessionStorage.removeItem('selectedHomeData');
    
    setSelectedHome(null);
  };

  const handleCreateHome = async () => {
    if (!newHomeData.name.trim() || !newHomeData.address.trim()) {
      setError('Home name and address are required');
      return;
    }

    try {
      await homeService.createHome({
        name: newHomeData.name,
        address: newHomeData.address
      });
      setShowCreateModal(false);
      setNewHomeData({ name: '', address: '' });
      fetchHomes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create home');
    }
  };

  const handleViewESP32Dashboard = () => {
    // Update URL without reloading page
    window.history.pushState({}, '', '/esp32');
    setShowESP32Dashboard(true);
  };

  const handleBackFromESP32 = () => {
    // Update URL without reloading page
    window.history.pushState({}, '', '/');
    setShowESP32Dashboard(false);
  };

  const handleUpdateHome = async () => {
    if (!homeToUpdate) return;
    
    if (!updatedHomeData.name.trim() || !updatedHomeData.address.trim()) {
      setError('Home name and address are required');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      const updated = await homeService.updateHome(homeToUpdate.id, {
        name: updatedHomeData.name,
        address: updatedHomeData.address
      });
      
      // Update local state
      setHomes(prev => 
        prev.map(home => home.id === homeToUpdate.id ? 
          {...home, name: updated.name, address: updated.address} : home
        )
      );
      
      setShowUpdateModal(false);
      setHomeToUpdate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update home');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteHome = async (homeId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await homeService.deleteHome(homeId);
      
      // Remove from local state
      setHomes(prev => prev.filter(home => home.id !== homeId));
      setShowDeleteConfirm(false);
      setActiveMenuHome(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete home');
    } finally {
      setIsDeleting(false);
    }
  };

  const openUpdateModal = (home: RHome) => {
    setHomeToUpdate(home);
    setUpdatedHomeData({ name: home.name, address: home.address });
    setShowUpdateModal(true);
    setActiveMenuHome(null);
  };

  const openDeleteConfirm = (homeId: number) => {
    const home = homes.find(h => h.id === homeId);
    if (home) {
      setHomeToUpdate(home);
      setShowDeleteConfirm(true);
      setActiveMenuHome(null);
    }
  };

  // If ESP32 Dashboard is selected, show it
  if (showESP32Dashboard) {
    return <ESP32Dashboard onBack={handleBackFromESP32} />;
  }

  // If a home is selected, show the room dashboard
  if (selectedHome) {
    return <RoomDashboard selectedHome={selectedHome} onBackToHomes={handleBackToHomes} />;
  }

  const filteredHomes = homes.filter(home => 
    home.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    home.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Generate a random gradient for each home card
  const getRandomGradient = (id: number) => {
    const gradients = [
      'from-violet-600 to-indigo-700',
      'from-blue-600 to-cyan-500',
      'from-green-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-pink-600 to-rose-600',
      'from-red-600 to-orange-600',
      'from-purple-600 to-indigo-600'
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
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/40 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors mr-4"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Smart Home</h1>
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={handleViewESP32Dashboard}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 transition-colors mr-3"
              >
                <Cpu size={18} />
                <span className="hidden md:inline">ESP32 Controllers</span>
              </button>
              
              <button 
                onClick={onLogout}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="lg:hidden fixed inset-0 z-30 bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleViewESP32Dashboard();
                  }}
                  className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl"
                >
                  <Cpu size={24} className="text-purple-400" />
                  <span className="text-lg font-medium">ESP32 Controllers</span>
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl"
                >
                  <Settings size={24} className="text-gray-400" />
                  <span className="text-lg font-medium">Settings</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-3 p-4 bg-red-900/30 text-red-200 rounded-xl"
                >
                  <LogOut size={24} />
                  <span className="text-lg font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Widget Container */}
        <WidgetContainer />
        
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Your Homes</h2>
            <p className="text-gray-500">{homes.length} home{homes.length !== 1 && 's'}</p>
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search homes..."
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
              <span className="hidden sm:inline font-medium">Add Home</span>
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
            <p className="mt-6 text-gray-400">Loading your homes...</p>
          </motion.div>
        ) : (
          <>
            {/* Empty State */}
            {filteredHomes.length === 0 && !isLoading && (
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
                  <Home size={40} className="text-blue-400" />
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {searchTerm ? "No matches found" : "No homes yet"}
                </motion.h3>
                <motion.p 
                  className="text-gray-400 mb-8 max-w-md mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {searchTerm 
                    ? "No homes match your search criteria. Try different keywords or clear your search."
                    : "You haven't added any smart homes to your network yet. Add your first home to start automating your life."}
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
                    Add Your First Home
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Home Cards Grid */}
            {filteredHomes.length > 0 && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredHomes.map((home) => (
                  <motion.div 
                    key={home.id}
                    variants={itemVariants}
                    className="group relative bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-800/60 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-blue-900/10"
                    onMouseEnter={() => setHoverCard(home.id)}
                    onMouseLeave={() => setHoverCard(null)}
                    whileHover={{ y: -5 }}
                  >
                    {/* Üç nokta menü */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuHome(activeMenuHome === home.id ? null : home.id);
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
                      {activeMenuHome === home.id && (
                        <div className="absolute top-full right-0 mt-1 w-36 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUpdateModal(home);
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
                              openDeleteConfirm(home.id);
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
                      className={`h-48 bg-gradient-to-r ${getRandomGradient(home.id)} flex items-center justify-center relative overflow-hidden`}
                      onClick={() => handleViewHome(home)}
                    >
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80')] bg-cover opacity-30 mix-blend-overlay"></div>
                      
                      {/* Animated circles when hovered */}
                      <motion.div 
                        className="absolute w-40 h-40 rounded-full bg-white/5"
                        animate={{
                          scale: hoverCard === home.id ? [1, 1.2, 1.1] : 1,
                          opacity: hoverCard === home.id ? [0.1, 0.3, 0.1] : 0.1,
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      />
                      <motion.div 
                        className="absolute w-60 h-60 rounded-full bg-white/5"
                        animate={{
                          scale: hoverCard === home.id ? [1, 1.2, 1.1] : 1,
                          opacity: hoverCard === home.id ? [0.05, 0.15, 0.05] : 0.05,
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
                      />
                      
                      <div className="relative z-10 text-center">
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-4 inline-flex mb-2">
                          <Home size={36} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">{home.name}</h3>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-400">Location</h4>
                          <p className="text-white font-medium mt-1">{home.address}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-900/30 backdrop-blur-sm px-3 py-1 rounded-full">
                          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-green-400 text-xs font-medium">Online</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-white">
                            {homeStats[home.id]?.isLoading 
                              ? <span className="inline-block w-4 h-4 bg-gray-600 rounded-full animate-pulse"></span>
                              : homeStats[home.id]?.roomCount || 0}
                          </p>
                          <p className="text-xs text-gray-400">Rooms</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-white">
                            {homeStats[home.id]?.deviceCount || 0}
                          </p>
                          <p className="text-xs text-gray-400">Devices</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-cyan-400">24°</p>
                          <p className="text-xs text-gray-400">Temp</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleViewHome(home)}
                        className="w-full bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/40 hover:to-blue-600/40 border border-blue-700/30 rounded-xl py-3 text-blue-300 font-medium flex items-center justify-center gap-2 transition-all group-hover:border-blue-600/50"
                      >
                        View Details
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                    
                    {/* Glow effect on hover */}
                    <motion.div 
                      className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{
                        boxShadow: hoverCard === home.id ? 
                          "0 0 40px 5px rgba(59, 130, 246, 0.3)" : 
                          "0 0 0 0 rgba(59, 130, 246, 0)"
                      }}
                    />
                  </motion.div>
                ))}
                
                {/* Add Home Card */}
                <motion.div 
                  variants={itemVariants}
                  onClick={() => setShowCreateModal(true)}
                  className="relative bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-10 h-full min-h-[400px] hover:border-blue-600/50 transition-all cursor-pointer backdrop-blur-sm"
                  whileHover={{ y: -5, boxShadow: "0 15px 30px -10px rgba(59, 130, 246, 0.2)" }}
                >
                  <motion.div 
                    className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-full p-6 mb-6"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Plus size={36} className="text-blue-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Add New Home</h3>
                  <p className="text-gray-400 text-center max-w-xs">Connect a new smart home to your dashboard and start controlling your devices</p>
                  
                  {/* Animated circles */}
                  <div className="absolute w-full h-full overflow-hidden rounded-2xl -z-10">
                    <motion.div 
                      className="absolute w-40 h-40 rounded-full bg-blue-600/5"
                      animate={{
                        y: [0, 50, 0],
                        x: [0, 30, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                    />
                    <motion.div 
                      className="absolute right-10 bottom-10 w-60 h-60 rounded-full bg-indigo-600/5"
                      animate={{
                        y: [0, -30, 0],
                        x: [0, -20, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Create Home Modal */}
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
                <h2 className="text-2xl font-bold mb-6">Add New Home</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="homeName" className="block text-sm font-medium text-gray-300 mb-1">
                      Home Name
                    </label>
                    <input
                      id="homeName"
                      type="text"
                      value={newHomeData.name}
                      onChange={(e) => setNewHomeData({...newHomeData, name: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="My House"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="homeAddress" className="block text-sm font-medium text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      id="homeAddress"
                      type="text"
                      value={newHomeData.address}
                      onChange={(e) => setNewHomeData({...newHomeData, address: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="123 Main Street, City"
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
                  onClick={handleCreateHome}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20"
                >
                  Create Home
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Home Modal */}
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
                <h2 className="text-2xl font-bold mb-6">Update Home</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="updateHomeName" className="block text-sm font-medium text-gray-300 mb-1">
                      Home Name
                    </label>
                    <input
                      id="updateHomeName"
                      type="text"
                      value={updatedHomeData.name}
                      onChange={(e) => setUpdatedHomeData({...updatedHomeData, name: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="My House"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="updateHomeAddress" className="block text-sm font-medium text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      id="updateHomeAddress"
                      type="text"
                      value={updatedHomeData.address}
                      onChange={(e) => setUpdatedHomeData({...updatedHomeData, address: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
                      placeholder="123 Main Street, City"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowUpdateModal(false);
                    setHomeToUpdate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateHome}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Home"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && homeToUpdate && (
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
                <h2 className="text-2xl font-bold mb-4 text-center">Delete Home</h2>
                <p className="text-gray-300 mb-6 text-center">
                  Are you sure you want to delete <span className="font-semibold text-white">{homeToUpdate.name}</span>? This action cannot be undone.
                </p>
                <p className="text-red-300 mb-6 text-center text-sm bg-red-900/20 p-3 rounded-xl">
                  All rooms and devices in this home will also be deleted.
                </p>
              </div>
              
              <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setHomeToUpdate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteHome(homeToUpdate.id)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-red-900/20 flex items-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Home"
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

export default HomeDashboard; 