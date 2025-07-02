import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Upload, Package, Calendar, MapPin, Activity, Copy, Clock, BarChart3, Menu, X, TrendingUp, Users, CheckCircle2, Check, Square, Trash2, AlertTriangle } from 'lucide-react';
import { TrackingCode, Generation } from '../utils/api';
import { 
  getAllTrackingCodes, 
  getAllGenerations,
  getRecentTrackingCodes, 
  addTrackingCodes, 
  parseCsvFile, 
  getStatistics,
  deleteTrackingCode,
  deleteMultipleTrackingCodes,
  StatsResponse 
} from '../utils/api';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [trackingCodes, setTrackingCodes] = useState<TrackingCode[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [recentCodes, setRecentCodes] = useState<TrackingCode[]>([]);
  const [stats, setStats] = useState<StatsResponse>({ total: 0, delivered: 0, inTransit: 0, todayCodes: 0 });
  const [manualCities, setManualCities] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'generations' | 'all'>('recent');
  const [copyMessage, setCopyMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [lastGeneration, setLastGeneration] = useState<Generation | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<TrackingCode | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setDataLoading(true);
      console.log('🔄 Loading admin dashboard data...');
      
      const [allCodes, allGenerations, recent, statistics] = await Promise.all([
        getAllTrackingCodes().catch(err => {
          console.error('Error loading all codes:', err);
          return [];
        }),
        getAllGenerations().catch(err => {
          console.error('Error loading generations:', err);
          return [];
        }),
        getRecentTrackingCodes().catch(err => {
          console.error('Error loading recent codes:', err);
          return [];
        }),
        getStatistics().catch(err => {
          console.error('Error loading statistics:', err);
          return { total: 0, delivered: 0, inTransit: 0, todayCodes: 0 };
        })
      ]);
      
      console.log('📊 Data loaded successfully:', {
        allCodes: allCodes.length,
        generations: allGenerations.length,
        recent: recent.length,
        stats: statistics
      });
      
      setTrackingCodes(Array.isArray(allCodes) ? allCodes : []);
      setGenerations(Array.isArray(allGenerations) ? allGenerations : []);
      setRecentCodes(Array.isArray(recent) ? recent : []);
      setStats(statistics || { total: 0, delivered: 0, inTransit: 0, todayCodes: 0 });
      
      // Set last generation if available
      if (allGenerations && allGenerations.length > 0) {
        setLastGeneration(allGenerations[0]);
        console.log('📁 Last generation set:', allGenerations[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setMessage('Erro ao carregar dados do servidor');
    } finally {
      setDataLoading(false);
    }
  };

  const handleManualGeneration = async () => {
    if (!manualCities.trim()) {
      setMessage('Por favor, digite pelo menos uma cidade');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const cities = manualCities
        .split(',')
        .map(city => city.trim())
        .filter(city => city.length > 0);
      
      if (cities.length === 0) {
        setMessage('Nenhuma cidade válida encontrada');
        setLoading(false);
        return;
      }
      
      console.log('➕ Generating codes for cities:', cities);
      const result = await addTrackingCodes(cities);
      
      if (result.success && result.generation) {
        setMessage(result.message);
        setManualCities('');
        setLastGeneration(result.generation);
        setActiveTab('recent');
        await loadData();
      } else {
        setMessage(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Error in manual generation:', error);
      setMessage('Erro ao gerar códigos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setMessage('Por favor, selecione um arquivo CSV');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const cities = await parseCsvFile(csvFile);
      
      if (cities.length === 0) {
        setMessage('Nenhuma cidade válida encontrada no arquivo CSV');
        setLoading(false);
        return;
      }
      
      console.log('📄 Generating codes from CSV for cities:', cities);
      const result = await addTrackingCodes(cities);
      
      if (result.success && result.generation) {
        setMessage(result.message);
        setCsvFile(null);
        setLastGeneration(result.generation);
        setActiveTab('recent');
        await loadData();
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setMessage(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Error in CSV upload:', error);
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro ao processar CSV'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (code: TrackingCode) => {
    console.log('🗑️ Preparing to delete code:', code);
    setCodeToDelete(code);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCode = async () => {
    if (!codeToDelete) return;
    
    setDeleteLoading(true);
    try {
      console.log('🗑️ Confirming delete for code:', codeToDelete);
      const result = await deleteTrackingCode(codeToDelete.id);
      
      if (result.success) {
        setMessage(`Código ${codeToDelete.code} deletado com sucesso!`);
        await loadData();
        setSelectedCodes(new Set()); // Clear selection
        console.log('✅ Code deleted successfully');
      } else {
        setMessage(`Erro: ${result.message}`);
        console.error('❌ Delete failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error deleting code:', error);
      setMessage('Erro ao deletar código. Tente novamente.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setCodeToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCodes.size === 0) {
      setMessage('Nenhum código selecionado para deletar');
      return;
    }
    
    setDeleteLoading(true);
    try {
      const idsArray = Array.from(selectedCodes);
      console.log('🗑️ Deleting selected codes:', idsArray);
      
      const result = await deleteMultipleTrackingCodes(idsArray);
      
      if (result.success) {
        setMessage(`${result.deletedCount || selectedCodes.size} código(s) deletado(s) com sucesso!`);
        await loadData();
        setSelectedCodes(new Set()); // Clear selection
        console.log('✅ Multiple codes deleted successfully');
      } else {
        setMessage(`Erro: ${result.message}`);
        console.error('❌ Multiple delete failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error deleting selected codes:', error);
      setMessage('Erro ao deletar códigos selecionados. Tente novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyCodesText = (codes: TrackingCode[]) => {
    try {
      if (!codes || codes.length === 0) {
        setCopyMessage('Nenhum código para copiar');
        setTimeout(() => setCopyMessage(''), 3000);
        return;
      }
      
      const codesText = codes
        .filter(code => code && code.code)
        .map(code => code.code)
        .join('\n');
      
      if (!codesText) {
        setCopyMessage('Nenhum código válido para copiar');
        setTimeout(() => setCopyMessage(''), 3000);
        return;
      }
      
      navigator.clipboard.writeText(codesText).then(() => {
        setCopyMessage(`${codes.length} códigos copiados para a área de transferência!`);
        setTimeout(() => setCopyMessage(''), 3000);
      }).catch(err => {
        console.error('Error copying to clipboard:', err);
        setCopyMessage('Erro ao copiar códigos');
        setTimeout(() => setCopyMessage(''), 3000);
      });
    } catch (error) {
      console.error('Error in copyCodesText:', error);
      setCopyMessage('Erro ao copiar códigos');
      setTimeout(() => setCopyMessage(''), 3000);
    }
  };

  const copySelectedCodes = () => {
    try {
      const allCodes = [...trackingCodes, ...recentCodes];
      const selectedCodesArray = allCodes.filter(code => 
        code && code.id && selectedCodes.has(code.id)
      );
      
      if (selectedCodesArray.length === 0) {
        setCopyMessage('Nenhum código selecionado');
        setTimeout(() => setCopyMessage(''), 3000);
        return;
      }
      
      const codesText = selectedCodesArray
        .filter(code => code && code.code)
        .map(code => code.code)
        .join('\n');
      
      navigator.clipboard.writeText(codesText).then(() => {
        setCopyMessage(`${selectedCodes.size} códigos selecionados copiados!`);
        setTimeout(() => setCopyMessage(''), 3000);
        setSelectedCodes(new Set());
      }).catch(err => {
        console.error('Error copying selected codes:', err);
        setCopyMessage('Erro ao copiar códigos selecionados');
        setTimeout(() => setCopyMessage(''), 3000);
      });
    } catch (error) {
      console.error('Error in copySelectedCodes:', error);
      setCopyMessage('Erro ao copiar códigos selecionados');
      setTimeout(() => setCopyMessage(''), 3000);
    }
  };

  const toggleCodeSelection = (codeId: string) => {
    try {
      if (!codeId) return;
      
      console.log('🔄 Toggling selection for code ID:', codeId);
      const newSelected = new Set(selectedCodes);
      if (newSelected.has(codeId)) {
        newSelected.delete(codeId);
        console.log('➖ Removed from selection');
      } else {
        newSelected.add(codeId);
        console.log('➕ Added to selection');
      }
      setSelectedCodes(newSelected);
      console.log('📊 Total selected:', newSelected.size);
    } catch (error) {
      console.error('Error toggling code selection:', error);
    }
  };

  const selectAllCodes = (codes: TrackingCode[]) => {
    try {
      if (!codes || codes.length === 0) return;
      
      const allIds = codes
        .filter(code => code && code.id)
        .map(code => code.id);
      
      console.log('✅ Selecting all codes:', allIds.length);
      setSelectedCodes(new Set(allIds));
    } catch (error) {
      console.error('Error selecting all codes:', error);
    }
  };

  const clearSelection = () => {
    console.log('🧹 Clearing selection');
    setSelectedCodes(new Set());
  };

  const getStatusColor = (day: number) => {
    if (day === 10) return 'text-green-700 bg-green-100 border-green-200';
    if (day === 8) return 'text-red-700 bg-red-100 border-red-200';
    if (day >= 7) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-blue-700 bg-blue-100 border-blue-200';
  };

  const getStatusIcon = (day: number) => {
    if (day === 10) return CheckCircle2;
    if (day === 8) return X;
    return Activity;
  };

  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return { date: 'Data inválida', time: 'Hora inválida' };
      }
      
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: 'Data inválida', time: 'Hora inválida' };
    }
  };

  const getDisplayCodes = () => {
    switch (activeTab) {
      case 'recent':
        return Array.isArray(recentCodes) ? recentCodes : [];
      case 'all':
        return Array.isArray(trackingCodes) ? trackingCodes : [];
      case 'generations':
        return [];
      default:
        return [];
    }
  };

  const displayCodes = getDisplayCodes();

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && codeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar o código <span className="font-bold text-gray-900">{codeToDelete.code}</span>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCodeToDelete(null);
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCode}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deletando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Deletar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="ml-2 lg:ml-0">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">Painel Administrativo</span>
                  <span className="sm:hidden">Admin Trackfy</span>
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Gerencie códigos de rastreamento</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gerar Códigos</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Generation Panel Content */}
                <div className="space-y-6">
                  {/* Manual Generation */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Inserção Manual
                    </label>
                    <textarea
                      value={manualCities}
                      onChange={(e) => setManualCities(e.target.value)}
                      placeholder="Digite as cidades separadas por vírgula&#10;Ex: São Paulo, Rio de Janeiro, Belo Horizonte"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 text-sm resize-none"
                      rows={4}
                      disabled={loading}
                    />
                    <button
                      onClick={handleManualGeneration}
                      disabled={!manualCities.trim() || loading}
                      className="mt-3 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium shadow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Gerar Códigos</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* CSV Upload */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={loading}
                    />
                    <button
                      onClick={handleCsvUpload}
                      disabled={!csvFile || loading}
                      className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium shadow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Importando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Importar CSV</span>
                        </>
                      )}
                    </button>
                  </div>

                  {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${
                      message.includes('Erro') 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <div className="h-full bg-white shadow-xl border-r border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2 text-orange-500" />
                Gerar Códigos
              </h2>
              
              {/* Manual Generation */}
              <div className="mb-6 bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Inserção Manual
                </label>
                <textarea
                  value={manualCities}
                  onChange={(e) => setManualCities(e.target.value)}
                  placeholder="Digite as cidades separadas por vírgula&#10;Ex: São Paulo, Rio de Janeiro, Belo Horizonte"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 resize-none"
                  rows={4}
                  disabled={loading}
                />
                <button
                  onClick={handleManualGeneration}
                  disabled={!manualCities.trim() || loading}
                  className="mt-3 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Gerar Códigos</span>
                    </>
                  )}
                </button>
              </div>

              {/* CSV Upload */}
              <div className="mb-6 bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={loading}
                />
                <button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || loading}
                  className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Importar CSV</span>
                    </>
                  )}
                </button>
              </div>

              {message && (
                <div className={`p-4 rounded-xl font-medium ${
                  message.includes('Erro') 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">Total de Códigos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">Entregues</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">Em Trânsito</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inTransit}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayCodes}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Codes List */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-900">Códigos de Rastreamento</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setActiveTab('recent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === 'recent'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Última Geração ({lastGeneration?.totalCodes || recentCodes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('generations')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === 'generations'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Por Geração ({generations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === 'all'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Todos ({trackingCodes.length})
                  </button>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Gerar</span>
                  </button>
                </div>
              </div>

              {/* Generations View */}
              {activeTab === 'generations' && (
                <div className="space-y-6">
                  {generations.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">Nenhuma geração encontrada</p>
                      <p className="text-gray-400 text-sm mt-2">Gere códigos para ver as gerações aqui</p>
                    </div>
                  ) : (
                    generations.map((generation) => (
                      <div key={generation.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Geração de {formatDateTime(generation.createdAt).date} às {formatDateTime(generation.createdAt).time}
                            </h3>
                            <p className="text-gray-600">{generation.totalCodes} códigos gerados</p>
                          </div>
                          <button
                            onClick={() => copyCodesText(generation.codes)}
                            className="flex items-center space-x-2 text-sm text-orange-600 hover:text-orange-700 font-medium bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition-all duration-200"
                          >
                            <Copy className="h-4 w-4" />
                            <span>Copiar Geração ({generation.totalCodes})</span>
                          </button>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm max-h-40 overflow-y-auto break-all shadow-inner">
                          {generation.codes.filter(code => code && code.code).map(code => code.code).join('\n')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Copy Area for Recent/All tabs */}
              {activeTab !== 'generations' && displayCodes.length > 0 && (
                <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <Copy className="h-4 w-4 mr-2" />
                      {activeTab === 'recent' ? 'Última Geração' : 'Códigos para Copiar'}
                    </label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {selectedCodes.size > 0 && (
                        <>
                          <button
                            onClick={copySelectedCodes}
                            className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-700 font-medium bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-all duration-200"
                          >
                            <Copy className="h-4 w-4" />
                            <span>Copiar Selecionados ({selectedCodes.size})</span>
                          </button>
                          <button
                            onClick={handleDeleteSelected}
                            disabled={deleteLoading}
                            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            {deleteLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                                <span>Deletando...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span>Deletar Selecionados ({selectedCodes.size})</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={clearSelection}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all duration-200"
                          >
                            <X className="h-4 w-4" />
                            <span>Limpar</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => selectAllCodes(displayCodes)}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all duration-200"
                      >
                        <Check className="h-4 w-4" />
                        <span>Selecionar Todos</span>
                      </button>
                      <button
                        onClick={() => copyCodesText(displayCodes)}
                        className="flex items-center space-x-2 text-sm text-orange-600 hover:text-orange-700 font-medium bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-all duration-200"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copiar Todos ({displayCodes.length})</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm max-h-40 overflow-y-auto break-all shadow-inner">
                    {displayCodes.filter(code => code && code.code).map(code => code.code).join('\n')}
                  </div>
                  {copyMessage && (
                    <p className="text-sm text-green-600 mt-2 font-medium">{copyMessage}</p>
                  )}
                </div>
              )}

              {/* Codes List for Recent/All tabs */}
              {activeTab !== 'generations' && (
                <>
                  {displayCodes.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        {activeTab === 'recent' 
                          ? 'Nenhum código gerado recentemente' 
                          : 'Nenhum código de rastreamento gerado ainda'
                        }
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {activeTab === 'recent' 
                          ? 'Códigos gerados nos últimos 30 minutos aparecerão aqui' 
                          : 'Use o painel lateral para gerar novos códigos'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {displayCodes.map((code) => {
                        if (!code || !code.id || !code.code) {
                          console.warn('Invalid code found:', code);
                          return null;
                        }
                        
                        const StatusIcon = getStatusIcon(code.currentStatus?.day || 0);
                        const isSelected = selectedCodes.has(code.id);
                        
                        return (
                          <div key={code.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-start space-x-4">
                              <button
                                onClick={() => toggleCodeSelection(code.id)}
                                className={`mt-1 p-1 rounded transition-all duration-200 ${
                                  isSelected 
                                    ? 'text-orange-600 bg-orange-100' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {isSelected ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-lg break-all mb-2">{code.code}</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
                                      <div className="flex items-center space-x-2 text-gray-600">
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate font-medium">{code.city}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 text-gray-600">
                                        <Calendar className="h-4 w-4 flex-shrink-0" />
                                        <span>{formatDateTime(code.createdAt).date}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col lg:text-right space-y-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(code.currentStatus?.day || 0)} self-start lg:self-end`}>
                                      <StatusIcon className="h-4 w-4 mr-2" />
                                      <span className="truncate max-w-32 lg:max-w-none">{code.currentStatus?.status || 'Status desconhecido'}</span>
                                    </span>
                                    <p className="text-sm text-gray-500 font-medium">
                                      Dia {code.currentStatus?.day || 0} de 10
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteCode(code)}
                                disabled={deleteLoading}
                                className="mt-1 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Deletar código"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;