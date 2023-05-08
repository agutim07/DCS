import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import {styled} from '@mui/material/styles';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import TimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopCircleIcon from '@mui/icons-material/StopCircle';

import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

const GrabCard = ({g, update, returnMessage, traffic}) => {
    const stat = g.status!=-1;
    const [timePass, setTimePass] = useState(Date.now());
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        if(stat){
            const interval = setInterval(() => {
                setTimePass(new Date());
                g.status = g.status + 1;
            }, 1000);
        
            return () => clearInterval(interval);
        }
    }, []);

    function secondsToDateLabel(seconds){
        var inicio = 0;

        if(seconds>=3600){
            inicio = 11;
        }else if(seconds>=60){
            inicio = 14;
        }else{
            inicio = 16;
        }

        var out = new Date(seconds * 1000).toISOString().substring(inicio, 19);
        return out;
    }

    const startCh = async () => {
        setLoading(true);

        let okeyMsg = "<html><body>Grabacion iniciada<br/></body></html>";
        let state = ""; let msg = "";
        try {
            const response = await axios.get(`/start?canal=${g.id}`);

            if(response.data==okeyMsg){
                state="success"; msg="Grabación en el canal "+g.id+" iniciada correctamente";
            }else{
                state="error"; msg="Error al iniciar la grabación del canal "+g.id;
            }
        } catch(e) {
            state="error"; msg="Error al iniciar la grabación del canal "+g.id;
            console.log(e);
        } 

        setLoading(false);
        handleClose();
        update();
        returnMessage(msg,state);
    }

    const stopCh = async () => {
        setLoading(true);

        let okeyMsg = "<html><body>Grabacion detenida<br/></body></html>";
        let state = ""; let msg = "";
        try {
            const response = await axios.get(`/stop?canal=${g.id}`);

            if(response.data==okeyMsg){
                state="success"; msg="Grabación en el canal "+g.id+" detenida correctamente";
            }else{
                state="error"; msg="Error al detener la grabación del canal "+g.id;
            }
        } catch(e) {
            state="error"; msg="Error al detener la grabación del canal "+g.id;
            console.log(e);
        } 

        setLoading(false);
        handleClose();
        update();
        returnMessage(msg,state);
    }

    const [open, setOpen] = React.useState(false);
    const [dialogForStart, setDialogForStart] = React.useState(false);
    const handleClickOpen = (tipo) => {
        if(tipo=="stop"){
            setDialogForStart(false);
        }else{
            setDialogForStart(true);
        }
        setOpen(true);
    };
    const handleClose = () => {setOpen(false);};

    function Traffic(props) {
        const packs = props.traffic;

        if (packs>50) {
          return <LightTooltip title={Math.round(traffic/5)+" paquetes por segundo"} placement="right">
          <TrendingUpIcon sx={{color:'green', border:2, padding:0.5, borderColor:'black', backgroundColor:'white'}}/>
          </LightTooltip>;
        }

        if (packs>0) {
            return <LightTooltip title={Math.round(traffic/5)+" paquetes por segundo"} placement="right">
                <TrendingFlatIcon sx={{color:'#E5D600', border:2, padding:0.5, borderColor:'black', backgroundColor:'white'}}/>
                </LightTooltip>;
        }

        return <LightTooltip title={Math.round(traffic/5)+" paquetes por segundo"} placement="right">
            <TrendingDownIcon sx={{color:'red', border:2, padding:0.5, borderColor:'black', backgroundColor:'white'}}/>
            </LightTooltip>;
    }

    return(
        <div>
        <Grid my={1.5} container alignItems="center">
            <Grid item xs={0.5} align="left">
                {g.id}
            </Grid>
            <Grid item xs={3.5} align="left">
                <LightTooltip title={g.syntax} placement="right">
                <SmallChip label={g.syntax} style={{backgroundColor:'white'}} variant="outlined" />
                </LightTooltip>
            </Grid>
            <Grid item xs={1} align="center">
                {(!stat) ? (
                    <SmallChip label={"OFF"} style={{backgroundColor:'#D04A4A', color:'white'}}/>
                ) : (
                    <SmallChip label={"ON"} style={{backgroundColor:'#47CD1F', color:'white'}}/>
                )}
            </Grid>
            <Grid item xs={1} align="center">
                {(traffic==-1) ? (
                    <CircularProgress size="1.5rem" sx={{color:'#ED7D31'}}/>
                ) : ""}
                {(traffic>=0) ? (
                    <Traffic traffic={traffic}/>
                ) : ""}
            </Grid>
            <Grid item xs={2} align="center">
                {(stat) ? (
                <Button startIcon={<TimerIcon />} disabled={true} type="submit" variant="contained" sx={{'&:disabled': {backgroundColor: 'white', color:'#91E291', border:1, borderColor:"black"}}}>
                    {secondsToDateLabel(g.status)}
                </Button>
                ) : ""}
            </Grid>
            <Grid item xs={1} align="center"/>
            <Grid item xs={1.5} align="center">
            <Box sx={{ width: '100%' }}>
                <IconButton onClick={() => handleClickOpen("start")} type="submit" variant="contained" disabled={stat} sx={{width:'40%', '&:disabled': {backgroundColor: '#D5F2CC', }, bgcolor:"#47CD1F", '&:hover': {backgroundColor: '#89D572', }, borderRadius: 0, border: "1px solid", borderRadius: '10px', borderColor: "black", "& .MuiButton-startIcon": { margin: 0 }}}>
                    <PlayArrowIcon sx={{color:'white'}}/>
                </IconButton>
            </Box>
            </Grid>
            <Grid item xs={1.5} align="left">
            <Box sx={{ width: '100%' }}>
                <IconButton onClick={() => handleClickOpen("stop")} type="submit" variant="contained" disabled={!stat} sx={{width:'40%', '&:disabled': {backgroundColor: '#F2CCCC', }, bgcolor:"#D04A4A", '&:hover': {backgroundColor: '#E46D6D', }, borderRadius: 0, border: "1px solid", borderRadius: '10px', borderColor: "black", "& .MuiButton-startIcon": { margin: 0 }}}>
                    <StopCircleIcon sx={{color:'white'}}/>
                </IconButton>
            </Box>
            </Grid>
        </Grid>

        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Confirmación</DialogTitle>
            <div>
            <DialogContent>
                {(loading) ? (
                    <Box display="flex" justifyContent="center" alignItems="center">
                        <CircularProgress sx={{color:'#ED7D31'}}/>
                    </Box>
                ) : (
                    <Alert severity={dialogForStart ? "info" : "warning"}>
                    <AlertTitle>{dialogForStart ? "¿Está seguro que desea iniciar la grabación "+g.id+"?" : "¿Está seguro que desea detener la grabación "+g.id+"?"}</AlertTitle>
                    </Alert>
                )}
            </DialogContent>
            {(!loading) ? (
            <DialogActions>
                <IconButton onClick={dialogForStart ? startCh : stopCh}>
                    <DoneIcon sx={{color:'green'}}/>
                </IconButton>
                <IconButton onClick={handleClose}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions> 
            ) : ""}
            </div>
        </Dialog>
        </div>
    );
}

export default GrabCard;