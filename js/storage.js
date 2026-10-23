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
  /**
   * Obtiene todos los datos almacenados de forma segura.
   */
  getData() {
    return getRawData();
  },

  /**
   * Guarda o actualiza los datos completos.
   */
  saveData(data) {
    persistData(data);
  },

  /**
   * Recupera la medalla o estado de logro de una categoría concreta.
   * Evita el TypeError verificando la existencia de la colección antes de acceder a la clave.
   */
  getMedal(categoryName) {
    const data = getRawData();

    // Soporte para distintas estructuras habituales (data.medals, data.categories o la raíz)
    if (data.medals && typeof data.medals === 'object') {
      return data.medals[categoryName] ?? null;
    }

    if (data.categories && typeof data.categories === 'object') {
      return data.categories[categoryName] ?? null;
    }

    return null;
  },

  /**
   * Asigna o actualiza la medalla para una categoría.
   */
  setMedal(categoryName, medalValue) {
    const data = getRawData();
    if (!data.medals || typeof data.medals !== 'object') {
      data.medals = {};
    }
    data.medals[categoryName] = medalValue;
    persistData(data);
  },

  /**
   * Obtiene el progreso general o puntuación de una categoría.
   */
  getProgress(categoryName) {
    const data = getRawData();
    if (categoryName) {
      return (data.categories && data.categories[categoryName]) ?? null;
    }
    return data;
  },

  /**
   * Guarda el progreso de una categoría.
   */
  saveProgress(categoryName, progressData) {
    const data = getRawData();
    if (!data.categories || typeof data.categories !== 'object') {
      data.categories = {};
    }
    data.categories[categoryName] = progressData;
    persistData(data);
  },

  /**
   * Restablece todos los datos almacenados.
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("StorageManager: Error al limpiar localStorage.", error);
    }
  }
};

export default StorageManager;