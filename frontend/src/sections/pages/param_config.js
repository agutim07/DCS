import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import IconButton from '@mui/material/IconButton';
import DoneIcon from '@mui/icons-material/Done';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import KeyIcon from '@mui/icons-material/Key';
import CloseIcon from '@mui/icons-material/Close';

import RepCard from './sub/repcard'
import RepAdd from './sub/repadd'

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import axios from "axios";

import { alpha } from "@mui/material";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const darkTheme = createTheme({
    typography: {
        fontFamily: 'Copperplate Gothic Light',
    },
    palette: {
        mode: 'dark',
    },
});

export default function Configuracion(){
    const [details,setDetails] = useState({newpack:0, maxpacks:0, interface:"", checktime:0, maxMBs:0});
    const [config,setConfig] = useState({});
    const [loading,setLoading] = useState(true);
    const [error, setError] = React.useState("false");
    const [snackMsg, setSnackMsg] = React.useState("false");
    const [snackState, setSnackState] = React.useState("error");
    const [openSnack, setOpenSnack] = useState(false);

    const handleCloseSnack = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenSnack(false);
    };

    async function getConfig() {
        try {
            const response = await axios.get(`/getconfig`);
            
            var configuration = response.data.replace("[", "");
            configuration = configuration.replace("]", "");
            let configArray = configuration.split(", ");

            if(configArray.length!=7){
                setError("No se han podido obtener los parámetros del backend");
            }else{
                let iter = {newpack:parseInt(configArray[0]), maxpacks:parseInt(configArray[1]), interface:configArray[2], 
                    checktime:parseInt(configArray[3]), maxMBs:parseInt(configArray[4]), key:configArray[6]};

                setDetails(iter);
                setConfig(iter);
            }
            
        } catch(e) {
            setError("No se han podido obtener los parámetros del backend");
            console.log(e);
        } 
    }

    useEffect(() => {
        getConfig();
        setLoading(false);
    }, []);

    function checkChange(){
        if(details.newpack!=config.newpack || details.maxpacks!=config.maxpacks || details.maxMBs!=config.maxMBs || details.checktime!=config.checktime || details.interface!=config.interface){
            return false;
        }

        return true;
    }

    function modify(){
        let str = "";

        if(details.interface!=config.interface){
            if(details.interface=="" || details.interface.length>15 || details.interface.includes(" ")){
                setSnackMsg("Nombre de interfaz no válido");
                setSnackState("error");
                setOpenSnack(true);
                return;
            }else{
                str+="interface="+details.interface+"&";
            }
        }

        if(details.newpack!=config.newpack){
            if(details.newpack%1 != 0 || details.newpack<=0){
                console.log()
                setSnackMsg("El tiempo de creación de un nuevo paquete no debe tener decimales y debe ser mayor a 0");
                setSnackState("error");
                setOpenSnack(true);
                return;
            }else{
                str+="newpack="+details.newpack+"&";
            }
        }

        if(details.maxpacks!=config.maxpacks){
            if(details.maxpacks%1 != 0 || details.maxpacks<=0){
                setSnackMsg("Los max. paquetes por grabación no deben tener decimales y deben ser mayor a 0");
                setSnackState("error");
                setOpenSnack(true);
                return;
            }else{
                str+="maxpacks="+details.maxpacks+"&";
            }
        }

        if(details.checktime!=config.checktime){
            if(details.checktime%1 != 0 || details.checktime<=0){
                setSnackMsg("Los segundos de comprobación no deben tener decimales y deben ser mayor a 0");
                setSnackState("error");
                setOpenSnack(true);
                return;
            }else{
                str+="checktime="+details.checktime+"&";
            }
        }

        if(details.maxMBs!=config.maxMBs){
            if(details.maxMBs%1 != 0 || details.maxMBs<=0){
                setSnackMsg("El tamaño máximo de capturas no debe tener decimales y debe ser mayor a 0");
                setSnackState("error");
                setOpenSnack(true);
                return;
            }else{
                str+="maxMBs="+details.maxMBs+"&";
            }
        }

        update(str);
    }

    async function update(str){
        setLoading(true);

        try {
            const response = await axios.get(`/updateconfig?${str}`);
            if(response.data=="OK"){
                let message = "Los parámetros se han actualizado con éxito";
                if(str.includes("maxpacks") || str.includes("newpack")){
                    message+=": si hay grabaciones activas reinicie para que surgan efecto";
                }
                setSnackMsg(message);
                setSnackState("success");
                setOpenSnack(true);
                if(str.includes("checktime")){
                    setOpenDialog(true);
                }
            }else{
                setError("Error al actualizar: "+response.data);
            }
        } catch(e) {
            setError("Error al actualizar: error de conexión con el backend");
            console.log(e);
        }

        getConfig();
        setLoading(false);
    }

    const [openDialog, setOpenDialog] = React.useState(false);

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const [openDialogKey, setOpenDialogKey] = React.useState(false);
    const handleOpenDialogKey = () => {setOpenDialogKey(true);};
    const handleCloseDialogKey = () => {setOpenDialogKey(false); setKeys({old:"", new1:"", new2:""}); setErrorKey("");};

    const [keys,setKeys] = useState({old:"", new1:"", new2:""});
    const [loadingChange, setLoadingChange] = React.useState(false);
    const [errorKey, setErrorKey] = React.useState("");

    async function changeKey(){
        if(keys.old=="" || keys.new1=="" || keys.new2==""){
            setErrorKey("ningún campo puede estar en blanco");
            return;
        }

        if(keys.new1!=keys.new2){
            setErrorKey("la nueva clave debe coincidir en ambos campos");
            return;
        }

        setLoadingChange(true);
        try {
            const response = await axios.get(`/changekey?old=${keys.old}&new=${keys.new1}`);
            if(response.data=="OK"){
                let message = "La clave de inicio de sesión se ha actualizado con éxito";
                setSnackMsg(message);
                setSnackState("success");
                setOpenSnack(true);
            }else if(response.data=="Error al modificar: la clave antigua no es correcta"){
                setSnackMsg(response.data);
                setSnackState("error");
                setOpenSnack(true);
            }else{
                setError("Error al modificar: "+response.data);
            }
        } catch(e) {
            setError("Error al modificar: error de conexión con el backend");
            console.log(e);
        }
        setLoadingChange(false);
        handleCloseDialogKey();
    }

    const preventPaste = (e) => {e.preventDefault();};
    
    return(
        <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center">
            <Grid item xs={12}>
                <Button startIcon={<DoneIcon />} disabled={checkChange() || loading} onClick={() => modify()} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }, '&:disabled': {backgroundColor: '#91E291', color:'#000000'}}}>
                    Aplicar cambios
                </Button>
            </Grid>
            {(loading) ? (
                <Box sx={{ width: '80%', mt:2 }}>
                    <LinearProgress sx={{backgroundColor: "#ED7D31", "& .MuiLinearProgress-bar": {backgroundColor: "#F3D2BB"} }}/>
                </Box>
            ) : ""}

            {(error!="false" && !loading) ? (
                <Box display="flex" sx={{my:1, width:'90%'}} justifyContent="center" alignItems="center">
                    <Alert severity="error">
                    <strong>{error}</strong>
                    </Alert>
                </Box>
            ) : ""}

            {(error!="No se han podido obtener los parámetros del backend" && !loading) ? (
            <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center">
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, mr:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Typography component="h1" variant="h5">
                    Parámetros de grabación
                    </Typography>
                    <Divider sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Tiempo de creación de nuevo paquete
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: details.newpack==config.newpack ? "#ED7D31" : "green" },'&.Mui-focused fieldset': {borderColor: details.newpack==config.newpack ? "#ED7D31" : "green"},}}} autoFocusmargin="dense" id="new_pack" label="Segundos" fullWidth value={details.newpack} onChange={e => setDetails({ ...details, newpack: e.target.value })}/>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Max. paquetes por grabación
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: details.maxpacks==config.maxpacks ? "#ED7D31" : "green" },'&.Mui-focused fieldset': {borderColor: details.maxpacks==config.maxpacks ? "#ED7D31" : "green"}},}} autoFocusmargin="dense" id="maxpacks" label="Paquetes" fullWidth value={details.maxpacks} onChange={e => setDetails({ ...details, maxpacks: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, ml:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center">
                        <Typography component="h1" variant="h5">
                        Parámetros de borrado automático
                        </Typography>
                        <Tooltip title="Si las capturas alcanzan el tamaño máximo, el mecanismo elimina las más antiguas hasta estar por debajo del límite">
                            <IconButton>
                                <InfoIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Divider  sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Cada cuánto se comprueba el espacio
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: details.checktime==config.checktime ? "#ED7D31" : "green" },'&.Mui-focused fieldset': {borderColor: details.checktime==config.checktime ? "#ED7D31" : "green"}},}} autoFocusmargin="dense" id="checktime" label="Segundos" fullWidth value={details.checktime} onChange={e => setDetails({ ...details, checktime: e.target.value })}/>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Tamaño máximo de capturas
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: details.maxMBs==config.maxMBs ? "#ED7D31" : "green" },'&.Mui-focused fieldset': {borderColor: details.maxMBs==config.maxMBs ? "#ED7D31" : "green"}},}} autoFocusmargin="dense" id="maxMBs" label="MBs" fullWidth value={details.maxMBs} onChange={e => setDetails({ ...details, maxMBs: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, ml:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Typography component="h1" variant="h5">
                    Parámetros de reproducción
                    </Typography>
                    <Divider  sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Interfaz de red para reinyectar
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: details.interface==config.interface ? "#ED7D31" : "green" },'&.Mui-focused fieldset': {borderColor: details.interface==config.interface ? "#ED7D31" : "green"}},}} autoFocusmargin="dense" id="interface" label="Interfaz" fullWidth value={details.interface} onChange={e => setDetails({ ...details, interface: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, ml:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Typography component="h1" variant="h5">
                    Parámetros de seguridad
                    </Typography>
                    <Divider  sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Clave de inicio de sesión
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Button startIcon={<KeyIcon />} onClick={() => handleOpenDialogKey()} variant="contained" sx={{ bgcolor:"#E9A272", '&:hover': {backgroundColor: '#ED7D31', }}}>
                                Modificar
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            </Grid>
            ) : ""}

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogContent>
                    <Alert variant="outlined" severity="info">
                        <strong>Se han actualizado los segundos de comprobación de espacio en la base de datos, pero el cambio real no se efectuará hasta reiniciar el servidor backend</strong>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{color:'blue'}}>Ok</Button>
                </DialogActions>
            </Dialog>

            <ThemeProvider theme={darkTheme}>
            <Dialog open={openDialogKey} onClose={handleCloseDialogKey}>
                <DialogContent>
                    <Box sx={{borderRadius: 2, m:3, textAlign: 'center'}}>
                        <Typography component="h1" variant="h5">
                        Cambio de clave
                        </Typography>
                        <Divider sx={{my:1,bgcolor:'white'}}/>
                        <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                            <Grid item xs={4}>
                                <Typography sx={{fontSize:12, mb:2}}>
                                Clave antigua
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <TextField variant="filled" sx={{mb:2, "& .MuiFilledInput-root:hover": {background: "#EEA97C"}, "& .MuiFilledInput-root": {background: alpha("#EEA97C",0.5), '&.Mui-focused': {background: "#EEA97C"}}}} autoFocusmargin="dense" id="old" fullWidth value={keys.old} onChange={e => setKeys({ ...keys, old: e.target.value })}/>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography sx={{fontSize:12}}>
                                Nueva clave
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <TextField variant="filled" sx={{"& .MuiFilledInput-root:hover": {background: "#84EE7C"}, "& .MuiFilledInput-root": {background: alpha("#84EE7C", 0.5), '&.Mui-focused': {background: "#84EE7C"}}}} autoFocusmargin="dense" id="new1" fullWidth value={keys.new1} onChange={e => setKeys({ ...keys, new1: e.target.value })}/>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography sx={{fontSize:12}}>
                                Repite nueva clave
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <TextField variant="filled" onPaste={preventPaste} sx={{"& .MuiFilledInput-root:hover": {background: "#84EE7C"}, "& .MuiFilledInput-root": {background: alpha("#84EE7C", 0.5), '&.Mui-focused': {background: "#84EE7C"}}}} autoFocusmargin="dense" id="new2" fullWidth value={keys.new2} onChange={e => setKeys({ ...keys, new2: e.target.value })}/>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                <Box sx={{position: 'relative' }}>
                    <Button onClick={changeKey} disabled={loadingChange} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ color:"white", bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                        Cambiar
                    </Button>
                    {loadingChange && (
                    <CircularProgress size={24} sx={{color: "green", position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}} />
                    )}
                </Box>
                <IconButton onClick={handleCloseDialogKey}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions>
            {(errorKey!="") ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{mb:2}}>
                <Alert sx={{color:'red'}} variant="outlined" severity="error" onClose={() => {setErrorKey("")}}><b>Error: </b>{errorKey}</Alert>
            </Box>
            ) : ""}
            </Dialog>
            </ThemeProvider>

            <Snackbar open={openSnack} autoHideDuration={6000} onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity={snackState}>
                    <strong>{snackMsg}</strong>
                </Alert>
            </Snackbar>
        </Grid>
    );
}