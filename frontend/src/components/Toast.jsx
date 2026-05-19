import useUIStore from '../store/uiStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle :
                     toast.type === 'error' ? AlertCircle : Info;

        const bgColor = toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                        toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                        'bg-blue-50 text-blue-800 border-blue-200';
                        
        const iconColor = toast.type === 'success' ? 'text-green-500' :
                          toast.type === 'error' ? 'text-red-500' : 'text-blue-500';

        return (
          <div 
            key={toast.id}
            className={`flex items-center p-4 rounded-xl shadow-lg border backdrop-blur-md ${bgColor} transform transition-all duration-300 translate-y-0`}
          >
            <Icon className={`w-5 h-5 mr-3 ${iconColor}`} />
            <p className="flex-1 font-medium">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
