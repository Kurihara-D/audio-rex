import React from 'react';
import { Container, Typography, Box, styled } from '@mui/material';
import { RecordingControls } from './components/RecordingControls';
import { useAudioRecorder } from './hooks/useAudioRecorder';

const AppContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  height: '100vh',
  background: `linear-gradient(145deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
}));

const GlassPanel = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(3),
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  width: '100%',
  height: '100%',
  overflowY: 'auto',
}));

const App: React.FC = () => {
  const {
    isRecording,
    recordingTime,
    micVolume,
    blackholeVolume,
    audioUrl,
    startRecording,
    stopRecording
  } = useAudioRecorder();

  return (
    <AppContainer>
      <Container maxWidth={false}>
        <GlassPanel>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Audio Recorder Pro
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary" 
              sx={{ opacity: 0.8 }}
            >
              マイク入力とBlackHole出力を同時に録音
            </Typography>
          </Box>

          <RecordingControls
            isRecording={isRecording}
            recordingTime={recordingTime}
            micVolume={micVolume}
            blackholeVolume={blackholeVolume}
            audioUrl={audioUrl}
            onStart={startRecording}
            onStop={stopRecording}
          />
        </GlassPanel>
      </Container>
    </AppContainer>
  );
};

export default App;