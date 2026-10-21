export const ClozeMode = {
    state: null,
    clozeData: null,

    start(config) {
        this.state = config;
        this.nextCard();
    },

    generateCloze(text) {
        const targetParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで'];
        const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(text));
        
        // Buscar todas las partículas en la frase
        let possibleGaps = [];
        segments.forEach((seg, index) => {
            if (targetParticles.includes(seg.segment)) {
                possibleGaps.push({ index, word: seg.segment });
            }
        });

        // Si la frase no tiene partículas, devolvemos null
        if (possibleGaps.length === 0) return null;

        // Elegir una partícula al azar para ocultar
        const gap = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
        
        // Generar 3 trampas (distractors) que no sean la respuesta correcta
        let distractors = targetParticles.filter(p => p !== gap.word);
        distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // Mezclar respuesta correcta con trampas
        const options = [...distractors, gap.word].sort(() => 0.5 - Math.random());
        
        return {
            answer: gap.word,
            options: options,
            before: segments.slice(0, gap.index).map(s => s.segment).join(''),
            after: segments.slice(gap.index + 1).map(s => s.segment).join('')
        };
    },

    nextCard() {
        if (this.state.queue.length === 0) {
            this.state.onComplete();
            return;
        }

        const item = this.state.queue[0];
        this.clozeData = this.generateCloze(item.ja);

        // Si la frase no tiene partículas, la saltamos silenciosamente para no frustrar al usuario
        if (!this.clozeData) {
            this.state.queue.shift();
            this.nextCard();
            return;
        }

        this.render();
    },

    render() {
        const item = this.state.queue[0];
        const isFlagged = this.state.storage.flags.includes(item.id);

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[75vh]">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm font-semibold text-slate-500">${this.state.queue.length} restantes</span>
                    <div class="flex gap-2">
                        <button id="btn-skip" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><i data-lucide="skip-forward"></i></button>
                        <button id="btn-flag" class="p-2 ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} bg-white rounded-full shadow-sm"><i data-lucide="pin"></i></button>
                        <button id="btn-close" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                    </div>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col items-center justify-center relative">
                    <button id="btn-audio" class="absolute top-4 right-4 p-3 bg-indigo-50 text-indigo-600 rounded-full active:scale-90 transition-transform">
                        <i data-lucide="volume-2"></i>
                    </button>

                    <h3 class="text-xl font-semibold text-center text-slate-500 mb-8">${item.es}</h3>
                    
                    <div class="text-3xl font-medium text-slate-800 mb-12 text-center leading-relaxed">
                        ${this.clozeData.before}
                        <span id="gap-box" class="inline-block min-w-[60px] border-b-4 border-indigo-400 text-indigo-600 mx-1 px-2 text-center transition-all bg-indigo-50/50 rounded-t-lg">?</span>
                        ${this.clozeData.after}
                    </div>

                    <div class="w-full grid grid-cols-2 gap-4 mt-auto">
                        ${this.clozeData.options.map(opt => `
                            <button class="opt-btn bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 text-xl py-4 rounded-2xl font-bold shadow-sm active:scale-95 transition-all" data-val="${opt}">
                                ${opt}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.attachEvents();
    },

    attachEvents() {
        const item = this.state.queue[0];

        // Lógica de validación
        document.querySelectorAll('.opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selected = e.currentTarget.dataset.val;
                const gapBox = document.getElementById('gap-box');
                
                gapBox.textContent = selected;
                
                if (selected === this.clozeData.answer) {
                    // Éxito
                    e.currentTarget.classList.replace('border-slate-200', 'border-emerald-500');
                    e.currentTarget.classList.replace('bg-slate-50', 'bg-emerald-50');
                    e.currentTarget.classList.replace('text-slate-700', 'text-emerald-700');
                    gapBox.classList.replace('border-indigo-400', 'border-emerald-500');
                    gapBox.classList.replace('text-indigo-600', 'text-emerald-600');
                    
                    this.state.audio.play(item.ja);
                    setTimeout(() => this.handleFeedback(true), 1200);
                } else {
                    // Fallo
                    e.currentTarget.classList.replace('border-slate-200', 'border-rose-400');
                    e.currentTarget.classList.replace('bg-slate-50', 'bg-rose-50');
                    e.currentTarget.classList.replace('text-slate-700', 'text-rose-700');
                    
                    setTimeout(() => this.handleFeedback(false), 800);
                }
            });
        });

        document.getElementById('btn-audio').addEventListener('click', () => this.state.audio.play(item.ja));
        document.getElementById('btn-close').addEventListener('click', this.state.onComplete);
        
        document.getElementById('btn-skip').addEventListener('click', () => {
            this.state.queue.shift();
            this.nextCard();
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
        
        this.nextCard();
    }
};