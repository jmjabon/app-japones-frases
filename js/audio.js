export const AudioPlayer = {
    synth: window.speechSynthesis,
    voice: null,

    init() {
        const loadVoice = () => {
            const voices = this.synth.getVoices();
            // Buscar voz nativa de iOS en japonés (Kyoko u Otoya)
            this.voice = voices.find(v => v.lang === 'ja-JP') || null;
        };
        
        loadVoice();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoice;
        }
    },

    play(text, rate = 1.0) {
        if (!this.synth || !text) return;
        
        this.synth.cancel(); // Detener audios anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = rate;
        
        if (this.voice) utterance.voice = this.voice;
        this.synth.speak(utterance);
    }
};