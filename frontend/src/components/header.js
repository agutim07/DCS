import Grid from '@mui/material/Grid'
import Toolbar from '@mui/material/Toolbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const Header = () => {

    return (
        <div>
            <Toolbar sx={{borderBottom: `1px solid black`}}>
                <Grid my={1.5} container alignItems="center">
                    <Grid item xs={2} align="left">
                        <IconButton disableElevation disableRipple size="small" sx={{ ml: 1, "&.MuiButtonBase-root:hover": {bgcolor: "transparent"}}}>
                            <Box component="img" sx={{ height: 120, width: 120*1.42}}
                            alt="DCS" src="/images/DCS_logo.jpg" />
                        </IconButton>
                    </Grid>
                    <Grid item xs={8}>
                        <Grid container direction="row" alignItems="center" textAlign="center">
                        <Stack spacing={2} direction="row" alignItems="center" textAlign="center">
                            <Button variant="outlined">Inicio</Button>
                            <Button variant="outlined">Grabaciones</Button>
                            <Button variant="outlined">Reproducciones</Button>
                            <Button variant="outlined">Datos</Button>
                            <Button variant="outlined">Parámetros</Button>
                        </Stack>
                        </Grid>
                    </Grid>
                </Grid>
            </Toolbar>
        </div>
    );
}

export default Header;