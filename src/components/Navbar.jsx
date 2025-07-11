import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";
import { useColorMode } from "../index";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import Avatar from "@mui/material/Avatar";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const colorMode = useColorMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Play Online", to: "/play-online" },
    { label: "Play Bot", to: "/play-bot" },
    ...(currentUser ? [
      { label: "Profile", to: "/profile" }
    ] : [
      { label: "Login", to: "/login" }
    ])
  ];

  const handleLogout = () => {
    setLogoutDialog(true);
  };
  const confirmLogout = () => {
    setLogoutDialog(false);
    logout();
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            component={Link} 
            to="/" 
            sx={{ 
              color: 'inherit', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <SportsEsportsIcon sx={{ fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              Chess App
            </Typography>
          </Button>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
          {navLinks.map((link, idx) => (
            <Button key={idx} color="inherit" component={Link} to={link.to}>{link.label}</Button>
          ))}
          {currentUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Avatar src={currentUser.photoURL || undefined} sx={{ width: 32, height: 32 }}>{currentUser.displayName ? currentUser.displayName[0] : ''}</Avatar>
              <Typography variant="body1" sx={{ fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.displayName || currentUser.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>Logout</Button>
            </Box>
          ) : (
            <Button color="inherit" component={Link} to="/login" sx={{ ml: 2, fontWeight: 600 }}>Sign In</Button>
          )}
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <Box sx={{ width: 220 }} role="presentation" onClick={() => setDrawerOpen(false)}>
              <List>
                {navLinks.map((link, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemButton component={Link} to={link.to}>
                      <ListItemText primary={link.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
                {currentUser ? (
                  <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
                ) : (
                  <ListItem disablePadding>
                    <ListItemButton component={Link} to="/login">
                      <ListItemText primary="Sign In" />
                    </ListItemButton>
                  </ListItem>
                )}
                <ListItem disablePadding>
                  <ListItemButton onClick={colorMode.toggleColorMode}>
                    <ListItemText primary={theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Drawer>
        </Box>
        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutDialog} onClose={() => setLogoutDialog(false)}>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to log out?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogoutDialog(false)} color="primary">Cancel</Button>
            <Button onClick={confirmLogout} color="error">Logout</Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
} 