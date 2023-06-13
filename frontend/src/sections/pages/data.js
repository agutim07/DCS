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

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import TocIcon from '@mui/icons-material/Toc';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DataUsageIcon from '@mui/icons-material/DataUsage';

import {styled} from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";
import { useLocation , useNavigate } from 'react-router-dom'

import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";

import axios from "axios";
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
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
        if(index==0){navigate('/datos/grabaciones');}
        if(index==1){navigate('/datos/graficos');}
        if(index==2){navigate('/datos/rendimiento');}
    };

    useEffect(() => {
        if(selectedIndex==0){navigate('/datos/grabaciones');}
        if(selectedIndex==1){navigate('/datos/graficos');}
        if(selectedIndex==2){navigate('/datos/rendimiento');}
    }, []);

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
                    <Route path="/grabaciones" element={<DataGrab/>} />
                    <Route path="/graficos" element={<DataGraph/>} />
                    <Route path="/rendimiento" element={<DataStatus/>} />
                </Routes>
            </Grid>
        </Grid>
        </Box>
        </Grid>
    );
}
