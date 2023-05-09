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
import LinearProgress from '@mui/material/LinearProgress';
import Switch from '@mui/material/Switch';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FormControlLabel from '@mui/material/FormControlLabel';

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

const ThemedSwitch = styled((props) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 37,
    height: 21,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#ED7D31',
          opacity: 1,
          border: 0,
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: '#33cf4d',
        border: '6px solid #fff',
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color:
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[600],
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 17,
      height: 17,
    },
    '& .MuiSwitch-track': {
      borderRadius: 21 / 2,
      backgroundColor: theme.palette.mode === 'light' ? '#757575' : '#39393D',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
    },
  }));

export default function Canales(){
    const [seeDisabled, setSeeDisabled] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("false");
    const [canales, setCanales] = useState([]);

    async function checkChannels() {
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
    }

    useEffect(() => {
        setLoading(true);
        checkChannels();
        setLoading(false);
    }, []);

    const [snackMsg, setSnackMsg] = React.useState("false");
    const [snackState, setSnackState] = React.useState("error");
    const [openSnack, setOpenSnack] = useState(false);

    const handleCloseSnack = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenSnack(false);
    };

    async function modifyChannel(state,id){
        let change = "habilitado";
        if(state==0){change="deshabilitado";}

        setLoading(true);
        try {
            const response = await axios.get(`/modifych?${state}&${id}`);
            if(response.data=="OK"){
                let message = "El canal "+id+" se ha "+change+" con éxito";
                setSnackMsg(message);
                setSnackState("success");
                setOpenSnack(true);
                changeOn(id,state);
            }else{
                setSnackMsg(response.data);
                setSnackState("error");
                setOpenSnack(true);
            }
        } catch(e) {
            setSnackMsg("Error al modificar: error de conexión con el backend");
            setSnackState("error");
            setOpenSnack(true);
            console.log(e);
        }

        setLoading(false);
    }

    function changeOn(id, state){
        var cann = canales;
        for(let i=0; i<cann.length; i++){
            if(cann[i].id==id){
                cann[i].on=state;
            }
        }
        setCanales(cann);
    }

    return(
        <div>
        {(loading) ? (
            <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center">
            <Box sx={{width: '80%', mt:2 }}>
                <LinearProgress sx={{backgroundColor: "#ED7D31", "& .MuiLinearProgress-bar": {backgroundColor: "#F3D2BB"} }}/>
            </Box>
            </Grid>
        ) : (
            (error=="false") ? (
                <Grid container direction="column">
                    <Grid item align="left" sx={{mb:0.5}}>
                    <FormControlLabel
                        control={<ThemedSwitch sx={{ m: 1 }} checked={seeDisabled} onClick={() => setSeeDisabled(!seeDisabled)}/>}
                        label="Ver canales deshabilitados"
                    />
                    </Grid>
                {canales.map((c) => (
                    (!c.on && !seeDisabled) ? "" : (
                    <Grid item sx={{bgcolor: c.on ? 'grey.100' : '#212121', border: "1px solid grey", borderRadius: '10px', borderColor: "grey.400", mb:0.5}}> 
                        <Grid my={1.5} container alignItems="center">
                        <Grid item xs={0.5} align="center" sx={{color: !c.on ? 'white' : 'black'}}>
                            {c.id}
                        </Grid>
                        <Grid item xs={8.5} align="left">
                            <SmallChip label={c.syntax} style={{backgroundColor:'white'}} variant="outlined" />
                        </Grid>
                        <Grid item xs={2} align="left">
                            {(!c.on ? (
                                <Button disabled sx={{backgroundColor:'#C62828', '&:disabled': {color:'white', borderColor:'white'},}} variant="outlined">
                                Deshabilitado
                                </Button>
                            ) : "")}
                        </Grid>
                        <Grid item xs={1} align="left">
                            {(c.on ? (
                                <LightTooltip title="Deshabilitar" placement="right">
                                    <IconButton onClick={() => modifyChannel(0,c.id)} size="small" sx={{backgroundColor:'#C62828', '&:hover': {bgcolor: 'red',}}}>
                                        <HighlightOffIcon sx={{color:'white'}} fontSize="large"/>
                                    </IconButton>
                                </LightTooltip>
                            ) : (
                                <LightTooltip title="Habilitar" placement="right">
                                    <IconButton onClick={() => modifyChannel(1,c.id)} size="small" sx={{backgroundColor:'#43A047', '&:hover': {bgcolor: 'green',}}}>
                                        <AddBoxIcon sx={{color:'white'}} fontSize="large"/>
                                    </IconButton>
                                </LightTooltip>
                            ))}
                        </Grid>
                        </Grid>
                    </Grid>
                    )
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

            <Snackbar open={openSnack} autoHideDuration={6000} onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity={snackState}>
                    <strong>{snackMsg}</strong>
                </Alert>
            </Snackbar>
        </div>
    );
}