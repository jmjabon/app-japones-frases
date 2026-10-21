export const DictationMode = {
    state: null,
    hintsGiven: 0,
    isEvaluated: false,

    start(config) {
        this.state = config;
        this.hintsGiven = 0;
        this.isEvaluated = false;
        this.render();
        // Reproducción automática del primer audio
        setTimeout(() => this.playCurrentAudio(1.0), 400);
    },

    playCurrentAudio(rate = 1.0) {
        const item = this.state.queue[0];
        if (item) this.state.audio.play(item.ja, rate);
    },

    normalizeString(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFKC')
            // Reemplazo de macron / vocales largas comunes en romaji
            .replace(/ā/g, 'aa')
            .replace(/ī/g, 'ii')
            .replace(/ū/g, 'uu')
            .replace(/ē/g, 'ee')
            .replace(/ō/g, 'ou')
            // Eliminar espacios, puntuación japonesa y occidental
            .replace(/[。、！？\s\.,!\?'-]/g, '');
    },

    checkAnswer(userInput, item) {
        const cleanInput = this.normalizeString(userInput);
        if (!cleanInput) return false;

        const cleanJa = this.normalizeString(item.ja);
        const cleanRomaji = this.normalizeString(item.romaji);

        // Acepta coincidencia exacta con japonés o con la transcripción romaji
        return cleanInput === cleanJa || cleanInput === cleanRomaji;
    },

    render() {
        if (this.state.queue.length === 0) {
            this.state.onComplete();
            return;
        }

        const item = this.state.queue[0];
        const isFlagged = this.state.storage.flags.includes(item.id);

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[82vh]">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Dictado Auditivo (${this.state.queue.length} restantes)
                    </span>
                    <div class="flex gap-2">
                        <button id="btn-skip-dic" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><i data-lucide="skip-forward"></i></button>
                        <button id="btn-flag-dic" class="p-2 ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} bg-white rounded-full shadow-sm"><i data-lucide="pin"></i></button>
                        <button id="btn-close-dic" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                    </div>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">${item.isla}</span>
                            <button id="btn-hint" class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 active:scale-95 transition-transform flex items-center gap-1">
                                <i data-lucide="lightbulb" class="w-3.5 h-3.5"></i> Pista (${this.hintsGiven}/2)
                            </button>
                        </div>

                        <!-- Zona de Reproducción de Audio -->
                        <div class="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-5 text-center">
                            <div class="flex justify-center gap-4 mb-3">
                                <button id="btn-audio-normal" class="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-transform">
                                    <i data-lucide="volume-2" class="w-6 h-6"></i>
                                </button>
                                <button id="btn-audio-slow" class="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                                    0.7x Lento
                                </button>
                            </div>
                            <p class="text-xs text-slate-400">Escucha con atención y escribe lo que oigas</p>
                        </div>

                        <!-- Contenedor dinámico de pistas -->
                        <div id="hint-container" class="space-y-2 mb-4">
                            ${this.hintsGiven >= 1 ? `
                                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 fade-in">
                                    <strong>Significado:</strong> ${item.es}
                                </div>
                            ` : ''}
                            ${this.hintsGiven >= 2 ? `
                                <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-mono fade-in">
                                    <strong>Empieza por:</strong> ${item.romaji.slice(0, 5)}...
                                </div>
                            ` : ''}
                        </div>

                        <!-- Input táctil iPad (font-size 16px para evitar auto-zoom) -->
                        <div class="mb-4">
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tu respuesta (Kana o Romaji):</label>
                            <input 
                                type="text" 
                                id="dictation-input" 
                                class="w-full px-4 py-3.5 text-base bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                                placeholder="Escribe aquí..." 
                                autocomplete="off" 
                                autocapitalize="off" 
                                spellcheck="false"
                                ${this.isEvaluated ? 'disabled' : ''}
                            />
                        </div>
                    </div>

                    <!-- Zona de Feedback / Resolución -->
                    <div id="dictation-feedback-zone">
                        ${!this.isEvaluated ? `
                            <button id="btn-check-dic" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">
                                <i data-lucide="check-circle" class="w-5 h-5"></i> Comprobar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.attachEvents();
    },

    attachEvents() {
        const item = this.state.queue[0];
        const inputEl = document.getElementById('dictation-input');

        document.getElementById('btn-close-dic').addEventListener('click', this.state.onComplete);
        document.getElementById('btn-audio-normal').addEventListener('click', () => this.playCurrentAudio(1.0));
        document.getElementById('btn-audio-slow').addEventListener('click', () => this.playCurrentAudio(0.7));

        document.getElementById('btn-skip-dic').addEventListener('click', () => {
            this.state.queue.shift();
            this.hintsGiven = 0;
            this.isEvaluated = false;
            this.render();
            setTimeout(() => this.playCurrentAudio(1.0), 300);
        });

        document.getElementById('btn-flag-dic').addEventListener('click', (e) => {
            const isActive = this.state.storage.toggleFlag(item.id);
            e.currentTarget.classList.toggle('text-amber-500', isActive);
            e.currentTarget.classList.toggle('text-slate-400', !isActive);
        });

        // Botón de Pistas
        document.getElementById('btn-hint').addEventListener('click', () => {
            if (this.hintsGiven < 2) {
                this.hintsGiven += 1;
                this.render();
                const input = document.getElementById('dictation-input');
                if (input) input.focus();
            }
        });

        // Enviar con Enter del teclado virtual
        inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isEvaluated) {
                this.evaluate(inputEl.value, item);
            }
        });

        document.getElementById('btn-check-dic')?.addEventListener('click', () => {
            this.evaluate(inputEl?.value || '', item);
        });
    },

    evaluate(userInput, item) {
        const isCorrect = this.checkAnswer(userInput, item);
        this.isEvaluated = true;

        if (navigator.vibrate) {
            navigator.vibrate(isCorrect ? [40] : [80, 50, 80]);
        }

        const feedbackZone = document.getElementById('dictation-feedback-zone');
        const inputEl = document.getElementById('dictation-input');

        if (isCorrect) {
            inputEl?.classList.replace('border-slate-200', 'border-emerald-500');
            inputEl?.classList.add('bg-emerald-50');
            feedbackZone.innerHTML = `
                <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl mb-3 text-emerald-800 fade-in">
                    <div class="flex items-center gap-2 font-bold mb-1">
                        <i data-lucide="check" class="w-4 h-4 text-emerald-600"></i> ¡Perfecto!
                    </div>
                    <div class="text-xl font-medium mb-1">${item.furigana}</div>
                    <div class="text-xs font-mono text-emerald-600">${item.romaji}</div>
                </div>
                <button id="btn-next-dic" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm active:scale-95 transition-all">
                    Continuar
                </button>
            `;
        } else {
            inputEl?.classList.replace('border-slate-200', 'border-rose-400');
            inputEl?.classList.add('bg-rose-50');
            feedbackZone.innerHTML = `
                <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-3 text-rose-800 fade-in">
                    <div class="flex items-center gap-2 font-bold mb-1">
                        <i data-lucide="x" class="w-4 h-4 text-rose-600"></i> No coincide
                    </div>
                    <div class="text-sm text-slate-600 mb-1">Solución:</div>
                    <div class="text-xl font-medium mb-1">${item.furigana}</div>
                    <div class="text-xs font-mono text-rose-600 mb-1">${item.romaji}</div>
                    <div class="text-xs text-slate-500">${item.es}</div>
                </div>
                <button id="btn-next-dic" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm active:scale-95 transition-all">
                    Entendido, siguiente
                </button>
            `;
        }
        lucide.createIcons();

        document.getElementById('btn-next-dic').addEventListener('click', () => {
            this.handleFeedback(isCorrect);
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

        this.hintsGiven = 0;
        this.isEvaluated = false;
        this.render();
        setTimeout(() => this.playCurrentAudio(1.0), 300);
    }
};