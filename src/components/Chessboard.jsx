import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { useRef } from "react";
import { collection as firestoreCollection, addDoc as firestoreAddDoc, query, orderBy, onSnapshot as firestoreOnSnapshot } from "firebase/firestore";
// import useSound from 'use-sound';
// import { sounds } from '../sounds.js';
import { useTheme } from '@mui/material/styles';
import { useCallback } from 'react';

const pieceUnicode = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};

const themes = {
  light: {
    light: '#eeeed2',
    dark: '#769656',
    highlight: '#f7ec6e',
    selected: '#f6f669',
    fontColor: '#222',
    fontFamily: 'serif',
  },
  dark: {
    light: '#b58863',
    dark: '#3c3c3c',
    highlight: '#f7ec6e',
    selected: '#f6f669',
    fontColor: '#fff',
    fontFamily: 'monospace',
  },
  classic: {
    light: '#f0d9b5',
    dark: '#b58863',
    highlight: '#f7ec6e',
    selected: '#f6f669',
    fontColor: '#222',
    fontFamily: 'Georgia, serif',
  },
  modern: {
    light: '#e0e0e0',
    dark: '#607d8b',
    highlight: '#ffd54f',
    selected: '#ffecb3',
    fontColor: '#222',
    fontFamily: 'Arial, sans-serif',
  },
};

function getSquareName(i, j) {
  // i: row (0-7), j: col (0-7)
  return String.fromCharCode(97 + j) + (8 - i);
}

export default function Chessboard({ 
  roomId, 
  multiplayer, 
  playerWhite, 
  playerBlack, 
  customGame, 
  onUserMove, 
  onPieceSelect,
  selectedPiece,
  availableMoves,
  disableMultiplayer, 
  hideChat, 
  hideMoveHistory 
}) {
  const [game, setGame] = useState(customGame || new Chess());
  const [selected, setSelected] = useState(null); // {row, col}
  const [lastMove, setLastMove] = useState(null); // {from, to}
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const board = game.board();
  const { currentUser } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [moveHistory, setMoveHistory] = useState([]);
  const chatEndRef = useRef(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAccepted, setRematchAccepted] = useState(false);
  const [theme, setTheme] = useState('classic');
  const [soundEnabled, setSoundEnabled] = useState(false); // Disable sounds temporarily
  const themeObj = useTheme();
  
  // Define getSquareColor inside the component so it can access 'theme'
  function getSquareColor(i, j) {
    return (i + j) % 2 === 1 ? themes[theme].dark : themes[theme].light;
  }

  // Comment out sound hooks temporarily
  // const [playMove] = useSound(sounds.move, { volume: 0.5 });
  // const [playCheck] = useSound(sounds.check, { volume: 0.6 });
  // const [playGameOver] = useSound(sounds.gameOver, { volume: 0.7 });

  const saveGameResult = useCallback(async (result, winner) => {
    if (!currentUser || !roomId) return;
    const opponentId = currentUser.uid === playerWhite ? playerBlack : playerWhite;
    const opponentEmail = currentUser.uid === playerWhite ? 
      (await getDoc(doc(db, "users", playerBlack)))?.data()?.email : 
      (await getDoc(doc(db, "users", playerWhite)))?.data()?.email;
    await addDoc(collection(db, "games"), {
      userId: currentUser.uid,
      opponentId,
      opponentEmail: opponentEmail || "Unknown",
      result: result === "draw" ? "draw" : (result === "white" && currentUser.uid === playerWhite) ? "win" : "loss",
      date: serverTimestamp(),
      roomId
    });
  }, [currentUser, playerWhite, playerBlack, roomId]);

  async function handleResign() {
    if (!multiplayer || !roomId || !currentUser) return;
    const result = currentUser.uid === playerWhite ? "black" : "white";
    await updateDoc(doc(db, "rooms", roomId), { 
      status: "finished", 
      result,
      winner: currentUser.uid === playerWhite ? playerBlack : playerWhite
    });
    setGameOver(true);
    setGameResult(result);
  }

  async function handleDrawOffer() {
    if (!multiplayer || !roomId) return;
    await updateDoc(doc(db, "rooms", roomId), { drawOffered: true });
  }

  useEffect(() => {
    if (!multiplayer || !roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    const unsub = onSnapshot(roomRef, async (snap) => {
      const data = snap.data();
      if (data) {
        if (data.fen) {
          setGame(new Chess(data.fen));
        }
        if (data.status === "finished") {
          setGameOver(true);
          setGameResult(data.result);
          await saveGameResult(data.result, data.winner);
        }
      }
    });
    return unsub;
  }, [multiplayer, roomId, saveGameResult]);

  // Move history update
  useEffect(() => {
    setMoveHistory(game.history({ verbose: true }));
  }, [game]);

  // Update game when customGame prop changes
  useEffect(() => {
    if (customGame) {
      setGame(customGame);
    }
  }, [customGame]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Chat Firestore listener
  useEffect(() => {
    if (!multiplayer || !roomId) return;
    const chatRef = firestoreCollection(db, "rooms", roomId, "chat");
    const q = query(chatRef, orderBy("timestamp"));
    const unsub = firestoreOnSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(doc => doc.data()));
    });
    return unsub;
  }, [multiplayer, roomId]);

  // Listen for rematch offers
  useEffect(() => {
    if (!multiplayer || !roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
      const data = snap.data();
      if (data && data.rematch) {
        setRematchRequested(true);
        if (data.rematchAccepted) {
          setRematchAccepted(true);
          // Reset board
          setGame(new Chess());
          setLastMove(null);
          setGameOver(false);
          setGameResult(null);
          setRematchRequested(false);
          setRematchAccepted(false);
          updateDoc(roomRef, { rematch: false, rematchAccepted: false, fen: null, status: "waiting", result: null, winner: null });
        }
      }
    });
    return unsub;
  }, [multiplayer, roomId]);

  async function handleRematch() {
    if (!multiplayer || !roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { rematch: true });
  }

  async function handleAcceptRematch() {
    if (!multiplayer || !roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, { rematchAccepted: true });
  }

  const handleSquareClick = async (i, j) => {
    if (gameOver) return;
    const square = getSquareName(i, j);
    
    // Handle piece selection for bot mode
    if (onPieceSelect && !selected) {
      const piece = game.get(square);
      if (piece && piece.color === 'w') {
        onPieceSelect(square);
        setSelected({ row: i, col: j });
        return;
      }
    }

    if (selected) {
      const from = getSquareName(selected.row, selected.col);
      
      // Bot mode - use onUserMove callback
      if (onUserMove) {
        const success = onUserMove(from, square);
        if (success) {
          setSelected(null);
        }
        return;
      }

      // Multiplayer mode - existing logic
      if (multiplayer && roomId) {
        const isWhite = game.turn() === "w";
        const isMyTurn = (isWhite && currentUser?.uid === playerWhite) || (!isWhite && currentUser?.uid === playerBlack);
        if (!isMyTurn) {
          setSelected(null);
          return;
        }
      }
      
      // Check if the move is valid before attempting it
      const moves = game.moves({ square: from, verbose: true });
      const validMove = moves.find(move => move.to === square);
      
      if (!validMove) {
        setSelected(null);
        return;
      }
      
      // Use the valid move object to make the move
      const move = game.move(validMove);
      if (move) {
        setGame(new Chess(game.fen()));
        setLastMove({ from, to: square });
        setSelected(null);
        
        // Comment out sound effects temporarily
        // if (soundEnabled) {
        //   playMove();
        //   if (game.inCheck()) {
        //     playCheck();
        //   }
        // }
        
        // Multiplayer: update Firestore
        if (multiplayer && roomId) {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, { fen: game.fen() });
          // Check for game over
          if (game.isGameOver()) {
            let result = "draw";
            if (game.isCheckmate()) {
              result = game.turn() === "w" ? "black" : "white";
            }
            // if (soundEnabled) {
            //   playGameOver();
            // }
            await updateDoc(roomRef, { 
              status: "finished", 
              result,
              winner: result === "draw" ? null : (result === "white" ? playerWhite : playerBlack)
            });
            await saveGameResult(result, result === "draw" ? null : (result === "white" ? playerWhite : playerBlack));
          }
        }
        // Save game if over (single player)
        if (!multiplayer && game.isGameOver()) {
          let result = "draw";
          if (game.isCheckmate()) {
            result = game.turn() === "w" ? "loss" : "win";
          }
          // if (soundEnabled) {
          //   playGameOver();
          // }
          if (currentUser) {
            addDoc(collection(db, "games"), {
              userId: currentUser.uid,
              opponentEmail: "Bot",
              result,
              date: serverTimestamp(),
            });
          }
        }
      } else {
        setSelected(null);
      }
    } else if (board[i][j]) {
      setSelected({ row: i, col: j });
    }
  };

  function handleReset() {
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;
    const chatRef = firestoreCollection(db, "rooms", roomId, "chat");
    await firestoreAddDoc(chatRef, {
      user: currentUser.email,
      text: chatInput,
      timestamp: serverTimestamp(),
    });
    setChatInput("");
  }

  const isMyTurn = multiplayer ? 
    ((game.turn() === "w" && currentUser?.uid === playerWhite) || 
     (game.turn() === "b" && currentUser?.uid === playerBlack)) : true;

  const squareSize = 50;
  const mobileSquareSize = 36;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', mt: 4, gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Theme Selector */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button size="small" variant={theme === 'classic' ? 'contained' : 'outlined'} onClick={() => setTheme('classic')} sx={{ mr: 1 }}>Classic</Button>
          <Button size="small" variant={theme === 'modern' ? 'contained' : 'outlined'} onClick={() => setTheme('modern')} sx={{ mr: 1 }}>Modern</Button>
          <Button size="small" variant={theme === 'light' ? 'contained' : 'outlined'} onClick={() => setTheme('light')} sx={{ mr: 1 }}>Light</Button>
          <Button size="small" variant={theme === 'dark' ? 'contained' : 'outlined'} onClick={() => setTheme('dark')} sx={{ mr: 1 }}>Dark</Button>
          <Button 
            size="small" 
            variant={soundEnabled ? 'contained' : 'outlined'} 
            onClick={() => setSoundEnabled(!soundEnabled)}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </Button>
        </Box>
        {multiplayer && (
          <Typography variant="h6" sx={{ mb: 2, color: isMyTurn ? 'green' : 'gray' }}>
            {gameOver ? `Game Over - ${gameResult === 'draw' ? 'Draw' : `${gameResult} wins`}` : 
             isMyTurn ? "Your turn" : "Opponent's turn"}
          </Typography>
        )}
        <Card sx={{ p: 2, boxShadow: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "grid",
                gridTemplateRows: { xs: `repeat(8, ${mobileSquareSize}px)`, md: `repeat(8, ${squareSize}px)` },
                gridTemplateColumns: { xs: `repeat(8, ${mobileSquareSize}px)`, md: `repeat(8, ${squareSize}px)` },
                border: "2px solid #333",
                width: { xs: mobileSquareSize * 8, md: squareSize * 8 },
                height: { xs: mobileSquareSize * 8, md: squareSize * 8 },
                mb: 2,
                transition: 'width 0.3s, height 0.3s',
                background: themeObj.palette.mode === 'dark' ? '#222' : undefined
              }}
            >
              {board.map((row, i) =>
                row.map((piece, j) => {
                  const squareName = getSquareName(i, j);
                  const isSelected = selected && selected.row === i && selected.col === j;
                  const isLastFrom = lastMove && getSquareName(i, j) === lastMove.from;
                  const isLastTo = lastMove && getSquareName(i, j) === lastMove.to;
                  const isSelectedPiece = selectedPiece === squareName;
                  const isAvailableMove = availableMoves && availableMoves.includes(squareName);
                  
                  return (
                    <Box
                      key={`${i}-${j}`}
                      onClick={() => handleSquareClick(i, j)}
                      sx={{
                        width: { xs: mobileSquareSize, md: squareSize },
                        height: { xs: mobileSquareSize, md: squareSize },
                        background: isSelected || isSelectedPiece
                          ? themes[theme].selected
                          : isAvailableMove
                          ? '#90EE90' // Light green for available moves
                          : isLastFrom || isLastTo
                          ? themes[theme].highlight
                          : getSquareColor(i, j),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: { xs: 22, md: 36 },
                        userSelect: "none",
                        cursor: piece || selected || isAvailableMove ? "pointer" : "default",
                        transition: "background 0.2s, font-size 0.2s, width 0.3s, height 0.3s",
                        color: themes[theme].fontColor,
                        fontFamily: themes[theme].fontFamily,
                        boxShadow: isLastTo ? '0 0 8px 2px #ffd54f' : undefined,
                        borderRadius: isSelected || isSelectedPiece ? 2 : 0
                      }}
                    >
                      <span
                        style={{
                          transition: isLastTo ? "transform 0.2s" : undefined,
                          transform: isLastTo ? "scale(1.2)" : "scale(1)"
                        }}
                      >
                        {piece ? pieceUnicode[piece.color === "w" ? piece.type.toUpperCase() : piece.type] : ""}
                      </span>
                    </Box>
                  );
                })
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={handleReset}>
                Reset Board
              </Button>
              {multiplayer && !gameOver && (
                <>
                  <Button variant="outlined" color="error" onClick={handleResign}>
                    Resign
                  </Button>
                  <Button variant="outlined" color="warning" onClick={handleDrawOffer}>
                    Offer Draw
                  </Button>
                </>
              )}
            </Box>
            {multiplayer && gameOver && !rematchRequested && (
              <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleRematch}>
                Rematch
              </Button>
            )}
            {multiplayer && gameOver && rematchRequested && !rematchAccepted && (
              <Button variant="contained" color="success" sx={{ mt: 2 }} onClick={handleAcceptRematch}>
                Accept Rematch
              </Button>
            )}
          </CardContent>
        </Card>
      </Box>
      {multiplayer && !hideChat && (
        <Box sx={{ minWidth: 250, maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Move History */}
          {!hideMoveHistory && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">Move History</Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 14 }}>
                  {moveHistory.length === 0 ? (
                    <Typography>No moves yet.</Typography>
                  ) : (
                    moveHistory.map((move, idx) => (
                      <div key={idx}>{`${idx + 1}. ${move.color === 'w' ? 'White' : 'Black'}: ${move.san}`}</div>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
          {/* Chat */}
          <Card>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="h6">Chat</Typography>
              <Box sx={{ maxHeight: 180, overflowY: 'auto', mb: 1 }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    <b>{msg.user}:</b> {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </Box>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, fontSize: 14 }}
                />
                <Button type="submit" size="small" variant="contained">Send</Button>
              </form>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
} 