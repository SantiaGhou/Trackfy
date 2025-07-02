import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'tracking-codes.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read data from JSON file with error handling
async function readData() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Ensure all required properties exist with safe defaults
    const safeData = {
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
      generations: Array.isArray(parsed.generations) ? parsed.generations : []
    };
    
    // Validate each code has required properties
    safeData.codes = safeData.codes.map(code => ({
      id: code.id || '',
      code: code.code || '',
      city: code.city || '',
      createdAt: code.createdAt || new Date().toISOString(),
      generationId: code.generationId || '',
      currentStatus: code.currentStatus || {
        day: 0,
        status: 'Despachado',
        description: 'Objeto postado',
        timestamp: new Date().toISOString()
      }
    }));
    
    // Validate each generation has required properties
    safeData.generations = safeData.generations.map(generation => ({
      id: generation.id || '',
      createdAt: generation.createdAt || new Date().toISOString(),
      codes: Array.isArray(generation.codes) ? generation.codes.map(code => ({
        id: code.id || '',
        code: code.code || '',
        city: code.city || '',
        createdAt: code.createdAt || new Date().toISOString(),
        generationId: code.generationId || '',
        currentStatus: code.currentStatus || {
          day: 0,
          status: 'Despachado',
          description: 'Objeto postado',
          timestamp: new Date().toISOString()
        }
      })) : [],
      totalCodes: generation.totalCodes || 0
    }));
    
    return safeData;
  } catch (error) {
    console.error('Error reading data file:', error);
    // Return safe default structure
    return { codes: [], generations: [] };
  }
}

// Write data to JSON file with error handling
async function writeData(data) {
  try {
    await ensureDataDirectory();
    
    // Ensure data has required structure
    const safeData = {
      codes: Array.isArray(data.codes) ? data.codes : [],
      generations: Array.isArray(data.generations) ? data.generations : []
    };
    
    await fs.writeFile(DATA_FILE, JSON.stringify(safeData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

// Generate tracking code
function generateTrackingCode() {
  try {
    const numbers = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const letters = Array.from({ length: 2 }, () => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `BR${numbers}${letters}`;
  } catch (error) {
    console.error('Error generating tracking code:', error);
    return `BR000000000XX`;
  }
}

// Generate realistic timestamp for a specific day, ensuring it's never after current time
function generateRealisticTimestamp(createdAt, dayOffset) {
  try {
    const created = new Date(createdAt);
    const targetDate = new Date(created.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    // If target date is in the future, use current time
    if (targetDate > now) {
      return now.toISOString();
    }
    
    // Generate random hour between 6 AM and 8 PM for realistic delivery times
    const minHour = dayOffset === 0 ? created.getHours() : 6;
    const maxHour = Math.min(20, now.getHours());
    
    // If it's today and we're past the target day, use current time
    if (targetDate.toDateString() === now.toDateString() && dayOffset > 0) {
      const randomHour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
      const randomMinute = Math.floor(Math.random() * 60);
      
      targetDate.setHours(randomHour, randomMinute, 0, 0);
      
      // Ensure it's not in the future
      if (targetDate > now) {
        return now.toISOString();
      }
    } else if (dayOffset === 0) {
      // For day 0, use the exact creation time
      return created.toISOString();
    } else {
      // For past days, generate random time
      const randomHour = Math.floor(Math.random() * (20 - 6 + 1)) + 6;
      const randomMinute = Math.floor(Math.random() * 60);
      targetDate.setHours(randomHour, randomMinute, 0, 0);
    }
    
    return targetDate.toISOString();
  } catch (error) {
    console.error('Error generating timestamp:', error);
    return new Date().toISOString();
  }
}

// Calculate current status based on creation date
function calculateCurrentStatus(createdAt, city) {
  try {
    const stages = [
      { day: 0, status: 'Despachado', description: 'Objeto postado' },
      { day: 1, status: 'Em trânsito local', description: 'Objeto em trânsito - por favor aguarde' },
      { day: 2, status: 'Chegou no centro de distribuição', description: 'Objeto chegou ao centro de distribuição' },
      { day: 3, status: 'Preparando para sair', description: 'Objeto sendo preparado para envio' },
      { day: 4, status: 'Pacote em trânsito', description: `Objeto em trânsito para ${city || 'destino'}` },
      { day: 5, status: 'Pacote chegou na cidade', description: `Objeto chegou em ${city || 'destino'}` },
      { day: 6, status: 'Pacote pronto para entrega', description: 'Objeto pronto para entrega' },
      { day: 7, status: 'Saiu para entrega', description: 'Objeto saiu para entrega' },
      { day: 8, status: 'Falha na entrega', description: 'Destinatário não encontrado' },
      { day: 9, status: 'Saindo para entrega novamente', description: 'Nova tentativa de entrega' },
      { day: 10, status: 'Entregue', description: 'Objeto entregue ao destinatário' }
    ];

    const now = new Date();
    const created = new Date(createdAt);
    
    // Validate dates
    if (isNaN(created.getTime())) {
      return {
        day: 0,
        status: 'Despachado',
        description: 'Objeto postado',
        timestamp: new Date().toISOString()
      };
    }
    
    const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const clampedDays = Math.max(0, Math.min(daysDiff, 10));
    
    const stage = stages[clampedDays] || stages[0];
    
    return {
      day: clampedDays,
      status: stage.status,
      description: stage.description,
      timestamp: generateRealisticTimestamp(createdAt, clampedDays)
    };
  } catch (error) {
    console.error('Error calculating status:', error);
    return {
      day: 0,
      status: 'Despachado',
      description: 'Objeto postado',
      timestamp: new Date().toISOString()
    };
  }
}

// Clean up delivered codes older than 30 days
async function cleanupDeliveredCodes() {
  try {
    console.log('🧹 Iniciando limpeza automática de códigos entregues...');
    
    const data = await readData();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    let removedCodesCount = 0;
    let removedGenerationsCount = 0;
    
    // Filter out delivered codes older than 30 days
    const originalCodesCount = data.codes.length;
    data.codes = data.codes.filter(code => {
      try {
        const currentStatus = calculateCurrentStatus(code.createdAt, code.city);
        const createdDate = new Date(code.createdAt);
        
        // Keep code if:
        // 1. Not delivered (day < 10), OR
        // 2. Delivered but less than 30 days old
        const shouldKeep = currentStatus.day < 10 || createdDate >= thirtyDaysAgo;
        
        if (!shouldKeep) {
          removedCodesCount++;
          console.log(`📦 Removendo código entregue: ${code.code} (criado em ${code.createdAt})`);
        }
        
        return shouldKeep;
      } catch (error) {
        console.error('Error checking code for cleanup:', error);
        return true; // Keep code if there's an error
      }
    });
    
    // Clean up generations - remove codes from generations and remove empty generations
    const originalGenerationsCount = data.generations.length;
    data.generations = data.generations.map(generation => {
      try {
        const originalGenerationCodesCount = generation.codes.length;
        
        // Filter codes in this generation
        generation.codes = generation.codes.filter(code => {
          try {
            const currentStatus = calculateCurrentStatus(code.createdAt, code.city);
            const createdDate = new Date(code.createdAt);
            
            return currentStatus.day < 10 || createdDate >= thirtyDaysAgo;
          } catch (error) {
            console.error('Error checking generation code for cleanup:', error);
            return true;
          }
        });
        
        // Update total codes count
        generation.totalCodes = generation.codes.length;
        
        if (originalGenerationCodesCount > generation.codes.length) {
          console.log(`📁 Geração ${generation.id}: removidos ${originalGenerationCodesCount - generation.codes.length} códigos entregues`);
        }
        
        return generation;
      } catch (error) {
        console.error('Error processing generation for cleanup:', error);
        return generation;
      }
    }).filter(generation => {
      // Remove empty generations
      const shouldKeep = generation.codes.length > 0;
      if (!shouldKeep) {
        removedGenerationsCount++;
        console.log(`🗂️ Removendo geração vazia: ${generation.id}`);
      }
      return shouldKeep;
    });
    
    // Save cleaned data if changes were made
    if (removedCodesCount > 0 || removedGenerationsCount > 0) {
      const writeSuccess = await writeData(data);
      
      if (writeSuccess) {
        console.log(`✅ Limpeza concluída com sucesso!`);
        console.log(`📊 Estatísticas da limpeza:`);
        console.log(`   • Códigos removidos: ${removedCodesCount}`);
        console.log(`   • Gerações removidas: ${removedGenerationsCount}`);
        console.log(`   • Códigos restantes: ${data.codes.length} (antes: ${originalCodesCount})`);
        console.log(`   • Gerações restantes: ${data.generations.length} (antes: ${originalGenerationsCount})`);
      } else {
        console.error('❌ Erro ao salvar dados após limpeza');
      }
    } else {
      console.log('ℹ️ Nenhum código entregue antigo encontrado para remoção');
    }
    
    return {
      success: true,
      removedCodes: removedCodesCount,
      removedGenerations: removedGenerationsCount,
      remainingCodes: data.codes.length,
      remainingGenerations: data.generations.length
    };
  } catch (error) {
    console.error('❌ Erro durante limpeza automática:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Schedule automatic cleanup every 24 hours
function scheduleAutomaticCleanup() {
  // Run cleanup immediately on startup
  setTimeout(cleanupDeliveredCodes, 5000); // Wait 5 seconds after startup
  
  // Then run every 24 hours (86400000 milliseconds)
  setInterval(cleanupDeliveredCodes, 24 * 60 * 60 * 1000);
  
  console.log('⏰ Limpeza automática agendada para executar a cada 24 horas');
}

// Routes with comprehensive error handling

// Get all tracking codes
app.get('/api/codes', async (req, res) => {
  try {
    const data = await readData();
    
    // Update current status for all codes with error handling
    const updatedCodes = (data.codes || []).map(code => {
      try {
        return {
          ...code,
          currentStatus: calculateCurrentStatus(code.createdAt, code.city)
        };
      } catch (error) {
        console.error('Error updating code status:', error);
        return code;
      }
    });
    
    res.json({ codes: updatedCodes });
  } catch (error) {
    console.error('Error in /api/codes:', error);
    res.status(500).json({ 
      error: 'Failed to read tracking codes',
      codes: []
    });
  }
});

// Get all generations
app.get('/api/generations', async (req, res) => {
  try {
    const data = await readData();
    
    // Update current status for all codes in generations with error handling
    const updatedGenerations = (data.generations || []).map(generation => {
      try {
        return {
          ...generation,
          codes: (generation.codes || []).map(code => {
            try {
              return {
                ...code,
                currentStatus: calculateCurrentStatus(code.createdAt, code.city)
              };
            } catch (error) {
              console.error('Error updating generation code status:', error);
              return code;
            }
          })
        };
      } catch (error) {
        console.error('Error updating generation:', error);
        return generation;
      }
    });
    
    res.json({ generations: updatedGenerations });
  } catch (error) {
    console.error('Error in /api/generations:', error);
    res.status(500).json({ 
      error: 'Failed to read generations',
      generations: []
    });
  }
});

// Get recent tracking codes (last 30 minutes)
app.get('/api/codes/recent', async (req, res) => {
  try {
    const data = await readData();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentCodes = (data.codes || [])
      .filter(code => {
        try {
          return new Date(code.createdAt) >= thirtyMinutesAgo;
        } catch (error) {
          console.error('Error filtering recent codes:', error);
          return false;
        }
      })
      .map(code => {
        try {
          return {
            ...code,
            currentStatus: calculateCurrentStatus(code.createdAt, code.city)
          };
        } catch (error) {
          console.error('Error updating recent code status:', error);
          return code;
        }
      });
    
    res.json({ codes: recentCodes });
  } catch (error) {
    console.error('Error in /api/codes/recent:', error);
    res.status(500).json({ 
      error: 'Failed to read recent tracking codes',
      codes: []
    });
  }
});

// Find specific tracking code
app.get('/api/codes/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid tracking code parameter' });
    }
    
    const data = await readData();
    
    const found = (data.codes || []).find(c => {
      try {
        return c.code && c.code.toUpperCase() === code.toUpperCase();
      } catch (error) {
        console.error('Error comparing codes:', error);
        return false;
      }
    });
    
    if (!found) {
      return res.status(404).json({ error: 'Tracking code not found' });
    }
    
    // Update current status
    const updatedCode = {
      ...found,
      currentStatus: calculateCurrentStatus(found.createdAt, found.city)
    };
    
    res.json(updatedCode);
  } catch (error) {
    console.error('Error in /api/codes/:code:', error);
    res.status(500).json({ error: 'Failed to find tracking code' });
  }
});

// Add new tracking codes
app.post('/api/codes', async (req, res) => {
  try {
    const { cities } = req.body;
    
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ error: 'Cities array is required and must not be empty' });
    }
    
    const data = await readData();
    const newCodes = [];
    const generationId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    
    for (const city of cities) {
      try {
        if (city && typeof city === 'string' && city.trim()) {
          const newCode = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            code: generateTrackingCode(),
            city: city.trim(),
            createdAt,
            generationId
          };
          
          newCode.currentStatus = calculateCurrentStatus(newCode.createdAt, newCode.city);
          data.codes.push(newCode);
          newCodes.push(newCode);
        }
      } catch (error) {
        console.error('Error processing city:', city, error);
      }
    }
    
    if (newCodes.length === 0) {
      return res.status(400).json({ error: 'No valid cities provided' });
    }
    
    // Create generation record
    const generation = {
      id: generationId,
      createdAt,
      codes: newCodes,
      totalCodes: newCodes.length
    };
    
    // Ensure generations array exists
    if (!Array.isArray(data.generations)) {
      data.generations = [];
    }
    
    data.generations.unshift(generation); // Add to beginning for newest first
    
    const writeSuccess = await writeData(data);
    
    if (!writeSuccess) {
      return res.status(500).json({ error: 'Failed to save tracking codes' });
    }
    
    res.json({ 
      message: `${newCodes.length} código(s) gerado(s) com sucesso!`,
      generation
    });
  } catch (error) {
    console.error('Error in /api/codes POST:', error);
    res.status(500).json({ error: 'Failed to add tracking codes' });
  }
});

// Delete single tracking code
app.delete('/api/codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Tentativa de deletar código com ID: ${id}`);
    
    if (!id || typeof id !== 'string') {
      console.log('❌ ID inválido fornecido');
      return res.status(400).json({ error: 'Invalid code ID parameter' });
    }
    
    const data = await readData();
    console.log(`📊 Total de códigos no sistema: ${data.codes.length}`);
    
    // Find the code to delete
    const codeIndex = data.codes.findIndex(code => {
      const match = code && code.id === id;
      if (match) {
        console.log(`✅ Código encontrado: ${code.code} (ID: ${code.id})`);
      }
      return match;
    });
    
    if (codeIndex === -1) {
      console.log('❌ Código não encontrado na lista principal');
      console.log('🔍 IDs disponíveis:', data.codes.map(c => c.id).slice(0, 5));
      return res.status(404).json({ error: 'Código não encontrado' });
    }
    
    const deletedCode = data.codes[codeIndex];
    console.log(`🎯 Deletando código: ${deletedCode.code} (ID: ${deletedCode.id})`);
    
    // Remove from main codes array
    data.codes.splice(codeIndex, 1);
    console.log(`✅ Código removido da lista principal. Códigos restantes: ${data.codes.length}`);
    
    // Remove from generations and update counts
    let removedFromGenerations = 0;
    data.generations = data.generations.map(generation => {
      const originalCount = generation.codes.length;
      generation.codes = generation.codes.filter(code => {
        const shouldKeep = code.id !== id;
        if (!shouldKeep) {
          removedFromGenerations++;
          console.log(`🗂️ Código ${deletedCode.code} removido da geração ${generation.id}`);
        }
        return shouldKeep;
      });
      generation.totalCodes = generation.codes.length;
      
      return generation;
    }).filter(generation => {
      const shouldKeep = generation.codes.length > 0;
      if (!shouldKeep) {
        console.log(`🗂️ Geração ${generation.id} removida por estar vazia`);
      }
      return shouldKeep;
    });
    
    console.log(`📁 Código removido de ${removedFromGenerations} geração(ões)`);
    
    const writeSuccess = await writeData(data);
    
    if (!writeSuccess) {
      console.log('❌ Erro ao salvar dados após exclusão');
      return res.status(500).json({ error: 'Erro ao salvar alterações' });
    }
    
    console.log(`✅ Código ${deletedCode.code} deletado com sucesso!`);
    
    res.json({ 
      message: `Código ${deletedCode.code} deletado com sucesso!`,
      deletedCode: deletedCode
    });
  } catch (error) {
    console.error('❌ Erro ao deletar código:', error);
    res.status(500).json({ error: 'Erro ao deletar código' });
  }
});

// Delete multiple tracking codes
app.delete('/api/codes', async (req, res) => {
  try {
    const { ids } = req.body;
    
    console.log(`🗑️ Tentativa de deletar múltiplos códigos:`, ids);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array de IDs é obrigatório' });
    }
    
    const data = await readData();
    const deletedCodes = [];
    
    console.log(`📊 Total de códigos no sistema: ${data.codes.length}`);
    
    // Find codes to delete
    const codesToDelete = data.codes.filter(code => {
      const shouldDelete = ids.includes(code.id);
      if (shouldDelete) {
        console.log(`✅ Código encontrado para exclusão: ${code.code} (ID: ${code.id})`);
      }
      return shouldDelete;
    });
    
    if (codesToDelete.length === 0) {
      console.log('❌ Nenhum código encontrado para deletar');
      console.log('🔍 IDs disponíveis:', data.codes.map(c => c.id).slice(0, 10));
      return res.status(404).json({ error: 'Nenhum código encontrado para deletar' });
    }
    
    console.log(`🎯 Deletando ${codesToDelete.length} código(s)`);
    
    // Remove from main codes array
    data.codes = data.codes.filter(code => {
      const shouldDelete = ids.includes(code.id);
      if (shouldDelete) {
        deletedCodes.push(code);
        console.log(`🗑️ Removendo: ${code.code} (ID: ${code.id})`);
      }
      return !shouldDelete;
    });
    
    console.log(`✅ Códigos removidos da lista principal. Códigos restantes: ${data.codes.length}`);
    
    // Remove from generations and update counts
    let totalRemovedFromGenerations = 0;
    data.generations = data.generations.map(generation => {
      const originalCount = generation.codes.length;
      generation.codes = generation.codes.filter(code => {
        const shouldKeep = !ids.includes(code.id);
        if (!shouldKeep) {
          totalRemovedFromGenerations++;
        }
        return shouldKeep;
      });
      generation.totalCodes = generation.codes.length;
      
      if (originalCount > generation.codes.length) {
        console.log(`📁 Geração ${generation.id}: removidos ${originalCount - generation.codes.length} códigos`);
      }
      
      return generation;
    }).filter(generation => {
      const shouldKeep = generation.codes.length > 0;
      if (!shouldKeep) {
        console.log(`🗂️ Geração ${generation.id} removida por estar vazia`);
      }
      return shouldKeep;
    });
    
    console.log(`📁 Total de códigos removidos das gerações: ${totalRemovedFromGenerations}`);
    
    const writeSuccess = await writeData(data);
    
    if (!writeSuccess) {
      console.log('❌ Erro ao salvar dados após exclusão em lote');
      return res.status(500).json({ error: 'Erro ao salvar alterações' });
    }
    
    console.log(`✅ ${deletedCodes.length} códigos deletados com sucesso!`);
    deletedCodes.forEach(code => {
      console.log(`   • ${code.code} (ID: ${code.id})`);
    });
    
    res.json({ 
      message: `${deletedCodes.length} código(s) deletado(s) com sucesso!`,
      deletedCodes: deletedCodes,
      deletedCount: deletedCodes.length
    });
  } catch (error) {
    console.error('❌ Erro ao deletar múltiplos códigos:', error);
    res.status(500).json({ error: 'Erro ao deletar códigos' });
  }
});

// Get tracking history for a specific code
app.get('/api/codes/:code/history', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid tracking code parameter' });
    }
    
    const data = await readData();
    
    const found = (data.codes || []).find(c => {
      try {
        return c.code && c.code.toUpperCase() === code.toUpperCase();
      } catch (error) {
        console.error('Error comparing codes for history:', error);
        return false;
      }
    });
    
    if (!found) {
      return res.status(404).json({ error: 'Tracking code not found' });
    }
    
    const currentStatus = calculateCurrentStatus(found.createdAt, found.city);
    const history = [];
    
    const stages = [
      { day: 0, status: 'Despachado', description: 'Objeto postado' },
      { day: 1, status: 'Em trânsito local', description: 'Objeto em trânsito - por favor aguarde' },
      { day: 2, status: 'Chegou no centro de distribuição', description: 'Objeto chegou ao centro de distribuição' },
      { day: 3, status: 'Preparando para sair', description: 'Objeto sendo preparado para envio' },
      { day: 4, status: 'Pacote em trânsito', description: `Objeto em trânsito para ${found.city || 'destino'}` },
      { day: 5, status: 'Pacote chegou na cidade', description: `Objeto chegou em ${found.city || 'destino'}` },
      { day: 6, status: 'Pacote pronto para entrega', description: 'Objeto pronto para entrega' },
      { day: 7, status: 'Saiu para entrega', description: 'Objeto saiu para entrega' },
      { day: 8, status: 'Falha na entrega', description: 'Destinatário não encontrado' },
      { day: 9, status: 'Saindo para entrega novamente', description: 'Nova tentativa de entrega' },
      { day: 10, status: 'Entregue', description: 'Objeto entregue ao destinatário' }
    ];
    
    for (let day = 0; day <= currentStatus.day; day++) {
      try {
        const stage = stages[day] || stages[0];
        
        history.push({
          day,
          status: stage.status,
          description: stage.description,
          timestamp: generateRealisticTimestamp(found.createdAt, day)
        });
      } catch (error) {
        console.error('Error generating history item:', error);
      }
    }
    
    res.json({ history: history.reverse() });
  } catch (error) {
    console.error('Error in /api/codes/:code/history:', error);
    res.status(500).json({ 
      error: 'Failed to get tracking history',
      history: []
    });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const data = await readData();
    
    const updatedCodes = (data.codes || []).map(code => {
      try {
        return {
          ...code,
          currentStatus: calculateCurrentStatus(code.createdAt, code.city)
        };
      } catch (error) {
        console.error('Error updating code for stats:', error);
        return code;
      }
    });
    
    const total = updatedCodes.length;
    const delivered = updatedCodes.filter(code => {
      try {
        return code.currentStatus && code.currentStatus.day === 10;
      } catch (error) {
        console.error('Error filtering delivered codes:', error);
        return false;
      }
    }).length;
    const inTransit = updatedCodes.filter(code => {
      try {
        return code.currentStatus && code.currentStatus.day < 10;
      } catch (error) {
        console.error('Error filtering in-transit codes:', error);
        return false;
      }
    }).length;
    
    const today = new Date();
    const todayCodes = updatedCodes.filter(code => {
      try {
        const codeDate = new Date(code.createdAt);
        return !isNaN(codeDate.getTime()) && codeDate.toDateString() === today.toDateString();
      } catch (error) {
        console.error('Error filtering today codes:', error);
        return false;
      }
    }).length;
    
    res.json({
      total,
      delivered,
      inTransit,
      todayCodes
    });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      total: 0,
      delivered: 0,
      inTransit: 0,
      todayCodes: 0
    });
  }
});

// Manual cleanup endpoint (for admin use)
app.post('/api/cleanup', async (req, res) => {
  try {
    console.log('🧹 Limpeza manual solicitada via API');
    const result = await cleanupDeliveredCodes();
    
    if (result.success) {
      res.json({
        message: 'Limpeza executada com sucesso',
        ...result
      });
    } else {
      res.status(500).json({
        error: 'Erro durante limpeza',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    res.status(500).json({ 
      error: 'Failed to execute cleanup',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: {
        automaticCleanup: true,
        cleanupInterval: '24 hours',
        manualDelete: true
      }
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString() 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server and schedule cleanup
app.listen(PORT, () => {
  console.log(`🚀 Trackfy API Server running on http://localhost:${PORT}`);
  console.log(`📁 Data will be stored in: ${DATA_FILE}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🧹 Automatic cleanup: Enabled (every 24 hours)`);
  console.log(`🗑️ Manual delete: Enabled`);
  
  // Schedule automatic cleanup
  scheduleAutomaticCleanup();
});