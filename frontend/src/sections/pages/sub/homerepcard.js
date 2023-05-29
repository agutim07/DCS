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
import { createTheme, ThemeProvider} from '@mui/material/styles';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import TimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';

import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SmallChip = styled(Chip)(({ theme }) => ({
    '& .MuiChip-label': {
        fontSize:12
    },
}));

const CustomSlider = styled(Slider)({
    color: '#ED7D31',
    height: 4,
    '& .MuiSlider-markLabel' : {fontSize: "10px"},
    "& .MuiSlider-valueLabelLabel": {fontSize: "10px"},
    '&.Mui-disabled': {
        "& .MuiSlider-thumb ": {
            color: 'black',
        },
        "& .MuiSlider-track": {
          backgroundColor: "#ED7D31",
        },
        '& .MuiSlider-rail': {
            color: 'black',
        },
    },
    '& .MuiSlider-thumb': {
        width: 13,
        height: 13,
        color: 'black',
    },
    "& .MuiSlider-track": {
        backgroundColor: "#ED7D31",
    },
    '& .MuiSlider-rail': {
        color: 'black',
    },
});

const HomeRepCard = ({r, update}) => {
    const [timePass, setTimePass] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
          setTimePass(new Date());
          r.position = r.position + r.speed;
          if(r.position>=(r.end-r.start)){update();}
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);

    function getMarks(){
        var end = r.end - r.start;
        var endlabel = secondsToDateLabel(end);

        const sliderMark = [
            {
            value: 0,
            label: '00:00',
            },
            {
            value: end,
            label: endlabel,
            },
        ];
        return sliderMark;
    }

    function valuetext(current) {
        var d = new Date(0);
        d.setUTCSeconds(r.start);

        var startime = d.toLocaleTimeString();
        var a = startime.split(':'); // split it at the colons
        startime = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

        current = Math.round(current) + startime;

        return secondsToDateLabel(current);
    }

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
            <Grid item xs={0.5} align="center">
                {r.id}
            </Grid>
            <Grid item xs={3} align="center">
                <SmallChip label={"Canal " + r.canal} style={{backgroundColor:'white', borderColor:'black'}} variant="outlined" />
            </Grid>
            <Grid item xs={7.5} align="right">
            <Box sx={{ width: '100%' }}>
                <CustomSlider
                    disabled
                    value={r.position}
                    valueLabelFormat={valuetext(r.position)}
                    valueLabelDisplay="on"
                    min={0}
                    max={r.end-r.start}
                    marks={getMarks(r.end-r.start)}
                />
            </Box>
            </Grid>
        </Grid>
        </div> 
    );
}

export default HomeRepCard;