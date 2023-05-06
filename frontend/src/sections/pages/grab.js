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
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';

import GrabCard from './sub/grabcard'

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Grab(){
    const [error, setError] = React.useState("false");
    const [windows, setWindows] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const [grabs, setGrabs] = useState([]);

    useEffect(() => {
        async function checkInstallations() {
            setLoading(true);
            try {
                const response = await axios.get(`/checkinstall?0`);
                if(response.data!="OK" && response.data!="windows"){
                    setError(response.data);
                }
                if(response.data=="windows"){setWindows(true);}
            } catch(e) {
                setError("No se ha podido conectar con el backend");
                console.log(e);
            }
        }

        checkInstallations();
        update();
    }, []);

    async function update() {
        setLoading(true);
        try {
            const response = await axios.get(`/canalesRawFull`);
            if(response.data=="error"){
                setError("No hay canales existentes en la base de datos");
            }else{
                var channels = response.data.replace("[", "");
                channels = channels.replace("]", "");
                const arrayChannels = channels.split(", ");
                const arrayChannels1 = [];
                
                let i=0;
                while(i<arrayChannels.length) {
                    let status = -1;
                    if(arrayChannels[i+2]!="off"){status=parseInt(arrayChannels[i+2]);}

                    let temp = {id:parseInt(arrayChannels[i]), syntax:arrayChannels[i+1], status:status};
                    i = i+3;
                    arrayChannels1.push(temp);
                }

                setGrabs(arrayChannels1);
            }
        } catch(e) {
            setError("No se ha podido conectar con el backend");
            console.log(e);
        } 
        setLoading(false);
    }

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

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {setOpen(true);};
    const handleClose = () => {setOpen(false);};

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
            <Typography component="h1" variant="h4">
            Grabaciones
            </Typography>
            {(windows) ? (
                <Chip icon={<InfoIcon sx={{"&&": {color:'white'}}}/>} sx={{mt:1}} style={{backgroundColor:'#E9A272'}} label="Leer: Grabación en Windows" onClick={handleClickOpen}/>
            ) : ""}
            {(error=="false") ? (
            <IconButton onClick={update}>
                <RefreshIcon sx={{color:'#ED7D31'}} fontSize="large"/>
            </IconButton>
            ) : ""}
            <Box sx={{ width: '90%', borderRadius: 2, mt:2, p:1, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                {(loading) ? (
                    <CircularProgress sx={{color:'#ED7D31'}}/>
                ) : (
                    (error=="false") ? (
                        <Grid container direction="column" spacing={1}>
                        {grabs.map((g) => (
                            <Grid item sx={{borderBottom: `1px solid grey`}}> 
                                <GrabCard g={g} update={update} returnMessage={openSnack}/>
                            </Grid>
                        ))}
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

            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snackState} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>

            <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Grabaciones en Windows</DialogTitle>
            <DialogContent>
                <Alert severity="warning">
                <AlertTitle>Para grabar en Windows se debe tener:</AlertTitle>
                1. Instalado el Tcpdump de Microolap.<br />
                2. Añadido el comando 'tcpdump' al PATH de Windows.<br />
                3. Haber ejecutado el servidor como administrador.
                </Alert>
            </DialogContent>
            <DialogActions>
                <IconButton onClick={handleClose}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions> 
        </Dialog>
        </Grid>
    );
}