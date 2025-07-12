import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';

export default function GoogleSignInTest() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTest = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      console.log("Test: Starting Google sign-in test...");
      await signInWithGoogle();
      setSuccess("Google sign-in test successful!");
      console.log("Test: Google sign-in test completed successfully");
    } catch (err) {
      console.error("Test: Google sign-in test failed:", err);
      setError(`Test failed: ${err.message} (Code: ${err.code})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Google Sign-In Test
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Button
        variant="contained"
        startIcon={<GoogleIcon />}
        onClick={handleTest}
        disabled={loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {loading ? "Testing..." : "Test Google Sign-In"}
      </Button>
      
      <Typography variant="body2" color="text.secondary">
        This will help debug any issues with Google authentication.
        Check the browser console for detailed logs.
      </Typography>
    </Box>
  );
} 