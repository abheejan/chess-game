import React, { useState } from "react";
import Chessboard from "../components/Chessboard";
import ThreeDChessboard from "../components/ThreeDChessboard";
import { Chess } from "chess.js";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export default function PlayBot() {
  const [game, setGame] = useState(new Chess());
  const [userTurn, setUserTurn] = useState(true);
  const [result, setResult] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [use3D, setUse3D] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  // Bot move logic for different difficulties
  function botMove(currentGame) {
    if (currentGame.isGameOver()) return;
    const moves = currentGame.moves({ verbose: true });
    if (moves.length === 0) return;
    let move;
    if (difficulty === "easy") {
      // Random move
      move = moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === "medium") {
      // Prefer captures, otherwise random
      const captureMoves = moves.filter(m => m.captured);
      if (captureMoves.length > 0) {
        // Pick the capture with the highest value
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
        captureMoves.sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
        move = captureMoves[0];
      } else {
        move = moves[Math.floor(Math.random() * moves.length)];
      }
    } else if (difficulty === "hard") {
      // Minimax depth 2 (1 ply for bot, 1 for user)
      move = findBestMove(currentGame, 2);
      if (!move) move = moves[Math.floor(Math.random() * moves.length)];
    }
    currentGame.move(move);
    setGame(new Chess(currentGame.fen()));
    setUserTurn(true);
    setSelectedPiece(null);
    setAvailableMoves([]);
    if (currentGame.isGameOver()) {
      setResult(getResult(currentGame));
    }
  }

  // Simple minimax for hard mode
  function findBestMove(chess, depth) {
    let bestMove = null;
    let bestValue = -Infinity;
    const moves = chess.moves({ verbose: true });
    for (const move of moves) {
      const temp = new Chess(chess.fen());
      temp.move(move);
      const value = minimax(temp, depth - 1, false);
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
    return bestMove;
  }

  function minimax(chess, depth, isMaximizing) {
    if (depth === 0 || chess.isGameOver()) {
      return evaluateBoard(chess);
    }
    const moves = chess.moves({ verbose: true });
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const temp = new Chess(chess.fen());
        temp.move(move);
        const evalScore = minimax(temp, depth - 1, false);
        if (evalScore > maxEval) maxEval = evalScore;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const temp = new Chess(chess.fen());
        temp.move(move);
        const evalScore = minimax(temp, depth - 1, true);
        if (evalScore < minEval) minEval = evalScore;
      }
      return minEval;
    }
  }

  function evaluateBoard(chess) {
    // Simple material count
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let evalScore = 0;
    const board = chess.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          evalScore += piece.color === "b" ? value : -value;
        }
      }
    }
    return evalScore;
  }

  function getResult(chess) {
    if (chess.isCheckmate()) {
      return chess.turn() === "w" ? "Bot wins!" : "You win!";
    }
    if (chess.isDraw()) return "Draw!";
    return null;
  }

  // Handle piece selection and show available moves
  const handlePieceSelect = (from) => {
    if (!userTurn || game.isGameOver() || !gameStarted) return;
    const piece = game.get(from);
    if (piece && piece.color === 'w') { // User plays as white
      setSelectedPiece(from);
      const moves = game.moves({ square: from, verbose: true });
      setAvailableMoves(moves.map(move => move.to));
    }
  };

  // User move handler
  const handleUserMove = (from, to) => {
    if (!userTurn || game.isGameOver() || !gameStarted) return false;
    
    // Check if the move is valid before attempting it
    const moves = game.moves({ square: from, verbose: true });
    const validMove = moves.find(move => move.to === to);
    
    if (!validMove) return false;
    
    // Use the valid move object to make the move
    const move = game.move(validMove);
    if (move) {
      setGame(new Chess(game.fen()));
      setUserTurn(false);
      setSelectedPiece(null);
      setAvailableMoves([]);
      if (game.isGameOver()) {
        setResult(getResult(game));
      } else {
        setTimeout(() => botMove(new Chess(game.fen())), 800);
      }
      return true;
    }
    return false;
  };

  function handleStartGame() {
    setGame(new Chess());
    setUserTurn(true);
    setResult(null);
    setGameStarted(true);
    setSelectedPiece(null);
    setAvailableMoves([]);
  }

  function handleReset() {
    setGame(new Chess());
    setUserTurn(true);
    setResult(null);
    setGameStarted(false);
    setSelectedPiece(null);
    setAvailableMoves([]);
  }

  // 3D board click handler
  const handle3DSquareClick = (i, j) => {
    if (!userTurn || game.isGameOver() || !gameStarted) return;
    const from = selectedPiece;
    const to = String.fromCharCode(97 + j) + (8 - i);
    if (from && availableMoves.includes(to)) {
      handleUserMove(from, to);
    } else {
      // Select new piece
      const piece = game.get(to);
      if (piece && piece.color === 'w') {
        setSelectedPiece(to);
        const moves = game.moves({ square: to, verbose: true });
        setAvailableMoves(moves.map(move => move.to));
      } else {
        setSelectedPiece(null);
        setAvailableMoves([]);
      }
    }
  };

  // Highlight squares for available moves in 3D
  const highlightSquares = selectedPiece && availableMoves.length > 0
    ? availableMoves.map(move => [8 - parseInt(move[1]), move.charCodeAt(0) - 97])
    : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <Card sx={{ p: 2, mb: 2, maxWidth: 700 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Play Against Bot</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            You play as White. The bot will make a move after each of your moves.
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ mr: 1, display: 'inline' }}>Difficulty:</Typography>
              <Select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                size="small"
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </Box>
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
          {!gameStarted && (
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={handleStartGame}
              sx={{ mb: 2 }}
            >
              Start Game
            </Button>
          )}
          {gameStarted && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color={userTurn ? 'success.main' : 'text.secondary'}>
                {userTurn ? "Your turn (White)" : "Bot's turn (Black)"}
              </Typography>
              {result && (
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  {result}
                </Typography>
              )}
            </Box>
          )}
          {selectedPiece && availableMoves.length > 0 && !use3D && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Available moves for {selectedPiece}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableMoves.map((move, index) => (
                  <Chip 
                    key={index} 
                    label={move} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
          <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
            {use3D ? (
              <ThreeDChessboard
                board={game.board()}
                onSquareClick={handle3DSquareClick}
                highlights={highlightSquares}
              />
            ) : (
              <Chessboard
                customGame={game}
                onUserMove={handleUserMove}
                onPieceSelect={handlePieceSelect}
                selectedPiece={selectedPiece}
                availableMoves={availableMoves}
                disableMultiplayer
                hideChat
                hideMoveHistory
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleReset}
              fullWidth
            >
              Reset Game
            </Button>
            {gameStarted && (
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleStartGame}
                fullWidth
              >
                New Game
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 