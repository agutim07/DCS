import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import {styled} from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

const darkTheme = createTheme({
    typography: {
        fontFamily: 'Copperplate Gothic Light',
    },
    palette: {
        mode: 'dark',
    },
});

export default function DataGrab({redirect}){
    const [loading, setLoading] = useState(true);
    const [grabaciones, setGrabaciones] = useState([]);
    const [error,setError] = useState("false");

    useEffect(() => {
        update();
    }, []);

    async function update(){
        setLoading(true);
        try {
            const response = await axios.get(`/data`);
            if(response.data=="empty"){
                setError("No hay ninguna grabación existente");
            }else{
                const arrayChannels = response.data;
                const arrayGrabaciones = [];
                
                let i=0, idNum=0;
                while(i<arrayChannels.length) {
                    idNum++;
                    let temp = {id:idNum, realId:arrayChannels[i], canal:arrayChannels[i+1], inicio:arrayChannels[i+2], fin:arrayChannels[i+3], archivos:arrayChannels[i+4], size:arrayChannels[i+5]};
                    i = i+6;
                    arrayGrabaciones.push(temp);
                };

                arrayGrabaciones.sort(compareID);
                setGrabaciones(arrayGrabaciones);
            }
        } catch(e) {
            setError("Error al conectar con la base de datos");
            console.log(e);
        } 
        setLoading(false);
    }

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

    const [ordenar, setOrdenar] = React.useState(0);

    const handleChange = (event) => {
        setOrdenar(event.target.value);
        switch(event.target.value){
            case 0: setGrabaciones(grabaciones.sort(compareID)); break;
            case 1: setGrabaciones(grabaciones.sort(compareCanal)); break;
            case 2: setGrabaciones(grabaciones.sort(compareDuracion)); break;
            case 3: setGrabaciones(grabaciones.sort(compareAnt)); break;
            case 4: setGrabaciones(grabaciones.sort(compareArchivos)); break;
            case 5: setGrabaciones(grabaciones.sort(compareTam)); break;
            default: break;
        }
    };

    function compareID(a,b) {
        if ( a.id < b.id){return -1;}
        if ( a.id > b.id){return 1;}
        return 0;
    }

    function compareCanal(a,b) {
        if ( a.canal < b.canal ){return -1;}
        if ( a.canal > b.canal ){return 1;}
        return 0;
    }

    function compareDuracion(a,b) {
        if ( (a.fin-a.inicio) < (b.fin-b.inicio) ){return 1;}
        if ( (a.fin-a.inicio) > (b.fin-b.inicio) ){return -1;}
        return 0;
    }

    function compareAnt(a,b) {
        if ( a.inicio < b.inicio ){return 1;}
        if ( a.inicio > b.inicio ){return -1;}
        return 0;
    }

    function compareArchivos(a,b) {
        if ( a.archivos < b.archivos ){return 1;}
        if ( a.archivos > b.archivos ){return -1;}
        return 0;
    }

    function compareTam(a,b) {
        if ( a.size < b.size ){return 1;}
        if ( a.size > b.size ){return -1;}
        return 0;
    }

    const [dialogGrab, setDialogGrab] = useState();
    const [integrityPackets, setIntegrityPackets] = useState(0);
    async function checkIntegrity(g) {
        setLoading(true);
        try {
            const response = await axios.get(`/checkintegrity?id=${g.realId}`);
            if(response.data==0){
                openSnack("La grabación "+g.id+" tiene todos sus archivos íntegros","success");
            }else if(response.data==g.archivos){
                setDialogGrab(g);
                setDeletionType(1);
                setOpenDelete(true);
            }else{
                setIntegrityPackets(response.data);
                setDialogGrab(g);
                setOpenIntegrity(true);
            }
        } catch(e) {
            console.log(e);
            openSnack("Error al comprobar la integridad","error");
        } 
        setLoading(false);
    }

    async function deletePackets(type) {
        setLoadingChange(true);

        try {
            const response = await axios.get(`/deleterecord?${type}&id=${dialogGrab.realId}`);
            if(response.data){
                if(type==1){
                    openSnack("La grabación ha sido borrada satisfactoriamente","success");
                }else{
                    openSnack("La grabación "+dialogGrab.id+" ha eliminado registros satisfactoriamente","success");
                }
            }else{
                openSnack("Error al intentar eliminar/limpiar la grabación "+dialogGrab.id,"error");
            }
        } catch(e) {
            console.log(e);
            openSnack("Error al comunicarse con la base de datos","error");
        } 
        setLoadingChange(false);
        setOpenDelete(false);
        setOpenIntegrity(false);
        update();
    }

    const [openDelete, setOpenDelete] = React.useState(false);
    const handleCloseDelete = () => {setOpenDelete(false);}
    const handleOpenNormalDelete = (g) => {
        setDialogGrab(g);
        setDeletionType(0);
        setOpenDelete(true);
    }
    const [deletionType, setDeletionType] = useState(0);

    const [openIntegrity, setOpenIntegrity] = React.useState(false);
    const handleCloseIntegrity = () => {setOpenIntegrity(false);}
    const [loadingChange, setLoadingChange] = React.useState(false);

    const [snackOpen, setSnackOpen] = React.useState(false);
    const [snackState, setSnackState] = useState("");
    const [snackMessage, setSnackMessage] = useState("");

    function openSnack(message, state){
        setSnackMessage(message);
        setSnackState(state);
        setSnackOpen(true);
    };

    const handleSnackClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackOpen(false);
    };

    return(
        <Grid container spacing={0} direction="column">
        {(error=="false" && !loading) ? (
        <Box display="flex" justifyContent="center" alignItems="center">
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minWidth:'12%' }}>
            <FormControl fullWidth variant="filled" sx={{m: 1}}>
                <InputLabel>Ordenar</InputLabel>
                <Select value={ordenar} onChange={handleChange}>
                    <MenuItem value={0}>ID</MenuItem>
                    <MenuItem value={1}>Canal</MenuItem>
                    <MenuItem value={2}>Duración</MenuItem>
                    <MenuItem value={3}>Antigüedad</MenuItem>
                    <MenuItem value={4}>Archivos</MenuItem>
                    <MenuItem value={5}>Tamaño</MenuItem>
                </Select>
            </FormControl>
        </Box>
        </Box>
        ) : ""}

        <TableContainer sx={{mt:2,overflowY: "hidden"}} component={Paper}>
            <Table sx={{backgroundColor: '#E9A272'}} size="small">
            <Box display="flex" justifyContent="center" alignItems="center">
                {(loading) ? (
                <CircularProgress sx={{my:1,color:'#ED7D31'}}/>
                ) : ""}

                {(error!="false" && !loading) ? (
                <Alert severity="error" sx={{mx:2, my:2}}>
                    <strong>{error}</strong>
                </Alert>
                ) : ""}

                {(error=="false" && !loading) ? (
                <div>
                <TableHead>
                <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell align="right"><b>Canal</b></TableCell>
                    <TableCell align="right"><b>Duración</b></TableCell>
                    <TableCell align="right"><b>Inicio&nbsp;(local)</b></TableCell>
                    <TableCell align="right"><b>Fin&nbsp;(local)</b></TableCell>
                    <TableCell align="right"><b>Archivos</b></TableCell>
                    <TableCell align="right"><b>Tamaño&nbsp;(MBs)</b></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {grabaciones.map((g) => (
                    <TableRow
                    key={g.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                    <TableCell component="th" scope="row" align="right"><b>{g.id}</b></TableCell>
                    <TableCell align="right">{g.canal}</TableCell>
                    <TableCell align="right">{secondsToDateLabel(g.fin-g.inicio)}</TableCell>
                    <TableCell align="right">{epochToDateLabel(g.inicio)}</TableCell>
                    <TableCell align="right">{epochToDateLabel(g.fin)}</TableCell>
                    <TableCell align="right">
                        <LightTooltip title="Comprobar integridad">
                            <IconButton onClick={() => checkIntegrity(g)} sx={{color:'black', borderRadius: 1, border:1, borderColor:'black'}} size="small">
                                {g.archivos}
                            </IconButton>
                        </LightTooltip>
                    </TableCell>
                    {(g.size>=0) ? (
                        <TableCell align="right">{g.size}</TableCell>
                    ) : (
                        <TableCell align="right"><b>Compruebe integridad</b></TableCell>
                    )}
                    <TableCell align="right">
                        <IconButton aria-label="delete" sx={{backgroundColor:'white'}} onClick={() => handleOpenNormalDelete(g)}>
                            <DeleteIcon sx={{color:'#FC1208'}}/>
                        </IconButton>
                    </TableCell>
                    <TableCell align="right">
                        <IconButton aria-label="delete" sx={{backgroundColor:'white'}} onClick={() => redirect(g.id)}>
                            <QueryStatsIcon sx={{color:'rgb(93, 193, 185)'}}/>
                        </IconButton>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
                </div>
                ) : ""}
            </Box>
            </Table>
        </TableContainer>

        {(openIntegrity) ? (
        <ThemeProvider theme={darkTheme}>
            <Dialog open={openIntegrity} onClose={handleCloseIntegrity} maxWidth='lg'>
                <DialogContent>
                    <Box sx={{borderRadius: 2, m:3}}>
                       <Alert severity="warning" sx={{ width: '100%' }}>
                            <AlertTitle>Grabación en el disco incompleta</AlertTitle>
                            {"Faltan "+integrityPackets+" archivo/s en el disco de los "+dialogGrab.archivos+" que debería tener la grabación "+dialogGrab.id}
                        </Alert>
                        <Typography sx={{fontSize:16, mt:2}}>
                            ¿Quiere eliminar los registros de los paquetes no existentes de la base de datos?
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                <Box sx={{position: 'relative' }}>
                    <Button onClick={() => deletePackets(0)} disabled={loadingChange} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ mr:1, color:"white", bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                        Eliminar
                    </Button>
                    {loadingChange && (
                    <CircularProgress size={24} sx={{color: "green", position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}} />
                    )}
                </Box>
                <Button sx={{color:'white', borderColor:'red'}} onClick={handleCloseIntegrity} disabled={loadingChange} startIcon={<CloseIcon sx={{color:'red'}} />} type="submit" variant="outlined">
                    Cancelar
                </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
        ) : ""}

        {(openDelete) ? (
        <ThemeProvider theme={darkTheme}>
            <Dialog open={openDelete} onClose={handleCloseDelete} maxWidth='lg'>
                <DialogContent>
                    <Box sx={{borderRadius: 2, m:3}}>
                       <Alert severity="error" sx={{ width: '100%' }}>
                            <AlertTitle>Aviso</AlertTitle>
                            {(deletionType==1) ? (
                                "Ningún archivo de esta grabación está en el disco (se recomienda borrarla)"
                            ) : (
                                "El borrado de la grabación conlleva eliminar su registro de la base de datos y todos los archivos de la misma que estén en el disco"
                            )}
                        </Alert>
                        <Typography sx={{fontSize:16, mt:2}}>
                            {(deletionType==1) ? (
                                "¿Quiere eliminar el registro de la grabación de la base de datos?"
                            ) : (
                                "¿Quiere proceder con el borrado completo de la grabación?"
                            )}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                <Box sx={{position: 'relative' }}>
                    <Button onClick={() => deletePackets(1)} disabled={loadingChange} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ mr:1, color:"white", bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                        Eliminar
                    </Button>
                    {loadingChange && (
                    <CircularProgress size={24} sx={{color: "green", position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}} />
                    )}
                </Box>
                <Button sx={{color:'white', borderColor:'red'}} onClick={handleCloseDelete} disabled={loadingChange} startIcon={<CloseIcon sx={{color:'red'}} />} type="submit" variant="outlined">
                    Cancelar
                </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
        ) : ""}

        <Snackbar open={snackOpen} autoHideDuration={5000} onClose={handleSnackClose}>
            <Alert onClose={handleSnackClose} severity={snackState} sx={{ width: '100%' }}>
                {snackMessage}
            </Alert>
        </Snackbar>
        </Grid>
    );
}
