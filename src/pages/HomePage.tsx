import React, { useState } from 'react';
import Header from '../components/Header';
import TrackingForm from '../components/TrackingForm';
import TrackingResult from '../components/TrackingResult';
import { TrackingCode } from '../utils/api';
import { findTrackingCode } from '../utils/api';
import { AlertCircle, Package, Truck, Shield, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (code: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await findTrackingCode(code);
      if (result) {
        setTrackingData(result);
      } else {
        setError('Código de rastreamento não encontrado. Verifique o código e tente novamente.');
      }
    } catch (err) {
      setError('Erro ao buscar código de rastreamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setTrackingData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          {!trackingData ? (
            <div className="text-center w-full">
              {/* Hero Section */}
              <div className="mb-8 sm:mb-12">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-4 sm:p-6 shadow-2xl">
                      <Package className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-white" />
                    </div>
                    <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-orange-100 rounded-full p-1.5 sm:p-2 animate-bounce">
                      <Truck className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600" />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
                  Rastreamento de
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                    Encomendas
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                  Acompanhe sua entrega em tempo real com nossa plataforma segura e confiável
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="bg-blue-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Tempo Real</h3>
                  <p className="text-sm sm:text-base text-gray-600">Atualizações instantâneas do status da sua encomenda</p>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="bg-green-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Seguro</h3>
                  <p className="text-sm sm:text-base text-gray-600">Seus dados protegidos com criptografia avançada</p>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                  <div className="bg-purple-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Confiável</h3>
                  <p className="text-sm sm:text-base text-gray-600">Rastreamento preciso em todo território nacional</p>
                </div>
              </div>
              
              <div className="px-4">
                <TrackingForm onSearch={handleSearch} loading={loading} />
              </div>
              
              {error && (
                <div className="mt-6 sm:mt-8 mx-4">
                  <div className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-red-700 max-w-lg mx-auto shadow-lg animate-fade-in">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <p className="text-sm sm:text-base font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 px-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Confiado por milhares de clientes</p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm">99.9% Uptime</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm">SSL Seguro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm">Suporte 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 w-full flex justify-center">
              <TrackingResult trackingData={trackingData} onNewSearch={handleNewSearch} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;