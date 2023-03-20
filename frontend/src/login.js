import React, { useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TheatersIcon from '@mui/icons-material/Theaters';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import MovieIcon from '@mui/icons-material/Movie';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {DialogActions, DialogContent} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import MuiAlert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import {styled} from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Avatar from '@mui/material/Avatar';
import MuiToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import {useNavigate} from 'react-router-dom';

function Login() {
  const [logged, setLog] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const onLogOut = () => {
      setLog(false);
      localStorage.setItem("logged", false);
      navigate('/', {replace: true});
  }

  const [details, setDetails] = useState({key:""});
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (event) => {
      event.preventDefault();
  
      if(details.key===""){
          setError("Rellene la clave");
          setOpen(true);
      }else{
          setLoading(true);
          setTimeout(function(){}, 1000);
          setLog(true);
          localStorage.setItem("logged", true);
          navigate('/');
      }
      };
  
    const [showKey, setShowKey] = useState(false);
    function handleKeyVisibleChange(e) {
      const value = e.target.checked;
      if(value){
        setShowKey(true);
      }else{
        setShowKey(false);
      }
    }

  return (
    <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center" style={{ minHeight: '100vh'}}>
      <Avatar variant="rounded" sx={{ m: 1, width: 110, height: 130 }} src="/images/DCS_logo2.png" />
      <Typography component="h1" variant="h5">
      Iniciar sesión
      </Typography>
      <Collapse in={open}>
          <MuiAlert severity="error"
          action={
              <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                  setOpen(false);
              }}
              >
              <CloseIcon fontSize="inherit" />
              </IconButton>
          }
          sx={{ mb: 2 }}
          >
          <AlertTitle>Clave incorrecta</AlertTitle>
          <strong>{error}</strong>
          </MuiAlert>
      </Collapse>

      {(loading) ? (
      <Box sx={{ display: 'flex', my:1 }}>
          <CircularProgress />
      </Box>) : ""}
  
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" required fullWidth id="key" label="Clave" name="key" autoComplete="key"  InputLabelProps={{sx:{ color: 'white' }}} 
              onChange={e => setDetails({...details, key: e.target.value})} value={details.key}  autoFocus variant="outlined"
          />
          <FormControlLabel
              control={<Checkbox color="primary" style ={{color: "#ffffff",}} onChange={(e) => handleKeyVisibleChange(e)} />}
              label="Mostrar clave"
          />
          <Button fullWidth type="submit" variant="contained" sx={{mt: 3, mb: 1 }}>
              Iniciar Sesión
          </Button>
      </Box>
    </Grid>
  );
}

export default Login;