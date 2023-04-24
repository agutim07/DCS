import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import IconButton from '@mui/material/IconButton';
import DoneIcon from '@mui/icons-material/Done';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

import RepCard from './sub/repcard'
import RepAdd from './sub/repadd'

import axios from "axios";
import {backend} from '../../variables/global'

export default function Configuracion(){

    const [details,setDetails] = useState([]);
    
    return(
        <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center">
            <Grid item xs={12}>
                <Button startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                    Aplicar cambios
                </Button>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, mr:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Typography component="h1" variant="h5">
                    Parámetros de grabación
                    </Typography>
                    <Divider sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Tiempo de creación de nuevo paquete
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: "#ED7D31" },},}} autoFocusmargin="dense" id="new_pack" label="Segundos" fullWidth value={details.newpack} onChange={e => setDetails({ ...details, newpack: e.target.value })}/>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Max. paquetes por grabación
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: "#ED7D31" },},}} autoFocusmargin="dense" id="maxpacks" label="Paquetes" fullWidth value={details.maxpacks} onChange={e => setDetails({ ...details, maxpacks: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, ml:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Grid container spacing={0} direction="row" alignItems="center" justifyContent="center">
                        <Typography component="h1" variant="h5">
                        Parámetros de borrado automático
                        </Typography>
                        <Tooltip title="Si las capturas alcanzan el tamaño máximo, el mecanismo elimina las más antiguas hasta estar por debajo del límite">
                            <IconButton>
                                <InfoIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Divider  sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Cada cuánto se comprueba el espacio
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: "#ED7D31" },},}} autoFocusmargin="dense" id="checktime" label="Segundos" fullWidth value={details.checktime} onChange={e => setDetails({ ...details, checktime: e.target.value })}/>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Tamaño máximo de capturas
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: "#ED7D31" },},}} autoFocusmargin="dense" id="maxMBs" label="MBs" fullWidth value={details.maxMBs} onChange={e => setDetails({ ...details, maxMBs: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, ml:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Typography component="h1" variant="h5">
                    Parámetros de reproducción
                    </Typography>
                    <Divider  sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Interfaz de red para reinyectar
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: "#ED7D31" },},}} autoFocusmargin="dense" id="checktime" label="Segundos" fullWidth value={details.checktime} onChange={e => setDetails({ ...details, checktime: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={6}>
                <Box sx={{borderRadius: 2, mt:3, ml:1, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                    <Typography component="h1" variant="h5">
                    Parámetros de seguridad
                    </Typography>
                    <Divider  sx={{my:1,bgcolor:'black'}}/>
                    <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
                        <Grid item xs={8}>
                            <Typography sx={{fontSize:12}}>
                            Clave de inicio de sesión
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField type="number" size="small" sx={{"& .MuiOutlinedInput-root": {"& > fieldset": { borderColor: "#ED7D31" },},}} autoFocusmargin="dense" id="checktime" label="Segundos" fullWidth value={details.checktime} onChange={e => setDetails({ ...details, checktime: e.target.value })}/>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </Grid>
    );
}