import { StorageManager } from './storage.js';
import { AudioPlayer } from './audio.js';
import { ScrambleMode } from './modes/scramble.js';
import { ClozeMode } from './modes/cloze.js';
import { SlotMode } from './modes/slot.js';
import { RoleplayMode } from './modes/roleplay.js';
import { DictationMode } from './modes/dictation.js';

const State = {
    isFuriganaActive: true,
    isRomajiActive: true,
    activeIslands: [],
    sessionQueue: [],
    blindEs: false, // Persiana Ocultar Español
    blindJa: false  // Persiana Ocultar Japonés
};

const DOM = {
    container: document.getElementById('app-container'),
    toggleFurigana: document.getElementById('toggle-furigana'),
    toggleRomaji: document.getElementById('toggle-romaji')
};

async function initApp() {
    await StorageManager.loadVocab();
    AudioPlayer.init();
    State.activeIslands = StorageManager.getIslands();
    
    setupGlobalListeners();
    renderMainMenu();
    
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
                        <div class="p-3 border-t border-slate-200 flex flex-wrap gap-2 max-h-60 overflow-y-auto">
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
                        <option value="5">5 frases</option>
                        <option value="10" selected>10 frases</option>
                        <option value="20">20 frases</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-2.5 mb-3">
                    <button id="btn-start-guided" class="bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                        <i data-lucide="book-open" class="w-4 h-4"></i> Guiado
                    </button>
                    <button id="btn-start-cards" class="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                        <i data-lucide="layers" class="w-4 h-4"></i> Tarjetas
                    </button>
                    <button id="btn-start-scramble" class="bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                        <i data-lucide="puzzle" class="w-4 h-4"></i> Ordenar
                    </button>
                    <button id="btn-start-cloze" class="bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                        <i data-lucide="target" class="w-4 h-4"></i> Partículas
                    </button>
                    <button id="btn-start-slot" class="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                        <i data-lucide="zap" class="w-4 h-4"></i> Sustitución
                    </button>
                    <button id="btn-start-roleplay" class="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                        <i data-lucide="messages-square" class="w-4 h-4"></i> Diálogos
                    </button>
                </div>
                <button id="btn-start-dictation" class="w-full mb-3 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 text-sm">
                    <i data-lucide="headphones" class="w-4 h-4"></i> Dictado Auditivo
                </button>
                <button id="btn-open-manager" class="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                    <i data-lucide="database"></i> Gestor de Frases
                </button>
                <button id="btn-open-manager" class="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                    <i data-lucide="database"></i> Gestor de Frases
                </button>
            </div>
        </div>
    `;
    lucide.createIcons();

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
        else alert('Selecciona al menos una isla con frases.');
    });

    document.getElementById('btn-start-guided').addEventListener('click', renderGuidedStudy);
    document.getElementById('btn-open-manager').addEventListener('click', renderPhraseManager);

    document.getElementById('btn-start-scramble').addEventListener('click', () => {
        const size = parseInt(document.getElementById('session-size').value);
        State.sessionQueue = StorageManager.generateSession(State.activeIslands, size);
        if (State.sessionQueue.length > 0) {
            ScrambleMode.start({
                queue: State.sessionQueue,
                storage: StorageManager,
                audio: AudioPlayer,
                container: DOM.container,
                onComplete: renderMainMenu
            });
        } else alert('Selecciona al menos una isla con frases.');
    });

    document.getElementById('btn-start-cloze').addEventListener('click', () => {
        const size = parseInt(document.getElementById('session-size').value);
        State.sessionQueue = StorageManager.generateSession(State.activeIslands, size);
        if (State.sessionQueue.length > 0) {
            ClozeMode.start({
                queue: State.sessionQueue,
                storage: StorageManager,
                audio: AudioPlayer,
                container: DOM.container,
                onComplete: renderMainMenu
            });
        } else alert('Selecciona al menos una isla con frases.');
    });

    document.getElementById('btn-start-slot').addEventListener('click', () => {
        SlotMode.start({
            container: DOM.container,
            audio: AudioPlayer,
            onComplete: renderMainMenu
        });
    });

    document.getElementById('btn-start-roleplay').addEventListener('click', () => {
        RoleplayMode.start({
            container: DOM.container,
            audio: AudioPlayer,
            onComplete: renderMainMenu
        });
    });

    document.getElementById('btn-start-dictation').addEventListener('click', () => {
        const size = parseInt(document.getElementById('session-size').value);
        State.sessionQueue = StorageManager.generateSession(State.activeIslands, size);
        if (State.sessionQueue.length > 0) {
            DictationMode.start({
                queue: State.sessionQueue,
                storage: StorageManager,
                audio: AudioPlayer,
                container: DOM.container,
                onComplete: renderMainMenu
            });
        } else alert('Selecciona al menos una isla con frases.');
    });
}

// ====== MÓDULO 1: ESTUDIO GUIADO ======
function renderGuidedStudy() {
    const pool = StorageManager.vocabData.filter(item => State.activeIslands.includes(item.isla));
    
    if (pool.length === 0) return alert('No hay frases en las islas seleccionadas.');

    DOM.container.innerHTML = `
        <div class="fade-in max-w-2xl mx-auto flex flex-col h-[85vh]">
            <div class="flex justify-between items-center mb-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <button id="btn-back-guided" class="p-2 text-slate-500 hover:text-slate-800"><i data-lucide="arrow-left"></i></button>
                <div class="flex gap-2">
                    <button id="btn-blind-es" class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${State.blindEs ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}">Ocultar ES</button>
                    <button id="btn-blind-ja" class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${State.blindJa ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}">Ocultar JP</button>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-10">
                ${pool.map(item => `
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative group">
                        <button class="btn-play-audio absolute top-4 right-4 p-3 text-indigo-500 bg-indigo-50 rounded-full active:scale-90 transition-transform" data-text="${item.ja}">
                            <i data-lucide="volume-2" class="w-5 h-5"></i>
                        </button>
                        <div class="mb-3 pr-12">
                            <p class="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mb-1">${item.isla}</p>
                            <h4 class="text-lg font-medium text-slate-800 transition-opacity ${State.blindEs ? 'opacity-0 select-none active:opacity-100' : ''}">${item.es}</h4>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 transition-opacity ${State.blindJa ? 'opacity-0 select-none active:opacity-100' : ''}">
                            <div class="text-3xl text-slate-800 mb-3 leading-tight">${item.furigana}</div>
                            <div class="romaji-text text-slate-500 font-mono text-sm">${item.romaji}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lucide.createIcons();

    document.getElementById('btn-back-guided').addEventListener('click', renderMainMenu);
    
    document.getElementById('btn-blind-es').addEventListener('click', () => {
        State.blindEs = !State.blindEs;
        renderGuidedStudy();
    });
    
    document.getElementById('btn-blind-ja').addEventListener('click', () => {
        State.blindJa = !State.blindJa;
        renderGuidedStudy();
    });

    document.querySelectorAll('.btn-play-audio').forEach(btn => {
        btn.addEventListener('click', (e) => AudioPlayer.play(e.currentTarget.dataset.text));
    });
}

// ====== MÓDULO 2: GESTOR DE FRASES (CRUD) ======
function renderPhraseManager() {
    let searchTerm = '';
    let showOnlyFlagged = false;

    DOM.container.innerHTML = `
        <div class="fade-in max-w-2xl mx-auto flex flex-col h-[85vh]">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col gap-3">
                <div class="flex justify-between items-center">
                    <button id="btn-back-mgr" class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><i data-lucide="arrow-left"></i></button>
                    <h2 class="text-lg font-bold text-slate-800">Gestor de Frases</h2>
                </div>
                <div class="flex gap-2">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                        <input type="text" id="search-input" placeholder="Buscar frase..." class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                    </div>
                    <button id="btn-filter-flagged" class="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl transition-colors" title="Solo marcadas">
                        <i data-lucide="pin" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
            <div id="phrase-list-container" class="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-10"></div>
        </div>
        <!-- Modal Editor -->
        <div id="edit-modal" class="hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"></div>
    `;
    lucide.createIcons();

    document.getElementById('btn-back-mgr').addEventListener('click', renderMainMenu);
    
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        updateListDOM();
    });

    document.getElementById('btn-filter-flagged').addEventListener('click', (e) => {
        showOnlyFlagged = !showOnlyFlagged;
        e.currentTarget.classList.toggle('bg-amber-100', showOnlyFlagged);
        e.currentTarget.classList.toggle('text-amber-600', showOnlyFlagged);
        updateListDOM();
    });

    const updateListDOM = () => {
        let filtered = StorageManager.vocabData;
        if (showOnlyFlagged) filtered = filtered.filter(item => StorageManager.flags.includes(item.id));
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.es.toLowerCase().includes(searchTerm) || 
                item.ja.includes(searchTerm) || 
                item.romaji.toLowerCase().includes(searchTerm)
            );
        }

        const container = document.getElementById('phrase-list-container');
        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-400 mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">No se encontraron frases</div>`;
            return;
        }

        container.innerHTML = filtered.map(item => `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group">
                <div class="flex-1 pr-4">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">${item.isla}</span>
                        ${StorageManager.flags.includes(item.id) ? '<i data-lucide="pin" class="w-3 h-3 text-amber-500 fill-amber-500"></i>' : ''}
                    </div>
                    <p class="font-medium text-slate-800">${item.es}</p>
                    <p class="text-sm text-slate-500 mt-1 truncate">${item.ja}</p>
                </div>
                <button class="btn-edit-phrase p-2.5 bg-slate-50 text-slate-400 rounded-xl active:scale-90 transition-transform" data-id="${item.id}">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
        
        lucide.createIcons({ root: container });

        container.querySelectorAll('.btn-edit-phrase').forEach(btn => {
            btn.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.id, updateListDOM));
        });
    };

    updateListDOM();
}

function openEditModal(id, reloadCallback) {
    const item = StorageManager.vocabData.find(i => i.id === id);
    if (!item) return;
    
    const modal = document.getElementById('edit-modal');
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 transform transition-all fade-in">
            <h3 class="font-bold text-lg text-slate-800">Editar Frase</h3>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Isla Lingüística</label>
                    <input type="text" id="edit-isla" value="${item.isla}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Español</label>
                    <input type="text" id="edit-es" value="${item.es}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Japonés</label>
                    <input type="text" id="edit-ja" value="${item.ja}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Furigana (HTML)</label>
                    <input type="text" id="edit-furigana" value="${item.furigana.replace(/"/g, '&quot;')}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Romaji</label>
                    <input type="text" id="edit-romaji" value="${item.romaji}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500">
                </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button id="btn-cancel-edit" class="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                <button id="btn-save-edit" class="px-5 py-2.5 text-white bg-indigo-600 rounded-xl font-bold">Guardar</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });
    
    document.getElementById('btn-save-edit').addEventListener('click', () => {
        const newData = {
            isla: document.getElementById('edit-isla').value,
            es: document.getElementById('edit-es').value,
            ja: document.getElementById('edit-ja').value,
            furigana: document.getElementById('edit-furigana').value,
            romaji: document.getElementById('edit-romaji').value
        };
        
        StorageManager.updatePhrase(id, newData);
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        reloadCallback(); // Refrescar la lista automáticamente
    });
}

// ====== MÓDULO 3: TARJETAS ======
function renderCardMode() {
    // [Nota: Aquí se mantiene todo el código de las Tarjetas Interactivas que ya teníamos en la versión anterior. 
    // Lo dejo oculto para no alargar la respuesta, pero no ha sufrido cambios].
    
    if (State.sessionQueue.length === 0) {
        renderMainMenu();
        return;
    }

    const item = State.sessionQueue[0];
    const isFlagged = StorageManager.flags.includes(item.id);

    DOM.container.innerHTML = `
        <div class="fade-in max-w-md mx-auto flex flex-col h-[75vh]">
            <div class="flex justify-between items-center mb-4">
                <span class="text-sm font-semibold text-slate-500">${State.sessionQueue.length} restantes</span>
                <div class="flex gap-2">
                    <button id="btn-skip" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><i data-lucide="skip-forward"></i></button>
                    <button id="btn-flag" class="p-2 ${isFlagged ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} bg-white rounded-full shadow-sm"><i data-lucide="pin"></i></button>
                    <button id="btn-close" class="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm"><i data-lucide="x"></i></button>
                </div>
            </div>

            <div class="flex-1 perspective-1000">
                <div id="flashcard" class="relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer">
                    <div class="absolute inset-0 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center justify-center p-8 backface-hidden">
                        <span class="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-4">${item.isla}</span>
                        <h3 class="text-2xl font-semibold text-center text-slate-800">${item.es}</h3>
                        <p class="text-slate-400 mt-8 text-sm flex items-center gap-1"><i data-lucide="touchpad" class="w-4 h-4"></i> Toca para voltear</p>
                    </div>

                    <div class="absolute inset-0 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180">
                        <button id="btn-audio" class="absolute top-4 right-4 p-3 bg-indigo-50 text-indigo-600 rounded-full active:scale-90 transition-transform">
                            <i data-lucide="volume-2"></i>
                        </button>
                        
                        <div class="text-4xl font-medium text-slate-800 mb-6 text-center leading-relaxed">
                            ${item.furigana}
                        </div>
                        <div class="romaji-text text-lg text-slate-500 font-mono text-center mb-16">
                            ${item.romaji}
                        </div>

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
        State.sessionQueue.shift(); 
        renderCardMode();
    });

    document.getElementById('btn-flag').addEventListener('click', (e) => {
        const isActive = StorageManager.toggleFlag(item.id);
        e.currentTarget.classList.toggle('text-amber-500', isActive);
        e.currentTarget.classList.toggle('text-slate-400', !isActive);
    });

    const handleFeedback = (isCorrect) => {
        StorageManager.updateWeight(item.id, isCorrect);
        const currentItem = State.sessionQueue.shift();
        if (!isCorrect) {
            const insertIndex = Math.min(3, State.sessionQueue.length);
            State.sessionQueue.splice(insertIndex, 0, currentItem);
        }
        card.style.opacity = '0';
        setTimeout(renderCardMode, 200);
    };

    document.getElementById('btn-wrong').addEventListener('click', (e) => { e.stopPropagation(); handleFeedback(false); });
    document.getElementById('btn-correct').addEventListener('click', (e) => { e.stopPropagation(); handleFeedback(true); });
}

document.addEventListener('DOMContentLoaded', initApp);