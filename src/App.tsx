import React from 'react';
import { Container, Typography, Box, styled } from '@mui/material';
import { RecordingControls } from './components/RecordingControls';
import { useAudioRecorder } from './hooks/useAudioRecorder';

const AppContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  background: `linear-gradient(145deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const StyledContainer = styled(Container)({
  flex: 1,
  padding: '0 !important',
  margin: '0 !important',
  maxWidth: 'none !important',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%'
});

const GlassPanel = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(3, 0),
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: '100%'
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
      <StyledContainer maxWidth={false}>
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
      </StyledContainer>
    </AppContainer>
  );
};

export default App;