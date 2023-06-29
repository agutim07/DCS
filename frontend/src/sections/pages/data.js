import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TocIcon from '@mui/icons-material/Toc';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DataUsageIcon from '@mui/icons-material/DataUsage';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import {useNavigate,useLocation} from 'react-router-dom'

import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";

import DataGrab from './data_grab';
import DataGraph from './data_graph';
import DataStatus from './data_status';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const darkTheme = createTheme({
    typography: {
        fontFamily: 'Copperplate Gothic Light',
    },
    palette: {
        mode: 'dark',
    },
});

export default function Data(){
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedIndex, setSelectedIndex] = React.useState(getIndex());
    const [selected, setSelected] = useState(0);

    function getIndex(){
        if(location.pathname=='/datos/grabaciones'){return 0;}
        if(location.pathname=='/datos/graficos'){return 1;}
        if(location.pathname=='/datos/rendimiento'){return 2;}

        return 0;
    }

    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
        if(index==0){navigate('/datos/grabaciones');}
        if(index==1){setSelected(0); navigate('/datos/graficos');}
        if(index==2){navigate('/datos/rendimiento');}
    };

    useEffect(() => {
        if(selectedIndex==0){navigate('/datos/grabaciones');}
        if(selectedIndex==1){setSelected(0); navigate('/datos/graficos');}
        if(selectedIndex==2){navigate('/datos/rendimiento');}
    }, []);

    function redirect(value){
        setSelected(value);
        setSelectedIndex(1);
        navigate('/datos/graficos');
    }

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
        <Typography component="h1" variant="h4">
            Datos
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: '100%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
        <Grid container spacing={0} direction="row">
            <Grid item xs={3}>
                <ThemeProvider theme={darkTheme}>
                <Paper elevation={3} sx={{ width: '80%', height: '100%'}}>
                <List component="nav" aria-label="grabaciones">
                    <ListItemButton
                    selected={selectedIndex === 0}
                    onClick={(event) => handleListItemClick(event, 0)}
                    >
                    <ListItemIcon>
                        <TocIcon />
                    </ListItemIcon>
                    <ListItemText primary="Grabaciones" />
                    </ListItemButton>
                </List>
                <Divider />
                <List component="nav" aria-label="graficos">
                    <ListItemButton
                    selected={selectedIndex === 1}
                    onClick={(event) => handleListItemClick(event, 1)}
                    >
                    <ListItemIcon>
                        <ShowChartIcon />
                    </ListItemIcon>
                    <ListItemText primary="Gráficos" />
                    </ListItemButton>
                </List>
                <Divider />
                <List component="nav" aria-label="rendimiento">
                    <ListItemButton
                    selected={selectedIndex === 2}
                    onClick={(event) => handleListItemClick(event, 2)}
                    >
                    <ListItemIcon>
                        <DataUsageIcon />
                    </ListItemIcon>
                    <ListItemText primary="Rendimiento" />
                    </ListItemButton>
                </List>
                </Paper>
                </ThemeProvider>
            </Grid>
            <Grid item xs={9}>
                <Routes>
                    <Route path="/grabaciones" element={<DataGrab redirect={redirect}/>} />
                    <Route path="/graficos" element={<DataGraph selected={selected}/>} />
                    <Route path="/rendimiento" element={<DataStatus/>} />
                </Routes>
            </Grid>
        </Grid>
        </Box>
        </Grid>
    );
}
