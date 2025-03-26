import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import DeviceWidget from './DeviceWidget';
import AddWidgetModal from './AddWidgetModal';
import { RDevice } from '../../api/models/content.type';

// Widget bilgisini temsil eden tür
interface WidgetInfo {
  deviceId: number;
  device: RDevice;
  roomName: string;
  homeName: string;
}

const WidgetContainer = () => {
  const [widgets, setWidgets] = useState<WidgetInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // LocalStorage'dan widget'ları yükle
  useEffect(() => {
    const loadWidgets = () => {
      setIsLoading(true);
      try {
        const savedWidgets = localStorage.getItem('dashboard_widgets');
        if (savedWidgets) {
          setWidgets(JSON.parse(savedWidgets));
        }
      } catch (err) {
        console.error('Widget yüklenirken hata oluştu:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWidgets();
  }, []);

  // Widget'lar değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
    }
  }, [widgets, isLoading]);

  // Widget ekle
  const handleAddWidget = (device: RDevice, roomName: string, homeName: string) => {
    // Aynı cihazı tekrar eklememek için kontrol et
    const isDuplicate = widgets.some(widget => widget.deviceId === device.id);
    
    if (!isDuplicate) {
      const newWidget: WidgetInfo = {
        deviceId: device.id,
        device,
        roomName,
        homeName
      };
      
      setWidgets(prev => [...prev, newWidget]);
    }
    
    setShowAddModal(false);
  };

  // Widget kaldır
  const handleRemoveWidget = (deviceId: number) => {
    setWidgets(prev => prev.filter(widget => widget.deviceId !== deviceId));
  };

  // Widget'ı yenile
  const handleRefreshWidgets = () => {
    // Widget listesini güncelleme tetikleyicisi - state değişikliği yaptığımız için
    // DeviceWidget bileşenlerinin her biri kendi durumunu günceller
    setWidgets(prev => [...prev]);
  };

  return (
    <div className="w-full">
      {/* Widget ekle modalı */}
      <AnimatePresence>
        {showAddModal && (
          <AddWidgetModal 
            onClose={() => setShowAddModal(false)} 
            onAddWidget={handleAddWidget} 
          />
        )}
      </AnimatePresence>

      {/* Widget'lar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Widget'lar
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} />
            Widget Ekle
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40 bg-gray-900/40 rounded-xl border border-gray-800 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Widget'lar Yükleniyor...</span>
          </div>
        ) : widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 bg-gray-900/40 rounded-xl border border-gray-800 backdrop-blur-sm text-center p-5">
            <div className="text-gray-400 mb-3">
              Henüz widget eklenmemiş
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <PlusCircle size={16} />
              İlk Widget'ını Ekle
            </button>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {widgets.map((widget) => (
              <DeviceWidget 
                key={widget.deviceId}
                device={widget.device}
                roomName={widget.roomName}
                homeName={widget.homeName}
                onRemove={() => handleRemoveWidget(widget.deviceId)}
                onRefresh={handleRefreshWidgets}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WidgetContainer; 