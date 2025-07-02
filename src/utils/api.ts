const API_BASE_URL = 'http://localhost:3001/api';

export interface TrackingCode {
  id: string;
  code: string;
  city: string;
  createdAt: string;
  generationId?: string;
  currentStatus: TrackingStatus;
}

export interface TrackingStatus {
  day: number;
  status: string;
  description: string;
  timestamp: string;
}

export interface Generation {
  id: string;
  createdAt: string;
  codes: TrackingCode[];
  totalCodes: number;
}

export interface ApiResponse<T> {
  codes?: T[];
  generations?: Generation[];
  generation?: Generation;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  total: number;
  delivered: number;
  inTransit: number;
  todayCodes: number;
}

export interface DeleteResponse {
  message: string;
  deletedCode?: TrackingCode;
  deletedCodes?: TrackingCode[];
  deletedCount?: number;
}

// Enhanced error handling wrapper
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ API Error:`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Request Failed:`, error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão: Verifique se o servidor está rodando');
    }
    throw error;
  }
}

// Get all tracking codes
export async function getAllTrackingCodes(): Promise<TrackingCode[]> {
  try {
    const data = await apiRequest<ApiResponse<TrackingCode>>(`${API_BASE_URL}/codes`);
    const codes = Array.isArray(data.codes) ? data.codes : [];
    console.log(`📦 Loaded ${codes.length} tracking codes`);
    return codes;
  } catch (error) {
    console.error('Error fetching tracking codes:', error);
    return [];
  }
}

// Get all generations
export async function getAllGenerations(): Promise<Generation[]> {
  try {
    const data = await apiRequest<ApiResponse<Generation>>(`${API_BASE_URL}/generations`);
    const generations = Array.isArray(data.generations) ? data.generations : [];
    console.log(`📁 Loaded ${generations.length} generations`);
    return generations;
  } catch (error) {
    console.error('Error fetching generations:', error);
    return [];
  }
}

// Get recent tracking codes
export async function getRecentTrackingCodes(): Promise<TrackingCode[]> {
  try {
    const data = await apiRequest<ApiResponse<TrackingCode>>(`${API_BASE_URL}/codes/recent`);
    const codes = Array.isArray(data.codes) ? data.codes : [];
    console.log(`⏰ Loaded ${codes.length} recent tracking codes`);
    return codes;
  } catch (error) {
    console.error('Error fetching recent tracking codes:', error);
    return [];
  }
}

// Find specific tracking code
export async function findTrackingCode(code: string): Promise<TrackingCode | null> {
  try {
    if (!code || typeof code !== 'string' || !code.trim()) {
      throw new Error('Código de rastreamento inválido');
    }

    console.log(`🔍 Searching for tracking code: ${code}`);
    const data = await apiRequest<TrackingCode>(`${API_BASE_URL}/codes/${encodeURIComponent(code.trim())}`);
    console.log(`✅ Found tracking code:`, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log(`❌ Tracking code not found: ${code}`);
      return null;
    }
    console.error('Error finding tracking code:', error);
    return null;
  }
}

// Add new tracking codes
export async function addTrackingCodes(cities: string[]): Promise<{ success: boolean; message: string; generation?: Generation }> {
  try {
    if (!Array.isArray(cities) || cities.length === 0) {
      return { success: false, message: 'Lista de cidades é obrigatória' };
    }

    const validCities = cities
      .filter(city => city && typeof city === 'string' && city.trim().length > 0)
      .map(city => city.trim());

    if (validCities.length === 0) {
      return { success: false, message: 'Nenhuma cidade válida fornecida' };
    }

    console.log(`➕ Adding tracking codes for cities:`, validCities);
    const data = await apiRequest<{ message: string; generation: Generation }>(`${API_BASE_URL}/codes`, {
      method: 'POST',
      body: JSON.stringify({ cities: validCities }),
    });
    
    console.log(`✅ Successfully added tracking codes:`, data);
    return { 
      success: true, 
      message: data.message || 'Códigos gerados com sucesso',
      generation: data.generation 
    };
  } catch (error) {
    console.error('Error adding tracking codes:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao gerar códigos' 
    };
  }
}

// Delete single tracking code
export async function deleteTrackingCode(id: string): Promise<{ success: boolean; message: string; deletedCode?: TrackingCode }> {
  try {
    if (!id || typeof id !== 'string' || !id.trim()) {
      return { success: false, message: 'ID do código é obrigatório' };
    }

    console.log(`🗑️ Deleting tracking code with ID: ${id}`);
    const data = await apiRequest<DeleteResponse>(`${API_BASE_URL}/codes/${encodeURIComponent(id.trim())}`, {
      method: 'DELETE',
    });
    
    console.log(`✅ Successfully deleted tracking code:`, data);
    return { 
      success: true, 
      message: data.message || 'Código deletado com sucesso',
      deletedCode: data.deletedCode 
    };
  } catch (error) {
    console.error('Error deleting tracking code:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao deletar código' 
    };
  }
}

// Delete multiple tracking codes
export async function deleteMultipleTrackingCodes(ids: string[]): Promise<{ success: boolean; message: string; deletedCodes?: TrackingCode[]; deletedCount?: number }> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, message: 'Lista de IDs é obrigatória' };
    }

    const validIds = ids.filter(id => id && typeof id === 'string' && id.trim().length > 0);

    if (validIds.length === 0) {
      return { success: false, message: 'Nenhum ID válido fornecido' };
    }

    console.log(`🗑️ Deleting multiple tracking codes:`, validIds);
    const data = await apiRequest<DeleteResponse>(`${API_BASE_URL}/codes`, {
      method: 'DELETE',
      body: JSON.stringify({ ids: validIds }),
    });
    
    console.log(`✅ Successfully deleted multiple tracking codes:`, data);
    return { 
      success: true, 
      message: data.message || 'Códigos deletados com sucesso',
      deletedCodes: data.deletedCodes,
      deletedCount: data.deletedCount
    };
  } catch (error) {
    console.error('Error deleting multiple tracking codes:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao deletar códigos' 
    };
  }
}

// Get tracking history
export async function getTrackingHistory(code: string): Promise<TrackingStatus[]> {
  try {
    if (!code || typeof code !== 'string' || !code.trim()) {
      return [];
    }

    console.log(`📜 Getting tracking history for: ${code}`);
    const data = await apiRequest<{ history: TrackingStatus[] }>(`${API_BASE_URL}/codes/${encodeURIComponent(code.trim())}/history`);
    const history = Array.isArray(data.history) ? data.history : [];
    console.log(`📜 Loaded ${history.length} history items`);
    return history;
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    return [];
  }
}

// Get statistics
export async function getStatistics(): Promise<StatsResponse> {
  try {
    console.log(`📊 Getting statistics`);
    const data = await apiRequest<StatsResponse>(`${API_BASE_URL}/stats`);
    const stats = {
      total: typeof data.total === 'number' ? data.total : 0,
      delivered: typeof data.delivered === 'number' ? data.delivered : 0,
      inTransit: typeof data.inTransit === 'number' ? data.inTransit : 0,
      todayCodes: typeof data.todayCodes === 'number' ? data.todayCodes : 0,
    };
    console.log(`📊 Statistics:`, stats);
    return stats;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return { total: 0, delivered: 0, inTransit: 0, todayCodes: 0 };
  }
}

// Parse CSV file
export function parseCsvFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo fornecido'));
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Arquivo deve ser do tipo CSV'));
      return;
    }

    console.log(`📄 Parsing CSV file: ${file.name}`);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        
        if (!text || typeof text !== 'string') {
          reject(new Error('Arquivo vazio ou inválido'));
          return;
        }

        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
          reject(new Error('Arquivo CSV está vazio'));
          return;
        }

        const header = lines[0].toLowerCase();
        
        if (!header.includes('cidades') && !header.includes('cidade')) {
          reject(new Error('CSV deve conter uma coluna "Cidades" ou "Cidade"'));
          return;
        }
        
        const headerColumns = header.split(',').map(col => col.trim());
        const cityIndex = headerColumns.findIndex(col => 
          col.includes('cidades') || col.includes('cidade')
        );
        
        if (cityIndex === -1) {
          reject(new Error('Coluna "Cidades" não encontrada'));
          return;
        }
        
        const cities = lines.slice(1)
          .map(line => {
            const columns = line.split(',');
            return columns[cityIndex]?.trim();
          })
          .filter(city => city && city.length > 0);
        
        if (cities.length === 0) {
          reject(new Error('Nenhuma cidade válida encontrada no CSV'));
          return;
        }
        
        console.log(`✅ Parsed ${cities.length} cities from CSV`);
        resolve(cities);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo CSV: ' + (error instanceof Error ? error.message : 'Erro desconhecido')));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}