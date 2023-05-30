import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';

import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
  } from "react-router-dom";

import Header from '../components/header';
import Home from './pages/home';
import Rep from './pages/rep';
import Parametros from './pages/parametros';
import Grab from './pages/grab';
import Data from './pages/data';

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
        <Routes>
          <Route path='/' element={<Navigate to='/inicio' />} />
          <Route path="/inicio" exact element={<Home/>} />
          <Route path="/grabaciones" element={<Grab/>} />
          <Route path="/reproducciones" element={<Rep/>} />
          <Route path="/parametros/*" element={<Parametros/>} />
          <Route path="/datos" element={<Data/>} />
          <Route path="/*" element={<p>No hay nada aquí: 404!</p>} />
        </Routes>
      </Box>
      </ThemeProvider>
    );
    }

    export default Inicio;
