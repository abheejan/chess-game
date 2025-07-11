import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Chessboard from "../components/Chessboard";
import ThreeDChessboard from "../components/ThreeDChessboard";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Snackbar from "@mui/material/Snackbar";

export default function PlayOnline() {
  const { currentUser } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [error, setError] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [use3D, setUse3D] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [copySnackbar, setCopySnackbar] = useState(false);

  async function handleCreateRoom() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const roomRef = await addDoc(collection(db, "rooms"), {
        playerWhite: currentUser.uid,
        playerWhiteEmail: currentUser.email,
        playerBlack: null,
        playerBlackEmail: null,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
        createdAt: new Date(),
        status: "waiting",
        turn: "w"
      });
      setRoomId(roomRef.id);
      setJoinedRoom({ id: roomRef.id, playerWhite: currentUser.uid, playerBlack: null });
      setRoomData({ 
        playerWhite: currentUser.uid, 
        playerWhiteEmail: currentUser.email,
        playerBlack: null, 
        playerBlackEmail: null,
        status: "waiting",
        turn: "w"
      });
    } catch (error) {
      setError("Failed to create room. Please try again.");
      console.error("Error creating room:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom() {
    if (!roomId) return;
    setLoading(true);
    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        setError("Room not found");
        return;
      }
      const roomData = roomSnap.data();
      if (roomData.playerBlack && roomData.playerWhite !== currentUser.uid) {
        setError("Room is full");
        return;
      }
      // Join as black if not already white
      if (!roomData.playerBlack && roomData.playerWhite !== currentUser.uid) {
        await updateDoc(roomRef, { 
          playerBlack: currentUser.uid,
          playerBlackEmail: currentUser.email,
          status: "playing"
        });
        setJoinedRoom({ ...roomData, id: roomId, playerBlack: currentUser.uid });
        setRoomData({ 
          ...roomData, 
          playerBlack: currentUser.uid,
          playerBlackEmail: currentUser.email,
          status: "playing"
        });
        setGameStarted(true);
      } else {
        setJoinedRoom({ ...roomData, id: roomId });
        setRoomData(roomData);
        if (roomData.status === "playing") {
          setGameStarted(true);
        }
      }
      setError("");
    } catch (error) {
      setError("Failed to join room. Please try again.");
      console.error("Error joining room:", error);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(email) {
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  }

  function getAvatarColor(email) {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const index = email ? email.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  // Listen for real-time updates to room data
  useEffect(() => {
    if (!joinedRoom?.id) return;
    
    const roomRef = doc(db, "rooms", joinedRoom.id);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRoomData(data);
        if (data.status === "playing" && !gameStarted) {
          setGameStarted(true);
        }
      }
    });

    return () => unsubscribe();
  }, [joinedRoom?.id, gameStarted]);

  // Handle game start when both players join
  useEffect(() => {
    if (roomData?.playerWhite && roomData?.playerBlack && roomData?.status === "waiting") {
      updateDoc(doc(db, "rooms", joinedRoom.id), { status: "playing" });
    }
  }, [roomData, joinedRoom?.id]);

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(joinedRoom.id);
      setCopySnackbar(true);
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  };

  if (joinedRoom) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 600, mb: 2 }}>
          <Typography variant="h5" gutterBottom>Room ID: {joinedRoom.id}</Typography>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => {
              setJoinedRoom(null);
              setRoomData(null);
              setGameStarted(false);
              setRoomId("");
            }}
          >
            Leave Room
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body1">
            Share this code with your friend to join: <b>{joinedRoom.id}</b>
          </Typography>
          <IconButton onClick={handleCopyRoomCode} size="small" color="primary">
            <ContentCopyIcon />
          </IconButton>
        </Box>
        
        {/* Game Status */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          {roomData?.status === "waiting" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Waiting for opponent to join...
            </Alert>
          )}
          {roomData?.status === "playing" && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Game in progress!
            </Alert>
          )}
        </Box>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={use3D}
                onChange={(e) => setUse3D(e.target.checked)}
                color="primary"
              />
            }
            label="3D Board"
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 600, mb: 2 }}>
          <Card sx={{ flex: 1, mr: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: getAvatarColor(roomData?.playerWhiteEmail),
                  fontSize: '1.5rem',
                  mx: 'auto',
                  mb: 1
                }}
              >
                {getInitials(roomData?.playerWhiteEmail)}
              </Avatar>
              <Typography variant="h6">White Player</Typography>
              <Typography variant="body2">{roomData?.playerWhiteEmail || 'Waiting...'}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, ml: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: getAvatarColor(roomData?.playerBlackEmail),
                  fontSize: '1.5rem',
                  mx: 'auto',
                  mb: 1
                }}
              >
                {getInitials(roomData?.playerBlackEmail)}
              </Avatar>
              <Typography variant="h6">Black Player</Typography>
              <Typography variant="body2">{roomData?.playerBlackEmail || 'Waiting...'}</Typography>
            </CardContent>
          </Card>
        </Box>
        {gameStarted && roomData?.status === "playing" ? (
          use3D ? (
            <ThreeDChessboard
              roomId={joinedRoom.id}
              multiplayer
              playerWhite={roomData?.playerWhite}
              playerBlack={roomData?.playerBlack}
            />
          ) : (
            <Chessboard 
              roomId={joinedRoom.id} 
              multiplayer 
              playerWhite={roomData?.playerWhite}
              playerBlack={roomData?.playerBlack}
            />
          )
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">
              {roomData?.status === "waiting" 
                ? "Waiting for opponent to join..." 
                : "Loading game..."}
            </Typography>
          </Box>
        )}
        
        {/* Copy to clipboard notification */}
        <Snackbar
          open={copySnackbar}
          autoHideDuration={2000}
          onClose={() => setCopySnackbar(false)}
          message="Room code copied to clipboard!"
        />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Card sx={{ minWidth: 350, p: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>Play Online</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You need to be logged in to play online chess.
            </Typography>
            <Button variant="contained" color="primary" href="/login" fullWidth>
              Sign In to Play
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <Card sx={{ minWidth: 350, p: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Play Online</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new game room or join an existing one using a room code.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mb: 2 }} 
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Create New Game Room"}
          </Button>
          
          <Typography align="center" sx={{ my: 2 }}>or</Typography>
          
          <TextField
            label="Enter Room Code"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            disabled={loading}
            placeholder="e.g., abc123"
          />
          
          <Button 
            variant="outlined" 
            color="secondary" 
            fullWidth 
            onClick={handleJoinRoom}
            disabled={loading || !roomId.trim()}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Join Room"}
          </Button>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 