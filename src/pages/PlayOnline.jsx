import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, doc, getDoc, setDoc, onSnapshot, updateDoc, query, where, deleteDoc, serverTimestamp } from "firebase/firestore";
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
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import ShareIcon from "@mui/icons-material/Share";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

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
  const [openRooms, setOpenRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState("");
  const [matchmaking, setMatchmaking] = useState(false);
  const [matchStatus, setMatchStatus] = useState("");
  const [selectedTimeControl, setSelectedTimeControl] = useState("5|0");
  const [userData, setUserData] = useState(null);

  // Fetch user data
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  async function handleCreateRoom() {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const roomRef = await addDoc(collection(db, "rooms"), {
        playerWhite: currentUser.uid,
        playerWhiteEmail: currentUser.email,
        playerBlack: null,
        playerBlackEmail: null,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
        createdAt: new Date(),
        status: "waiting",
        turn: "w",
        timeControl: selectedTimeControl
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
      setError("");
    } catch (error) {
      setError("Failed to create room. Please check your connection and try again.");
      setSnackbarOpen(true);
      console.error("Error creating room:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom() {
    if (!roomId) return;
    setLoading(true);
    setError("");
    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        setError("Room not found. Please check the code and try again.");
        setSnackbarOpen(true);
        return;
      }
      const roomData = roomSnap.data();
      if (roomData.playerWhite === currentUser.uid || roomData.playerBlack === currentUser.uid) {
        setError("You are already in this room.");
        setSnackbarOpen(true);
        setJoinedRoom({ ...roomData, id: roomId });
        setRoomData(roomData);
        if (roomData.status === "playing") setGameStarted(true);
        return;
      }
      if (roomData.playerBlack && roomData.playerWhite !== currentUser.uid) {
        setError("Room is full. Try another room or create a new one.");
        setSnackbarOpen(true);
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
      setError("Failed to join room. Please check your connection and try again.");
      setSnackbarOpen(true);
      console.error("Error joining room:", error);
    } finally {
      setLoading(false);
    }
  }

  // Add Play Random Opponent logic
  async function handleMatchmaking() {
    if (!currentUser) return;
    setMatchmaking(true);
    setMatchStatus("Searching for an opponent...");
    const mmRef = doc(db, "matchmaking", currentUser.uid);
    await setDoc(mmRef, {
      uid: currentUser.uid,
      email: currentUser.email,
      rating: userData?.stats?.rating || 1200,
      timeControl: selectedTimeControl,
      timestamp: serverTimestamp()
    });
    // Listen for a match
    const unsub = onSnapshot(collection(db, "matchmaking"), async (snap) => {
      const waiting = snap.docs.map(doc => doc.data()).filter(u => u.uid !== currentUser.uid);
      if (waiting.length > 0) {
        // Found an opponent
        const opponent = waiting[0];
        setMatchStatus("Match found! Creating game...");
        // Create a new room
        const roomRef = await addDoc(collection(db, "rooms"), {
          playerWhite: currentUser.uid,
          playerWhiteEmail: currentUser.email,
          playerBlack: opponent.uid,
          playerBlackEmail: opponent.email,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          createdAt: new Date(),
          status: "playing",
          turn: "w",
          timeControl: selectedTimeControl
        });
        // Remove both from matchmaking
        await deleteDoc(doc(db, "matchmaking", currentUser.uid));
        await deleteDoc(doc(db, "matchmaking", opponent.uid));
        unsub();
        // Redirect to new room
        setRoomId(roomRef.id);
        setJoinedRoom({ id: roomRef.id, playerWhite: currentUser.uid, playerBlack: opponent.uid });
        setRoomData({
          playerWhite: currentUser.uid,
          playerWhiteEmail: currentUser.email,
          playerBlack: opponent.uid,
          playerBlackEmail: opponent.email,
          status: "playing",
          turn: "w"
        });
        setGameStarted(true);
        setMatchmaking(false);
        setMatchStatus("");
      }
    });
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

  // Fetch open rooms (status: 'waiting')
  useEffect(() => {
    setRoomsLoading(true);
    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsub = onSnapshot(q, (snapshot) => {
      setOpenRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRoomsLoading(false);
    });
    return unsub;
  }, []);

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(joinedRoom.id);
      setCopySnackbar(true);
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  };

  // Clear error on input change
  useEffect(() => {
    if (roomId) setError("");
  }, [roomId]);

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
          <Tooltip title="Copy Room Code">
            <IconButton onClick={handleCopyRoomCode} size="small" color="primary">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          {navigator.share && (
            <Tooltip title="Share Room Code">
              <IconButton
                size="small"
                color="primary"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: 'Chess Room Invite',
                      text: `Join my chess room: ${joinedRoom.id}`,
                      url: window.location.href
                    });
                  } catch (e) {}
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          )}
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
          {roomData?.status === "finished" && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <b>Game Over!</b><br/>
              {roomData.result === "draw"
                ? "It's a draw!"
                : roomData.result === "white"
                  ? `White wins${roomData.winner ? ` (${roomData.winner === roomData.playerWhite ? roomData.playerWhiteEmail : roomData.playerBlackEmail})` : ""}!`
                  : roomData.result === "black"
                    ? `Black wins${roomData.winner ? ` (${roomData.winner === roomData.playerBlack ? roomData.playerBlackEmail : roomData.playerWhiteEmail})` : ""}!`
                    : "Game finished."}
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
        {gameStarted && roomData?.status === "playing" && (
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
        )}
        {roomData?.status === "finished" && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Game Over!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {roomData.result === "draw"
                ? "It's a draw!"
                : roomData.result === "white"
                  ? `White wins${roomData.winner ? ` (${roomData.winner === roomData.playerWhite ? roomData.playerWhiteEmail : roomData.playerBlackEmail})` : ""}!`
                  : roomData.result === "black"
                    ? `Black wins${roomData.winner ? ` (${roomData.winner === roomData.playerBlack ? roomData.playerBlackEmail : roomData.playerWhiteEmail})` : ""}!`
                    : "Game finished."}
            </Typography>
            <Button variant="contained" color="primary" onClick={() => {
              setJoinedRoom(null);
              setRoomData(null);
              setGameStarted(false);
              setRoomId("");
            }}>
              Leave Room
            </Button>
          </Box>
        )}
        
        {/* Copy to clipboard notification */}
        <Snackbar
          open={copySnackbar}
          autoHideDuration={2000}
          onClose={() => setCopySnackbar(false)}
          message="Room code copied to clipboard!"
        />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={error}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
      {/* Room List/Lobby */}
      <Card sx={{ minWidth: 350, p: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Open Rooms</Typography>
          {roomsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 60 }}>
              <CircularProgress size={24} />
            </Box>
          ) : openRooms.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No open rooms. Create one!</Typography>
          ) : (
            <Fade in timeout={500}>
              <Box>
                {openRooms.map(room => {
                  const isOwnRoom = currentUser && (room.playerWhite === currentUser.uid || room.playerBlack === currentUser.uid);
                  return (
                    <Box key={room.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, opacity: isOwnRoom ? 0.7 : 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(room.playerWhiteEmail), fontSize: '1rem', mr: 1 }}>
                        {getInitials(room.playerWhiteEmail)}
                      </Avatar>
                      <Typography sx={{ flex: 1 }}>
                        {room.playerWhiteEmail || 'Unknown'}
                        {isOwnRoom && (
                          <Typography component="span" sx={{ ml: 1, fontSize: 12, color: 'primary.main' }}>(You)</Typography>
                        )}
                      </Typography>
                      <Tooltip title={isOwnRoom ? "You are already in this room" : "Join this room"}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              setJoiningRoomId(room.id);
                              setRoomId(room.id);
                              await handleJoinRoom();
                              setJoiningRoomId("");
                            }}
                            disabled={loading || isOwnRoom || joiningRoomId === room.id}
                            sx={{ minWidth: 70 }}
                          >
                            {joiningRoomId === room.id ? <CircularProgress size={16} /> : "Join"}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>
      {/* Existing create/join room UI below */}
      <Card sx={{ minWidth: 350, p: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Play Online</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new game room or join an existing one using a room code.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Time Control:</Typography>
            <Select
              value={selectedTimeControl}
              onChange={e => setSelectedTimeControl(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="1|0">Bullet (1|0)</MenuItem>
              <MenuItem value="3|0">Blitz (3|0)</MenuItem>
              <MenuItem value="5|0">Blitz (5|0)</MenuItem>
              <MenuItem value="10|0">Rapid (10|0)</MenuItem>
              <MenuItem value="15|10">Classical (15|10)</MenuItem>
              <MenuItem value="30|0">Classical (30|0)</MenuItem>
              <MenuItem value="custom">Custom...</MenuItem>
            </Select>
          </Box>

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
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', textAlign: 'center' }}>
            Click to create a new room and get a code to share with a friend.
          </Typography>
          
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mb: 2 }}
            onClick={handleMatchmaking}
            disabled={loading || matchmaking}
          >
            {matchmaking ? <CircularProgress size={20} color="inherit" /> : "Play Random Opponent"}
          </Button>
          {matchmaking && (
            <Typography align="center" sx={{ mb: 2 }}>{matchStatus}</Typography>
          )}
          
          <Typography align="center" sx={{ my: 2 }}>or</Typography>
          
          <TextField
            label="Enter Room Code"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            disabled={loading}
            placeholder="e.g., abc123"
            error={!!error}
            helperText={error}
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