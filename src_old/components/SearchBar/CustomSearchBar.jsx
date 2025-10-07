import React from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const CustomSearchBar = ({ searchText, onSearch, onHide }) => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'flex-end',  // right align
    width: '100%',
  }}>
    <TextField
      value={searchText}
      onChange={e => onSearch(e.target.value)}
      placeholder="Search"
      size="small"
      variant="standard"  // thin underline style
      sx={{
        minWidth: 220,
        maxWidth: 320,
        '& .MuiInputBase-root': {
          alignItems: 'center',
        },
        '& .MuiInput-underline:before': {
          borderBottomColor: '#3f4a6b', // thin, dark underline
          borderBottomWidth: '2px',
        },
        '& .MuiInputAdornment-root': {
          marginTop: '2px',
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 20, color: '#444' }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              disableRipple
              aria-label="close search"
              onClick={onHide}
              sx={{ p: 0, color: '#888' }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  </Box>
);

export default CustomSearchBar;
