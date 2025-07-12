import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Paper, List, ListItem, ListItemText } from '@mui/material';
import { auth, app } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function FirebaseDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Collect debug information
    const info = {
      appName: app.name,
      appId: app.options.appId,
      projectId: app.options.projectId,
      authDomain: app.options.authDomain,
      apiKey: app.options.apiKey ? 'Present' : 'Missing',
      currentUser: auth.currentUser ? auth.currentUser.email : 'None',
      authState: 'Checking...'
    };

    // Check auth state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      info.authState = user ? 'Authenticated' : 'Not authenticated';
      setDebugInfo(info);
    });

    setDebugInfo(info);
    return unsubscribe;
  }, []);

  const testGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      console.log("=== FIREBASE DEBUG START ===");
      console.log("App config:", app.options);
      console.log("Auth instance:", auth);
      
      const provider = new GoogleAuthProvider();
      console.log("Google provider created:", provider);
      
      console.log("Attempting sign-in popup...");
      const result = await signInWithPopup(auth, provider);
      
      console.log("Sign-in successful:", result);
      setSuccess("Google sign-in successful! User: " + result.user.email);
      
    } catch (err) {
      console.error("=== FIREBASE DEBUG ERROR ===");
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      console.error("Full error:", err);
      
      setError(`Error: ${err.code} - ${err.message}`);
    } finally {
      setLoading(false);
      console.log("=== FIREBASE DEBUG END ===");
    }
  };

  const checkFirebaseConfig = () => {
    const issues = [];
    
    if (!app.options.apiKey) {
      issues.push("API Key is missing");
    }
    if (!app.options.authDomain) {
      issues.push("Auth Domain is missing");
    }
    if (!app.options.projectId) {
      issues.push("Project ID is missing");
    }
    
    return issues;
  };

  const configIssues = checkFirebaseConfig();

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Firebase Configuration Debug
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Configuration Info</Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="App Name" 
              secondary={debugInfo.appName || 'Loading...'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Project ID" 
              secondary={debugInfo.projectId || 'Loading...'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Auth Domain" 
              secondary={debugInfo.authDomain || 'Loading...'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="API Key" 
              secondary={debugInfo.apiKey || 'Loading...'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Current User" 
              secondary={debugInfo.currentUser || 'Loading...'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Auth State" 
              secondary={debugInfo.authState || 'Loading...'} 
            />
          </ListItem>
        </List>
      </Paper>

      {configIssues.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Configuration Issues:</Typography>
          <ul>
            {configIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Button
        variant="contained"
        onClick={testGoogleSignIn}
        disabled={loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {loading ? "Testing..." : "Test Google Sign-In (Debug Mode)"}
      </Button>

      <Typography variant="body2" color="text.secondary">
        Check the browser console (F12) for detailed logs when testing.
      </Typography>
    </Box>
  );
} 