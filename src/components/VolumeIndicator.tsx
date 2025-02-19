import React, { useMemo } from 'react';
import { Box, Typography, styled } from '@mui/material';

const MeterContainer = styled(Box)(({ theme }) => ({
  width: 40,
  height: 200,
  backgroundColor: theme.palette.grey[900],
  borderRadius: 4,
  padding: 2,
  position: 'relative',
  border: `1px solid ${theme.palette.grey[800]}`,
}));

const MeterSegment = styled('div')<{ $active: boolean; $isRed: boolean }>(({ $active, $isRed, theme }) => ({
  width: '100%',
  height: 4,
  marginBottom: 2,
  backgroundColor: $active
    ? $isRed
      ? theme.palette.error.main
      : theme.palette.success.main
    : theme.palette.grey[800],
  transition: 'background-color 0.1s ease',
  boxShadow: $active ? '0 0 5px rgba(255, 255, 255, 0.3)' : 'none',
}));

interface VolumeIndicatorProps {
  label: string;
  value: number;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ label, value }) => {
  // 0-255の値を20セグメントに分割
  const segments = useMemo(() => {
    const normalizedValue = (value / 255) * 20;
    return Array.from({ length: 20 }, (_, i) => ({
      active: i < normalizedValue,
      isRed: i >= 16, // 上位4セグメントは赤色
    }));
  }, [value]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', m: 2 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1, fontWeight: 'bold' }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <MeterContainer>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column-reverse' }}>
            {segments.map((segment, i) => (
              <MeterSegment
                key={i}
                $active={segment.active}
                $isRed={segment.isRed}
              />
            ))}
          </Box>
        </MeterContainer>
      </Box>
    </Box>
  );
};