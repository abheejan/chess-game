import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { sendEmailVerification } from "firebase/auth";

export default function Profile() {
  const { currentUser } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, draws: 0, winRate: 0 });
  const [userData, setUserData] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!currentUser) return;
    fetchUserData();
    fetchGames();
  }, [currentUser, fetchUserData, fetchGames]);

  const fetchUserData = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setEditForm(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [currentUser?.uid]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const q = query(
      collection(db, "games"),
      where("userId", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const gamesData = querySnapshot.docs.map(doc => doc.data());
    setGames(gamesData);
    
    // Calculate statistics
    const total = gamesData.length;
    const wins = gamesData.filter(g => g.result === 'win').length;
    const losses = gamesData.filter(g => g.result === 'loss').length;
    const draws = gamesData.filter(g => g.result === 'draw').length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    
    setStats({ total, wins, losses, draws, winRate });
    setLoading(false);
  }, [currentUser?.uid]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        username: editForm.username,
        phone: editForm.phone || "",
        dateOfBirth: editForm.dateOfBirth || "",
        updatedAt: new Date()
      });
      
      setUserData(editForm);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditDialog(false);
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(currentUser);
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send verification email. Please try again.' });
    }
  };

  function getInitials() {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
    }
    return currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'U';
  }

  function getAvatarColor(email) {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const index = email ? email.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  if (!currentUser) {
    return <Typography variant="h6">Please log in to view your profile.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, maxWidth: 800, mx: 'auto', p: 2 }}>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2, width: '100%' }}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, width: '100%' }}>
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: getAvatarColor(currentUser.email),
            fontSize: '2rem',
            mr: 3
          }}
        >
          {getInitials()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            {userData ? `${userData.firstName} ${userData.lastName}` : currentUser.displayName || currentUser.email}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {userData?.username && `@${userData.username}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentUser.email}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip 
              label={currentUser.emailVerified ? "Email Verified" : "Email Not Verified"} 
              color={currentUser.emailVerified ? "success" : "warning"}
              size="small"
            />
            {!currentUser.emailVerified && (
              <Button size="small" onClick={handleResendVerification}>
                Resend Verification
              </Button>
            )}
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => setEditDialog(true)}
          sx={{ ml: 2 }}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} columns={12} sx={{ mb: 4, width: '100%' }}>
        <Grid span={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{stats.total}</Typography>
            <Typography variant="body2">Total Games</Typography>
          </Paper>
        </Grid>
        <Grid span={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.wins}</Typography>
            <Typography variant="body2">Wins</Typography>
          </Paper>
        </Grid>
        <Grid span={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.losses}</Typography>
            <Typography variant="body2">Losses</Typography>
          </Paper>
        </Grid>
        <Grid span={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.draws}</Typography>
            <Typography variant="body2">Draws</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3, width: '100%' }}>
        <Typography variant="h6" gutterBottom>Win Rate</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1, bgcolor: 'grey.200', borderRadius: 1, height: 20 }}>
            <Box 
              sx={{ 
                bgcolor: 'success.main', 
                height: '100%', 
                width: `${stats.winRate}%`, 
                borderRadius: 1,
                transition: 'width 0.5s ease'
              }} 
            />
          </Box>
          <Typography variant="body1">{stats.winRate}%</Typography>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>Recent Games</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : games.length === 0 ? (
        <Typography>No games found.</Typography>
      ) : (
        games.slice(0, 10).map((game, idx) => (
          <Card key={idx} sx={{ minWidth: 300, mb: 2, width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1">
                    vs. {game.opponentEmail || 'Bot'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {game.date ? new Date(game.date.seconds * 1000).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
                <Chip 
                  label={game.result.toUpperCase()} 
                  color={game.result === 'win' ? 'success' : game.result === 'loss' ? 'error' : 'warning'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            value={editForm.firstName || ''}
            onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Last Name"
            value={editForm.lastName || ''}
            onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Username"
            value={editForm.username || ''}
            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={editForm.phone || ''}
            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={editForm.dateOfBirth || ''}
            onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 