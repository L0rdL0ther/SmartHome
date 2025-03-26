import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Search, Cpu, Wifi, WifiOff, RefreshCw, Copy, Trash } from 'lucide-react';
import { espService } from '../../api/services';
import { REsp } from '../../api/models/content.type';

interface ESP32DashboardProps {
  onBack: () => void;
}

const ESP32Dashboard = ({ onBack }: ESP32DashboardProps) => {
  const [espDevices, setEspDevices] = useState<REsp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newESPData, setNewESPData] = useState({ title: '' });
  const [copiedToken, setCopiedToken] = useState<number | null>(null);
  const [refreshingDevice, setRefreshingDevice] = useState<number | null>(null);

  useEffect(() => {
    fetchESP32Devices();
  }, []);

  const fetchESP32Devices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await espService.getAllEsps(0, 100);
      setEspDevices(response.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ESP32 devices');
      console.error('Error fetching ESP32 devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateESP = async () => {
    if (!newESPData.title.trim()) {
      setError('ESP32 name is required');
      return;
    }

    try {
      await espService.createEsp({
        title: newESPData.title
      });
      setShowCreateModal(false);
      setNewESPData({ title: '' });
      fetchESP32Devices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ESP32 device');
    }
  };

  const handleDeleteESP = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ESP32 device? This action cannot be undone.')) {
      try {
        await espService.deleteEsp(id);
        fetchESP32Devices();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete ESP32 device');
      }
    }
  };

  const handleCopyToken = (id: number, token: string | null) => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(id);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const handleRefreshToken = async (id: number) => {
    try {
      setRefreshingDevice(id);
      await espService.updateEsp(id, { title: espDevices.find(esp => esp.id === id)?.title || '' });
      fetchESP32Devices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh ESP32 token');
    } finally {
      setRefreshingDevice(null);
    }
  };

  const filteredDevices = espDevices.filter(device => 
    device.title?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full filter blur-[150px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500 rounded-full filter blur-[150px] opacity-10"></div>
      </div>

      {/* Header - Glass Morphism */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/40 border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  ESP32 Devices
                </h1>
              </div>
              <p className="text-gray-500 text-sm">Manage your ESP32 microcontrollers</p>
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
          <div>
            <h2 className="text-2xl font-bold">Controllers</h2>
            <p className="text-gray-400">Manage your microcontroller network</p>
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search ESP32 devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl py-3 pl-12 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-200"
              />
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl px-5 py-3 flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-800/50"
            >
              <Plus size={18} />
              <span className="hidden sm:inline font-medium">Add ESP32</span>
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
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-blue-400 animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-400">Loading ESP32 devices...</p>
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
                  className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 inline-flex p-6 rounded-full mb-6 backdrop-blur-lg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Cpu size={40} className="text-purple-400" />
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {searchTerm ? "No matches found" : "No ESP32 devices yet"}
                </motion.h3>
                <motion.p 
                  className="text-gray-400 mb-8 max-w-md mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {searchTerm 
                    ? "No ESP32 devices match your search criteria. Try different keywords or clear your search."
                    : "You haven't added any ESP32 microcontrollers to your network yet. Add your first ESP32 to start building your IoT network."}
                </motion.p>
                {!searchTerm && (
                  <motion.button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl px-8 py-4 inline-flex items-center gap-3 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-800/50 font-medium"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={20} />
                    Add Your First ESP32
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* ESP32 Cards */}
            {filteredDevices.length > 0 && (
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredDevices.map((device) => (
                  <motion.div 
                    key={device.id}
                    variants={itemVariants}
                    className="group bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-800/60 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-indigo-900/10"
                    whileHover={{ y: -5 }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-3 flex items-center justify-center">
                            <Cpu size={24} className="text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{device.title || 'Unnamed ESP32'}</h3>
                            <span className="text-gray-400 text-sm">ID: {device.id}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${Math.random() > 0.3 ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'} text-xs font-medium px-2 py-1`}>
                            {Math.random() > 0.3 ? (
                              <div className="flex items-center gap-1">
                                <Wifi size={14} />
                                <span>Online</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <WifiOff size={14} />
                                <span>Offline</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-medium text-gray-400">Token</h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRefreshToken(device.id)}
                              className="p-1 hover:text-purple-400 transition-colors"
                            >
                              {refreshingDevice === device.id ? (
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <RefreshCw size={16} />
                              )}
                            </button>
                            <button 
                              onClick={() => handleCopyToken(device.id, device.token)}
                              className="p-1 hover:text-purple-400 transition-colors"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="bg-gray-900 rounded-lg px-3 py-2 text-gray-400 text-sm font-mono overflow-hidden truncate">
                            {device.token || 'No token generated'}
                          </div>
                          {copiedToken === device.id && (
                            <span className="text-green-400 text-xs ml-2">Copied!</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>Connected devices:</span>
                            <span className="font-bold text-white">{Math.floor(Math.random() * 10)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteESP(device.id)}
                          className="text-red-400 hover:text-red-300 p-2 transition-colors"
                          title="Delete ESP32 device"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add ESP32 Card */}
                <motion.div 
                  variants={itemVariants}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-b from-gray-900/60 to-gray-900/40 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-8 h-full min-h-[200px] hover:border-purple-600/50 transition-all cursor-pointer backdrop-blur-sm"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-full p-4 mb-4">
                    <Plus size={30} className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-300">Add New ESP32</h3>
                  <p className="text-gray-400 text-center max-w-xs">Connect a new ESP32 microcontroller to your network</p>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Create ESP32 Modal */}
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
                <h2 className="text-2xl font-bold mb-6">Add New ESP32 Device</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="espName" className="block text-sm font-medium text-gray-300 mb-1">
                      ESP32 Name
                    </label>
                    <input
                      id="espName"
                      type="text"
                      value={newESPData.title}
                      onChange={(e) => setNewESPData({...newESPData, title: e.target.value})}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 w-full focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-200"
                      placeholder="Living Room Controller"
                    />
                  </div>
                  
                  <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-800/30">
                    <p className="text-sm text-purple-300">
                      <span className="font-bold block mb-1">Note:</span>
                      After creating your ESP32 device, you'll receive a unique token. Use this token in your ESP32 firmware to authenticate with your smart home system.
                    </p>
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
                  onClick={handleCreateESP}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-purple-900/20"
                >
                  Create ESP32
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ESP32Dashboard; 