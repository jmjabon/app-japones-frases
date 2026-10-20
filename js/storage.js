const DB_KEYS = {
    WEIGHTS: 'nihongo_weights_v2',
    FLAGS: 'nihongo_flags_v2'
};

export const StorageManager = {
    vocabData: [],
    weights: JSON.parse(localStorage.getItem(DB_KEYS.WEIGHTS)) || {},
    flags: JSON.parse(localStorage.getItem(DB_KEYS.FLAGS)) || [],

    async loadVocab() {
        try {
            const response = await fetch('./data/vocab.json');
            this.vocabData = await response.json();
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

    getIslands() {
        const islands = new Set();
        this.vocabData.forEach(item => islands.add(item.isla));
        return Array.from(islands);
    },

    generateSession(activeIslands, size) {
        // Filtrar vocabulario por islas activas
        const pool = this.vocabData.filter(item => activeIslands.includes(item.isla));
        if (pool.length === 0) return [];

        // Muestreo ponderado basado en pesos (algoritmo Leitner simplificado)
        const weightedPool = [];
        pool.forEach(item => {
            const weight = this.weights[item.id]?.peso || 1;
            for (let i = 0; i < weight; i++) {
                weightedPool.push(item);
            }
        });

        // Seleccionar aleatoriamente respetando los pesos
        const session = new Set();
        while(session.size < size && session.size < pool.length) {
            const randomItem = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            session.add(randomItem);
        }
        return Array.from(session);
    }
};