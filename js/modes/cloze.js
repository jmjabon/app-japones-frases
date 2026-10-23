export const ClozeMode = {
    state: null,
    clozeData: null,
    isProcessing: false,
    timerId: null,
    currentIndex: 0, // Solución al contador
    totalCards: 0,

    start(config) {
        this.state = config;
        this.isProcessing = false;
        
        const targetParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで'];
        const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
        
        this.state.queue = this.state.queue.filter(item => {
            const segments = Array.from(segmenter.segment(item.ja));
            return segments.some(seg => targetParticles.includes(seg.segment));
        });

        // 👇 AÑADE ESTO: Avisa a app.js del nuevo tamaño real tras el filtro
        if (this.state.onSizeAdjusted) {
            this.state.onSizeAdjusted(this.state.queue.length);
        }

        if (this.state.queue.length === 0) {
            alert("No hay suficientes frases con partículas en esta selección.");
            if (this.state.onAbort) this.state.onAbort();
            else this.state.onComplete();
            return;
        }

        this.currentIndex = 1;
        this.totalCards = this.state.queue.length;
        this.nextCard();
    },

    generateCloze(text) {
        const targetParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで'];
        const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(text));
        
        let possibleGaps = [];
        segments.forEach((seg, index) => {
            if (targetParticles.includes(seg.segment)) possibleGaps.push({ index, word: seg.segment });
        });

        if (possibleGaps.length === 0) return null;

        const gap = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
        let distractors = targetParticles.filter(p => p !== gap.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        return {
            answer: gap.word,
            options: [...distractors, gap.word].sort(() => 0.5 - Math.random()),
            before: segments.slice(0, gap.index).map(s => s.segment).join(''),
            after: segments.slice(gap.index + 1).map(s => s.segment).join('')
        };
    },

    nextCard() {
        if (this.state.queue.length === 0) {
            this.state.onComplete();
            return;
        }
        this.clozeData = this.generateCloze(this.state.queue[0].ja);
        this.isProcessing = false;
        this.render();
    },

    render() {
        const item = this.state.queue[0];
        const isFlagged = this.state.storage.flags.includes(item.id);

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[85vh]">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm font-bold text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        Partículas (${this.currentIndex}/${this.totalCards})
                    </span>
                    <div class="flex gap-2">
                        <button id="btn-skip" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><i data-lucide="skip-forward"></i></button>
                        <button id="btn-flag" class="p-2 ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} bg-white rounded-full shadow-sm"><i data-lucide="pin"></i></button>
                        <button id="btn-close" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                    </div>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
                    <button id="btn-audio" class="absolute top-4 right-4 p-3 bg-fuchsia-50 text-fuchsia-600 rounded-full active:scale-90 transition-transform">
                        <i data-lucide="volume-2"></i>
                    </button>

                    <h3 class="text-xl font-semibold text-center text-slate-500 mb-8 mt-4">${item.es}</h3>
                    
                    <div class="text-3xl font-medium text-slate-800 mb-10 text-center leading-relaxed">
                        ${this.clozeData.before}
                        <span id="gap-box" class="inline-block min-w-[60px] border-b-4 border-fuchsia-400 text-fuchsia-600 mx-1 px-2 text-center transition-all bg-fuchsia-50/50 rounded-t-lg">?</span>
                        ${this.clozeData.after}
                    </div>

                    <div class="w-full grid grid-cols-2 gap-4 mb-6">
                        ${this.clozeData.options.map(opt => `
                            <button class="opt-btn bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 text-xl py-4 rounded-2xl font-bold shadow-sm active:scale-95 transition-all" data-val="${opt}">
                                ${opt}
                            </button>
                        `).join('')}
                    </div>

                    <!-- REPARACIÓN: Soporte nativo para lectura completa con Furigana y Romaji -->
                    <div class="mt-auto pt-4 border-t border-slate-100 text-center opacity-40 hover:opacity-100 transition-opacity">
                        <div class="text-lg font-medium text-slate-800 mb-1">${item.furigana}</div>
                        <div class="romaji-text text-xs font-mono text-slate-500">${item.romaji}</div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.attachEvents();
    },

    attachEvents() {
        const item = this.state.queue[0];
        document.querySelectorAll('.opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isProcessing) return;
                this.isProcessing = true;
                document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

                const selected = e.currentTarget.dataset.val;
                const gapBox = document.getElementById('gap-box');
                gapBox.textContent = selected;

                const isCorrect = (selected === this.clozeData.answer);
                if (isCorrect) {
                    e.currentTarget.classList.replace('border-slate-200', 'border-emerald-500');
                    e.currentTarget.classList.replace('bg-slate-50', 'bg-emerald-50');
                    e.currentTarget.classList.replace('text-slate-700', 'text-emerald-700');
                    gapBox.classList.replace('border-fuchsia-400', 'border-emerald-500');
                    gapBox.classList.replace('text-fuchsia-600', 'text-emerald-600');
                    this.state.audio.play(item.ja);
                    this.timerId = setTimeout(() => this.handleFeedback(true), 1100);
                } else {
                    e.currentTarget.classList.replace('border-slate-200', 'border-rose-400');
                    e.currentTarget.classList.replace('bg-slate-50', 'bg-rose-50');
                    e.currentTarget.classList.replace('text-slate-700', 'text-rose-700');
                    this.timerId = setTimeout(() => this.handleFeedback(false), 800);
                }
            });
        });

        document.getElementById('btn-audio')?.addEventListener('click', () => this.state.audio.play(item.ja));
        document.getElementById('btn-close')?.addEventListener('click', () => { 
            if (this.timerId) clearTimeout(this.timerId); 
            if (this.state.onAbort) this.state.onAbort(); 
            else this.state.onComplete(); 
        });
        document.getElementById('btn-skip')?.addEventListener('click', () => { clearTimeout(this.timerId); this.state.queue.shift(); this.nextCard(); });
    },

    handleFeedback(isCorrect) {
        const item = this.state.queue.shift();
        this.state.storage.updateWeight(item.id, isCorrect);
        
        if (!isCorrect) {
            const insertIndex = Math.min(3, this.state.queue.length);
            this.state.queue.splice(insertIndex, 0, item);
        } else {
            this.currentIndex++; // Solo avanza el contador real si aciertas y superas la tarjeta
        }
        this.nextCard();
    }
};