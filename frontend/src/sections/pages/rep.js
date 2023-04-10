import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Slider from '@mui/material/Slider';
import {styled} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import RefreshIcon from '@mui/icons-material/Refresh';

import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import RepCard from './sub/repcard'

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Rep(){
    const rep = {id:1, canal:3, start:1680972630, end:1680972900, position:120, speed:1};
    const rep2 = {id:2, canal:5, start:1680972000, end:1680972300, position:200, speed:1};
    const canal = {id:1, syntax:"udp"}; const canal2 = {id:2, syntax:"tcp -i enp0s8"};

    const [reps, setReps] = useState([]);
    const [canales, setCanales] = useState([]);

    useEffect(() => {
        const temp = []; const temp2 = [];
        temp.push(rep); temp2.push(canal);
        temp.push(rep2); temp2.push(canal2);
        setReps(temp); setCanales(temp2);
    }, []);

    // const installations = 0;

    // useEffect(async () => {
    //     try {
    //         await axios.get(`${backend}/logout`);
    //         handleClose();
    //         localStorage.removeItem('token');
    //         logout();
    //     } catch(e) {
    //         setType("error");
    //     } 
    // }, []);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("false");

    const [details, setDetails] = useState({canal:0, inicio:0, fin:0});

    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    return(
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
            <Typography component="h1" variant="h4">
            Reproducciones
            </Typography>
            <IconButton>
                <RefreshIcon sx={{color:'#ED7D31'}} fontSize="large"/>
            </IconButton>
            <Box sx={{ width: '90%', borderRadius: 2, mt:3, p:2, textAlign: 'center', border: '1px solid', bgcolor: 'grey.100', color: 'grey.800', borderColor: 'grey.300' }}>
                {(loading) ? (
                    <CircularProgress sx={{color:'#ED7D31'}}/>
                ) : (
                    (error=="false") ? (
                        <Grid container direction="column" spacing={2}>
                        {reps.map((r) => (
                            <Grid item sx={{borderBottom: `1px solid grey`}}> 
                                <RepCard r={r} />
                            </Grid>
                        ))}
                            <Grid item>
                                <Button onClick={handleClickOpen} startIcon={<AddIcon />} type="submit" variant="contained" sx={{ color:'black', width:'70%', bgcolor:"#31E3E9", '&:hover': {backgroundColor: '#9FECEF', }}}>
                                    Añadir reproducción
                                </Button>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center">
                            <Alert severity="error">
                            <AlertTitle>Error</AlertTitle>
                            <strong>{error}</strong>
                            </Alert>
                        </Box>
                    )
                )}
            </Box>

            <Box sx={{position: "absolute", bottom: 20, right: 20}} >
                <Dialog fullWidth="300px" sx={{width:"200"}} open={open} onClose={handleClose}>
                    <DialogTitle id="form-dialog-title">Añadir reproducción</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth>
                        <br></br>
                        <TextField select label="Canal" defaultValue="1" helperText="Selecciona un canal">
                        {canales.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                            {option.id+" - "+option.syntax}
                            </MenuItem>
                        ))}
                        </TextField>
                        <br></br>
                        <TextField type="number" autoFocusmargin="dense" id="inicio" label="Inicio en tiempo epoch" fullWidth onChange={e => setDetails({ ...details, inicio: e.target.value })}/>
                        <br></br>
                        <TextField type="number" autoFocusmargin="dense" id="inicio" label="Final en tiempo epoch" fullWidth onChange={e => setDetails({ ...details, fin: e.target.value })}/>
                        <br></br>
                        </FormControl>
                        <br></br>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} startIcon={<DoneIcon />} type="submit" variant="contained" sx={{ bgcolor:"green", '&:hover': {backgroundColor: 'darkgreen', }}}>
                            Iniciar
                        </Button>
                        <IconButton onClick={handleClose}>
                            <CloseIcon sx={{color:'red'}}/>
                        </IconButton>
                    </DialogActions>
                </Dialog>
            </Box>
        </Grid>
    );
}