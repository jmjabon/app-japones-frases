export const SlotMode = {
    state: null,
    timerId: null,
    timeLeft: 5,

    async start(config) {
        this.state = config;
        try {
            const resp = await fetch('./data/templates.json');
            this.state.templates = await resp.json();
            this.nextChallenge();
        } catch (e) {
            alert('Error cargando templates.json');
            this.state.onComplete();
        }
    },

    nextChallenge() {
        if (this.timerId) clearInterval(this.timerId);

        // Elegir plantilla y slot al azar
        const tpl = this.state.templates[Math.floor(Math.random() * this.state.templates.length)];
        const slot = tpl.slots[Math.floor(Math.random() * tpl.slots.length)];

        this.current = {
            tpl,
            slot,
            esFull: tpl.es_pattern.replace('{slot}', slot.es),
            jaFull: tpl.ja_pattern.replace('{slot}', slot.ja),
            romajiFull: tpl.romaji_pattern.replace('{slot}', slot.romaji),
            furiganaFull: tpl.ja_pattern.replace('{slot}', slot.furigana)
        };

        this.timeLeft = 5;
        this.isRevealed = false;
        this.render();
        this.startTimer();
    },

    startTimer() {
        const timerBar = document.getElementById('timer-bar');
        const timerText = document.getElementById('timer-text');
        
        this.timerId = setInterval(() => {
            this.timeLeft -= 1;
            if (timerText) timerText.textContent = `${this.timeLeft}s`;
            if (timerBar) timerBar.style.width = `${(this.timeLeft / 5) * 100}%`;

            if (this.timeLeft <= 0) {
                clearInterval(this.timerId);
                this.revealAnswer();
            }
        }, 1000);
    },

    revealAnswer() {
        if (this.timerId) clearInterval(this.timerId);
        this.isRevealed = true;
        this.render();
        this.state.audio.play(this.current.jaFull);
    },

    render() {
        const c = this.current;

        this.state.container.innerHTML = `
            <div class="fade-in max-w-md mx-auto flex flex-col h-[75vh]">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Sustitución Rápida</span>
                    <button id="btn-close-slot" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                </div>

                <!-- Temporizador Superior -->
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
                    <div id="timer-bar" class="bg-amber-500 h-full transition-all duration-1000 ease-linear" style="width: ${(this.timeLeft / 5) * 100}%"></div>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">${c.tpl.isla}</span>
                            <span id="timer-text" class="text-xs font-mono font-bold text-slate-400">${this.isRevealed ? '¡Tiempo!' : `${this.timeLeft}s`}</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-800 mb-2">${c.esFull}</h3>
                        <p class="text-xs text-slate-500 mb-6">Di en voz alta la frase antes de que acabe el tiempo:</p>

                        <!-- Indicador visual de la pieza a cambiar -->
                        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <span class="text-[10px] uppercase font-bold text-amber-700 block">Pieza a sustituir</span>
                                <span class="text-base font-bold text-amber-900">${c.slot.es}</span>
                            </div>
                            <span class="text-xl font-bold text-amber-600">${c.slot.ja}</span>
                        </div>
                    </div>

                    <!-- Respuesta revelada -->
                    <div class="my-auto py-4 text-center ${this.isRevealed ? 'fade-in' : 'opacity-0 select-none'}">
                        <div class="text-3xl font-medium text-slate-800 mb-2 leading-relaxed">${c.furiganaFull}</div>
                        <div class="romaji-text text-sm font-mono text-slate-500">${c.romajiFull}</div>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="pt-2">
                        ${!this.isRevealed ? `
                            <button id="btn-reveal" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-sm active:scale-95 transition-all">
                                Revelar Solución
                            </button>
                        ` : `
                            <div class="grid grid-cols-2 gap-3">
                                <button id="btn-slot-fail" class="py-3.5 bg-rose-100 text-rose-700 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                                    <i data-lucide="x"></i> Me costó
                                </button>
                                <button id="btn-slot-pass" class="py-3.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                                    <i data-lucide="check"></i> ¡Dicho a tiempo!
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.attachEvents();
    },

    attachEvents() {
        document.getElementById('btn-close-slot').addEventListener('click', () => {
            if (this.timerId) clearInterval(this.timerId);
            this.state.onComplete();
        });

        const revealBtn = document.getElementById('btn-reveal');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.revealAnswer());
        }

        const failBtn = document.getElementById('btn-slot-fail');
        const passBtn = document.getElementById('btn-slot-pass');

        if (failBtn && passBtn) {
            failBtn.addEventListener('click', () => this.nextChallenge());
            passBtn.addEventListener('click', () => this.nextChallenge());
        }
    }
};