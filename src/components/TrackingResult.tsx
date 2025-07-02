import React, { useEffect, useState } from 'react';
import { TrackingCode, TrackingStatus } from '../utils/api';
import { getTrackingHistory } from '../utils/api';
import { Package, MapPin, Clock, CheckCircle, Truck, Building, Home, AlertCircle, RotateCcw, Plane, Navigation, ArrowRight } from 'lucide-react';

interface TrackingResultProps {
  trackingData: TrackingCode;
  onNewSearch: () => void;
}

const TrackingResult: React.FC<TrackingResultProps> = ({ trackingData, onNewSearch }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [history, setHistory] = useState<TrackingStatus[]>([]);
  const isDelivered = trackingData.currentStatus.day === 10;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const trackingHistory = await getTrackingHistory(trackingData.code);
      setHistory(trackingHistory);
    };
    loadHistory();
  }, [trackingData.code]);

  const getStageIcon = (day: number) => {
    switch (day) {
      case 0: return Package;
      case 1: return Truck;
      case 2: return Building;
      case 3: return Navigation;
      case 4: return Plane;
      case 5: return MapPin;
      case 6: return Package;
      case 7: return Truck;
      case 8: return AlertCircle;
      case 9: return RotateCcw;
      case 10: return CheckCircle;
      default: return Package;
    }
  };

  const getStageColor = (day: number, isCurrent: boolean, isCompleted: boolean) => {
    if (isCurrent) {
      return 'from-orange-500 to-orange-600';
    }
    if (isCompleted) {
      return 'from-green-500 to-emerald-500';
    }
    if (day === 8) {
      return 'from-red-500 to-red-600';
    }
    return 'from-gray-300 to-gray-400';
  };

  const getProgressPercentage = () => {
    return Math.min((trackingData.currentStatus.day / 10) * 100, 100);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Filter timeline to show only specific days: 1, 3, 5, 7, 9
  const timelineSteps = [1, 3, 5, 7, 9];

  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-5xl w-full border border-gray-100 transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Rastreamento de Encomenda</h2>
          <p className="text-gray-600">Acompanhe sua entrega em tempo real</p>
        </div>
        <button
          onClick={onNewSearch}
          className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span>Nova Consulta</span>
        </button>
      </div>
      
      {/* Package Info Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200 shadow-inner">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl shadow-sm">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Código de Rastreamento</p>
              <p className="text-xl font-bold text-gray-900 break-all">{trackingData.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl shadow-sm">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Cidade de Destino</p>
              <p className="text-xl font-bold text-gray-900 truncate">{trackingData.city}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl shadow-sm">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Data de Postagem</p>
              <p className="text-xl font-bold text-gray-900">
                {formatDateTime(trackingData.createdAt).date}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className={`p-6 rounded-2xl mb-8 border-2 shadow-lg ${
        isDelivered 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
          : trackingData.currentStatus.day === 8
            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className={`p-4 rounded-2xl self-start shadow-lg ${
            isDelivered 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
              : trackingData.currentStatus.day === 8
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
          }`}>
            {React.createElement(getStageIcon(trackingData.currentStatus.day), {
              className: "h-8 w-8 text-white"
            })}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-2xl font-bold mb-2 ${
              isDelivered 
                ? 'text-green-800' 
                : trackingData.currentStatus.day === 8
                  ? 'text-red-800'
                  : 'text-orange-800'
            }`}>
              {trackingData.currentStatus.status}
            </p>
            <p className={`text-lg ${
              isDelivered 
                ? 'text-green-600' 
                : trackingData.currentStatus.day === 8
                  ? 'text-red-600'
                  : 'text-orange-600'
            }`}>
              {trackingData.currentStatus.description}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Atualizado em {formatDateTime(trackingData.currentStatus.timestamp).date} às {formatDateTime(trackingData.currentStatus.timestamp).time}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Progresso</p>
            <p className="text-2xl font-bold text-gray-900">
              {isDelivered ? 'Finalizado' : `${trackingData.currentStatus.day}/10`}
            </p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              isDelivered 
                ? 'bg-green-100 text-green-800' 
                : trackingData.currentStatus.day === 8
                  ? 'bg-red-100 text-red-800'
                  : 'bg-orange-100 text-orange-800'
            }`}>
              {isDelivered ? 'Entregue' : trackingData.currentStatus.day === 8 ? 'Atenção' : 'Em Trânsito'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Progresso da Entrega</h3>
          <span className="text-lg font-bold text-gray-600">{Math.round(getProgressPercentage())}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
              isDelivered 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : trackingData.currentStatus.day === 8
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>
      
      {/* Timeline */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Histórico Detalhado</h3>
        
        {/* Horizontal Timeline for Large Screens - Only Icons */}
        <div className="hidden xl:block mb-8">
          <div className="flex justify-between items-center relative px-4">
            <div className="absolute top-8 left-4 right-4 h-2 bg-gray-200 rounded-full"></div>
            <div 
              className={`absolute top-8 left-4 h-2 rounded-full transition-all duration-1000 ease-out ${
                isDelivered 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}
              style={{ width: `${(getProgressPercentage() / 100) * (100 - 8)}%` }}
            ></div>
            
            {timelineSteps.map((day) => {
              const IconComponent = getStageIcon(day);
              const isActive = day <= trackingData.currentStatus.day;
              const isCurrent = day === trackingData.currentStatus.day;
              
              return (
                <div key={day} className="flex flex-col items-center relative z-10">
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-lg ${
                    isCurrent 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 scale-110 animate-pulse' 
                      : isActive 
                        ? day === 8 
                          ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500'
                          : 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-500'
                        : 'bg-white border-gray-300'
                  }`}>
                    <IconComponent className={`h-8 w-8 ${
                      isCurrent ? 'text-white' : isActive ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="space-y-6">
          {history.map((item, index) => {
            const IconComponent = getStageIcon(item.day);
            const isCurrent = item.day === trackingData.currentStatus.day;
            const isCompleted = item.day < trackingData.currentStatus.day;
            const dateTime = formatDateTime(item.timestamp);
            
            return (
              <div key={item.day} className={`timeline-item transition-all duration-500 ${
                isCurrent ? 'transform scale-105' : ''
              }`}>
                <div className={`timeline-dot transition-all duration-500 shadow-lg ${
                  isCurrent 
                    ? 'active scale-125 animate-pulse' 
                    : isCompleted 
                      ? item.day === 8 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500'
                        : 'completed' 
                      : ''
                }`}>
                  <IconComponent className={`h-4 w-4 ${
                    isCurrent || isCompleted ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
                <div className={`pb-6 transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 -mx-4 px-6 py-4 rounded-xl border-l-4 border-orange-500 shadow-md' 
                    : ''
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-3 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className={`text-lg font-semibold mb-2 ${
                        isCurrent 
                          ? 'text-orange-800' 
                          : item.day === 8 
                            ? 'text-red-700'
                            : 'text-gray-900'
                      }`}>
                        {item.status}
                      </p>
                      <p className={`text-base mb-3 ${
                        isCurrent 
                          ? 'text-orange-600' 
                          : item.day === 8
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}>
                        {item.description}
                      </p>
                      {isCurrent && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                          Status Atual
                        </div>
                      )}
                      {item.day === 8 && !isCurrent && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Falha na Entrega
                        </div>
                      )}
                    </div>
                    <div className="text-left lg:text-right lg:ml-6 flex-shrink-0 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {dateTime.date}
                      </p>
                      <p className="text-lg font-bold text-gray-700">
                        {dateTime.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Atualizado em tempo real</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Rastreamento seguro</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Suporte 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingResult;