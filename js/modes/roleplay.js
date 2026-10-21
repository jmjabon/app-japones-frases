export const RoleplayMode = {
    state: null,
    scenarios: [],
    currentIndex: 0,
    selectedOption: null,

    async start(config) {
        this.state = config;
        this.currentIndex = 0;
        this.selectedOption = null;

        try {
            const resp = await fetch('./data/roleplay.json');
            this.scenarios = await resp.json();
            this.render();
        } catch (e) {
            alert('Error cargando roleplay.json');
            this.state.onComplete();
        }
    },

    render() {
        if (this.currentIndex >= this.scenarios.length) {
            this.renderFinished();
            return;
        }

        const item = this.scenarios[this.currentIndex];

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[82vh]">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Simulador de Diálogo (${this.currentIndex + 1}/${this.scenarios.length})</span>
                    <button id="btn-close-rp" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
                    <div>
                        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">${item.escenario}</div>
                        <p class="text-sm font-medium text-slate-600 mb-4">${item.contexto}</p>

                        <!-- Burbuja de audio nativo -->
                        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 relative">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <i data-lucide="user-voice" class="w-4 h-4 text-indigo-500"></i> ${item.hablante}:
                                </span>
                                <div class="flex gap-2">
                                    <button id="btn-audio-slow" class="px-2 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg active:scale-95">0.7x</button>
                                    <button id="btn-audio-normal" class="p-1.5 bg-indigo-600 text-white rounded-lg active:scale-95"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                            <p class="text-lg font-medium text-slate-800 mb-1">${item.audio_prompt}</p>
                            <p class="romaji-text text-xs font-mono text-slate-400 mb-1">${item.prompt_romaji}</p>
                            <p class="text-xs text-slate-500 italic border-t border-slate-200/60 pt-1.5 mt-2">${item.prompt_es}</p>
                        </div>

                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">¿Cómo respondes?</label>
                    </div>

                    <!-- Lista de opciones de respuesta -->
                    <div class="space-y-2.5 my-2">
                        ${item.opciones.map((opt, idx) => `
                            <button class="opt-rp-btn w-full text-left p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] ${this.selectedOption ? (opt.correcta ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60') : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'}" data-idx="${idx}" ${this.selectedOption ? 'disabled' : ''}>
                                <div class="text-base font-semibold leading-snug">${opt.ja}</div>
                                <div class="romaji-text text-xs font-mono text-slate-500 mt-0.5">${opt.romaji}</div>
                                <div class="text-xs text-slate-600 mt-1">${opt.es}</div>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Mensaje de Feedback -->
                    <div id="rp-feedback-zone">
                        ${this.selectedOption ? `
                            <div class="p-3.5 rounded-2xl ${this.selectedOption.correcta ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'} mb-3 text-xs leading-relaxed">
                                <strong>${this.selectedOption.correcta ? '¡Correcto!' : 'Mejorable:'}</strong> ${this.selectedOption.feedback}
                            </div>
                            <button id="btn-next-rp" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm active:scale-95 transition-all">
                                Siguiente Situación
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
        const item = this.scenarios[this.currentIndex];

        document.getElementById('btn-close-rp').addEventListener('click', this.state.onComplete);
        document.getElementById('btn-audio-normal').addEventListener('click', () => this.state.audio.play(item.audio_prompt, 1.0));
        document.getElementById('btn-audio-slow').addEventListener('click', () => this.state.audio.play(item.audio_prompt, 0.7));

        document.querySelectorAll('.opt-rp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                this.selectedOption = item.opciones[idx];
                
                // Reproducir el audio de la respuesta elegida
                this.state.audio.play(this.selectedOption.ja);
                this.render();
            });
        });

        const nextBtn = document.getElementById('btn-next-rp');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentIndex += 1;
                this.selectedOption = null;
                this.render();
            });
        }
    },

    renderFinished() {
        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-12">
                <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="check-check" class="w-8 h-8"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-800 mb-2">¡Simulación Completada!</h3>
                <p class="text-slate-500 text-sm mb-6">Has superado todas las situaciones preparadas para esta sesión.</p>
                <button id="btn-finish-rp" class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all">
                    Volver al Menú
                </button>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('btn-finish-rp').addEventListener('click', this.state.onComplete);
    }
};