const DB_KEYS = {
    WEIGHTS: 'nihongo_weights_v2',
    FLAGS: 'nihongo_flags_v2',
    CUSTOM_VOCAB: 'nihongo_custom_vocab_v2',
    MEDALS: 'nihongo_medals_v1'
};

export const StorageManager = {
    vocabData: [],
    weights: JSON.parse(localStorage.getItem(DB_KEYS.WEIGHTS)) || {},
    flags: JSON.parse(localStorage.getItem(DB_KEYS.FLAGS)) || [],
    customVocab: JSON.parse(localStorage.getItem(DB_KEYS.CUSTOM_VOCAB)) || {},
    medals: JSON.parse(localStorage.getItem(DB_KEYS.MEDALS)) || {},
    sessionErrors: new Set(),

    async loadVocab() {
        try {
            const response = await fetch('./data/vocab.json');
            const baseVocab = await response.json();
            
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
        localStorage.setItem(DB_KEYS.CUSTOM_VOCAB, JSON.stringify(this.customVocab));
        localStorage.setItem(DB_KEYS.MEDALS, JSON.stringify(this.medals));
    },

    updateWeight(id, isCorrect) {
        if (!this.weights[id]) {
            this.weights[id] = { peso: 1, fallos: 0, aciertos: 0 };
        }

        if (!isCorrect) {
            this.sessionErrors.add(id);
            this.weights[id].peso += 2;
            this.weights[id].fallos++;
        } else {
            this.weights[id].peso = Math.max(1, this.weights[id].peso - 1);
            this.weights[id].aciertos++;
        }

        this.saveData();
    },

    getSessionErrors() {
        return this.vocabData.filter(item => this.sessionErrors.has(item.id));
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
        this.customVocab[id] = { ...this.customVocab[id], ...newData };
        localStorage.setItem(DB_KEYS.CUSTOM_VOCAB, JSON.stringify(this.customVocab));
        
        const index = this.vocabData.findIndex(i => i.id === id);
        if (index > -1) {
            this.vocabData[index] = { ...this.vocabData[index], ...newData };
        }
    },

    // 👇 MÉTODOS DEL EXAMEN Y MEDALLAS
    addExamPass(isla) {
        if (!this.medals[isla]) this.medals[isla] = 0;
        this.medals[isla] += 1;
        this.saveData();
    },

    getMedal(isla) {
        const count = this.medals[isla] || 0;
        if (count >= 10) return { id: 'platino', name: 'Platino', bg: 'bg-slate-800', text: 'text-slate-200', icon: 'award' };
        if (count >= 6) return { id: 'oro', name: 'Oro', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'medal' };
        if (count >= 3) return { id: 'plata', name: 'Plata', bg: 'bg-slate-200', text: 'text-slate-600', icon: 'medal' };
        if (count >= 1) return { id: 'bronce', name: 'Bronce', bg: 'bg-amber-100', text: 'text-amber-800', icon: 'medal' };
        return null;
    },

    // 👇 AQUÍ ESTÁ EL MÉTODO QUE FALTABA
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
        while (session.size < size && session.size < pool.length) {
            const randomItem = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            session.add(randomItem);
        }
        return Array.from(session);
    },

    generateWeaknessSession(size) {
        this.sessionErrors.clear();
        const weakItems = this.vocabData.filter(item => {
            const stats = this.weights[item.id];
            return stats && (stats.peso > 1 || stats.fallos > 0);
        });

        if (weakItems.length === 0) return [];

        weakItems.sort((a, b) => {
            const statA = this.weights[a.id];
            const statB = this.weights[b.id];
            if (statB.peso !== statA.peso) return statB.peso - statA.peso;
            return statB.fallos - statA.fallos;
        });

        return weakItems.slice(0, size);
    }
};