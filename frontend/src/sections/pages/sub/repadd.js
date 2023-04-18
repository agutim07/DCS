import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import DoneIcon from '@mui/icons-material/Done';

import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import axios from "axios";
import {backend} from '../../../variables/global'
import Modal from '@mui/material/Modal';

import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { createTheme, ThemeProvider} from '@mui/material/styles';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const CustomFontTheme = createTheme({
    typography: {
      fontFamily: 'Copperplate Gothic Light',
      fontSize: 14
    }
  });

const RepAdd = ({close, canales, update, returnMessage}) => {
    const [details, setDetails] = useState({canal:1, inicio:0, fin:1});
    const [inicioDate, setInicioDate] = React.useState(dayjs(epochToDate(details.inicio)));
    const [finDate, setFinDate] = React.useState(dayjs(epochToDate(details.fin)));

    const [loadingInfo, setLoadingInfo] = React.useState(true);
    const [grabaciones, setGrabaciones] = useState([]);
    const [info, setInfo] = React.useState("");
    const [openInfo, setOpenInfo] = React.useState(false);
    const handleOpenInfo = () => setOpenInfo(true);
    const handleCloseInfo = () => setOpenInfo(false);

    function epochToDate(epoch){
        var d = new Date(0);
        d.setUTCSeconds(epoch);
        return d;
    }

    function epochToDateLabel(epoch){
        var d = epochToDate(epoch);
        var seconds = d.getSeconds();
        var seconds = d.getSeconds(), minutes = d.getMinutes(), hours = d.getHours();
        if(seconds<10){seconds="0"+seconds;} 
        if(minutes<10){minutes="0"+minutes;}
        if(hours<10){hours="0"+hours;}

        var out = d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()+" "+hours+":"+minutes+":"+seconds;
        return out;
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

    useEffect(() => {
        getInfo(details.canal);
    }, []);

    function changeCanal(ch){
        setDetails({ ...details, canal: ch});
        getInfo(ch);
    }

    async function getInfo(ch) {
        setLoadingInfo(true);
        try {
            const response = await axios.get(`${backend}/canalesData?canal=${ch}`);
            if(response.data=="empty"){
                setInfo("No hay ninguna grabación disponible en este canal");
            }else{
                const arrayChannels = response.data;
                const arrayGrabaciones = [];
                
                let i=0, idNum=0;
                while(i<arrayChannels.length) {
                    idNum++;
                    let temp = {id:idNum, inicio:arrayChannels[i], fin:arrayChannels[i+1]};
                    i = i+2;
                    arrayGrabaciones.push(temp);
                }

                setInfo("Hay "+idNum+" grabacion/es disponibles en este canal");
                setGrabaciones(arrayGrabaciones);
            }
        } catch(e) {
            console.log(e);
        } 
        setLoadingInfo(false);
    }

    const [error,setError] = useState("");

    const [loadingAdd, setLoadingAdd] = useState(false);

    const add = async () => {
        setError("");
        setLoadingAdd(true);
        if(info=="No hay ninguna grabación disponible en este canal"){
            setError("no se puede iniciar una reproducción ya que no hay grabaciones en el canal");
        }else{
            try {
                const response = await axios.get(`${backend}/replayRaw?canal=${details.canal}&inicio=${details.inicio}&fin=${details.fin}`);
                if(response.data.substring(0,21)=="Reproduccion iniciada"){
                    let state="success", msg=response.data;
                    update();
                    returnMessage(msg,state);
                    close();
                }else{
                    setError(response.data);
                }
            } catch(e) {
                setError(e);
                console.log(e);
            }
        }
        setLoadingAdd(false);
    }

    return(
        <div>
            <DialogTitle id="form-dialog-title">Añadir reproducción</DialogTitle>
            <DialogContent>
            <Grid container direction="column" spacing={0.5} sx={{my:3}}>
                <ThemeProvider theme={CustomFontTheme}>
                <Grid item sx={{mb:3}}>
                    <Grid container alignItems="center" textAlign="center">
                        <Grid item xs={6}>
                            <TextField select label="Canal" value={details.canal ?? null} onChange={e => changeCanal(e.target.value)}>
                            {canales.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                {option.id+" - "+option.syntax}
                                </MenuItem>
                            ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                        {(loadingInfo) ? (
                            <Box display="flex" justifyContent="center" alignItems="center">
                                <LinearProgress sx={{width:'50%'}}/>
                            </Box>
                            ) : (
                            <Chip icon={<InfoIcon />} onClick={info=="No hay ninguna grabación disponible en este canal" ? null : handleOpenInfo } color='primary' label={info}/>
                        )}
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
                </ThemeProvider>
            </Grid>  
            </DialogContent>
            <DialogActions>
                <Box sx={{position: 'relative' }}>
                    <Button onClick={add} disabled={loadingAdd} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                        Iniciar
                    </Button>
                    {loadingAdd && (
                    <CircularProgress size={24} sx={{color: "green", position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}} />
                    )}
                </Box>
                <IconButton onClick={close}>
                    <CloseIcon sx={{color:'red'}}/>
                </IconButton>
            </DialogActions>

            {(error!="") ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{mb:2}}>
                <Alert sx={{color:'red'}} variant="outlined" severity="error" onClose={() => {setError("")}}><b>Error: </b>{error}</Alert>
            </Box>
            ) : ""}

            <Modal
                open={openInfo}
                onClose={handleCloseInfo}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                <Grid container spacing={2} columns={16}>
                    <Grid item xs={8} align="left">
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            {"Grabaciones - Canal "+details.canal}
                        </Typography>
                    </Grid>
                    <Grid item xs={8} align="right">
                        <IconButton onClick={handleCloseInfo}>
                            <CloseIcon sx={{color:'red'}}/>
                        </IconButton>
                    </Grid>
                </Grid>
                <TableContainer sx={{mt:2}} component={Paper}>
                    <Table sx={{ minWidth: 650, backgroundColor: '#E9A272'}} size="small" aria-label="a dense table">
                        <TableHead>
                        <TableRow>
                            <TableCell><b>ID</b></TableCell>
                            <TableCell align="right"><b>Duración&nbsp;(secs)</b></TableCell>
                            <TableCell align="right"><b>Inicio&nbsp;(epoch)</b></TableCell>
                            <TableCell align="right"><b>Inicio&nbsp;(local)</b></TableCell>
                            <TableCell align="right"><b>Fin&nbsp;(epoch)</b></TableCell>
                            <TableCell align="right"><b>Fin&nbsp;(local)</b></TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {grabaciones.map((g) => (
                            <TableRow
                            key={g.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                            <TableCell component="th" scope="row">
                                {g.id}
                            </TableCell>
                            <TableCell align="right">{g.fin-g.inicio}</TableCell>
                            <TableCell align="right">{g.inicio}</TableCell>
                            <TableCell align="right">{epochToDateLabel(g.inicio)}</TableCell>
                            <TableCell align="right">{g.fin}</TableCell>
                            <TableCell align="right">{epochToDateLabel(g.fin)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                </Box>
            </Modal>
        </div>
    );
}

export default RepAdd;