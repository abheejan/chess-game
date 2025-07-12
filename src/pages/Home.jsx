import React, { useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Divider, IconButton, Tooltip, Paper, FormControlLabel, Switch } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import GroupIcon from '@mui/icons-material/Group';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ThreeDChessboard from "../components/ThreeDChessboard";
import { useNavigate } from "react-router-dom";

// --- Sample Data ---
const data = [
  { name: 'Wins', value: 12 },
  { name: 'Losses', value: 7 },
  { name: 'Draws', value: 3 },
];

const features = [
  { icon: <ThreeDRotationIcon color="primary" sx={{ fontSize: 40 }} />, title: '3D Chessboard', desc: 'Play on a realistic, animated 3D chessboard.' },
  { icon: <GroupIcon color="primary" sx={{ fontSize: 40 }} />, title: 'Multiplayer', desc: 'Challenge friends or play with anyone online.' },
  { icon: <SportsEsportsIcon color="primary" sx={{ fontSize: 40 }} />, title: 'Play vs Bot', desc: 'Practice against a smart chess bot with difficulty levels.' },
  { icon: <GoogleIcon color="primary" sx={{ fontSize: 40 }} />, title: 'Google Sign-In', desc: 'Secure authentication with your Google account.' },
];

const leaderboard = [
  { name: 'Alice', wins: 22, avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Bob', wins: 18, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Carol', wins: 15, avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { name: 'You', wins: 12, avatar: null },
];

const testimonials = [
  { quote: "The 3D chessboard is stunning!", author: "ChessFan99" },
  { quote: "Best online chess experience I've had.", author: "GrandmasterX" },
  { quote: "Love the multiplayer and bot difficulty levels!", author: "RookieQueen" },
];

// --- Simple Demo Chessboard ---
const initialDemoBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];
const pieceUnicode = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};
function DemoChessboard() {
  const [board, setBoard] = useState(initialDemoBoard);
  const [selected, setSelected] = useState(null);
  function handleSquareClick(i, j) {
    if (selected) {
      // Move piece if empty or capture
      const [si, sj] = selected;
      if ((si !== i || sj !== j) && board[si][sj]) {
        const newBoard = board.map(row => row.slice());
        newBoard[i][j] = board[si][sj];
        newBoard[si][sj] = null;
        setBoard(newBoard);
        setSelected(null);
        return;
      }
      setSelected(null);
    } else if (board[i][j]) {
      setSelected([i, j]);
    }
  }
  return (
    <Box sx={{ display: 'inline-block', border: '2px solid #b58863', borderRadius: 2, boxShadow: 2, overflow: 'hidden', background: '#fff' }}>
      <Box sx={{ display: 'grid', gridTemplateRows: 'repeat(8, 32px)', gridTemplateColumns: 'repeat(8, 32px)' }}>
        {board.map((row, i) =>
          row.map((piece, j) => (
            <Box
              key={i + '-' + j}
              onClick={() => handleSquareClick(i, j)}
              sx={{
                width: 32, height: 32,
                background: (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, cursor: piece ? 'pointer' : 'default',
                border: selected && selected[0] === i && selected[1] === j ? '2px solid #f7ec6e' : undefined
              }}
            >
              {piece ? pieceUnicode[piece] : ''}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

// --- Animated Chessboard Background CSS ---
const animatedBg = {
  position: 'fixed',
  top: 0, left: 0, width: '100vw', height: '100vh',
  zIndex: 0,
  pointerEvents: 'none',
  background: `repeating-linear-gradient(90deg, #f0d9b5 0 40px, #b58863 40px 80px),
               repeating-linear-gradient(0deg, #f0d9b5 0 40px, #b58863 40px 80px)`,
  opacity: 0.12,
  animation: 'bgmove 12s linear infinite',
};
const keyframes = `@keyframes bgmove { 0% { background-position: 0 0, 0 0; } 100% { background-position: 80px 80px, 80px 80px; } }`;

export default function Home() {
  const [use3D, setUse3D] = useState(false);
  const navigate = useNavigate();
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      {/* Animated Background */}
      <style>{keyframes}</style>
      <Box sx={animatedBg} />

      {/* Hero Section */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        background: 'linear-gradient(90deg, #f0d9b5 0%, #b58863 100%)',
        boxShadow: 2,
        position: 'relative',
        zIndex: 2
      }}>
        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' }, mb: { xs: 3, md: 0 } }}>
          <Typography variant="h2" fontWeight={700} gutterBottom sx={{ fontFamily: 'serif' }}>
            Welcome to Chess 3D
          </Typography>
          <Typography variant="h5" sx={{ mb: 3 }}>
            The modern, full-featured chess platform.
          </Typography>
          <Button variant="contained" color="primary" size="large" onClick={() => navigate("/play-bot") } sx={{ mr: 2 }}>
            PLAY VS BOT
          </Button>
          <Button variant="outlined" color="primary" size="large" onClick={() => navigate("/play-online") }>
            PLAY ONLINE
          </Button>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Avatar
            variant="rounded"
            src={process.env.PUBLIC_URL + '/assets/images/chess-hero.jpg'}
            alt="Chess Hero"
            sx={{ width: 260, height: 260, boxShadow: 3, border: '6px solid #fff', bgcolor: '#fff' }}
            imgProps={{ style: { objectFit: 'cover' } }}
          >
            <ThreeDRotationIcon sx={{ fontSize: 120, color: '#b58863' }} />
          </Avatar>
        </Box>
      </Box>

      {/* SVG Section Divider */}
      <Box sx={{ width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 2 }}>
        <svg viewBox="0 0 1200 80" height="40" width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0,0 C300,80 900,0 1200,80 L1200,0 L0,0 Z" fill="#fff" />
        </svg>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6, px: 2, maxWidth: 1100, mx: 'auto', zIndex: 2 }}>
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          Features
        </Typography>
        <Grid container spacing={4} columns={12} justifyContent="center">
          {features.map((f, idx) => (
            <Grid span={3} key={idx}>
              <Card sx={{ textAlign: 'center', py: 3, boxShadow: 2, borderRadius: 3 }}>
                <CardContent>
                  {f.icon}
                  <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* SVG Section Divider */}
      <Box sx={{ width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 2 }}>
        <svg viewBox="0 0 1200 80" height="40" width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0,80 C300,0 900,80 1200,0 L1200,80 L0,80 Z" fill="#fff" />
        </svg>
      </Box>

      {/* Leaderboard & Demo Board Section */}
      <Box sx={{ py: 6, px: 2, maxWidth: 1100, mx: 'auto', zIndex: 2 }}>
        <Grid container spacing={4} columns={12}>
          <Grid span={6}>
            <Typography variant="h4" fontWeight={600} gutterBottom>Leaderboard</Typography>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              {leaderboard.map((user, idx) => (
                <Box key={user.name} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={user.avatar || undefined} sx={{ bgcolor: '#b58863', mr: 2 }}>{user.avatar ? '' : user.name[0]}</Avatar>
                  <Typography variant="h6" sx={{ flex: 1 }}>{user.name}</Typography>
                  <Typography variant="body1" fontWeight={600} color="primary">{user.wins} wins</Typography>
                  {idx === 0 && <span style={{ marginLeft: 8, fontSize: 22 }}>🏆</span>}
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid span={6}>
            <Typography variant="h4" fontWeight={600} gutterBottom>Try a Move!</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
            {use3D ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ThreeDChessboard
                  board={initialDemoBoard}
                  onSquareClick={(i, j) => {
                    // Simple demo click handler for 3D
                    console.log(`Clicked square: ${i}, ${j}`);
                  }}
                />
              </Box>
            ) : (
              <DemoChessboard />
            )}
          </Grid>
        </Grid>
      </Box>

      {/* SVG Section Divider */}
      <Box sx={{ width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 2 }}>
        <svg viewBox="0 0 1200 80" height="40" width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0,0 C300,80 900,0 1200,80 L1200,0 L0,0 Z" fill="#fff" />
        </svg>
      </Box>

      {/* Stats/Graph Section */}
      <Box sx={{ py: 6, px: 2, maxWidth: 700, mx: 'auto', zIndex: 2 }}>
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          Your Game Stats
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <ReTooltip />
            <Bar dataKey="value" fill="#b58863" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 6, px: 2, maxWidth: 900, mx: 'auto', zIndex: 2 }}>
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          What Players Say
        </Typography>
        <Grid container spacing={4} columns={12} justifyContent="center">
          {testimonials.map((t, idx) => (
            <Grid span={4} key={idx}>
              <Card sx={{ p: 3, borderLeft: '6px solid #b58863', boxShadow: 2, minHeight: 120 }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
                  “{t.quote}”
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  — {t.author}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4, zIndex: 2 }} />

      {/* Attribution/Footer with Social Links */}
      <Box sx={{ textAlign: 'center', pb: 4, zIndex: 2 }}>
        <Typography variant="body1" fontWeight={500}>
          Made with ♟️ by <span style={{ color: '#b58863', fontWeight: 700 }}>Abheejan Lal Shrestha</span>
        </Typography>
        <Box sx={{ mt: 2, mb: 1 }}>
          <Tooltip title="GitHub"><IconButton href="https://github.com/abheejan" target="_blank"><GitHubIcon /></IconButton></Tooltip>
          <Tooltip title="LinkedIn"><IconButton href="https://www.linkedin.com/in/abheejan-lal-shrestha-5b9919313/" target="_blank"><LinkedInIcon /></IconButton></Tooltip>
          <Tooltip title="Email"><IconButton href="mailto:abheejanlal@gmail.com"><EmailIcon /></IconButton></Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          © {new Date().getFullYear()} Chess 3D. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
} 