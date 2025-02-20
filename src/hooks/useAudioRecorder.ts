import { useState, useEffect, useCallback, useRef } from 'react';

interface ParticipantsInfo {
  staff: string;
  client: string;
}

interface AudioRecorderState {
  isRecording: boolean;
  recordingTime: number;
  micVolume: number;
  blackholeVolume: number;
  audioUrl: { url: string; mimeType: string; fileName: string; } | null;
}

export const useAudioRecorder = (participants: ParticipantsInfo) => {
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
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  const generateFileName = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];

    const staff = participants?.staff?.trim() || '';
    const client = participants?.client?.trim() || '';
    return `${staff || 'unknown'}-${client || 'unknown'}-${date}.webm`;
  }, [participants]);

  // 参加者情報が変更されたときにファイル名を更新
  useEffect(() => {
    if (state.isRecording) {
      const fileName = generateFileName();
      setState(prev => ({
        ...prev,
        audioUrl: prev.audioUrl ? {
          ...prev.audioUrl,
          fileName: fileName
        } : null
      }));
    }
  }, [participants, state.isRecording, generateFileName]);

  const handleStop = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    setState(prev => ({
      ...prev,
      audioUrl: {
        url: url,
        mimeType: 'audio/webm',
        fileName: prev.audioUrl?.fileName || generateFileName() // 既存のファイル名を保持、なければ新規生成
      }
    }));
  }, [generateFileName]);

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

  const updateVolumeAndTimer = useCallback(() => {
    if (!isRecordingRef.current) return;

    // Update volume indicators
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

    // Update timer
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setState(prev => ({ ...prev, recordingTime: elapsed }));
    }

    animationFrameRef.current = requestAnimationFrame(updateVolumeAndTimer);
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

      // MediaRecorderの作成と設定
      recorderRef.current = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
      recorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };
      recorderRef.current.onstop = handleStop;

      recorderRef.current.start();
      startTimeRef.current = Date.now();
      isRecordingRef.current = true;
      
      // 録音開始時に初期のファイル名を設定
      const fileName = generateFileName();
      setState(prev => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        audioUrl: {
          url: '', // 録音中は空のURLを設定
          mimeType: 'audio/webm',
          fileName: fileName
        }
      }));

      // Start the combined update loop
      updateVolumeAndTimer();
    } catch (err) {
      console.error('Recording error:', err);
      throw err;
    }
  }, [getBlackholeStream, updateVolumeAndTimer, handleStop]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isRecordingRef.current = false;
    startTimeRef.current = null;

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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