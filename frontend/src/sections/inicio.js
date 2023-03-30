import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useNavigate} from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';

import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
  } from "react-router-dom";
import Header from '../components/header';

const theme = createTheme({
  typography: {
    fontFamily: 'Copperplate Gothic Light',
    fontSize: 11
  },
});

function Inicio({updateApp}) {

    return (
      <ThemeProvider theme={theme}>
      <Box sx={{ mx: "7.5%"}}>
        <Header logout={updateApp}/>
        <Typography component="h1" variant="h5">
        Si
        </Typography>
      </Box>
      </ThemeProvider>
    );
    }

    export default Inicio;
