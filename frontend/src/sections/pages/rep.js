import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Slider from '@mui/material/Slider';
import {styled} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import RefreshIcon from '@mui/icons-material/Refresh';

import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import RepCard from './sub/repcard'

import axios from "axios";
import {backend} from '../../variables/global'

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Rep(){
    const [reps, setReps] = useState([]);
    const [canales, setCanales] = useState([]);
    const [empty, setEmpty] = useState(true);

    useEffect(() => {
        async function checkInstallations() {
            setLoading(true);
            try {
                const response = await axios.get(`${backend}/checkinstall?1`);
                if(response.data!="OK"){
                    setError(response.data);
                }
            } catch(e) {
                setError("No se ha podido conectar con el backend");
                console.log(e);
            } 
        }

        async function checkChannels() {
            try {
                const response = await axios.get(`${backend}/canalesRaw`);
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
        }

        checkInstallations();
        checkChannels();
        update();
    }, []);

    async function update() {
        setLoading(true);
        try {
            const response = await axios.get(`${backend}/reproduccionesRaw`);
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
                    console.log(iter);
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

    const [details, setDetails] = useState({canal:0, inicio:0, fin:0});

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

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
            <Typography component="h1" variant="h4">
            Reproducciones
            </Typography>
            <IconButton onClick={update}>
                <RefreshIcon sx={{color:'#ED7D31'}} fontSize="large"/>
            </IconButton>
            <Box sx={{ width: '90%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                {(loading) ? (
                    <CircularProgress sx={{color:'#ED7D31'}}/>
                ) : (
                    (error=="false") ? (
                        <Grid container direction="column" spacing={2}>
                        {reps.map((r) => (
                            <Grid item sx={{borderBottom: `1px solid grey`}}> 
                                <RepCard r={r} update={update} returnMessage={openSnack} />
                            </Grid>
                        ))}
                        {(empty) ? (
                            <Grid item sx={{borderBottom: `1px solid grey`}}> 
                                <Typography sx={{mb:2}} component="h1" variant="h5">
                                    No hay ninguna reproducción activa
                                </Typography>
                            </Grid>
                        ) : ""}
                            <Grid item>
                                <Button onClick={handleClickOpen} startIcon={<AddIcon />} type="submit" variant="contained" sx={{ color:'black', width:'70%', bgcolor:"#31E3E9", '&:hover': {backgroundColor: '#9FECEF', }}}>
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

            <Box sx={{position: "absolute", bottom: 20, right: 20}} >
                <Dialog fullWidth="300px" sx={{width:"200"}} open={open} onClose={handleClose}>
                    <DialogTitle id="form-dialog-title">Añadir reproducción</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth>
                        <br></br>
                        <TextField select label="Canal" defaultValue="1" helperText="Selecciona un canal">
                        {canales.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                            {option.id+" - "+option.syntax}
                            </MenuItem>
                        ))}
                        </TextField>
                        <br></br>
                        <TextField type="number" autoFocusmargin="dense" id="inicio" label="Inicio en tiempo epoch" fullWidth onChange={e => setDetails({ ...details, inicio: e.target.value })}/>
                        <br></br>
                        <TextField type="number" autoFocusmargin="dense" id="inicio" label="Final en tiempo epoch" fullWidth onChange={e => setDetails({ ...details, fin: e.target.value })}/>
                        <br></br>
                        </FormControl>
                        <br></br>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                            Iniciar
                        </Button>
                        <IconButton onClick={handleClose}>
                            <CloseIcon sx={{color:'red'}}/>
                        </IconButton>
                    </DialogActions>
                </Dialog>
            </Box>

            <Snackbar open={snackOpen} autoHideDuration={5000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snackState} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>

        </Grid>
    );
}