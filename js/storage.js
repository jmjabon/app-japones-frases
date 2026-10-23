// storage.js
const STORAGE_KEY = 'app_progreso_usuario';

const DEFAULT_STATE = {
  medals: {},
  scores: {},
  categories: {}
};

function getRawData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : { ...DEFAULT_STATE };
  } catch (error) {
    console.warn("StorageManager: Error al parsear localStorage, restaurando valores base.", error);
    return { ...DEFAULT_STATE };
  }
}

function persistData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("StorageManager: Error al escribir en localStorage.", error);
  }
}

export const StorageManager = {
  getData() {
    return getRawData();
  },

  saveData(data) {
    persistData(data);
  },

  getMedal(categoryName) {
    const data = getRawData();
    if (data.medals && typeof data.medals === 'object') {
      return data.medals[categoryName] ?? null;
    }
    if (data.categories && typeof data.categories === 'object') {
      return data.categories[categoryName] ?? null;
    }
    return null;
  },

  setMedal(categoryName, medalValue) {
    const data = getRawData();
    if (!data.medals || typeof data.medals !== 'object') {
      data.medals = {};
    }
    data.medals[categoryName] = medalValue;
    persistData(data);
  },

  getProgress(categoryName) {
    const data = getRawData();
    if (categoryName) {
      return (data.categories && data.categories[categoryName]) ?? null;
    }
    return data;
  },

  saveProgress(categoryName, progressData) {
    const data = getRawData();
    if (!data.categories || typeof data.categories !== 'object') {
      data.categories = {};
    }
    data.categories[categoryName] = progressData;
    persistData(data);
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("StorageManager: Error al limpiar localStorage.", error);
    }
  },

  async loadVocab(url = './data/vocab.json') {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("StorageManager: Error al cargar el vocabulario.", error);
      return []; 
    }
  }
};

export default StorageManager;