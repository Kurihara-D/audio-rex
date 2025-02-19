import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { RecordingControls } from './components/RecordingControls';
import { useAudioRecorder } from './hooks/useAudioRecorder';

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
    <Container>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Agent-Rex
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
    </Container>
  );
};

export default App;