import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  recordingTime: number;
  micVolume: number;
  blackholeVolume: number;
  audioUrl: string | null;
}

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    recordingTime: 0,
    micVolume: 0,
    blackholeVolume: 0,
    audioUrl: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const bhStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const blackholeAnalyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const getBlackholeStream = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const blackholeDevice = devices.find(
      device => device.kind === 'audioinput' && device.label.toLowerCase().includes('blackhole')
    );
    if (!blackholeDevice) {
      throw new Error('Blackhole device not found');
    }
    return await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: blackholeDevice.deviceId } }
    });
  }, []);

  const updateVolumeIndicators = useCallback(() => {
    if (micAnalyserRef.current) {
      const micData = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getByteFrequencyData(micData);
      const micVolume = micData.reduce((sum, value) => sum + value, 0) / micData.length;
      setState(prev => ({ ...prev, micVolume }));
    }

    if (blackholeAnalyserRef.current) {
      const bhData = new Uint8Array(blackholeAnalyserRef.current.frequencyBinCount);
      blackholeAnalyserRef.current.getByteFrequencyData(bhData);
      const blackholeVolume = bhData.reduce((sum, value) => sum + value, 0) / bhData.length;
      setState(prev => ({ ...prev, blackholeVolume }));
    }

    requestAnimationFrame(updateVolumeIndicators);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // 既存のストリームがない場合のみ新しく取得
      if (!micStreamRef.current || !bhStreamRef.current) {
        [micStreamRef.current, bhStreamRef.current] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }),
          getBlackholeStream()
        ]);
      } else {
        // 既存のストリームを有効化
        micStreamRef.current.getTracks().forEach(track => track.enabled = true);
        bhStreamRef.current.getTracks().forEach(track => track.enabled = true);
      }

      // AudioContextの初期化または再開
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const destination = audioContextRef.current.createMediaStreamDestination();

      // 初回のみノードを作成
      if (!micAnalyserRef.current || !blackholeAnalyserRef.current) {
        const micSource = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
        micAnalyserRef.current = audioContextRef.current.createAnalyser();
        micSource.connect(micAnalyserRef.current);
        micSource.connect(destination);

        if (bhStreamRef.current) {
          const bhSource = audioContextRef.current.createMediaStreamSource(bhStreamRef.current);
          blackholeAnalyserRef.current = audioContextRef.current.createAnalyser();
          bhSource.connect(blackholeAnalyserRef.current);
          bhSource.connect(destination);
        }
      } else {
        const micSource = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
        micSource.connect(micAnalyserRef.current);
        micSource.connect(destination);

        if (bhStreamRef.current) {
          const bhSource = audioContextRef.current.createMediaStreamSource(bhStreamRef.current);
          bhSource.connect(blackholeAnalyserRef.current);
          bhSource.connect(destination);
        }
      }

      chunksRef.current = [];
      recorderRef.current = new MediaRecorder(destination.stream);
      recorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      recorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setState(prev => ({ ...prev, audioUrl: url }));
      };

      recorderRef.current.start();
      setState(prev => ({ ...prev, isRecording: true, recordingTime: 0 }));

      // タイマーの開始
      const startTime = Date.now();
      const updateTimer = () => {
        if (!state.isRecording) return;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setState(prev => ({ ...prev, recordingTime: elapsed }));
        timerRef.current = requestAnimationFrame(updateTimer);
      };
      updateTimer();
      updateVolumeIndicators();
    } catch (err) {
      console.error('Recording error:', err);
      throw err;
    }
  }, [getBlackholeStream, state.isRecording, updateVolumeIndicators]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    // ストリームを停止せず、一時停止する
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.enabled = false);
    }
    if (bhStreamRef.current) {
      bhStreamRef.current.getTracks().forEach(track => track.enabled = false);
    }

    // AudioContextを一時停止
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }

    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  useEffect(() => {
    return () => {
      // クリーンアップ関数
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (bhStreamRef.current) {
        bhStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording
  };
};