export const ScrambleMode = {
    state: null,

    start(config) {
        this.state = {
            ...config,
            currentAnswer: [],
            currentPool: []
        };
        this.render();
    },

    tokenizeJapanese(text) {
        // Usamos la API nativa del iPad para cortar el japonés en palabras
        const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(text));
        // Filtramos espacios y puntuación para las fichas
        return segments
            .filter(s => s.segment.trim().length > 0 && !/[。、！？.!?]/.test(s.segment))
            .map(s => s.segment)
            .sort(() => Math.random() - 0.5); // Barajar fichas
    },

    render() {
        if (this.state.queue.length === 0) {
            this.state.onComplete();
            return;
        }

        const item = this.state.queue[0];
        
        // Si es la primera vez que se renderiza esta tarjeta, inicializar fichas
        if (this.state.currentPool.length === 0 && this.state.currentAnswer.length === 0) {
            this.state.currentPool = this.tokenizeJapanese(item.ja);
        }

        const isFlagged = this.state.storage.flags.includes(item.id);

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[80vh]">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm font-semibold text-slate-500">${this.state.queue.length} restantes</span>
                    <div class="flex gap-2">
                        <button id="btn-skip" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><i data-lucide="skip-forward"></i></button>
                        <button id="btn-flag" class="p-2 ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} bg-white rounded-full shadow-sm"><i data-lucide="pin"></i></button>
                        <button id="btn-close" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                    </div>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">
                    <span class="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-2 text-center">${item.isla}</span>
                    <h3 class="text-xl font-semibold text-center text-slate-800 mb-6">${item.es}</h3>
                    
                    <!-- Zona de Respuesta -->
                    <div id="answer-zone" class="min-h-[80px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-3 mb-6 flex flex-wrap gap-2 content-start transition-colors">
                        ${this.state.currentAnswer.map((word, idx) => `
                            <button class="ans-tile bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm active:scale-95 transition-transform" data-idx="${idx}">
                                ${word}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Zona de Fichas (Pool) -->
                    <div class="flex-1 flex flex-wrap gap-2 content-start">
                        ${this.state.currentPool.map((word, idx) => `
                            <button class="pool-tile bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium shadow-sm active:scale-95 transition-transform" data-idx="${idx}">
                                ${word}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Botón Verificar -->
                    <div class="pt-4 mt-auto">
                        <button id="btn-check" class="w-full py-4 rounded-xl font-bold text-white transition-all ${this.state.currentPool.length === 0 ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md' : 'bg-slate-300 opacity-50 cursor-not-allowed'}" ${this.state.currentPool.length === 0 ? '' : 'disabled'}>
                            Verificar Orden
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.attachEvents();
    },

    attachEvents() {
        const item = this.state.queue[0];

        // Mover del Pool a Answer
        document.querySelectorAll('.pool-tile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.dataset.idx;
                this.state.currentAnswer.push(this.state.currentPool[idx]);
                this.state.currentPool.splice(idx, 1);
                this.state.audio.play(this.state.currentAnswer[this.state.currentAnswer.length - 1]); // Reproducir ficha tocada
                this.render();
            });
        });

        // Mover de Answer al Pool
        document.querySelectorAll('.ans-tile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.dataset.idx;
                this.state.currentPool.push(this.state.currentAnswer[idx]);
                this.state.currentAnswer.splice(idx, 1);
                this.render();
            });
        });

        // Verificar respuesta
        const checkBtn = document.getElementById('btn-check');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                const userAnswer = this.state.currentAnswer.join('');
                
                // Normalizamos ambas cadenas eliminando espacios y puntuación para la comparación pura
                const normalize = (str) => str.replace(/[。、！？.!?\s]/g, '').normalize('NFKC');
                const isCorrect = normalize(userAnswer) === normalize(item.ja);

                const answerZone = document.getElementById('answer-zone');
                if (isCorrect) {
                    answerZone.classList.replace('border-slate-200', 'border-emerald-500');
                    answerZone.classList.replace('bg-slate-50', 'bg-emerald-50');
                    this.state.audio.play(item.ja); // Audio de éxito
                    setTimeout(() => this.handleFeedback(true), 1000);
                } else {
                    answerZone.classList.replace('border-slate-200', 'border-rose-400');
                    answerZone.classList.replace('bg-slate-50', 'bg-rose-50');
                    // Vibración táctil simulada en animacion
                    answerZone.style.transform = 'translateX(10px)';
                    setTimeout(() => answerZone.style.transform = 'translateX(-10px)', 50);
                    setTimeout(() => answerZone.style.transform = 'translateX(0)', 100);
                    
                    // Devolver todo al pool tras fallo
                    setTimeout(() => {
                        this.state.currentPool = [...this.state.currentPool, ...this.state.currentAnswer].sort(() => Math.random() - 0.5);
                        this.state.currentAnswer = [];
                        this.handleFeedback(false);
                    }, 800);
                }
            });
        }

        // Controles superiores
        document.getElementById('btn-close').addEventListener('click', this.state.onComplete);
        document.getElementById('btn-skip').addEventListener('click', () => {
            this.state.queue.shift();
            this.resetState();
            this.render();
        });
        document.getElementById('btn-flag').addEventListener('click', (e) => {
            const isActive = this.state.storage.toggleFlag(item.id);
            e.currentTarget.classList.toggle('text-amber-500', isActive);
            e.currentTarget.classList.toggle('text-slate-400', !isActive);
        });
    },

    handleFeedback(isCorrect) {
        const item = this.state.queue[0];
        this.state.storage.updateWeight(item.id, isCorrect);
        
        const currentItem = this.state.queue.shift();
        if (!isCorrect) {
            const insertIndex = Math.min(3, this.state.queue.length);
            this.state.queue.splice(insertIndex, 0, currentItem);
        }
        
        this.resetState();
        this.render();
    },

    resetState() {
        this.state.currentAnswer = [];
        this.state.currentPool = [];
    }
};