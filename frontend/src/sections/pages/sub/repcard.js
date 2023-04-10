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

const RepCard = ({r}) => {
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

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {setOpen(true);};
    const handleClose = () => {setOpen(false);};

    const [openEdit, setOpenEdit] = React.useState(false);
    const handleClickOpenEdit = () => {setOpenEdit(true);};
    const handleCloseEdit = () => {setOpenEdit(false);};

    return(
        <div>
        <Grid my={1.5} container alignItems="center">
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
            <div><DialogContent>
                <Alert severity="warning">
                <AlertTitle>{"¿Está seguro que desea detener la reproducción "+r.id+"?"}</AlertTitle>
                </Alert>
            </DialogContent>
            <DialogActions>
                <IconButton onClick={handleClose}>
                    <DoneIcon sx={{color:'green'}}/>
                </IconButton>
                <IconButton onClick={handleClose}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions> </div>
        </Dialog>

        <Box sx={{position: "absolute", bottom: 20, right: 20}} >
            <Dialog fullWidth="300px" sx={{width:"200"}} open={openEdit} onClose={handleCloseEdit}>
                <DialogTitle id="form-dialog-title">{"Modificar reproducción "+r.id}</DialogTitle>
                <DialogContent>
                    
                </DialogContent>
                <DialogActions>
                        <Button onClick={handleCloseEdit} startIcon={<EditIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                            Aplicar cambios
                        </Button>
                        <IconButton onClick={handleCloseEdit}>
                            <CloseIcon sx={{color:'red'}}/>
                        </IconButton>
                </DialogActions>
            </Dialog>
        </Box>
        </div> 
    );
}

export default RepCard;