import React from 'react';
import { Box, Button, Typography, Paper, styled } from '@mui/material';
import { Mic, Stop, Download } from '@mui/icons-material';
import { useEffect } from 'react';
import { VolumeIndicator } from './VolumeIndicator';

const ControlButton = styled(Button)(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  padding: theme.spacing(2),
  border: `3px solid ${theme.palette.grey[800]}`,
  '&:disabled': {
    backgroundColor: theme.palette.grey[900],
    border: `3px solid ${theme.palette.grey[800]}`,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 48,
  },
}));

const DisplayPanel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  border: `1px solid ${theme.palette.grey[800]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  fontFamily: 'monospace',
  color: theme.palette.primary.main,
  fontSize: '2rem',
  textAlign: 'center',
  marginBottom: theme.spacing(3),
  boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
  minWidth: '150px',
}));

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  micVolume: number;
  blackholeVolume: number;
  audioUrl: { url: string; mimeType: string; fileName: string } | null;
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

  useEffect(() => {
    
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper
     elevation={3}
     sx={{
       p: 3,
       mx: 0,
       mt: 0,
       backgroundColor: 'background.paper',
       borderRadius: 0,
       border: '1px solid',
       borderColor: 'grey.800',
       display: 'grid',
       gridTemplateColumns: '250px 1fr',
       gridTemplateRows: '1fr auto',
       gap: 3,
       height: '100%',
       flex: 1,
       minHeight: 0,
       overflow: 'hidden',
     }}
    >
      {/* Left Section - Meters */}
      <Box sx={{
        backgroundColor: 'grey.900',
        p: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        gridRow: '1 / 3',
        height: '100%'
      }}>
        <VolumeIndicator label="マイク入力" value={micVolume} />
        <VolumeIndicator label="BlackHole出力" value={blackholeVolume} />
      </Box>

      {/* Top Section - Controls */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.900',
        p: 4,
        borderRadius: 2,
        gridColumn: '2',
        gridRow: '1',
        height: '100%',
        minHeight: '300px',
      }}>
        <DisplayPanel>
          {formatTime(recordingTime)}
        </DisplayPanel>

        <Box sx={{
          display: 'flex',
          gap: 4,
          justifyContent: 'center'
        }}>
          <ControlButton
            variant="contained"
            color="primary"
            onClick={onStart}
            disabled={isRecording}
          >
            <Mic />
          </ControlButton>
          <ControlButton
            variant="contained"
            color="error"
            onClick={onStop}
            disabled={!isRecording}
          >
            <Stop />
          </ControlButton>
        </Box>
      </Box>

      {/* Bottom Section - Playback */}
      <Box sx={{
        backgroundColor: 'grey.900',
        p: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gridColumn: '2',
        gridRow: '2',
      }}>
        {audioUrl ? (
          <>
            <Box>
              <audio
                controls
                src={audioUrl?.url}
                style={{
                  width: '100%',
                  height: 60,
                  borderRadius: '4px',
                  padding: '4px'
                }}
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              href={audioUrl.url}
              download={audioUrl.fileName}
              sx={{
                borderRadius: 1,
                py: 1.5
              }}
            >
              録音をダウンロード
            </Button>
          </>
        ) : (
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ py: 4 }}
          >
            録音ファイルはここに表示されます
          </Typography>
        )}
      </Box>
    </Paper>
  );
};