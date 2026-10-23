export const ExamMode = {
    state: null,
    queue: [],
    errors: [],
    currentIndex: 0,
    totalQuestions: 20,
    isMedalEligible: false,
    targetIsland: null,
    currentQuestionType: null,

    start(config) {
        this.state = config;
        this.errors = [];
        this.currentIndex = 0;
        
        // Verificar si opta a medalla (solo si hay EXACTAMENTE 1 isla seleccionada)
        const activeIslands = this.state.storage.getIslands().filter(i => this.state.activeIslands.includes(i));
        this.isMedalEligible = (this.state.activeIslands.length === 1);
        this.targetIsland = this.isMedalEligible ? this.state.activeIslands[0] : null;

        // Generar 20 preguntas aleatorias de las islas activas
        let pool = this.state.storage.vocabData.filter(item => this.state.activeIslands.includes(item.isla));
        if (pool.length < 5) {
            alert('No hay suficientes frases en esta categoría para un examen.');
            this.state.onComplete();
            return;
        }

        // Barajar y coger 20 (permitiendo repeticiones si la isla es pequeña, para asegurar el rigor de 20)
        this.queue = [];
        for (let i = 0; i < this.totalQuestions; i++) {
            this.queue.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        this.nextQuestion();
    },

    nextQuestion() {
        if (this.currentIndex >= this.totalQuestions) {
            this.renderDiagnostic();
            return;
        }

        const item = this.queue[this.currentIndex];
        
        // Decidir el tipo de pregunta aleatoriamente
        const types = ['dictation', 'scramble', 'cloze'];
        let type = types[Math.floor(Math.random() * types.length)];

        // Si toca cloze pero la frase no tiene partículas, forzamos scramble
        if (type === 'cloze') {
            const particles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで'];
            const segs = Array.from(new Intl.Segmenter('ja-JP', { granularity: 'word' }).segment(item.ja));
            if (!segs.some(s => particles.includes(s.segment))) type = 'scramble';
        }

        this.currentQuestionType = type;
        this.renderQuestionContainer(item, type);
    },

    renderQuestionContainer(item, type) {
        // Interfaz unificada de examen con botón de cerrar
        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[85vh]">
                <div class="bg-rose-600 text-white rounded-2xl p-4 shadow-md mb-4 flex justify-between items-center">
                    <div>
                        <div class="text-[10px] uppercase tracking-widest font-bold opacity-80">Evaluación de Fluidez</div>
                        <div class="font-bold text-lg">Pregunta ${this.currentIndex + 1} de ${this.totalQuestions}</div>
                    </div>
                    <!-- NUEVO BOTÓN DE CERRAR -->
                    <button id="ex-btn-close" class="p-2 text-rose-200 hover:text-white bg-rose-700/50 hover:bg-rose-700 rounded-full transition-colors active:scale-95">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div id="exam-arena" class="flex-1 flex flex-col bg-white border border-slate-200 shadow-sm rounded-3xl p-6 relative">
                    <!-- Aquí se inyecta el minijuego -->
                </div>
            </div>
        `;
        lucide.createIcons();
        const arena = document.getElementById('exam-arena');

        // EVENTO PARA EL BOTÓN DE CERRAR
        document.getElementById('ex-btn-close').addEventListener('click', () => {
            if (confirm('¿Seguro que quieres abandonar el examen? Perderás el progreso de esta prueba.')) {
                this.state.onComplete();
            }
        });

        if (type === 'dictation') this.injectDictation(arena, item);
        else if (type === 'scramble') this.injectScramble(arena, item);
        else if (type === 'cloze') this.injectCloze(arena, item);
    },

    // --- INYECCIÓN DE MINI-JUEGOS STRICTOS ---
    injectDictation(arena, item) {
        arena.innerHTML = `
            <div class="text-center mb-6"><span class="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded uppercase">Dictado Auditivo</span></div>
            <div class="text-center mb-6">
                <button id="ex-btn-audio" class="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md active:scale-95 transition-transform"><i data-lucide="volume-2" class="w-8 h-8"></i></button>
            </div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Escribe lo que oigas (Romaji o Kana)</label>
            <input type="text" id="ex-input" class="w-full px-4 py-4 text-lg bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-rose-500" autocomplete="off" spellcheck="false" />
            <button id="ex-btn-check" class="w-full py-4 mt-auto bg-slate-800 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">Confirmar Respuesta</button>
        `;
        lucide.createIcons();
        setTimeout(() => this.state.audio.play(item.ja), 400);

        document.getElementById('ex-btn-audio').addEventListener('click', () => this.state.audio.play(item.ja));
        document.getElementById('ex-btn-check').addEventListener('click', () => {
            const val = document.getElementById('ex-input').value;
            const normalize = (str) => str.toLowerCase().normalize('NFKC').replace(/[。、！？\s\.,!\?'-]/g, '');
            const isCorrect = (normalize(val) === normalize(item.ja) || normalize(val) === normalize(item.romaji));
            this.evaluateAnswer(item, isCorrect, 'Dictado');
        });
    },

    injectScramble(arena, item) {
        const segments = Array.from(new Intl.Segmenter('ja-JP', { granularity: 'word' }).segment(item.ja))
            .filter(s => s.segment.trim().length > 0).map(s => s.segment);
        let pieces = [...segments].sort(() => 0.5 - Math.random());
        let selected = [];

        const render = () => {
            arena.innerHTML = `
                <div class="text-center mb-6"><span class="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded uppercase">Constructor</span></div>
                <h3 class="text-xl font-bold text-slate-800 text-center mb-6">${item.es}</h3>
                <div class="flex flex-wrap gap-2 justify-center min-h-[60px] p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 border-dashed mb-6" id="ex-drop">
                    ${selected.map((p, i) => `<button class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm" data-idx="${i}">${p}</button>`).join('')}
                </div>
                <div class="flex flex-wrap gap-2 justify-center mb-6" id="ex-pool">
                    ${pieces.map((p, i) => `<button class="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm active:scale-95" data-idx="${i}">${p}</button>`).join('')}
                </div>
                ${pieces.length === 0 ? `<button id="ex-btn-check" class="w-full py-4 mt-auto bg-slate-800 text-white rounded-2xl font-bold shadow-md active:scale-95">Evaluar</button>` : ''}
            `;
            
            document.querySelectorAll('#ex-pool button').forEach(btn => btn.addEventListener('click', (e) => {
                selected.push(pieces.splice(e.currentTarget.dataset.idx, 1)[0]);
                render();
            }));
            document.querySelectorAll('#ex-drop button').forEach(btn => btn.addEventListener('click', (e) => {
                pieces.push(selected.splice(e.currentTarget.dataset.idx, 1)[0]);
                render();
            }));
            document.getElementById('ex-btn-check')?.addEventListener('click', () => {
                this.evaluateAnswer(item, selected.join('') === item.ja, 'Constructor');
            });
        };
        render();
    },

    injectCloze(arena, item) {
        const targetParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで'];
        const segs = Array.from(new Intl.Segmenter('ja-JP', { granularity: 'word' }).segment(item.ja));
        const gaps = segs.map((s, i) => ({ i, w: s.segment })).filter(x => targetParticles.includes(x.w));
        const gap = gaps[Math.floor(Math.random() * gaps.length)];
        const distractors = targetParticles.filter(p => p !== gap.w).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [...distractors, gap.w].sort(() => 0.5 - Math.random());
        const before = segs.slice(0, gap.i).map(s => s.segment).join('');
        const after = segs.slice(gap.i + 1).map(s => s.segment).join('');

        arena.innerHTML = `
            <div class="text-center mb-6"><span class="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded uppercase">Partículas</span></div>
            <h3 class="text-lg font-semibold text-slate-500 text-center mb-6">${item.es}</h3>
            <div class="text-2xl font-medium text-slate-800 text-center leading-relaxed mb-8">
                ${before}<span class="inline-block min-w-[50px] border-b-4 border-slate-300 mx-1 text-transparent">_</span>${after}
            </div>
            <div class="grid grid-cols-2 gap-3 mt-auto">
                ${options.map(opt => `<button class="ex-opt-btn bg-slate-50 border-2 border-slate-200 py-4 rounded-xl font-bold text-lg active:scale-95" data-val="${opt}">${opt}</button>`).join('')}
            </div>
        `;
        document.querySelectorAll('.ex-opt-btn').forEach(btn => btn.addEventListener('click', (e) => {
            this.evaluateAnswer(item, e.currentTarget.dataset.val === gap.w, 'Partículas');
        }));
    },

    evaluateAnswer(item, isCorrect, modeName) {
        if (!isCorrect) {
            this.errors.push({ item, mode: modeName });
            navigator.vibrate?.([80, 50, 80]); // Feedback háptico de error sin romper la pantalla
        }
        this.currentIndex++;
        this.nextQuestion();
    },

    renderDiagnostic() {
        const passed = this.errors.length === 0;
        let medalHtml = '';

        if (passed && this.isMedalEligible) {
            this.state.storage.addExamPass(this.targetIsland);
            const medal = this.state.storage.getMedal(this.targetIsland);
            medalHtml = `
                <div class="mt-6 p-4 rounded-2xl ${medal.bg} ${medal.text} flex items-center justify-center gap-3 border border-current/20 shadow-sm fade-in">
                    <i data-lucide="${medal.icon}" class="w-8 h-8"></i>
                    <div class="text-left">
                        <div class="text-xs uppercase tracking-widest font-bold opacity-80">Rango Actualizado</div>
                        <div class="font-black text-xl">Medalla de ${medal.name}</div>
                    </div>
                </div>
            `;
        } else if (passed && !this.isMedalEligible) {
            medalHtml = `<div class="mt-6 text-sm text-slate-500 font-medium">100% Correcto. (Las medallas solo se otorgan al examinar una única isla).</div>`;
        }

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-8">
                <div class="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md ${passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}">
                    <i data-lucide="${passed ? 'check-check' : 'x-octagon'}" class="w-12 h-12"></i>
                </div>
                
                <h2 class="text-3xl font-black text-slate-800 mb-2">${passed ? '¡Examen Superado!' : 'Examen Suspendido'}</h2>
                <p class="text-slate-600 font-medium mb-6">
                    ${passed ? 'Precisión absoluta. Estás listo para sobrevivir en Tokio.' : `Has cometido ${this.errors.length} errores. Se requiere un 100% para aprobar.`}
                </p>

                ${medalHtml}

                ${!passed ? `
                    <div class="w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mt-6 text-left">
                        <h4 class="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Diagnóstico de Fallos:</h4>
                        <ul class="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                            ${this.errors.map(err => `
                                <li>
                                    <div class="text-[10px] font-bold text-rose-500 uppercase">${err.mode}</div>
                                    <div class="text-sm font-semibold text-slate-700">${err.item.es}</div>
                                    <div class="text-xs text-slate-500">${err.item.ja}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <button id="ex-btn-finish" class="w-full py-4 mt-8 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">
                    Volver al Menú
                </button>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('ex-btn-finish').addEventListener('click', this.state.onComplete);
    }
};