import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { Mic, Stop, Download } from '@mui/icons-material';
import { VolumeIndicator } from './VolumeIndicator';

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  micVolume: number;
  blackholeVolume: number;
  audioUrl: string | null;
  onStart: () => void;
  onStop: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordingTime,
  micVolume,
  blackholeVolume,
  audioUrl,
  onStart,
  onStop,
}) => {
  return (
    <Paper 
      elevation={3}
      sx={{
        p: 3,
        maxWidth: 600,
        mx: 'auto',
        mt: 4,
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom align="center">
          {isRecording 
            ? `録音中... ${recordingTime}秒`
            : '録音待機中'}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <VolumeIndicator label="マイク入力" value={micVolume} />
        <VolumeIndicator label="BlackHole出力" value={blackholeVolume} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Mic />}
          onClick={onStart}
          disabled={isRecording}
        >
          録音開始
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Stop />}
          onClick={onStop}
          disabled={!isRecording}
        >
          録音停止
        </Button>
      </Box>

      {audioUrl && (
        <Box sx={{ mt: 2 }}>
          <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '1rem' }} />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Download />}
            fullWidth
            href={audioUrl}
            download="recording.webm"
          >
            録音をダウンロード
          </Button>
        </Box>
      )}
    </Paper>
  );
};