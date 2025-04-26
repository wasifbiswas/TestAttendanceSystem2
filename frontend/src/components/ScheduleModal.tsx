import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock schedule data for demo
const mockScheduleData = [
  { day: 'Monday', hours: '9:00 AM - 5:00 PM', status: 'Regular' },
  { day: 'Tuesday', hours: '9:00 AM - 5:00 PM', status: 'Regular' },
  { day: 'Wednesday', hours: '9:00 AM - 5:00 PM', status: 'Regular' },
  { day: 'Thursday', hours: '9:00 AM - 5:00 PM', status: 'Regular' },
  { day: 'Friday', hours: '9:00 AM - 5:00 PM', status: 'Regular' },
  { day: 'Saturday', hours: 'Off', status: 'Weekend' },
  { day: 'Sunday', hours: 'Off', status: 'Weekend' },
];

const ScheduleModal = ({ isOpen, onClose }: ScheduleModalProps) => {
  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Work Schedule</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none"
                aria-label="Close schedule"
                title="Close schedule"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Current Week</h4>
              </div>
              
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                      <div className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Day</div>
                      <div className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</div>
                      <div className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {mockScheduleData.map((day, index) => (
                      <div key={day.day} className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                        <div className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {day.day}
                        </div>
                        <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {day.hours}
                        </div>
                        <div className="px-4 py-3 whitespace-nowrap text-sm">
                          {day.status === 'Regular' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200">
                              {day.status}
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {day.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Please contact HR for schedule changes or special arrangements.</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleModal; 