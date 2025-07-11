import React, { useState } from "react";
import { Box, Card, CardContent, Typography, Button, TextField, Avatar, CircularProgress, Alert, Divider } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import GoogleIcon from '@mui/icons-material/Google';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Redirect handled by auth context or router
    } catch (err) {
      console.error("Login error:", err);
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email. Please register first.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;
        default:
          setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      // Redirect handled by auth context or router
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%', p: 3, boxShadow: 6, borderRadius: 4, textAlign: 'center', position: 'relative' }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: '#b58863', mx: 'auto', mb: 2 }}>
          <EmojiEventsIcon sx={{ fontSize: 48, color: '#fff' }} />
        </Avatar>
        <CardContent>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sign in to Chess 3D
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Play chess online, track your games, and join the community.
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Email/Password Form */}
          <Box component="form" onSubmit={handleEmailSignIn} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button 
                color="primary" 
                size="small" 
                onClick={() => navigate("/forgot-password")}
                sx={{ textTransform: 'none' }}
              >
                Forgot Password?
              </Button>
            </Box>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, fontWeight: 600, fontSize: 16, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">OR</Typography>
          </Divider>

          {/* Google Sign-In */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            fullWidth
            sx={{ fontWeight: 600, fontSize: 16, py: 1.2, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in with Google"}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            By signing in, you agree to our Terms and Privacy Policy.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Button color="primary" onClick={() => navigate("/register")}>
              Create Account
            </Button>
          </Typography>
        </CardContent>
        {/* Chess illustration or background */}
        <Box sx={{ position: 'absolute', left: 0, bottom: 0, width: '100%', opacity: 0.08, zIndex: 0 }}>
          <img src={process.env.PUBLIC_URL + '/assets/images/chess-hero.jpg'} alt="chess" style={{ width: '100%', borderRadius: '0 0 16px 16px' }} />
        </Box>
      </Card>
    </Box>
  );
} 