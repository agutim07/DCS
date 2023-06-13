import React, {useEffect} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {useNavigate} from 'react-router-dom';

import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";

import Configuracion from './param_config';
import Canales from './param_canales';

export default function Parametros(){

    const navigate = useNavigate();
    const [op, setOp] = React.useState('Configuración');

    const handleChangeOp = (event, newAlignment) => {
        if (newAlignment !== null) {
            setOp(newAlignment);
            if(newAlignment=='Configuración'){navigate('/parametros/config');}
            if(newAlignment=='Canales'){navigate('/parametros/canales');}
        }
    };

    useEffect(() => {
        if(op=='Configuración'){navigate('/parametros/config');}
        if(op=='Canales'){navigate('/parametros/canales')}
    }, []);

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
            <Typography component="h1" variant="h4">
            Parámetros
            </Typography>
            <ToggleButtonGroup sx={{mt:2, border: '1px solid'}} color='warning' value={op} exclusive onChange={handleChangeOp}>
                <ToggleButton sx={{color:"#ED7D31"}} value="Configuración">Configuración</ToggleButton>
                <ToggleButton sx={{color:"#ED7D31"}} value="Canales">Canales</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ width: '90%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid'}}>
                <Routes>
                    <Route path="/config" element={<Configuracion/>} />
                    <Route path="/canales" element={<Canales/>} />
                </Routes>
            </Box>
        </Grid>
    );
}