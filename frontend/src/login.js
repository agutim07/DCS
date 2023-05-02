import React, { useState} from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import MuiAlert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import {styled} from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';

import {keyExpiration} from './variables/global'
import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const CustomTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: 'white',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: 'white',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'white',
    },
    '&.Mui-focused fieldset': {
      borderColor: "#ED7D31",
    },
  },
  '& .MuiOutlinedInput-root:hover': {
      '& fieldset': {
        borderColor: "#ED7D31",
      }
  },
});

const darkTheme = createTheme({
  typography: {
    fontFamily: 'Copperplate Gothic Light',
  },
  palette: {
    mode: 'dark',
  },
});

function setLoginInfo() {
	const now = new Date();
  var ttl = keyExpiration * 1000;

	const item = {
		value: "true",
		expiry: now.getTime() + ttl,
	}

	localStorage.setItem('token', JSON.stringify(item))
}

export default function Login({updateApp}) {
  const okeyMsg = "<html><body>Clave correcta, ha iniciado sesion <br/></body></html>";
  const [loading, setLoading] = useState(false);

  const [details, setDetails] = useState({key:""});
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (event) => {
    if(open){setOpen(false);}
    event.preventDefault();

    if(details.key===""){
        setError("Rellene la clave");
        setOpen(true);
    }else{
        setLoading(true);
        try {
          const response = await axios.get(`/login?key=${details.key}`);
          if(response.data==okeyMsg){
            setLoginInfo();
            updateApp();
          }else{
            setError("Clave incorrecta");
            setOpen(true);
          }
        } catch(e) {
          setError("No se ha podido conectar con el backend");
          console.log(e);
          setOpen(true);
        } 
        setLoading(false);
    }
  }
  
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
      <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Avatar variant="rounded" sx={{ m: 1, mb: 4, width: 350, height: 25 }} src="/images/DCS_logo2.png" />
      <Typography component="h1" variant="h5">
      Iniciar sesión
      </Typography>
      <Collapse in={open}>
          <Alert severity="error"
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
          sx={{ m: 2 }}
          >
          <AlertTitle>Ingreso fallido</AlertTitle>
          <strong>{error}</strong>
          </Alert>
      </Collapse>

      {(loading) ? (
      <Box sx={{ display: 'flex', my:1 }}>
          <CircularProgress sx={{color:'#ED7D31'}}/>
      </Box>) : ""}
  
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <CustomTextField margin="normal" required fullWidth id="key" label="Clave" name="key" autoComplete="key" type={showKey ? "text" : "password"}
              onChange={e => setDetails({...details, key: e.target.value})} value={details.key}  autoFocus variant="outlined"
          />
          <FormControlLabel
              control={<Checkbox color="primary" style ={{color: "#ED7D31",}} onChange={(e) => handleKeyVisibleChange(e)} />}
              label="Mostrar clave"
          />
          <Button fullWidth type="submit" variant="contained" sx={{ bgcolor:"#EB9C67", mt: 3, mb: 1, '&:hover': {backgroundColor: '#ED7D31', }}}>
              Ingresar
          </Button>
      </Box>
      </ThemeProvider>
    </Grid>
  );
}