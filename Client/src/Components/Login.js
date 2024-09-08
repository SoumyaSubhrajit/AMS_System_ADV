import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  //const { instance } = useMsal();
  const navigate = useNavigate();

  const handleLogin = () => {
      navigate("/dashboard")
  };

  return (
    <div style={{ backgroundColor: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container maxWidth="xs">
        <Box sx={{
          backgroundColor: '#111',
          padding: '40px',
          border: '1px solid #fff',
          borderRadius: '10px',
          boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
        }}>
          <Typography variant="h4" sx={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
            Login to Your Account
          </Typography>
          <Button
            onClick={handleLogin}
            type="button"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              backgroundColor: '#fff',
              color: '#111',
              '&:hover': { backgroundColor: '#f2f2f2' },
              marginBottom: '20px',
            }}
          >
            Login with Azure AD
          </Button>
          <Typography variant="body2" sx={{ color: '#fff', textAlign: 'center' }}>
            By using this app, you agree to our
            <span style={{ color: '#2196f3', paddingLeft: '4px' }}>
              Terms & Conditions
            </span>
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export default Login;
