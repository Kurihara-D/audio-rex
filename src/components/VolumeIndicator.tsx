import React from 'react';
import { Box, Typography, LinearProgress, styled } from '@mui/material';

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.MuiLinearProgress-colorPrimary`]: {
    backgroundColor: theme.palette.grey[800],
  },
  [`& .MuiLinearProgress-bar`]: {
    borderRadius: 5,
  },
}));

interface VolumeIndicatorProps {
  label: string;
  value: number;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ label, value }) => {
  // 0-255の値を0-100に正規化
  const normalizedValue = (value / 255) * 100;

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(normalizedValue)}%
        </Typography>
      </Box>
      <StyledLinearProgress
        variant="determinate"
        value={normalizedValue}
        sx={{
          '& .MuiLinearProgress-bar': {
            backgroundColor: value > 200 ? '#ff4444' : '#44ff44',
          },
        }}
      />
    </Box>
  );
};