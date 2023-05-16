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

import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Tooltip from '@mui/material/Tooltip';
import KeyIcon from '@mui/icons-material/Key';
import CloseIcon from '@mui/icons-material/Close';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";

import axios from "axios";

export default function Home(){
    const [db, setDB] = useState(false);
    const [ch, setCH] = useState(0);
    const [param, setParams] = useState(false);

    const [loading, setLoading] = useState(true);

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
            } catch(e) {
                setDB(false);
                setCH(0);
                setParams(false);
            } 
        }

        checkState();
        setLoading(false);
    }, []);

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
        </Grid>
    );
}
