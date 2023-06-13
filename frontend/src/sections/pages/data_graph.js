import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

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

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function DataGraph(){
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState("false");

    useEffect(() => {
        update();
    }, []);

    async function update(){
        setLoading(true);
        setLoading(false);
    }

    return(
        <Grid container spacing={0} direction="column">
        {(error=="false" && !loading) ? (
        <Typography>Graph</Typography>
        ) : ""}
        </Grid>
    );
}
