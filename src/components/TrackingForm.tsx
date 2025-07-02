import React, { useState } from 'react';
import { Search, Package, Truck } from 'lucide-react';

interface TrackingFormProps {
  onSearch: (code: string) => void;
  loading?: boolean;
}

const TrackingForm: React.FC<TrackingFormProps> = ({ onSearch, loading = false }) => {
  const [trackingCode, setTrackingCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      onSearch(trackingCode.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-lg w-full mx-auto border border-gray-100">
      <div className="text-center mb-6 sm:mb-8">
        <div className="relative inline-block mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-3 sm:p-4 shadow-lg">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-orange-100 rounded-full p-1.5 sm:p-2">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Rastrear Encomenda</h2>
        <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-2">Digite o código de rastreamento para acompanhar sua entrega em tempo real</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label htmlFor="tracking-code" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
            Código de Rastreamento
          </label>
          <div className="relative">
            <input
              type="text"
              id="tracking-code"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="BR123456789AB"
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all duration-300 bg-gray-50 hover:bg-white"
              disabled={loading}
            />
            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!trackingCode.trim() || loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
              <span>Rastreando...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Rastrear Encomenda</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Rastreamento em tempo real</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Seguro e confiável</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingForm;