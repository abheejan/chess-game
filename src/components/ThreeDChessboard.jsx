import React, { useMemo, Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, SoftShadows, useGLTF } from "@react-three/drei";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Chess } from "chess.js";

// Map piece type and color to model file name
const pieceModelMap = {
  wK: "wK.glb", wQ: "wQ.glb", wR: "wR.glb", wB: "wB.glb", wN: "wN.glb", wP: "wP.glb",
  bK: "bK.glb", bQ: "bQ.glb", bR: "bR.glb", bB: "bB.glb", bN: "bN.glb", bP: "bP.glb"
};

function PieceModel({ type, color, position }) {
  const key = color + type.toUpperCase();
  const modelPath = `/assets/models/${pieceModelMap[key]}`;
  // Always call useGLTF, let Suspense handle fallback
  const { scene } = useGLTF(modelPath, true);
  return <primitive object={scene} position={position} scale={0.6} />;
}

function PieceFallback({ color, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial color={color === "w" ? "#fff" : "#222"} metalness={0.5} roughness={0.4} />
    </mesh>
  );
}

function Square({ position, color, onClick, isHighlight }) {
  return (
    <mesh position={position} receiveShadow onClick={onClick}>
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial color={isHighlight ? "#f7ec6e" : color} />
    </mesh>
  );
}

function PieceWithFallback(props) {
  // This component wraps PieceModel in Suspense and provides a fallback
  return (
    <Suspense fallback={<PieceFallback color={props.color} position={props.position} />}>
      <PieceModel {...props} />
    </Suspense>
  );
}

export default function ThreeDChessboard({ 
  board, 
  onSquareClick, 
  highlights = [],
  roomId,
  multiplayer = false,
  playerWhite,
  playerBlack
}) {
  const { currentUser } = useAuth();
  const [game, setGame] = useState(new Chess());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);

  // Multiplayer logic
  useEffect(() => {
    if (!multiplayer || !roomId) return;

    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.fen) {
          const newGame = new Chess(data.fen);
          setGame(newGame);
          setIsMyTurn(
            (data.turn === "w" && currentUser?.uid === playerWhite) ||
            (data.turn === "b" && currentUser?.uid === playerBlack)
          );
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, multiplayer, currentUser, playerWhite, playerBlack]);

  // Handle piece selection and moves for multiplayer
  const handleMultiplayerClick = (i, j) => {
    if (!multiplayer || !isMyTurn || game.isGameOver()) return;
    
    const square = String.fromCharCode(97 + j) + (8 - i);
    const piece = game.get(square);
    
    if (selectedPiece && availableMoves.includes(square)) {
      // Make move
      const move = game.move({ from: selectedPiece, to: square });
      if (move) {
        // Update Firestore
        const roomRef = doc(db, "rooms", roomId);
        updateDoc(roomRef, {
          fen: game.fen(),
          turn: game.turn(),
          lastMove: { from: selectedPiece, to: square }
        });
        
        setSelectedPiece(null);
        setAvailableMoves([]);
      }
    } else if (piece) {
      // Check if it's the player's piece
      const isWhitePiece = piece.color === "w";
      const isMyPiece = (isWhitePiece && currentUser?.uid === playerWhite) ||
                       (!isWhitePiece && currentUser?.uid === playerBlack);
      
      if (isMyPiece) {
        setSelectedPiece(square);
        const moves = game.moves({ square, verbose: true });
        setAvailableMoves(moves.map(move => move.to));
      }
    } else {
      setSelectedPiece(null);
      setAvailableMoves([]);
    }
  };

  // Use provided board or game board
  const currentBoard = board || game.board();
  
  // Use provided click handler or multiplayer handler
  const handleClick = onSquareClick || handleMultiplayerClick;

  // Calculate highlights for multiplayer
  const currentHighlights = multiplayer 
    ? availableMoves.map(move => [8 - parseInt(move[1]), move.charCodeAt(0) - 97])
    : highlights;

  const squares = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        arr.push({
          pos: [j - 3.5, 0, 3.5 - i],
          color: (i + j) % 2 === 0 ? "#f0d9b5" : "#b58863",
          idx: i * 8 + j,
          i, j
        });
      }
    }
    return arr;
  }, []);

  const pieces = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = currentBoard[i][j];
        if (piece) {
          arr.push({
            type: piece.type,
            color: piece.color,
            pos: [j - 3.5, 0.2, 3.5 - i],
            key: `${piece.type}${piece.color}${i}${j}`
          });
        }
      }
    }
    return arr;
  }, [currentBoard]);

  return (
    <Canvas shadows camera={{ position: [0, 7, 7], fov: 40 }} style={{ height: 400, width: 400, borderRadius: 12 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={0.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <SoftShadows />
      {/* Board squares */}
      {squares.map((sq, idx) => (
        <Square
          key={idx}
          position={sq.pos}
          color={sq.color}
          isHighlight={currentHighlights.some(([i, j]) => i === sq.i && j === sq.j)}
          onClick={() => handleClick(sq.i, sq.j)}
        />
      ))}
      {/* Pieces with fallback */}
      {pieces.map(piece => (
        <PieceWithFallback key={piece.key} type={piece.type} color={piece.color} position={piece.pos} />
      ))}
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 3} />
    </Canvas>
  );
}

// INSTRUCTIONS:
// Place your 3D chess piece models in public/assets/models/ as:
//   wK.glb, wQ.glb, wR.glb, wB.glb, wN.glb, wP.glb (white pieces)
//   bK.glb, bQ.glb, bR.glb, bB.glb, bN.glb, bP.glb (black pieces)
// You can use free models from sites like Poly Pizza, Sketchfab, or OpenGameArt. 