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
import Chip from '@mui/material/Chip';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AddBoxIcon from '@mui/icons-material/AddBox';

import RepCard from './sub/repcard'
import RepAdd from './sub/repadd'
import {styled} from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SmallChip = styled(Chip)(({ theme }) => ({
    borderColor: 'black',
    "& .MuiChip-icon": {
      color: 'black'
    },
    "& .MuiChip-iconSmall": {
        color: 'black'
    },
    '& .MuiChip-label': {
        fontSize:12
    },
}));

const LightTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      color: 'rgba(0, 0, 0, 0.87)',
      boxShadow: theme.shadows[1],
      fontSize: 11,
    },
}));

export default function Canales(){

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("false");
    const [canales, setCanales] = useState([]);

    async function checkChannels() {
        setLoading(true);

        try {
            const response = await axios.get(`/getFullCanales`);
            if(response.data=="error"){
                setError("No hay canales existentes en la base de datos");
            }else{
                var channels = response.data.replace("[", "");
                channels = channels.replace("]", "");
                const arrayChannels = channels.split(", ");
                const arrayChannels1 = [];
                
                let i=0;
                while(i<arrayChannels.length) {
                    let temp = {id:parseInt(arrayChannels[i]), syntax:arrayChannels[i+1], on:parseInt(arrayChannels[i+2])};
                    i = i+3;
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

    useEffect(() => {
        checkChannels();
    })

    return(
        <div>
        {(loading) ? (
            <Box sx={{ display: 'flex' }}>
                <CircularProgress sx={{color:'#ED7D31'}}/>
            </Box>
        ) : (
            (error=="false") ? (
                <Grid container direction="column">
                {canales.map((c) => (
                    <Grid item sx={{bgcolor: c.on ? 'grey.100' : '#212121', border: "1px solid grey", borderRadius: '10px', borderColor: "grey.400", mb:0.5}}> 
                        <Grid my={1.5} container alignItems="center">
                        <Grid item xs={0.5} align="center" sx={{color: !c.on ? 'white' : 'black'}}>
                            {c.id}
                        </Grid>
                        <Grid item xs={9} align="left">
                            <SmallChip label={c.syntax} style={{backgroundColor:'white'}} variant="outlined" />
                        </Grid>
                        <Grid item xs={1.5} align="left">
                            {(!c.on ? (
                                <Button disabled sx={{backgroundColor:'#C62828', '&:disabled': {color:'white', borderColor:'white'},}} variant="outlined">
                                Deshabilitado
                                </Button>
                            ) : "")}
                        </Grid>
                        <Grid item xs={1} align="left">
                            {(c.on ? (
                                <LightTooltip title="Deshabilitar" placement="right">
                                    <IconButton size="small" sx={{backgroundColor:'#C62828', '&:hover': {bgcolor: 'red',}}}>
                                        <HighlightOffIcon sx={{color:'white'}} fontSize="large"/>
                                    </IconButton>
                                </LightTooltip>
                            ) : (
                                <LightTooltip title="Habilitar" placement="right">
                                    <IconButton size="small" sx={{backgroundColor:'#43A047', '&:hover': {bgcolor: 'green',}}}>
                                        <AddBoxIcon sx={{color:'white'}} fontSize="large"/>
                                    </IconButton>
                                </LightTooltip>
                            ))}
                        </Grid>
                        </Grid>
                    </Grid>
                ))}
                </Grid>
            ) : (
                <Box display="flex" justifyContent="center" alignItems="center">
                    <Alert severity="error">
                    <strong>{error}</strong>
                    </Alert>
                </Box>
            )
        )}
        </div>
    );
}