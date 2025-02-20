import React, { useState } from 'react';
import { Container, Typography, Box, styled } from '@mui/material';
import { RecordingControls } from './components/RecordingControls';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { ParticipantFields } from './components/ParticipantFields';
import { AudioDevices } from './components/AudioDevices';

const AppContainer = styled(Box)(({ theme }) => ({
  width: '100vw',
  height: '100vh',
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
  minHeight: 0,
  width: '100%'
});

const GlassPanel = styled(Box)(({ }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: '100%',
  minHeight: 0
}));

const App: React.FC = () => {
  const [staff, setStaff] = useState<string>('');
  const [client, setClient] = useState<string>('');

  const {
    isRecording,
    recordingTime,
    micVolume,
    blackholeVolume,
    audioUrl,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    staff,
    client
  });

  return (
    <AppContainer>
      <StyledContainer maxWidth={false}>
        <GlassPanel>
          <Box sx={{
            textAlign: 'center',
            mb: 1,
            pt: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Agent Rex
            </Typography>
            {/* <Link
              href="https://www.notion.so/AgentRex-1a04d37ab76780aab2f1d07abb15a0d9?pvs=4"
              target="_blank"
              rel="noopener"
              onClick={(e) => {
                e.preventDefault();
                window.open(e.currentTarget.href, '_blank');
              }}
              sx={{
                color: 'text.secondary',
                opacity: 0.8,
                textDecoration: 'underline',
                '&:hover': {
                  opacity: 1,
                  color: 'primary.main',
                },
                display: 'block',
                mb: 2,
              }}
            >
              使い方マニュアル
            </Link> */}
          </Box>

          <ParticipantFields
            staff={staff}
            client={client}
            onStaffChange={setStaff}
            onClientChange={setClient}
          />

          <AudioDevices />

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