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

import axios from "axios";
import {backend} from '../../variables/global'

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Configuracion(){

    const [details,setDetails] = useState({});
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
            const response = await axios.get(`${backend}/getconfig`);
            
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
            const response = await axios.get(`${backend}/updateconfig?${str}`);
            if(response.data=="OK"){
                setSnackMsg("Los parámetros se han actualizado con éxito");
                setSnackState("success");
                setOpenSnack(true);
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
                            <Button startIcon={<KeyIcon />} variant="contained" sx={{ bgcolor:"#E9A272", '&:hover': {backgroundColor: '#ED7D31', }}}>
                                Modificar
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            </Grid>
            ) : ""}

            <Snackbar open={openSnack} autoHideDuration={6000} onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity={snackState}>
                    <strong>{snackMsg}</strong>
                </Alert>
            </Snackbar>
        </Grid>
    );
}