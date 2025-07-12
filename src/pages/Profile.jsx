import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Divider from '@mui/material/Divider';

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
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [addFriendEmail, setAddFriendEmail] = useState("");
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [friendsWithStatus, setFriendsWithStatus] = useState([]);

  async function fetchUserData() {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          ...data,
          displayName: data.displayName || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          stats: data.stats || { wins: 0, losses: 0, draws: 0, rating: 1200 },
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || ""
        });
        setEditForm({
          displayName: data.displayName || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || ""
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  async function fetchGames() {
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
  }

  useEffect(() => {
    if (!currentUser) return;
    fetchUserData();
    fetchGames();
    // Fetch friends and friend requests
    const friendsRef = collection(db, "users", currentUser.uid, "friends");
    const unsub = onSnapshot(friendsRef, (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriends(all.filter(f => f.status === 'accepted'));
      setFriendRequests(all.filter(f => f.status === 'pending'));
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Fix online status: merge into friends list
  useEffect(() => {
    if (!friends.length) return;
    let mounted = true;
    const fetchStatuses = async () => {
      const now = Date.now();
      const updated = await Promise.all(friends.map(async f => {
        const userDoc = await getDoc(doc(db, "users", f.uid));
        const lastOnline = userDoc.data()?.lastOnline?.seconds ? userDoc.data().lastOnline.seconds * 1000 : 0;
        return { ...f, online: lastOnline && (now - lastOnline < 2 * 60 * 1000) };
      }));
      if (mounted) setFriendsWithStatus(updated);
    };
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, [friends]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: editForm.displayName,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        username: editForm.username,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
        updatedAt: new Date()
      });
      setUserData({ ...userData, ...editForm });
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

  // Add friend request logic
  async function handleAddFriend() {
    setAddFriendLoading(true);
    try {
      // Find user by email
      const q = query(collection(db, "users"), where("email", "==", addFriendEmail));
      const snap = await getDocs(q);
      if (snap.empty) {
        setMessage({ type: 'error', text: 'User not found.' });
        setAddFriendLoading(false);
        return;
      }
      const friendUser = snap.docs[0].data();
      const friendUid = snap.docs[0].id;
      if (friendUid === currentUser.uid) {
        setMessage({ type: 'error', text: 'You cannot add yourself.' });
        setAddFriendLoading(false);
        return;
      }
      // Add to both users' friends subcollections
      await setDoc(doc(db, "users", currentUser.uid, "friends", friendUid), {
        uid: friendUid,
        displayName: friendUser.displayName || friendUser.email,
        avatarUrl: friendUser.avatarUrl || "",
        status: 'pending',
        direction: 'outgoing',
        requestedAt: new Date()
      });
      await setDoc(doc(db, "users", friendUid, "friends", currentUser.uid), {
        uid: currentUser.uid,
        displayName: userData?.displayName || currentUser.email,
        avatarUrl: userData?.avatarUrl || "",
        status: 'pending',
        direction: 'incoming',
        requestedAt: new Date()
      });
      setMessage({ type: 'success', text: 'Friend request sent!' });
      setAddFriendEmail("");
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to send friend request.' });
    } finally {
      setAddFriendLoading(false);
    }
  }

  // Accept/decline friend request
  async function handleAcceptFriend(uid) {
    await updateDoc(doc(db, "users", currentUser.uid, "friends", uid), { status: 'accepted' });
    await updateDoc(doc(db, "users", uid, "friends", currentUser.uid), { status: 'accepted' });
  }
  async function handleDeclineFriend(uid) {
    await deleteDoc(doc(db, "users", currentUser.uid, "friends", uid));
    await deleteDoc(doc(db, "users", uid, "friends", currentUser.uid));
  }

  function getInitials() {
    if (userData?.displayName) {
      return userData.displayName.split(' ').map(s => s[0]).join('').toUpperCase().slice(0,2);
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
  if (!userData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, maxWidth: 800, mx: 'auto', p: 2 }}>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2, width: '100%' }}>
          {message.text}
        </Alert>
      )}

      {/* Tabs for Profile/Friends */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Profile" />
        <Tab label={`Friends (${friends.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, width: '100%' }}>
            <Avatar 
              src={userData?.avatarUrl || undefined}
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
                {userData?.displayName || currentUser.displayName || currentUser.email}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {userData?.bio}
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
            <Grid span={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">{userData?.stats?.rating || 1200}</Typography>
                <Typography variant="body2">Rating</Typography>
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={editForm.avatarUrl || undefined} sx={{ width: 56, height: 56, mr: 2 }} />
                <Button variant="outlined" disabled>Upload (coming soon)</Button>
              </Box>
              <TextField
                fullWidth
                label="Display Name"
                value={editForm.displayName || ''}
                onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                margin="normal"
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Bio"
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                margin="normal"
                multiline
                minRows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Avatar URL"
                value={editForm.avatarUrl || ''}
                onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                margin="normal"
                sx={{ mb: 2 }}
              />
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
              <Button onClick={() => setEditDialog(false)} disabled={saving}>Cancel</Button>
              <Button 
                onClick={handleSaveProfile} 
                variant="contained" 
                disabled={saving}
              >
                {saving ? <CircularProgress size={20} /> : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {tab === 1 && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Add Friend by Email"
              value={addFriendEmail}
              onChange={e => setAddFriendEmail(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button variant="contained" onClick={handleAddFriend} disabled={addFriendLoading || !addFriendEmail}>
              {addFriendLoading ? 'Adding...' : 'Add Friend'}
            </Button>
          </Box>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Friend Requests</Typography>
          <List>
            {friendRequests.length === 0 && <ListItem><ListItemText primary="No pending requests." /></ListItem>}
            {friendRequests.map(f => (
              <ListItem key={f.uid} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={f.avatarUrl || undefined}>{f.displayName?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={f.displayName} secondary={f.direction === 'incoming' ? 'Incoming request' : 'Outgoing request'} />
                <ListItemSecondaryAction>
                  {f.direction === 'incoming' ? (
                    <>
                      <Button size="small" color="success" onClick={() => handleAcceptFriend(f.uid)}>Accept</Button>
                      <Button size="small" color="error" onClick={() => handleDeclineFriend(f.uid)}>Decline</Button>
                    </>
                  ) : (
                    <Button size="small" disabled>Pending</Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Friends</Typography>
          <List>
            {friendsWithStatus.length === 0 && <ListItem><ListItemText primary="No friends yet." /></ListItem>}
            {friendsWithStatus.map(f => (
              <ListItem key={f.uid} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={f.avatarUrl || undefined}>{f.displayName?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={f.displayName} secondary={f.status === 'accepted' ? 'Friend' : ''} />
                <ListItemSecondaryAction>
                  <Chip label={f.online ? 'Online' : 'Offline'} color={f.online ? 'success' : 'default'} size="small" />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
} 