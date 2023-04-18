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

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

import RepCard from './sub/repcard'
import RepAdd from './sub/repadd'

import axios from "axios";
import {backend} from '../../variables/global'

export default function Configuracion(){
    return(
            <Typography component="h1" variant="h4">
            Configuración
            </Typography>
    );
}