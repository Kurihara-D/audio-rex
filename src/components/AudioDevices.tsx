import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, FormControl, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface AudioDevice {
  deviceId: string;
  label: string;
  isActive?: boolean;
}

interface SystemAudioDevice {
  name: string;
  selected: boolean;
}

export const AudioDevices: React.FC = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [systemDevices, setSystemDevices] = useState<SystemAudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedSystemDevice, setSelectedSystemDevice] = useState<string>('');
  const [isSystemAudio, setIsSystemAudio] = useState(true); // デフォルトをtrueに変更

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputDevices = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || 'Unknown Device',
          isActive: device.deviceId === selectedDevice
        }));
      setDevices(outputDevices);
      
      // 現在のデバイスがない場合は最初のデバイスを選択
      if (selectedDevice === '' && outputDevices.length > 0) {
        setSelectedDevice(outputDevices[0].deviceId);
      }
    } catch (error) {
      console.error('オーディオデバイスの取得に失敗:', error);
    }
  };

  const getSystemAudioDevices = async () => {
    try {
      if (window.electronAPI) {
        const devices = await window.electronAPI.getSystemAudioDevices();
        setSystemDevices(devices);
        
        // 選択中のデバイスを設定
        const currentDevice = devices.find(device => device.selected);
        if (currentDevice) {
          setSelectedSystemDevice(currentDevice.name);
        } else if (devices.length > 0) {
          setSelectedSystemDevice(devices[0].name);
        }
      }
    } catch (error) {
      console.error('システムオーディオデバイスの取得に失敗:', error);
    }
  };

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      // HTMLAudioElementを使用してデバイスを切り替え
      const audio = document.createElement('audio');
      // @ts-ignore: setSinkId is not in the type definitions
      if (audio.setSinkId) {
        // @ts-ignore
        await audio.setSinkId(deviceId);
        setSelectedDevice(deviceId);
        getAudioDevices(); // デバイスリストを更新
      }
    } catch (error) {
      console.error('オーディオ出力デバイスの切り替えに失敗:', error);
    }
  };

  const handleSystemDeviceSelect = async (deviceName: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.setSystemAudioDevice(deviceName);
        setSelectedSystemDevice(deviceName);
        getSystemAudioDevices(); // デバイスリストを更新
      }
    } catch (error) {
      console.error('システムオーディオデバイスの切り替えに失敗:', error);
    }
  };

  useEffect(() => {
    // 初期デバイス情報を取得
    getAudioDevices();
    getSystemAudioDevices();

    // デバイスの変更を監視
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, []);

  return (
    <Card sx={{ minWidth: 275, margin: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <VolumeUpIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            オーディオ出力デバイス
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isSystemAudio}
                onChange={(e) => setIsSystemAudio(e.target.checked)}
              />
            }
            label="システム全体に適用"
            sx={{ ml: 2 }}
          />
        </Box>
        <FormControl fullWidth>
          {isSystemAudio ? (
            <Select
              value={selectedSystemDevice}
              onChange={(e) => handleSystemDeviceSelect(e.target.value)}
              displayEmpty
            >
              {systemDevices.length === 0 ? (
                <MenuItem disabled value="">
                  利用可能なデバイスがありません
                </MenuItem>
              ) : (
                systemDevices.map((device, index) => (
                  <MenuItem 
                    key={`system-device-${device.name}-${index}`} 
                    value={device.name}
                  >
                    {device.name} {device.selected && '(現在使用中)'}
                  </MenuItem>
                ))
              )}
            </Select>
          ) : (
            <Select
              value={selectedDevice}
              onChange={(e) => handleDeviceSelect(e.target.value)}
              displayEmpty
            >
              {devices.length === 0 ? (
                <MenuItem disabled value="">
                  利用可能なデバイスがありません
                </MenuItem>
              ) : (
                devices.map((device) => (
                  <MenuItem 
                    key={device.deviceId} 
                    value={device.deviceId}
                  >
                    {device.label} {device.isActive && '(現在使用中)'}
                  </MenuItem>
                ))
              )}
            </Select>
          )}
        </FormControl>
      </CardContent>
    </Card>
  );
};