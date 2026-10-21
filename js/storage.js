const DB_KEYS = {
    WEIGHTS: 'nihongo_weights_v2',
    FLAGS: 'nihongo_flags_v2',
    CUSTOM_VOCAB: 'nihongo_custom_vocab_v2' // Guardará las ediciones hechas desde el iPad
};

export const StorageManager = {
    vocabData: [],
    weights: JSON.parse(localStorage.getItem(DB_KEYS.WEIGHTS)) || {},
    flags: JSON.parse(localStorage.getItem(DB_KEYS.FLAGS)) || [],
    customVocab: JSON.parse(localStorage.getItem(DB_KEYS.CUSTOM_VOCAB)) || {},

    sessionErrors: new Set(),

    async loadVocab() {
        try {
            const response = await fetch('./data/vocab.json');
            const baseVocab = await response.json();
            
            // Fusionar el JSON estático con las ediciones locales hechas en la app
            this.vocabData = baseVocab.map(item => {
                return this.customVocab[item.id] ? { ...item, ...this.customVocab[item.id] } : item;
            });
            
            this.initWeights();
            return this.vocabData;
        } catch (error) {
            console.error("Error cargando vocab.json:", error);
            return [];
        }
    },

    initWeights() {
        let changed = false;
        this.vocabData.forEach(item => {
            if (!this.weights[item.id]) {
                this.weights[item.id] = { peso: 1, fallos: 0, aciertos: 0 };
                changed = true;
            }
        });
        if (changed) this.saveData();
    },

    saveData() {
        localStorage.setItem(DB_KEYS.WEIGHTS, JSON.stringify(this.weights));
        localStorage.setItem(DB_KEYS.FLAGS, JSON.stringify(this.flags));
    },

    updateWeight(id, isCorrect) {
        if (!this.weights[id]) return;

        if (!isCorrect) this.sessionErrors.add(id);

        if (isCorrect) {
            this.weights[id].peso = Math.max(1, this.weights[id].peso - 1);
            this.weights[id].aciertos++;
        } else {
            this.weights[id].peso += 2;
            this.weights[id].fallos++;
        }
        this.saveData();
    },

    toggleFlag(id) {
        const index = this.flags.indexOf(id);
        if (index > -1) {
            this.flags.splice(index, 1);
        } else {
            this.flags.push(id);
        }
        this.saveData();
        return this.flags.includes(id);
    },

    updatePhrase(id, newData) {
        // Guardar en el diccionario local persistente
        this.customVocab[id] = { ...this.customVocab[id], ...newData };
        localStorage.setItem(DB_KEYS.CUSTOM_VOCAB, JSON.stringify(this.customVocab));
        
        // Actualizar la memoria activa
        const index = this.vocabData.findIndex(i => i.id === id);
        if(index > -1) {
            this.vocabData[index] = { ...this.vocabData[index], ...newData };
        }
    },

    getIslands() {
        const islands = new Set();
        this.vocabData.forEach(item => islands.add(item.isla));
        return Array.from(islands);
    },

    generateSession(activeIslands, size) {
        this.sessionErrors.clear();
        const pool = this.vocabData.filter(item => activeIslands.includes(item.isla));
        if (pool.length === 0) return [];

        const weightedPool = [];
        pool.forEach(item => {
            const weight = this.weights[item.id]?.peso || 1;
            for (let i = 0; i < weight; i++) {
                weightedPool.push(item);
            }
        });

        const session = new Set();
        while(session.size < size && session.size < pool.length) {
            const randomItem = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            session.add(randomItem);
        }
        return Array.from(session);
    },

    generateWeaknessSession(size) {
        this.sessionErrors.clear();
        // Filtrar solo las frases que el usuario ha fallado (peso > 1 o con registro de fallos)
        const weakItems = this.vocabData.filter(item => {
            const stats = this.weights[item.id];
            return stats && (stats.peso > 1 || stats.fallos > 0);
        });

        if (weakItems.length === 0) return [];

        // Ordenar: primero las de mayor peso (urgentes), luego desempatar por cantidad de fallos históricos
        weakItems.sort((a, b) => {
            const statA = this.weights[a.id];
            const statB = this.weights[b.id];
            if (statB.peso !== statA.peso) {
                return statB.peso - statA.peso; // Mayor peso primero
            }
            return statB.fallos - statA.fallos; // Mayor cantidad de fallos primero
        });

        // Devolver exactamente la cantidad solicitada (o menos si no hay tantos errores)
        return weakItems.slice(0, size);
    }
};

