import * as React from 'react';
import { useRef } from 'react';
import Grid from '@mui/material/Grid'
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';

import AlertTitle from '@mui/material/AlertTitle';
import MuiAlert from '@mui/material/Alert';
import axios from "axios";
import { useLocation , useNavigate } from 'react-router-dom'

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
  

const Header = ({logout}) => {
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    var buttonProps = {borderColor:'#ED7D31', color:'#ED7D31', '&:hover': {backgroundColor: '#E9A272', color:'#000000', borderColor:'#000000'}};
    var buttonProps2 = {mr:2, borderColor:'#ED7D31', color:'#ED7D31', '&:hover': {backgroundColor: '#E9A272', color:'#000000', borderColor:'#000000'}};
    var selected = {backgroundColor: '#E9A272', color:'#000000', borderColor:'#000000', '&:hover': {backgroundColor: '#E9A272', color:'#000000', borderColor:'#000000'}};
    var selected2 = {mr:2, backgroundColor: '#E9A272', color:'#000000', borderColor:'#000000', '&:hover': {backgroundColor: '#E9A272', color:'#000000', borderColor:'#000000'}};

    const [open, setOpen] = React.useState(false);
    const [type, setType] = React.useState("loading");
    const handleClickOpen = () => {setOpen(true);};
    const handleClose = () => {setOpen(false); setType("loading");};
    const location = useLocation();

    const navigate = useNavigate();
    const changePage = next => {
        navigate(next);
    }

    const endSession = async (event) => {
        event.preventDefault();
        handleClickOpen();

        try {
            await axios.get('/logout');
            handleClose();
            localStorage.removeItem('token');
            logout();
        } catch(e) {
            setType("error");
        } 
    }

    return (
        <div>
            <Toolbar sx={{mb:2, borderBottom: `1px solid black`}}>
                <Grid my={1.5} container alignItems="center">
                    <Grid item xs={2} align="left">
                        <IconButton disableElevation disableRipple disabled size="small" sx={{ ml: 1, "&.MuiButtonBase-root:hover": {bgcolor: "transparent"}}}>
                            <Box component="img" sx={{ height: windowSize.current[1]*0.1, width: windowSize.current[1]*0.142}}
                            alt="DCS" src="/images/DCS_logo.jpg" />
                        </IconButton>
                    </Grid>
                    <Grid item xs={8} align="center">
                            <Button sx={location.pathname=='/inicio' ? selected2 : buttonProps2} variant="outlined" onClick={() => changePage('/inicio')}>Inicio</Button>
                            <Button sx={location.pathname=='/grabaciones' ? selected2 : buttonProps2} variant="outlined" onClick={() => changePage('/grabaciones')}>Grabaciones</Button>
                            <Button sx={location.pathname=='/reproducciones' ? selected2 : buttonProps2} variant="outlined" onClick={() => changePage('/reproducciones')}>Reproducciones</Button>
                            <Button sx={location.pathname=='/datos' || location.pathname=='/datos/grabaciones' || location.pathname=='/datos/graficos' || location.pathname=='/datos/rendimiento' ? selected2 : buttonProps2} variant="outlined" onClick={() => changePage('/datos')}>Datos</Button>
                            <Button sx={location.pathname=='/parametros' || location.pathname=='/parametros/config' || location.pathname=='/parametros/canales' ? selected : buttonProps} variant="outlined" onClick={() => changePage('/parametros')}>Parámetros</Button>
                    </Grid>
                    <Grid item xs={2} align="right">
                        <IconButton onClick={endSession}>
                            <LogoutIcon sx={{color:'#000000'}}/>
                        </IconButton>
                    </Grid>
                </Grid>
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Cerrando sesión...</DialogTitle>
                    {(type=="loading") ? (
                    <div> <DialogContent align="center">
                        <CircularProgress sx={{color:'#ED7D31'}}/>
                    </DialogContent> </div>
                    ) : (
                    <div><DialogContent>
                        <Alert severity="error">
                        <AlertTitle>Error</AlertTitle>
                        <strong>No se ha podido conectar con el backend</strong>
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <IconButton onClick={handleClose}>
                            <CloseIcon sx={{color:'red'}}/>
                        </IconButton>
                    </DialogActions> </div>
                    )}
                </Dialog>
            </Toolbar>
        </div>
    );
}

export default Header;