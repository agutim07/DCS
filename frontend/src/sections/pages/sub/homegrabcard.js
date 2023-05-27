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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/Key';
import CloseIcon from '@mui/icons-material/Close';

import {styled} from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";

import axios from "axios";

const SmallChip = styled(Chip)(({ theme }) => ({
    borderColor: 'black',
    "& .MuiChip-icon": {
      color: 'black'
    },
    "& .MuiChip-iconSmall": {
        color: 'black'
    },
    '& .MuiChip-label': {
        fontSize:10
    },
}));

const LightTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      color: 'white',
      boxShadow: theme.shadows[1],
      fontSize: 11,
    },
}));

const HomeGrabCard = ({g}) => {
    const stat = g.status!=-1;

    const [timePass, setTimePass] = useState(Date.now());
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

    return(
        <div>
            <Grid my={1.5} container alignItems="center">
                <Grid item xs={1} align="center">
                    {g.id}
                </Grid>
                <Grid item xs={5.5} align="left">
                    <LightTooltip title={g.syntax} placement="right">
                    <SmallChip label={g.syntax} style={{backgroundColor:'white'}} variant="outlined" />
                    </LightTooltip>
                </Grid>
                <Grid item xs={2.5} align="center">
                    {(!stat) ? (
                        <SmallChip label={"OFF"} style={{backgroundColor:'#D04A4A', color:'white'}}/>
                    ) : (
                        <SmallChip label={"ON"} style={{backgroundColor:'#47CD1F', color:'white'}}/>
                    )}
                </Grid>
                <Grid item xs={3} align="center">
                    {(stat) ? (
                    <Button startIcon={<TimerIcon />} disabled={true} type="submit" variant="contained" sx={{'&:disabled': {backgroundColor: 'white', color:'#91E291', border:1, borderColor:"black"}}}>
                        {secondsToDateLabel(g.status)}
                    </Button>
                    ) : ""}
                </Grid>
            </Grid>
        </div>
    );
}

export default HomeGrabCard;