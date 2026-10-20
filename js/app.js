import { StorageManager } from './storage.js';
import { AudioPlayer } from './audio.js';

// Estado de la aplicación
const State = {
    isFuriganaActive: true,
    isRomajiActive: true,
    activeIslands: [],
    sessionQueue: [],
    currentCardIndex: 0
};

// Referencias del DOM
const DOM = {
    container: document.getElementById('app-container'),
    toggleFurigana: document.getElementById('toggle-furigana'),
    toggleRomaji: document.getElementById('toggle-romaji')
};

// Inicialización
async function initApp() {
    await StorageManager.loadVocab();
    AudioPlayer.init();
    State.activeIslands = StorageManager.getIslands(); // Seleccionar todas por defecto
    
    setupGlobalListeners();
    renderMainMenu();
    
    // Si hay un Service Worker, registrarlo
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
    }
}

function setupGlobalListeners() {
    DOM.toggleFurigana.addEventListener('click', () => {
        State.isFuriganaActive = !State.isFuriganaActive;
        document.body.classList.toggle('hide-furigana', !State.isFuriganaActive);
        DOM.toggleFurigana.textContent = `Furigana: ${State.isFuriganaActive ? 'ON' : 'OFF'}`;
        DOM.toggleFurigana.classList.toggle('bg-slate-300', !State.isFuriganaActive);
    });

    DOM.toggleRomaji.addEventListener('click', () => {
        State.isRomajiActive = !State.isRomajiActive;
        document.body.classList.toggle('hide-romaji', !State.isRomajiActive);
        DOM.toggleRomaji.textContent = `Romaji: ${State.isRomajiActive ? 'ON' : 'OFF'}`;
        DOM.toggleRomaji.classList.toggle('bg-slate-300', !State.isRomajiActive);
    });
}

function renderMainMenu() {
    const islands = StorageManager.getIslands();
    
    DOM.container.innerHTML = `
        <div class="fade-in max-w-md mx-auto space-y-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Configurar Sesión</h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-slate-600 mb-2">Islas Lingüísticas</label>
                    <details class="group bg-slate-50 rounded-xl border border-slate-200">
                        <summary class="p-3 font-medium text-slate-700 cursor-pointer list-none flex justify-between items-center">
                            <span>${State.activeIslands.length} de ${islands.length} seleccionadas</span>
                            <i data-lucide="chevron-down" class="text-slate-400 group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <div class="p-3 border-t border-slate-200 flex flex-wrap gap-2">
                            ${islands.map(isla => `
                                <button class="isla-btn px-3 py-1 rounded-full text-sm font-medium ${State.activeIslands.includes(isla) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'} border transition-colors" data-isla="${isla}">
                                    ${isla}
                                </button>
                            `).join('')}
                        </div>
                    </details>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-semibold text-slate-600 mb-2">Frases por sesión</label>
                    <select id="session-size" class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 outline-none focus:border-indigo-500">
                        <option value="5">5 frases (Rápida)</option>
                        <option value="10" selected>10 frases (Estándar)</option>
                        <option value="15">15 frases (Intensa)</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <button id="btn-start-guided" class="bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                        <i data-lucide="book-open"></i> Estudio Guiado
                    </button>
                    <button id="btn-start-cards" class="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                        <i data-lucide="layers"></i> Tarjetas
                    </button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Event Listeners del menú
    document.querySelectorAll('.isla-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const isla = e.target.dataset.isla;
            if (State.activeIslands.includes(isla)) {
                State.activeIslands = State.activeIslands.filter(i => i !== isla);
                e.target.classList.replace('bg-indigo-100', 'bg-white');
                e.target.classList.replace('text-indigo-700', 'text-slate-500');
            } else {
                State.activeIslands.push(isla);
                e.target.classList.replace('bg-white', 'bg-indigo-100');
                e.target.classList.replace('text-slate-500', 'text-indigo-700');
            }
            document.querySelector('summary span').textContent = `${State.activeIslands.length} de ${islands.length} seleccionadas`;
        });
    });

    document.getElementById('btn-start-cards').addEventListener('click', () => {
        const size = parseInt(document.getElementById('session-size').value);
        State.sessionQueue = StorageManager.generateSession(State.activeIslands, size);
        if (State.sessionQueue.length > 0) renderCardMode();
        else alert('No hay frases en las islas seleccionadas.');
    });
}

function renderCardMode() {
    if (State.sessionQueue.length === 0) {
        renderMainMenu();
        return;
    }

    const item = State.sessionQueue[0];
    const isFlagged = StorageManager.flags.includes(item.id);

    DOM.container.innerHTML = `
        <div class="fade-in max-w-md mx-auto flex flex-col h-[70vh]">
            <div class="flex justify-between items-center mb-4">
                <span class="text-sm font-semibold text-slate-500">${State.sessionQueue.length} restantes</span>
                <div class="flex gap-2">
                    <button id="btn-skip" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><i data-lucide="skip-forward"></i></button>
                    <button id="btn-flag" class="p-2 ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} bg-white rounded-full shadow-sm"><i data-lucide="pin"></i></button>
                    <button id="btn-close" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                </div>
            </div>

            <!-- Tarjeta Interactiva -->
            <div class="flex-1 perspective-1000">
                <div id="flashcard" class="relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer">
                    <!-- Anverso (Español) -->
                    <div class="absolute inset-0 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center justify-center p-8 backface-hidden">
                        <span class="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-4">${item.isla}</span>
                        <h3 class="text-2xl font-semibold text-center text-slate-800">${item.es}</h3>
                        <p class="text-slate-400 mt-8 text-sm"><i data-lucide="touchpad" class="inline w-4 h-4 mr-1"></i> Toca para voltear</p>
                    </div>

                    <!-- Reverso (Japonés) -->
                    <div class="absolute inset-0 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180">
                        <button id="btn-audio" class="absolute top-4 right-4 p-3 bg-indigo-50 text-indigo-600 rounded-full active:scale-90 transition-transform">
                            <i data-lucide="volume-2"></i>
                        </button>
                        
                        <div class="text-4xl font-medium text-slate-800 mb-6 text-center leading-relaxed">
                            ${item.furigana}
                        </div>
                        <div class="romaji-text text-lg text-slate-500 font-mono text-center">
                            ${item.romaji}
                        </div>

                        <!-- Botones de Feedback Binario -->
                        <div class="absolute bottom-6 w-full px-6 flex gap-4">
                            <button id="btn-wrong" class="flex-1 bg-rose-100 text-rose-700 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-transform flex justify-center items-center gap-2">
                                <i data-lucide="x"></i> No la sé
                            </button>
                            <button id="btn-correct" class="flex-1 bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-transform flex justify-center items-center gap-2">
                                <i data-lucide="check"></i> Me la sé
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Lógica de UI interactiva
    const card = document.getElementById('flashcard');
    let isFlipped = false;

    card.addEventListener('click', (e) => {
        if (!isFlipped && !e.target.closest('button')) {
            card.style.transform = 'rotateY(180deg)';
            isFlipped = true;
            AudioPlayer.play(item.ja);
        }
    });

    document.getElementById('btn-audio').addEventListener('click', (e) => {
        e.stopPropagation();
        AudioPlayer.play(item.ja);
    });

    document.getElementById('btn-close').addEventListener('click', renderMainMenu);
    
    document.getElementById('btn-skip').addEventListener('click', () => {
        State.sessionQueue.shift(); // Eliminar de la cola sin penalizar
        renderCardMode();
    });

    document.getElementById('btn-flag').addEventListener('click', (e) => {
        const isActive = StorageManager.toggleFlag(item.id);
        e.currentTarget.classList.toggle('text-amber-500', isActive);
        e.currentTarget.classList.toggle('text-slate-400', !isActive);
    });

    // Lógica Leitner y Re-encolado
    const handleFeedback = (isCorrect) => {
        StorageManager.updateWeight(item.id, isCorrect);
        const currentItem = State.sessionQueue.shift();
        
        if (!isCorrect) {
            // Reinsertar en la cola si se falla (a 3 posiciones de distancia o al final si hay menos)
            const insertIndex = Math.min(3, State.sessionQueue.length);
            State.sessionQueue.splice(insertIndex, 0, currentItem);
        }
        
        // Animación de salida y siguiente
        card.style.opacity = '0';
        setTimeout(renderCardMode, 200);
    };

    document.getElementById('btn-wrong').addEventListener('click', (e) => {
        e.stopPropagation();
        handleFeedback(false);
    });

    document.getElementById('btn-correct').addEventListener('click', (e) => {
        e.stopPropagation();
        handleFeedback(true);
    });
}

// Arrancar
document.addEventListener('DOMContentLoaded', initApp);