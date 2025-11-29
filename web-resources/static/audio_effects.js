document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('fsb_btn');
    const checkbox = document.getElementById('fsb_check');
    const modal = document.getElementById('fsb_modal');
    const audioEl = document.getElementById('ru_anthem');
    const body = document.body;

    if (checkbox && btn) {
        checkbox.addEventListener('change', () => {
            if(checkbox.checked) {
                btn.classList.add('active');
                btn.style.cursor = 'pointer';
            } else {
                btn.classList.remove('active');
                btn.style.cursor = 'not-allowed';
            }
        });

        btn.addEventListener('click', () => {
            if(!checkbox.checked) return;

            // 1. UI
            modal.style.opacity = '0';
            setTimeout(() => { modal.style.display = 'none'; }, 1000);
            body.classList.add('glitch-active');

            // 2. Init Audio
            initAudioContext(audioEl);
        });
    }
});

function initAudioContext(audioElement) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(audioElement);
        const analyser = audioCtx.createAnalyser();
        
        // Размер FFT (меньше = быстрее реакция, но меньше точность по частотам)
        analyser.fftSize = 1024; 
        analyser.smoothingTimeConstant = 0.5; // Очень резкая реакция

        // --- ЦЕПОЧКА ЭФФЕКТОВ ---
        const lowPass = audioCtx.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 3000; 
        lowPass.Q.value = 0.5;

        const bassBooster = audioCtx.createBiquadFilter();
        bassBooster.type = 'lowshelf';
        bassBooster.frequency.value = 60; 
        bassBooster.gain.value = 15;

        const voiceBooster = audioCtx.createBiquadFilter();
        voiceBooster.type = 'peaking';
        voiceBooster.frequency.value = 2500;
        voiceBooster.gain.value = 8; 

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 20;
        compressor.ratio.value = 4; 

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.4; 

        // Подключение
        source.connect(lowPass);
        lowPass.connect(bassBooster);
        bassBooster.connect(voiceBooster);
        voiceBooster.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(analyser);
        gainNode.connect(audioCtx.destination);

        // --- ВИЗУАЛИЗАТОР ---
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const body = document.body;
        
        let lastBeat = 0;
        const COOLDOWN = 100; // Уменьшили задержку для более частой долбежки

        function renderFrame() {
            requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);

            // Сумма 3-х самых низких частот
            let bassSum = 0;
            for(let i = 0; i < 3; i++) bassSum += dataArray[i];
            let bassAvg = bassSum / 3;

            // Порог снижен до 254 (чаще срабатывает)
            if (bassAvg > 254) {
                const now = Date.now();
                if (now - lastBeat > COOLDOWN) {
                    body.classList.add('beat-hit');
                    lastBeat = now;
                    // Держим эффект 80мс
                    setTimeout(() => {
                        body.classList.remove('beat-hit');
                    }, 40);
                }
            }
        }
        renderFrame();

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        audioElement.volume = 1.0;
        audioElement.play().catch(e => console.error("Audio Play Error:", e));

    } catch (e) {
        console.error("Web Audio API Error:", e);
        audioElement.volume = 1.0;
        audioElement.play();
    }
}