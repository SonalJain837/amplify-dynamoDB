import React, { useState } from 'react';
import { Box, Typography, Link } from '@mui/material';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import { useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        bgcolor: '#232b36',
        color: '#fff',
        py: 4,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DiamondOutlinedIcon sx={{ fontSize: 28, mr: 1, color: '#fff' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
            Travel to World
          </Typography>
        </Box>
        <Typography sx={{ color: '#b0b8c1', fontSize: 16, mb: 2 }}>
          Explore. Dream. Discover.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Link href="#" underline="none" sx={{ color: '#fff', fontWeight: 500, fontSize: 16, '&:hover': { color: '#1db954' } }}>About</Link>
          <Link
            component="button"
            onClick={() => {
              navigate('/terms');
            }}
            sx={{
              color: '#fff',
              fontWeight: 500,
              fontSize: 16,
              '&:hover': { color: '#1db954' },
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Terms
          </Link>
          <Link href="#" underline="none" sx={{ color: '#fff', fontWeight: 500, fontSize: 16, '&:hover': { color: '#1db954' } }}>Privacy</Link>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/contact');
            }}
            sx={{
              color: '#fff',
              fontWeight: 500,
              fontSize: 16,
              '&:hover': { color: '#1db954' },
              textDecoration: 'none',
            }}
          >
            Contact
          </Link>
        </Box>
        <Typography sx={{ color: '#b0b8c1', fontSize: 15, mt: 1 }}>
          © 2025 Travel to World. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer; 