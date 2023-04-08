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
import Slider from '@mui/material/Slider';
import {styled} from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

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
    }
});

export default function Rep(){
    const [rep, setRep] = useState({id:1, canal:3, start:1680972630, end:1680972900, position:120});
    const [reps, setReps] = useState([]);

    useEffect(() => {
        const temp = [];
        temp.push(rep);
        temp.push(rep);
        setReps(temp);
    }, []);

    // const installations = 0;

    // useEffect(async () => {
    //     try {
    //         await axios.get(`${backend}/logout`);
    //         handleClose();
    //         localStorage.removeItem('token');
    //         logout();
    //     } catch(e) {
    //         setType("error");
    //     } 
    // }, []);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("false");

    function epochToDate(epoch){
        var d = new Date(0);
        d.setUTCSeconds(epoch);
        var seconds = d.getSeconds();
        if(seconds<10){seconds="0"+seconds;}

        var out = d.getDay()+"/"+d.getMonth()+"/"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes()+":"+seconds;
        return out;
    }

    function getMarks(end,actual){
        var endseconds = (end%60);
        if(endseconds<10){endseconds = '0'+endseconds};

        const sliderMark = [
            {
            value: 0,
            label: '00:00',
            },
            {
            value: 100,
            label: Math.floor(end/60)+':'+endseconds,
            },
        ];
        return sliderMark;
    }
      
    function valuetext(current) {
        var seconds = (current%60);
        if(seconds<10){seconds = '0'+seconds};

        return Math.floor(current/60)+':'+seconds;
    }

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
            <Typography component="h1" variant="h4">
            Reproducciones
            </Typography>
            <Box sx={{ width: '75%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                {(loading) ? (
                    <CircularProgress sx={{color:'#ED7D31'}}/>
                ) : (
                    (error=="false") ? (
                        <Grid container direction="column" spacing={2}>
                        {reps.map((r) => (
                            <Grid item sx={{borderBottom: `1px solid grey`}}> <Grid my={1.5} container alignItems="center">
                                <Grid item xs={0.5} align="left">
                                    {r.id}
                                </Grid>
                                <Grid item xs={1} align="left">
                                    <SmallChip label={"Canal " + r.canal} variant="outlined" />
                                </Grid>
                                <Grid item xs={3} align="center">
                                    <Grid container direction="column" spacing={0.5}>
                                        <Grid item>
                                            <SmallChip label={epochToDate(r.start)} variant="outlined" />
                                        </Grid>
                                        <Grid item>
                                            <SmallChip label={epochToDate(r.end)} variant="outlined" />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={4.5} align="center">
                                <Box sx={{ width: 300 }}>
                                    <CustomSlider
                                        disabled
                                        defaultValue={(r.position/(r.end-r.start))*100}
                                        valueLabelFormat={valuetext(r.position)}
                                        step={100}
                                        valueLabelDisplay="on"
                                        marks={getMarks(r.end-r.start)}
                                    />
                                </Box>
                                </Grid>
                                <Grid item xs={3} align="center">
                                    <Grid container direction="column" spacing={0.5}>
                                        <Grid item>
                                        <Button startIcon={<EditIcon />} type="submit" variant="contained" sx={{ width:'60%', bgcolor:"#EBD728", '&:hover': {backgroundColor: '#E8DB6B', }}}>
                                            Modificar
                                        </Button>
                                        </Grid>
                                        <Grid item>
                                        <Button startIcon={<CloseIcon />} type="submit" variant="contained" sx={{ width:'60%', bgcolor:"#F32020", '&:hover': {backgroundColor: '#F26767', }}}>
                                            Detener
                                        </Button>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid> </Grid>
                        ))}
                            <Grid item>
                                <Button startIcon={<AddIcon />} type="submit" variant="contained" sx={{ color:'black', width:'70%', bgcolor:"#31E3E9", '&:hover': {backgroundColor: '#9FECEF', }}}>
                                    Añadir reproducción
                                </Button>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center">
                            <Alert severity="error">
                            <AlertTitle>Error</AlertTitle>
                            <strong>No se ha podido conectar con el backend</strong>
                            </Alert>
                        </Box>
                    )
                )}
            </Box>
        </Grid>
    );
}