import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PreviousTrips from '../components/PreviousTrips';
import Header from '../components/Header';

const PreviousTripsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Box sx={{ width: '100%', mt: 4, mb: 6, px: { xs: 0, md: 4 } }}>
        <PreviousTrips onClose={() => navigate('/')} />
      </Box>
    </>
  );
};

export default PreviousTripsPage; 