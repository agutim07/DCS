import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
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
import Chip from '@mui/material/Chip';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import IconButton from '@mui/material/IconButton';
import TimerIcon from '@mui/icons-material/Timer';
import VideocamIcon from '@mui/icons-material/Videocam';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/Key';
import CloseIcon from '@mui/icons-material/Close';
import HubIcon from '@mui/icons-material/Hub';

import {styled} from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";
import { useLocation , useNavigate } from 'react-router-dom'

import axios from "axios";
import HomeGrabCard from './sub/homegrabcard';
import HomeRepCard from './sub/homerepcard';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Home(){
    const [db, setDB] = useState(false);
    const [ch, setCH] = useState(0);
    const [param, setParams] = useState(false);

    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        async function checkState() {
            try {
                const response = await axios.get(`/canalesRaw`);
                var channels = response.data.replace("[", "");
                channels = channels.replace("]", "");
                const arrayChannels = channels.split(", ");
                if(response.data!="error"){setCH(arrayChannels.length/2);}

                const response2 = await axios.get(`/getconfig`);
                var configuration = response2.data.replace("[", "");
                configuration = configuration.replace("]", "");
                let configArray = configuration.split(", ");

                if(configArray.length==7){setParams(true);}

                setDB(true);

                if(response.data!="error" && configArray.length==7){await checkReps(); await checkGrabs();}
                setLoading(false);
            } catch(e) {
                setDB(false);
                setCH(0);
                setParams(false);
                setLoading(false);
            } 
        }

        checkState();
    }, []);

    const [reps, setReps] = useState([]);
    const [empty, setEmpty] = useState(false);
    const [errorRep, setErrorRep] = React.useState("false");
    async function checkReps() {
        try {
            const response = await axios.get(`/checkinstall?1`);
            if(response.data!="OK"){
                setErrorRep(response.data);
            }else{
                const response2 = await axios.get(`/reproduccionesRaw`);
                if(response2.data=="empty"){
                    setEmpty(true);
                    setReps([]);
                }else{
                    setEmpty(false);
                    
                    let repsArray = response2.data;
                    const repsArray1 = [];

                    let i=0;
                    while(i<repsArray.length) {
                        let iter = {id:repsArray[i], canal:repsArray[i+1], start:repsArray[i+2], end:repsArray[i+3], position:repsArray[i+4], speed:repsArray[i+5]};
                        i = i+6;
                        repsArray1.push(iter);
                    }

                    setReps(repsArray1);
                }
            }
        } catch(e) {
            setErrorRep("No se ha podido conectar con el backend");
            console.log(e);
        } 
    }

    const [grabs, setGrabs] = useState([]);
    const [errorGrab, setErrorGrab] = React.useState("false");
    async function checkGrabs() {
        try {
            const response = await axios.get(`/checkinstall?0`);
            if(response.data!="OK" && response.data!="windows"){
                setErrorGrab(response.data);
            }else{
                const response2 = await axios.get(`/canalesRawFull`);
                var channels = response2.data.replace("[", "");
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
            setErrorGrab("No se ha podido conectar con el backend");
            console.log(e);
        }
    }

    async function update(){
        setLoading(true);
        await checkReps(); 
        await checkGrabs();
        setLoading(false);
    }

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
        {(loading) ? (
        <Box sx={{ width: '80%', mt:2 }}>
            <LinearProgress sx={{backgroundColor: "#ED7D31", "& .MuiLinearProgress-bar": {backgroundColor: "#F3D2BB"} }}/>
        </Box>
        ) : (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{mt:1}}>
            {(db) ? (
                <Button startIcon={<CheckCircleIcon sx={{color:'green'}}/>} disabled={true} sx={{'&:disabled': {backgroundColor: 'transparent', color:'#000000', border:0}}}>
                    Conexión a la base de datos
                </Button>
            ) : (
                <Button startIcon={<ErrorIcon sx={{color:'red'}}/>} disabled={true} sx={{'&:disabled': {backgroundColor: 'transparent', color:'#000000', border:0}}}>
                    Conexión a la base de datos
                </Button>
            )}
            
            {(ch>0) ? (
                <Button startIcon={<CheckCircleIcon sx={{color:'green'}}/>} disabled={true} sx={{mx:3, '&:disabled': {backgroundColor: 'transparent', color:'#000000', border:0}}}>
                    {ch} canales cargados
                </Button>
            ) : (
                <Button startIcon={<ErrorIcon sx={{color:'red'}} />} disabled={true} sx={{mx:3, '&:disabled': {backgroundColor: 'transparent', color:'#000000', border:0}}}>
                    0 canales cargados
                </Button>
            )}

            {(param) ? (
                <Button startIcon={<CheckCircleIcon sx={{color:'green'}} />} disabled={true} sx={{'&:disabled': {backgroundColor: 'transparent', color:'#000000', border:0}}}>
                    Parámetros configurados
                </Button>
            ) : (
                <Button startIcon={<ErrorIcon sx={{color:'red'}} />} disabled={true} sx={{'&:disabled': {backgroundColor: 'transparent', color:'#000000', border:0}}}>
                    Parámetros configurados
                </Button>
            )}
        </Box>
        )}

        {(!loading && db && ch>0 && param) ? (
            <Grid container spacing={0} direction="row">
                <Grid item xs={6} sx={{mt:3}}>
                <Box display="flex" justifyContent="center" alignItems="center">
                    <Typography component="h1" variant="h5" sx={{color:'black'}}>
                        Grabaciones
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', borderRadius: 2, mt:0.5, mr:1.5, pt:2, textAlign: 'center', border: '1px solid', borderColor:'#ED7D31', bgcolor: 'grey.300', color: 'grey.800'}}>
                    {(errorGrab!="false") ? (
                        <Alert severity="error" sx={{mx:2}}>
                        <strong>{errorGrab}</strong>
                        </Alert>
                    ) : (
                        <Grid container direction="column">
                        {grabs.map((g) => (
                            <Grid item sx={{borderBottom: "1px solid grey", borderColor: "grey.400", mb:0.5, mx:1}}> 
                                <HomeGrabCard g={g} />
                            </Grid>
                        ))}
                            <Grid item>
                                <Button onClick={() => navigate('/grabaciones')} startIcon={<VideocamIcon />} type="submit" variant="contained" sx={{ mt:1.5, color:'black', width:'100%', bgcolor:"#E9A272", '&:hover': {backgroundColor: '#ED7D31', }}}>
                                    Control de grabaciones
                                </Button>
                            </Grid>
                        </Grid>
                    )}
                </Box>
                </Grid>
                <Grid item xs={6} sx={{mt:3}}>
                <Box display="flex" justifyContent="center" alignItems="center">
                    <Typography component="h1" variant="h5" sx={{color:'black'}}>
                        Reproducciones
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', borderRadius: 2, mt:0.5, ml:1.5, pt:2, textAlign: 'center', border: '1px solid', borderColor:'#ED7D31', bgcolor: 'grey.300', color: 'grey.800'}}>
                    {(errorRep!="false") ? (
                        <Alert severity="error" sx={{mx:2}}>
                        <strong>{errorRep}</strong>
                        </Alert>
                    ) : (
                        <Grid container direction="column">
                        {reps.map((r) => (
                            <Grid item sx={{borderBottom: "1px solid grey", borderColor: "grey.400", mb:2, mx:1}}> 
                                <HomeRepCard r={r} update={update}/>
                            </Grid>
                        ))}
                        {(empty) ? (
                            <Grid item sx={{borderBottom: "1px solid grey", borderColor: "grey.400", mb:1.5, mx:1}}> 
                                <Typography sx={{mb:2}} component="h1" variant="h5">
                                    No hay ninguna reproducción activa
                                </Typography>
                            </Grid>
                        ) : ""}
                            <Grid item>
                                <Button onClick={() => navigate('/reproducciones')} startIcon={<HubIcon />} type="submit" variant="contained" sx={{ mt:1.5, color:'black', width:'100%', bgcolor:"#E9A272", '&:hover': {backgroundColor: '#ED7D31', }}}>
                                    Control de reproducciones
                                </Button>
                            </Grid>
                        </Grid>
                    )}
                </Box>
                </Grid>
            </Grid>
        ) : ""}
        </Grid>
    );
}
