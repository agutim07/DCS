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

const speedMarks = [
    {
      value: 0.1,
      label: 'x0.1',
    },
    {
      value: 1,
      label: 'x1',
    },
    {
      value: 5,
      label: 'x5',
    },
    {
      value: 10,
      label: 'x10',
    },
  ];

const RepCard = ({r, update, returnMessage}) => {
    const [timePass, setTimePass] = useState(Date.now());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
          setTimePass(new Date());
          r.position = r.position + r.speed;
          if(r.position>=(r.end-r.start)){update();}
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);

    const [time, setTime] = React.useState(r.position);
    const [speed, setSpeed] = React.useState(r.speed);
    
    function epochToDate(epoch){
        var d = new Date(0);
        d.setUTCSeconds(epoch);
        var seconds = d.getSeconds(), minutes = d.getMinutes(), hours = d.getHours();
        if(seconds<10){seconds="0"+seconds;} 
        if(minutes<10){minutes="0"+minutes;}
        if(hours<10){hours="0"+hours;}

        var out = d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()+" "+hours+":"+minutes+":"+seconds;
        return out;
    }

    function getMarks(){
        var end = r.end - r.start;

        var endseconds = (end%60);
        if(endseconds<10){endseconds = '0'+endseconds};

        const sliderMark = [
            {
            value: 0,
            label: '00:00',
            },
            {
            value: end,
            label: Math.floor(end/60)+':'+endseconds,
            },
        ];
        return sliderMark;
    }

    function valuetext(current) {
        current = Math.round(current);

        var seconds = (current%60);
        if(seconds<10){seconds = '0'+seconds};

        return Math.floor(current/60)+':'+seconds;
    }

    function valuetextSpeed(value) {
        return`x${value}`
    }

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {setOpen(true);};
    const handleClose = () => {setOpen(false);};

    const okeyMsg = "<html><body>Reproduccion detenida<br/></body></html>";
    const handleDelete = async () => {
        setLoading(true);
        let state = ""; let msg = "";
        try {
            const response = await axios.get(`/stopreplay?reproduccion=${r.id}`);
            if(response.data==okeyMsg){
                state="success"; msg="Reproducción "+r.id+" eliminada correctamente";
            }else{
                state="error"; msg="Error al eliminar la reproducción "+r.id;
            }
        } catch(e) {
            state="error"; msg="Error al eliminar la reproducción: "+e;
            console.log(e);
        } 
        update();
        setOpen(false);
        setLoading(false);
        returnMessage(msg,state);
    };

    const [openEdit, setOpenEdit] = React.useState(false);
    const handleClickOpenEdit = () => {setOpenEdit(true); setTime(r.position); setSpeed(r.speed);};
    const handleCloseEdit = () => {setOpenEdit(false); setChangeTime(false);};
    const [changeTime, setChangeTime] = React.useState(false);

    const okeyMsgs = ["Reproduccion modificada correctamente: cambio de velocidad","Reproduccion modificada correctamente: salto de tiempo", "Reproduccion modificada correctamente: salto de tiempo y cambio de velocidad"];
    const [error,setError] = useState("");
    const [loadingModify, setLoadingModify] = useState(false);

    const handleModify = async () => {
        if(!changeTime && speed==r.speed){
            setError("No se ha modificado ningun valor de la reproducción");
            return;
        }

        let mode = 3, request = "";
        if(speed==r.speed){mode = 1; request=mode+"&"+r.id+"&"+time;}
        if(!changeTime){mode = 2; request=mode+"&"+r.id+"&"+speed;}
        if(mode==3){request=mode+"&"+r.id+"&"+time+"&"+speed;}

        setLoadingModify(true);
        let state = ""; let msg = "";
        try {
            const response = await axios.get(`/modifyreplay?${request}`);
            if(response.data==okeyMsgs[0] || response.data==okeyMsgs[1] || response.data==okeyMsgs[2]){
                state="success"; msg="Reproducción "+r.id+" modificada correctamente";
            }else{
                state="error"; msg="Error al modificar la reproducción "+r.id+": "+response.data;
            }
        } catch(e) {
            state="error"; msg="Error al modificar la reproducción: "+e;
            console.log(e);
        } 
        update();
        setOpenEdit(false);
        setLoadingModify(false);
        returnMessage(msg,state);
    };

    return(
        <div>
        <Grid my={1.5} container alignItems="center">
            <Grid item xs={0.5} align="left">
                {r.id}
            </Grid>
            <Grid item xs={1} align="right">
                <SmallChip label={"Canal " + r.canal} variant="outlined" />
            </Grid>
            <Grid item xs={0.8} align="center">
                <SmallChip label={"x" + r.speed} variant="outlined" />
            </Grid>
            <Grid item xs={2.7} align="left">
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
            <Grid item xs={2.5} align="center">
                <Grid container direction="column" spacing={0.5}>
                    <Grid item>
                    <Button onClick={() => handleClickOpenEdit()} startIcon={<EditIcon />} type="submit" variant="contained" sx={{ width:'60%', bgcolor:"#EBD728", '&:hover': {backgroundColor: '#E8DB6B', }}}>
                        Modificar
                    </Button>
                    </Grid>
                    <Grid item>
                    <Button onClick={() => handleClickOpen()} startIcon={<CloseIcon />} type="submit" variant="contained" sx={{ width:'60%', bgcolor:"#F32020", '&:hover': {backgroundColor: '#F26767', }}}>
                        Detener
                    </Button>
                    </Grid>
                </Grid>
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
                    <Alert severity="warning">
                    <AlertTitle>{"¿Está seguro que desea detener la reproducción "+r.id+"?"}</AlertTitle>
                    </Alert>
                )}
            </DialogContent>
            {(!loading) ? (
            <DialogActions>
                <IconButton onClick={handleDelete}>
                    <DoneIcon sx={{color:'green'}}/>
                </IconButton>
                <IconButton onClick={handleClose}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions> 
            ) : ""}
            </div>
        </Dialog>

        <Box sx={{position: "absolute", bottom: 20, right: 20}} >
            <Dialog fullWidth maxWidth='md'  open={openEdit} onClose={handleCloseEdit}>
                <DialogTitle id="form-dialog-title">{"Modificar reproducción "+r.id}</DialogTitle>
                <DialogContent>
                    <Grid container direction="column" spacing={0.5} sx={{my:3}}>
                        <Grid item sx={{mb:3}}>
                            <Grid container alignItems="center">
                                <Grid item xs={2.4}>
                                    <Typography component="h1" variant="h6">
                                        Tiempo
                                    </Typography>
                                </Grid>
                                <Grid item xs={6.3} align="center">
                                <CustomSlider
                                    value = { changeTime ? time : r.position }
                                    valueLabelFormat={ changeTime ? valuetext(time) : valuetext(r.position) }
                                    step={1}
                                    valueLabelDisplay="on"
                                    marks={getMarks()}
                                    min={0}
                                    max={r.end-r.start}
                                    onChange={(e, newValue) => {setTime(newValue); setChangeTime(true)}}
                                />
                                </Grid>
                                <Grid item xs={3.3} align="right">
                                    <SmallChip icon={<TimeIcon />} sx={{border: '2px solid', borderColor: "#EBD728", ...(changeTime && {borderColor: "green"})}} label={ changeTime ? epochToDate(time+r.start) : epochToDate(r.position+r.start) } variant="outlined" />
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid container alignItems="center">
                                <Grid item xs={2.4}>
                                    <Typography component="h1" variant="h6">
                                        Velocidad
                                    </Typography>
                                </Grid>
                                <Grid item xs={6.3} align="center">
                                <Slider
                                    track={false}
                                    aria-labelledby="track-false-slider"
                                    valueLabelFormat={valuetextSpeed(speed)}
                                    defaultValue={r.speed}
                                    step={0.1}
                                    valueLabelDisplay="on"
                                    marks={speedMarks}
                                    min={0.1}
                                    max={10}
                                    onChange={(e, newValue) => setSpeed(newValue)}
                                />
                                </Grid>
                                <Grid item xs={3.3} align="right">
                                    <SmallChip icon={<SpeedIcon />} sx={{border: '2px solid', borderColor: "#EBD728", ...(speed!=r.speed && {borderColor: "green"})}} label={'x'+speed} variant="outlined" />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Box sx={{position: 'relative' }}>
                        <Button onClick={handleModify} disabled={loadingModify} startIcon={<EditIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                            Aplicar cambios
                        </Button>
                        {loadingModify && (
                        <CircularProgress size={24} sx={{color: "green", position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}} />
                        )}
                    </Box>
                    <IconButton onClick={handleCloseEdit}>
                        <CloseIcon sx={{color:'red'}}/>
                    </IconButton>
                </DialogActions>
                {(error!="") ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{mb:2, mt:1}}>
                    <Alert sx={{color:'orange'}} variant="outlined" severity="warning" onClose={() => {setError("")}}><b>Error: </b>{error}</Alert>
                </Box>
                ) : ""}
            </Dialog>
        </Box>
        </div> 
    );
}

export default RepCard;