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
import Collapse from '@mui/material/Collapse';
import Slider from '@mui/material/Slider';
import {styled} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';


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

import axios from "axios";
import {backend} from '../../../variables/global'
import Modal from '@mui/material/Modal';

import dayjs from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const RepAdd = ({close, canales, update, returnMessage}) => {
    const [details, setDetails] = useState({canal:0, inicio:0, fin:1, canal:1});
    const [inicioDate, setInicioDate] = React.useState(dayjs(epochToDate(details.inicio)));
    const [finDate, setFinDate] = React.useState(dayjs(epochToDate(details.fin)));

    const [openInfo, setOpenInfo] = React.useState(false);
    const handleOpenInfo = () => setOpenInfo(true);
    const handleCloseInfo = () => setOpenInfo(false);

    function epochToDate(epoch){
        var d = new Date(0);
        d.setUTCSeconds(epoch);
        return d;
    }

    function changeDateE(epoch,mode){
        var d = epochToDate(epoch);
        
        if(mode==0){
            setDetails({ ...details, inicio: epoch });
            setInicioDate(dayjs(d));
        }else{
            setDetails({ ...details, fin: epoch });
            setFinDate(dayjs(d));
        }
    }

    function changeDateD(date,mode){
        let d = new Date(date);

        if(mode==0){
            setDetails({ ...details, inicio: (Date.parse(d) / 1000) });
            setInicioDate(date);
        }else{
            setDetails({ ...details, fin: (Date.parse(d) / 1000) });
            setFinDate(date);
        }
    }

    return(
        <div>
            <DialogTitle id="form-dialog-title">Añadir reproducción</DialogTitle>
            <DialogContent>
            <Grid container direction="column" spacing={0.5} sx={{my:3}}>
                <Grid item sx={{mb:3}}>
                    <Grid container alignItems="center" textAlign="center">
                        <Grid item xs={6}>
                            <TextField select label="Canal" defaultValue="1">
                            {canales.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                {option.id+" - "+option.syntax}
                                </MenuItem>
                            ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <Button onClick={handleOpenInfo}>Open modal</Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item sx={{mb:3}}>
                    <Grid container alignItems="center" textAlign="center">
                        <Grid item xs={6}>
                            <TextField sx={{ width: '60%' }} type="number" autoFocusmargin="dense" id="inicio" label="Inicio en tiempo epoch" fullWidth value={details.inicio} onChange={e => changeDateE(e.target.value,0)}/>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DateTimePicker views={['year', 'day', 'hours', 'minutes', 'seconds']} format="DD / MM / YYYY hh:mm:ss a" sx={{ width: '60%' }} label="Inicio en tiempo local" value={inicioDate} onChange={(newValue) => changeDateD(newValue,0)} />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container alignItems="center" textAlign="center">
                        <Grid item xs={6}>
                            <TextField sx={{ width: '60%' }} type="number" autoFocusmargin="dense" id="final" label="Final en tiempo epoch" fullWidth value={details.fin} onChange={e => changeDateE(e.target.value,1)}/>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DateTimePicker views={['year', 'day', 'hours', 'minutes', 'seconds']} format="DD / MM / YYYY hh:mm:ss a" sx={{ width: '60%' }} label="Final en tiempo local" value={finDate} onChange={(newValue) => changeDateD(newValue,1)}/>
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>  
            </DialogContent>
            <DialogActions>
                <Button onClick={close} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                    Iniciar
                </Button>
                <IconButton onClick={close}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions>
            <Modal
                open={openInfo}
                onClose={handleCloseInfo}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Text in a modal
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                </Typography>
                </Box>
            </Modal>
        </div>
    );
}

export default RepAdd;