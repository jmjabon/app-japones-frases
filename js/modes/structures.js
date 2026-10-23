export const StructuresMode = {
    state: null,
    templates: [],
    timerId: null,
    timeLeft: 5,
    drillQueue: [],
    currentDrill: null,

    async start(config) {
        this.state = config;
        try {
            const resp = await fetch('./data/templates.json');
            this.templates = await resp.json();
            this.renderHub();
        } catch (e) {
            console.error('Error cargando templates:', e);
            this.state.onComplete();
        }
    },

    // 1. PANTALLA INTERMEDIA (HUB DE ESTRUCTURAS)
    renderHub() {
        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[85vh]">
                <div class="flex justify-between items-center mb-6">
                    <button id="btn-back-hub" class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><i data-lucide="arrow-left"></i></button>
                    <h2 class="text-xl font-bold text-slate-800">Estructuras</h2>
                    <div class="w-8"></div>
                </div>

                <div class="space-y-4">
                    <button id="btn-guided-tpl" class="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-left active:scale-95 transition-transform flex gap-4">
                        <div class="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center shrink-0">
                            <i data-lucide="book-open" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 text-lg">Estudio de Plantillas</h3>
                            <p class="text-sm text-slate-500 mt-1">Explora la gramática visualmente y memoriza el vocabulario clave por categorías.</p>
                        </div>
                    </button>

                    <button id="btn-practice-tpl" class="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-left active:scale-95 transition-transform flex gap-4">
                        <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                            <i data-lucide="zap" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 text-lg">Práctica Flexible</h3>
                            <p class="text-sm text-slate-500 mt-1">Entrena tu velocidad de reacción mental sustituyendo piezas en tiempo real.</p>
                        </div>
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('btn-back-hub').addEventListener('click', this.state.onComplete);
        document.getElementById('btn-guided-tpl').addEventListener('click', () => this.renderGuided());
        document.getElementById('btn-practice-tpl').addEventListener('click', () => this.renderPracticeConfig());
    },

    // 2. ESTUDIO GUIADO (PLANTILLAS)
    renderGuided() {
        this.state.container.innerHTML = `
            <div class="fade-in max-w-2xl mx-auto flex flex-col h-[85vh]">
                <div class="flex items-center gap-4 mb-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <button id="btn-back-guided-tpl" class="p-2 text-slate-500"><i data-lucide="arrow-left"></i></button>
                    <h2 class="font-bold text-slate-800">Guía de Estructuras</h2>
                </div>
                
                <div class="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-10">
                    ${this.templates.map((tpl, i) => `
                        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <div class="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mb-1">${tpl.isla}</div>
                            
                            <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4 text-center">
                                <div class="text-xl font-bold text-indigo-900 tracking-wide">${tpl.formula}</div>
                            </div>
                            
                            <p class="text-sm text-slate-600 mb-4 px-2 leading-relaxed"><i data-lucide="info" class="inline w-4 h-4 text-slate-400 mb-0.5"></i> ${tpl.explicacion}</p>
                            
                            <details class="group bg-slate-50 border border-slate-200 rounded-xl">
                                <summary class="p-4 font-bold text-slate-700 cursor-pointer flex justify-between items-center list-none">
                                    Ver ${tpl.slots.length} opciones de vocabulario
                                    <i data-lucide="chevron-down" class="text-slate-400 group-open:rotate-180 transition-transform"></i>
                                </summary>
                                <div class="p-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                    ${tpl.slots.map(s => `
                                        <div class="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-300" onclick="AudioPlayer.play('${tpl.ja_pattern.replace('{slot}', s.ja)}')">
                                            <div>
                                                <div class="text-[9px] font-bold text-slate-400 uppercase">${s.categoria}</div>
                                                <div class="text-sm font-semibold text-slate-700">${s.es}</div>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-lg text-slate-800">${s.furigana}</div>
                                                <div class="romaji-text text-xs text-slate-400">${s.romaji}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </details>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('btn-back-guided-tpl').addEventListener('click', () => this.renderHub());
    },

    // 3. CONFIGURADOR DE PRÁCTICA
    renderPracticeConfig() {
        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[85vh]">
                <div class="flex items-center gap-4 mb-6">
                    <button id="btn-back-cfg" class="p-2 text-slate-500 bg-white rounded-xl shadow-sm"><i data-lucide="arrow-left"></i></button>
                    <h2 class="font-bold text-slate-800 text-lg">Configurar Práctica</h2>
                </div>

                <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-3">1. Selecciona estructuras</label>
                        <div class="space-y-2">
                            ${this.templates.map((tpl, i) => `
                                <label class="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                                    <input type="checkbox" value="${tpl.id}" class="tpl-checkbox w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" checked>
                                    <span class="ml-3 font-semibold text-slate-700">${tpl.formula}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-3">2. Exigencia Cognitiva</label>
                        <select id="drill-level" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 font-medium outline-none">
                            <option value="1">Nivel 1: Familiarización (Muestra pista en japonés)</option>
                            <option value="2" selected>Nivel 2: Producción (Solo español, tú evocas el japonés)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-3">3. Volumen (Sustituciones)</label>
                        <select id="drill-size" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 font-medium outline-none">
                            <option value="5">5 turnos rápidos</option>
                            <option value="10" selected>10 turnos (Estándar)</option>
                            <option value="20">20 turnos (Intenso)</option>
                        </select>
                    </div>

                    <button id="btn-start-drill" class="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 mt-4">
                        <i data-lucide="play" class="w-5 h-5"></i> Iniciar Entrenamiento
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('btn-back-cfg').addEventListener('click', () => this.renderHub());
        
        document.getElementById('btn-start-drill').addEventListener('click', () => {
            const selectedIds = Array.from(document.querySelectorAll('.tpl-checkbox:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) return alert('Selecciona al menos una estructura.');
            
            const level = parseInt(document.getElementById('drill-level').value);
            const size = parseInt(document.getElementById('drill-size').value);
            
            // Generar la pool barajando todas las opciones de los templates seleccionados
            let pool = [];
            const activeTemplates = this.templates.filter(t => selectedIds.includes(t.id));
            activeTemplates.forEach(tpl => {
                tpl.slots.forEach(slot => pool.push({ tpl, slot }));
            });
            
            pool = pool.sort(() => Math.random() - 0.5);
            this.drillQueue = pool.slice(0, size);
            this.drillLevel = level;
            
            this.nextDrill();
        });
    },

    // 4. MOTOR DE PRÁCTICA (DRILL)
    nextDrill() {
        if (this.timerId) clearInterval(this.timerId);
        
        if (this.drillQueue.length === 0) {
            this.renderHub(); // Al terminar vuelve al Hub central
            return;
        }

        const data = this.drillQueue[0];
        this.currentDrill = {
            ...data,
            esFull: data.tpl.es_pattern.replace('{slot}', data.slot.es),
            jaFull: data.tpl.ja_pattern.replace('{slot}', data.slot.ja),
            romajiFull: data.tpl.romaji_pattern.replace('{slot}', data.slot.romaji),
            furiganaFull: data.tpl.ja_pattern.replace('{slot}', data.slot.furigana)
        };

        this.timeLeft = 5;
        this.isRevealed = false;
        this.renderDrillCard();
        this.startTimer();
    },

    startTimer() {
        const bar = document.getElementById('drill-timer-bar');
        const txt = document.getElementById('drill-timer-text');
        
        this.timerId = setInterval(() => {
            this.timeLeft -= 1;
            if (txt) txt.textContent = `${this.timeLeft}s`;
            if (bar) bar.style.width = `${(this.timeLeft / 5) * 100}%`;

            if (this.timeLeft <= 0) {
                clearInterval(this.timerId);
                this.revealDrill();
            }
        }, 1000);
    },

    revealDrill() {
        if (this.timerId) clearInterval(this.timerId);
        this.isRevealed = true;
        this.renderDrillCard();
        this.state.audio.play(this.currentDrill.jaFull);
    },

    renderDrillCard() {
        const c = this.currentDrill;

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[75vh]">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Sustitución (${this.drillQueue.length} restantes)
                    </span>
                    <button id="btn-close-drill" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                </div>

                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
                    <div id="drill-timer-bar" class="bg-amber-500 h-full transition-all duration-1000 ease-linear" style="width: ${(this.timeLeft / 5) * 100}%"></div>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">${c.slot.categoria}</span>
                            <span id="drill-timer-text" class="text-xs font-mono font-bold text-slate-400">${this.isRevealed ? '¡Tiempo!' : `${this.timeLeft}s`}</span>
                        </div>
                        
                        <h3 class="text-xl font-bold text-slate-800 mb-6">${c.esFull}</h3>

                        <!-- ANDAMIAJE COGNITIVO SEGÚN NIVEL -->
                        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] text-center">
                            <span class="text-[10px] uppercase font-bold text-amber-700 mb-1">Pieza a insertar</span>
                            <span class="text-lg font-bold text-amber-900">${c.slot.es}</span>
                            ${this.drillLevel === 1 ? `
                                <div class="mt-2 text-2xl font-bold text-amber-600">${c.slot.furigana}</div>
                                <div class="romaji-text text-xs text-amber-500/80 font-mono">${c.slot.romaji}</div>
                            ` : `<div class="mt-2 text-xs font-semibold text-amber-600/50">Nivel 2: Produce tú el japonés</div>`}
                        </div>
                    </div>

                    <!-- RESPUESTA (Oculta hasta agotar tiempo o pulsar) -->
                    <div class="my-auto py-4 text-center ${this.isRevealed ? 'fade-in' : 'opacity-0 select-none'}">
                        <div class="text-3xl font-medium text-slate-800 mb-2 leading-relaxed">${c.furiganaFull}</div>
                        <div class="romaji-text text-sm font-mono text-slate-500">${c.romajiFull}</div>
                    </div>

                    <div class="pt-2">
                        ${!this.isRevealed ? `
                            <button id="btn-drill-reveal" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all">
                                Revelar Solución
                            </button>
                        ` : `
                            <button id="btn-drill-next" class="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all flex justify-center items-center gap-2">
                                Siguiente Frase <i data-lucide="arrow-right" class="w-5 h-5"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('btn-close-drill')?.addEventListener('click', () => {
            if (this.timerId) clearInterval(this.timerId);
            this.renderHub();
        });

        document.getElementById('btn-drill-reveal')?.addEventListener('click', () => this.revealDrill());
        
        document.getElementById('btn-drill-next')?.addEventListener('click', () => {
            this.drillQueue.shift();
            this.nextDrill();
        });
    }
};