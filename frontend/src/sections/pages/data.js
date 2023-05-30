import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
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

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import IconButton from '@mui/material/IconButton';
import TimerIcon from '@mui/icons-material/Timer';
import VideocamIcon from '@mui/icons-material/Videocam';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/Key';
import CloseIcon from '@mui/icons-material/Close';
import HubIcon from '@mui/icons-material/Hub';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {styled} from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";
import { useLocation , useNavigate } from 'react-router-dom'

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Data(){
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
                setError("No hay ninguna grabación disponible en este canal");
            }else{
                const arrayChannels = response.data;
                const arrayGrabaciones = [];
                
                let i=0, idNum=0;
                while(i<arrayChannels.length) {
                    idNum++;
                    let temp = {id:idNum, canal:arrayChannels[i], inicio:arrayChannels[i+1], fin:arrayChannels[i+2], paquetes:arrayChannels[i+3], size:arrayChannels[i+4]};
                    i = i+5;
                    arrayGrabaciones.push(temp);
                };

                arrayGrabaciones.sort(compareCanal);
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

    const [ordenar, setOrdenar] = React.useState(1);

    const handleChange = (event) => {
        setOrdenar(event.target.value);
        switch(event.target.value){
            case 1: setGrabaciones(grabaciones.sort(compareCanal)); break;
            case 2: setGrabaciones(grabaciones.sort(compareDuracion)); break;
            case 3: setGrabaciones(grabaciones.sort(compareAnt)); break;
            case 4: setGrabaciones(grabaciones.sort(comparePaquetes)); break;
            case 5: setGrabaciones(grabaciones.sort(compareTam)); break;
            default: break;
        }
    };

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

    function comparePaquetes(a,b) {
        if ( a.paquetes < b.paquetes ){return 1;}
        if ( a.paquetes > b.paquetes ){return -1;}
        return 0;
    }

    function compareTam(a,b) {
        if ( a.size < b.size ){return 1;}
        if ( a.size > b.size ){return -1;}
        return 0;
    }


    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
        <Typography component="h1" variant="h4">
            Grabaciones en la base de datos
        </Typography>

        <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: '90%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
            <Grid container spacing={0} direction="column">
            {(error=="false" && !loading) ? (
            <Box display="flex" justifyContent="center" alignItems="center">
                <FormControl variant="filled" sx={{m: 1}}>
                    <InputLabel>Ordenar</InputLabel>
                    <Select value={ordenar} onChange={handleChange}>
                        <MenuItem value={1}>Canal</MenuItem>
                        <MenuItem value={2}>Duración</MenuItem>
                        <MenuItem value={3}>Antigüedad</MenuItem>
                        <MenuItem value={4}>Paquetes</MenuItem>
                        <MenuItem value={5}>Tamaño</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            ) : ""}
            <TableContainer sx={{mt:2,overflowY: "hidden"}} component={Paper}>
                <Table sx={{backgroundColor: '#E9A272'}} size="small">
                    {(loading) ? (
                    <CircularProgress sx={{my:1,color:'#ED7D31'}}/>
                    ) : ""}

                    {(error!="false" && !loading) ? (
                    <Alert severity="error" sx={{mx:2}}>
                        <strong>{error}</strong>
                    </Alert>
                    ) : ""}

                    {(error=="false" && !loading) ? (
                    <div>
                    <TableHead>
                    <TableRow>
                        <TableCell><b>Canal</b></TableCell>
                        <TableCell align="right"><b>Duración</b></TableCell>
                        <TableCell align="right"><b>Inicio&nbsp;(epoch)</b></TableCell>
                        <TableCell align="right"><b>Inicio&nbsp;(local)</b></TableCell>
                        <TableCell align="right"><b>Fin&nbsp;(epoch)</b></TableCell>
                        <TableCell align="right"><b>Fin&nbsp;(local)</b></TableCell>
                        <TableCell align="right"><b>Paquetes</b></TableCell>
                        <TableCell align="right"><b>Tamaño&nbsp;(MBs)</b></TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {grabaciones.map((g) => (
                        <TableRow
                        key={g.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                        <TableCell component="th" scope="row" align="right"><b>{g.canal}</b></TableCell>
                        <TableCell align="right">{secondsToDateLabel(g.fin-g.inicio)}</TableCell>
                        <TableCell align="right">{g.inicio}</TableCell>
                        <TableCell align="right">{epochToDateLabel(g.inicio)}</TableCell>
                        <TableCell align="right">{g.fin}</TableCell>
                        <TableCell align="right">{epochToDateLabel(g.fin)}</TableCell>
                        <TableCell align="right">{g.paquetes}</TableCell>
                        <TableCell align="right">{g.size}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                    </div>
                    ) : ""}
                </Table>
            </TableContainer>
            </Grid>
        </Box>
        </Grid>
    );
}
