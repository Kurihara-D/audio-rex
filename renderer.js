const { ipcRenderer } = require('electron');
let micAnalyser, blackholeAnalyser;
let audioContext;
let recorder;
let recordedBlob;
let recordingStartTime;
let timerId;
let isRecording = false;
let micStream, bhStream;
let blackholeDeviceCache = null;

async function getBlackholeStream() {
  if (blackholeDeviceCache) {
    return await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: blackholeDeviceCache.deviceId } }
    });
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const blackholeDevice = devices.find(device => device.kind === 'audioinput' && device.label.toLowerCase().includes('blackhole'));
  if (!blackholeDevice) {
    throw new Error('Blackhole device not found');
  }
  blackholeDeviceCache = blackholeDevice;
  console.log('Found Blackhole device:', blackholeDevice.label, blackholeDevice.deviceId);
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: blackholeDevice.deviceId } }
  });
  return stream;
}

let recordedUrl;

async function startRecording() {
  try {
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    // 初期状態として、"Recording... 0 sec" を表示
    document.getElementById('recordingStatus').textContent = "Recording... 0 sec";

    // 既存のストリームがない場合のみ新しく取得
    if (!micStream || !bhStream) {
      [micStream, bhStream] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }),
          getBlackholeStream()
      ]);
      console.log('New mic and Blackhole streams obtained.');
    } else {
      // 既存のストリームを有効化
      micStream.getTracks().forEach(track => track.enabled = true);
      bhStream.getTracks().forEach(track => track.enabled = true);
      console.log('Reusing existing streams.');
    }

    // AudioContextの状態を確認して再利用
    if (!audioContext) {
        audioContext = new AudioContext();
        console.log('Created new AudioContext');
    } else if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Resumed existing AudioContext');
    }
    let destination;
    
    // 初回のみノードを作成
    if (!micAnalyser || !blackholeAnalyser) {
        destination = audioContext.createMediaStreamDestination();
        
        // マイク用のノード設定
        const micSource = audioContext.createMediaStreamSource(micStream);
        micAnalyser = audioContext.createAnalyser();
        micSource.connect(micAnalyser);
        micSource.connect(destination);
        
        // Blackhole用のノード設定
        if (bhStream) {
            const bhSource = audioContext.createMediaStreamSource(bhStream);
            blackholeAnalyser = audioContext.createAnalyser();
            bhSource.connect(blackholeAnalyser);
            bhSource.connect(destination);
        } else {
            blackholeAnalyser = null;
        }
        console.log('Created new audio nodes');
    } else {
        destination = audioContext.createMediaStreamDestination();
        // 既存のノードを再接続
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(micAnalyser);
        micSource.connect(destination);
        
        if (bhStream) {
            const bhSource = audioContext.createMediaStreamSource(bhStream);
            bhSource.connect(blackholeAnalyser);
            bhSource.connect(destination);
        }
        console.log('Reused existing audio nodes');
    }
    
    // ミキシングされたストリームを使用して録音開始
    const chunks = [];
    recorder = new MediaRecorder(destination.stream);
    recorder.ondataavailable = event => {
      chunks.push(event.data);
    };
    recorder.onstop = () => {
      recordedBlob = new Blob(chunks, { type: 'audio/webm' });
      recordedUrl = URL.createObjectURL(recordedBlob);
      const audioElem = document.getElementById('audioPlayback');
      audioElem.src = recordedUrl;
      const downloadLink = document.getElementById('downloadLink');
      downloadLink.href = recordedUrl;
      downloadLink.download = 'recording.webm';
      downloadLink.style.display = 'inline';
      console.log('Recording stopped and saved.');
    };
    
    recorder.start();
    recordingStartTime = Date.now();
    isRecording = true;
    function updateTimer() {
      if (!isRecording) return;
      let elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      document.getElementById('recordingStatus').textContent = "Recording... " + elapsed + " sec";
      timerId = requestAnimationFrame(updateTimer);
    }
    updateTimer();
    updateVolumeIndicators();
    console.log('録音開始：マイクとBlackholeの両方がキャプチャされています。');
  } catch (err) {
    console.error('メディアデバイスの取得エラー:', err);
  }
}

function stopRecording() {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop();
  }
  isRecording = false;
  cancelAnimationFrame(timerId);
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('recordingStatus').textContent = "Stopped.";
  
  // ストリームを停止せず、一時停止する
  if (micStream) {
    micStream.getTracks().forEach(track => track.enabled = false);
  }
  if (bhStream) {
    bhStream.getTracks().forEach(track => track.enabled = false);
  }
  
  // AudioContextを一時停止
  if (audioContext && audioContext.state === 'running') {
    audioContext.suspend();
  }
}

function updateVolumeIndicators() {
  if (micAnalyser) {
    const micData = new Uint8Array(micAnalyser.frequencyBinCount);
    micAnalyser.getByteFrequencyData(micData);
    const micVolume = micData.reduce((sum, value) => sum + value, 0) / micData.length;
    document.getElementById('micVolume').value = micVolume;
  }
  if (blackholeAnalyser) {
    const bhData = new Uint8Array(blackholeAnalyser.frequencyBinCount);
    blackholeAnalyser.getByteFrequencyData(bhData);
    const bhVolume = bhData.reduce((sum, value) => sum + value, 0) / bhData.length;
    document.getElementById('systemVolume').value = bhVolume;
  } else {
    document.getElementById('systemVolume').value = 0;
  }
  requestAnimationFrame(updateVolumeIndicators);
}

document.getElementById('startBtn').addEventListener('click', startRecording);
document.getElementById('stopBtn').addEventListener('click', stopRecording);

async function captureBlackholeOutput() {
  try {
    const stream = await getBlackholeStream();
    const recorderBH = new MediaRecorder(stream);
    let chunksBH = [];
    recorderBH.ondataavailable = e => chunksBH.push(e.data);
    recorderBH.start();
    // 3秒間録音
    await new Promise(resolve => setTimeout(resolve, 1000));
    recorderBH.stop();
    await new Promise(resolve => {
      recorderBH.onstop = resolve;
    });
    const blobBH = new Blob(chunksBH, { type: 'audio/webm' });
    const urlBH = URL.createObjectURL(blobBH);
    const container = document.getElementById('blackholeOutput');
    container.innerHTML = '';
    const audioElem = document.createElement('audio');
    audioElem.controls = true;
    audioElem.src = urlBH;
    container.appendChild(audioElem);
  } catch (error) {
    console.error('Error capturing Blackhole output:', error);
  }
}

const blackholeBtn = document.getElementById('blackholeBtn');
if (blackholeBtn) {
  blackholeBtn.addEventListener('click', captureBlackholeOutput);
}