import React from 'react';
import { Box, TextField } from '@mui/material';

interface ParticipantFieldsProps {
  staff: string;
  client: string;
  onStaffChange: (value: string) => void;
  onClientChange: (value: string) => void;
}

export const ParticipantFields: React.FC<ParticipantFieldsProps> = ({
  staff,
  client,
  onStaffChange,
  onClientChange
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2,
      px: 2,
      mb: 2,
      '& .MuiTextField-root': {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
          },
        },
      }
    }}>
      <TextField
        label="担当者"
        value={staff}
        onChange={(e) => onStaffChange(e.target.value)}
        variant="outlined"
        size="small"
        InputLabelProps={{
          sx: { color: 'text.secondary' }
        }}
      />
      <TextField
        label="参加者"
        value={client}
        onChange={(e) => onClientChange(e.target.value)}
        variant="outlined"
        size="small"
        InputLabelProps={{
          sx: { color: 'text.secondary' }
        }}
      />
    </Box>
  );
};