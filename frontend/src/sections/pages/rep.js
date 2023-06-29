import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import { createTheme, ThemeProvider} from '@mui/material/styles';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

import RepCard from './sub/repcard'
import RepAdd from './sub/repadd'

import axios from "axios";

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

export default function Rep(){
    const [reps, setReps] = useState([]);
    const [canales, setCanales] = useState([]);
    const [empty, setEmpty] = useState(true);

    useEffect(() => {
        async function checkInstallations() {
            setLoading(true);
            try {
                const response = await axios.get(`/checkinstall?1`);
                if(response.data!="OK"){
                    setError(response.data);
                    setLoading(false);
                    return;
                }
                checkChannels();
            } catch(e) {
                setError("No se ha podido conectar con el backend");
                console.log(e);
                setLoading(false);
            } 
        }

        async function checkChannels() {
            try {
                const response = await axios.get(`/canalesRaw`);
                if(response.data=="error"){
                    setError("No hay canales existentes en la base de datos");
                }else{
                    var channels = response.data.replace("[", "");
                    channels = channels.replace("]", "");
                    const arrayChannels = channels.split(", ");
                    const arrayChannels1 = [];
                    
                    let i=0;
                    while(i<arrayChannels.length) {
                        let temp = {id:parseInt(arrayChannels[i]), syntax:arrayChannels[i+1]};
                        i = i+2;
                        arrayChannels1.push(temp);
                    }

                    setCanales(arrayChannels1);
                }
            } catch(e) {
                setError("No se ha podido conectar con el backend");
                console.log(e);
            } 
            setLoading(false);
            update();
        }

        checkInstallations();
    }, []);

    async function update() {
        setLoading(true);
        try {
            const response = await axios.get(`/reproduccionesRaw`);
            if(response.data=="empty"){
                setEmpty(true);
                setReps([]);
            }else{
                setEmpty(false);
                
                let repsArray = response.data;
                const repsArray1 = [];

                let i=0;
                while(i<repsArray.length) {
                    let iter = {id:repsArray[i], canal:repsArray[i+1], start:repsArray[i+2], end:repsArray[i+3], position:repsArray[i+4], speed:repsArray[i+5]};
                    i = i+6;
                    repsArray1.push(iter);
                }

                setReps(repsArray1);
            }
        } catch(e) {
            setError("No se ha podido conectar con el backend");
            console.log(e);
        } 
        setLoading(false);
    }

    
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("false");

    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const [snackOpen, setSnackOpen] = React.useState(false);
    const [snackState, setSnackState] = useState("");
    const [snackMessage, setSnackMessage] = useState("");

    function openSnack(message, state){
        setSnackMessage(message);
        setSnackState(state);
        setSnackOpen(true);
    };

    const handleSnackClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackOpen(false);
    };

    const [openDelete, setOpenDelete] = React.useState(false);
    const handleOpenDelete = () => {setOpenDelete(true);};
    const handleCloseDelete = () => {setOpenDelete(false);}
    const [loadingChange, setLoadingChange] = React.useState(false);

    async function deletePackets() {
        setLoadingChange(true);
        const response = await axios.get(`/deletepackets`);
        let state="", msg="";
        if(response.data=="OK"){
            state="success";
            msg="Paquetes borrados correctamente de la base de datos";
        }else{
            state="error";
            msg="Error al eliminar los paquetes de la base de datos";
        }

        setSnackState(state); setSnackMessage(msg);
        setSnackOpen(true);
        setLoadingChange(false);
        handleCloseDelete();
    }

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
            <Typography component="h1" variant="h4">
            Reproducciones
            </Typography>
            {(error=="false") ? (
            <IconButton onClick={update}>
                <RefreshIcon sx={{color:'#ED7D31'}} fontSize="large"/>
            </IconButton>
            ) : ""}
            <Box sx={{ width: '90%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                {(loading) ? (
                    <CircularProgress sx={{color:'#ED7D31'}}/>
                ) : (
                    (error=="false") ? (
                        <Grid container direction="column">
                        {reps.map((r) => (
                            <Grid item sx={{borderColor: "grey.400", borderBottom: `1px solid grey`, mb:1.5}}> 
                                <RepCard r={r} update={update} returnMessage={openSnack} />
                            </Grid>
                        ))}
                        {(empty) ? (
                            <Grid item sx={{borderColor: "grey.400", borderBottom: `1px solid grey`, mb:1.5}}> 
                                <Typography sx={{mb:2}} component="h1" variant="h5">
                                    No hay ninguna reproducción activa
                                </Typography>
                            </Grid>
                        ) : ""}
                            <Grid item>
                                <Button onClick={handleClickOpen} startIcon={<AddIcon />} type="submit" variant="contained" sx={{ color:'black', width:'70%', bgcolor:"#E9A272", '&:hover': {backgroundColor: '#ED7D31', }}}>
                                    Añadir reproducción
                                </Button>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center">
                            <Alert severity="error">
                            <AlertTitle>Error</AlertTitle>
                            <strong>{error}</strong>
                            </Alert>
                        </Box>
                    )
                )}
            </Box>

            <ThemeProvider theme={darkTheme}>
            <Dialog open={openDelete} onClose={handleCloseDelete} maxWidth='lg'>
                <DialogContent>
                    <Box sx={{borderRadius: 2, m:3, textAlign: 'center'}}>
                        <Typography component="h1" variant="h5">
                        Algunos de los paquetes solicitados ya no existen
                        </Typography>
                        <Divider sx={{my:1,bgcolor:'white'}}/>
                        <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                            <Grid item xs={12}>
                                <Typography sx={{fontSize:14, mb:2, mt:1}}>
                                Posiblemente fueran borrados del disco por el mecanismo de borrado automático
                                </Typography>
                                <Typography sx={{fontSize:16}}>
                                ¿Quiere eliminar los registros de los paquetes no existentes de la base de datos?
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                <Box sx={{position: 'relative' }}>
                    <Button onClick={deletePackets} disabled={loadingChange} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ mr:1, color:"white", bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                        Borrar
                    </Button>
                    {loadingChange && (
                    <CircularProgress size={24} sx={{color: "green", position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}} />
                    )}
                </Box>
                <Button sx={{color:'white', borderColor:'red'}} onClick={handleCloseDelete} disabled={loadingChange} startIcon={<CloseIcon sx={{color:'red'}} />} type="submit" variant="outlined">
                    Cancelar
                </Button>
            </DialogActions>
            </Dialog>
            </ThemeProvider>

            <Box sx={{position: "absolute", bottom: 20, right: 20}} >
                <ThemeProvider theme={darkTheme}>
                    <Dialog fullWidth={true} maxWidth='lg' open={open} onClose={handleClose}>
                        <RepAdd close={handleClose} canales={canales} update={update} returnMessage={openSnack} openDelete={handleOpenDelete} />
                    </Dialog>
                </ThemeProvider>
            </Box>

            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snackState} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>

        </Grid>
    );
}