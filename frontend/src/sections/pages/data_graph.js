import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MuiToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';

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
import PropTypes from 'prop-types';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";
import { useLocation , useNavigate } from 'react-router-dom'

import axios from "axios";
import ReactECharts from 'echarts-for-react';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SmallChip = styled(Chip)(({ theme }) => ({
    borderColor: 'black',
    "& .MuiChip-icon": {
      color: 'black'
    },
    "& .MuiChip-iconSmall": {
        color: 'black'
    },
    '& .MuiChip-label': {
        fontSize:10
    },
}));

const ToggleButton = styled(MuiToggleButton)({
    color: "black",
    "&.Mui-selected, &.Mui-selected:hover": {
      color: "black",
      backgroundColor: '#ED7D31'
    }
});

function CircularProgressWithLabel(props) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" {...props} />
        <Box
          sx={{
            top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Typography component="div" sx={{color:'#ED7D31'}}>
            {`${Math.round(props.value)}%`}
          </Typography>
        </Box>
      </Box>
    );
}

CircularProgressWithLabel.propTypes = {
    value: PropTypes.number.isRequired,
};  

export default function DataGraph({selected}){
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = React.useState(0);
    const [error,setError] = useState("false");
    
    const [data, setData] = useState({});
    const [dataP, setDataP] = useState({});
    const [grabs, setGrabs] = useState([]);
    const [errorGrabs, setErrorGrabs] = useState([]);

    const [grabaciones, setGrabaciones] = useState([]);

    useEffect(() => {
        async function checkInstallations() {
            setLoading(true);
            try {
                const response = await axios.get(`/checkinstall?2`);
                if(response.data!="OK"){
                    setError(response.data);
                    setLoading(false);
                    return;
                }

                setProgress(10);
                getData();
            } catch(e) {
                setError("No se ha podido conectar con el backend");
                console.log(e);
                setLoading(false);
            } 
        }

        async function getData() {
            try {
                const response = await axios.get(`/recordinfo?0`);
                if(response.data=="empty"){
                    setError("No se ha encontrado ninguna grabación");
                    setLoading(false);
                    return;
                }else{
                    let dataArray = response.data;
                    const dataArray1 = [];
                    const g = [];
                    const errorG = [];
    
                    let i=0;
                    while(i<dataArray.length) {
                        let iter = {id:dataArray[i], ch:dataArray[i+1], npacks:dataArray[i+2], datarate:dataArray[i+3], packrate:dataArray[i+4], packsize:dataArray[i+5]};
                        if(!g.includes(iter.id)){g.push(iter.id)};
                        if(iter.npacks==-1){errorG.push(iter.id);}

                        i = i+6;
                        dataArray1.push(iter);
                    }
    
                    setData(dataArray1);
                    setGrabs(g.sort(function(a, b){return a-b}));
                    setErrorGrabs(errorG);

                    setProgress(50);
                    getDataPackets();
                }
            } catch(e) {
                setError("Error al intentar recuperar los datos de las grabaciones");
                console.log(e);
                setLoading(false);
            } 
        }

        async function getDataPackets() {
            try {
                const response = await axios.get(`/recordinfo?1`);
                if(response.data=="empty"){
                    setError("No se ha encontrado ninguna grabación");
                    setLoading(false);
                    return;
                }else{
                    var res = response.data.replace("[", "");
                    res = res.replace("]", "");
                    const dataArray = res.split(", ");
                    const dataArray1 = [];
    
                    let i=1;
                    while(i<dataArray.length) {
                        let iterID = dataArray[i];
                        i++;
                        if(dataArray[i]=="ERROR"){
                            i+=2;
                        }else{
                            let map = new Map();
                            while(dataArray[i]!='?'){
                                map.set(dataArray[i],parseInt(dataArray[i+1]));
                                i+=2;
                            }
                            i++;
                            let iter = {id:iterID, packs:map};
                            dataArray1.push(iter);
                        }
                    }
    
                    setDataP(dataArray1);

                    setProgress(80);
                    getGrabaciones();
                }
            } catch(e) {
                setError("Error al intentar recuperar los datos de las grabaciones");
                console.log(e);
                setLoading(false);
            } 
            
        }

        async function getGrabaciones(){
            try {
                const response = await axios.get(`/data`);
                if(response.data=="empty"){
                    setError("No hay ninguna grabación existente");
                }else{
                    setProgress(90);
                    const canales = await getChannels();
                    const arrayChannels = response.data;
                    const arrayGrabaciones = [];
                    
                    let i=0, idNum=0;
                    while(i<arrayChannels.length) {
                        idNum++;

                        let canal = "";
                        for(let x=0; x<canales.length; x++){
                            if(canales[x].id==arrayChannels[i+1]){canal=canales[x].syntax;}
                        }

                        let temp = {id:idNum, realId:arrayChannels[i], canal:canal, inicio:arrayChannels[i+2], fin:arrayChannels[i+3], archivos:arrayChannels[i+4], size:arrayChannels[i+5]};
                        i = i+6;
                        arrayGrabaciones.push(temp);
                    };

                    setGrabaciones(arrayGrabaciones);
                }
            } catch(e) {
                setError("Error al conectar con la base de datos");
                console.log(e);
            } 
            setLoading(false);
        }

        async function getChannels() {
            try {
                const response = await axios.get(`/getFullCanales`);
                var channels = response.data.replace("[", "");
                channels = channels.replace("]", "");
                const arrayChannels = channels.split(", ");
                const arrayChannels1 = [];
                
                let i=0;
                while(i<arrayChannels.length) {
                    let temp = {id:parseInt(arrayChannels[i]), syntax:arrayChannels[i+1], on:parseInt(arrayChannels[i+2])};
                    i = i+3;
                    arrayChannels1.push(temp);
                }

                return arrayChannels1;
            } catch(e) {
                return null;
                console.log(e);
            } 
        }

        checkInstallations();
    }, []);

    const [grab, setGrab] = React.useState(selected);

    const handleAlignment = (event, newAlignment) => {
        setGrab(newAlignment);
    };

    function getOption(op){
        let xData = [];
        let yData = [];
        let archivo = 1;

        let label1 = "";
        let label2 = "";

        for(let i=0; i<data.length; i++){
            if(data[i].id==grab){
                xData.push(archivo);
                archivo++;
                
                if(op==0){
                    yData.push(data[i].npacks);
                    label1 = "Paquetes (por archivo de grabación)";
                    label2 = "Número de paquetes";
                }

                if(op==1){
                    yData.push(data[i].datarate);
                    label1 = "Tasa de datos (por archivo de grabación)";
                    label2 = "Bytes por segundo";
                }

                if(op==2){
                    yData.push(data[i].packrate);
                    label1 = "Media de paquetes por segundo (por archivo de grabación)";
                    label2 = "Paquetes por segundo";
                }

                if(op==3){
                    yData.push(data[i].packsize);
                    label1 = "Media de tamaño de paquete (por archivo de grabación)";
                    label2 = "Bytes";
                }

            }
        }

        let option = {
            textStyle: {
                fontFamily: 'Copperplate Gothic Light'
            },
            title: {
                text: label1,
                left: 'center',
                top: 20,
            },
            color: 'rgb(237, 125, 49)',
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: xData,
                boundaryGap: false,
                axisLabel: {
                    color: 'black'
                },
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: 'black'
                },
            },
            series: [{
                name: label2,
                data: yData,
                type: 'line',
                smooth: true,
                lineStyle: {color: 'rgb(237, 125, 49)'},
                areaStyle: {color: 'rgb(93, 193, 185)'}
            }]
        };

        return option;
    }

    function getOptionPacks(){
        let dataY = [];
        let dataX = []

        for(let i=0; i<dataP.length; i++){
            if(dataP[i].id==grab){
                for (var [key, value] of dataP[i].packs) {
                    dataX.push(key);
                    dataY.push(value);
                }
            }
        }

        let option = {
            textStyle: {
                fontFamily: 'Copperplate Gothic Light'
            },
            title: {
                text: 'Tipos de paquetes',
                left: 'center',
                top: 20,
            },
            tooltip: {
                trigger: 'item'
            },
            xAxis: {
              data: dataX,
              axisLabel: {
                inside: true,
                color: 'black'
              },
              axisTick: {
                show: false
              },
              axisLine: {
                show: false
              },
              z: 10
            },
            yAxis: {
              axisLine: {
                show: false
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                color: 'black'
              }
            },
            series: [
              {
                name: 'Número de paquetes con el protocolo',
                type: 'bar',
                showBackground: true,
                itemStyle: {
                    color : {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: 
                            [{offset: 0, color: '#EE6C15' }, 
                            {offset: 0.5, color: '#EE9052'}, 
                            {offset: 1, color: '#EEA677'}],
                        global: false 
                    }
                },
                emphasis: {
                    itemStyle: {
                        color : {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: 
                                [{offset: 0, color: '#EEA677' }, 
                                {offset: 0.7, color: '#EE9052'}, 
                                {offset: 1, color: '#EE6C15'}],
                            global: false 
                        }
                    }
                },
                data: dataY
              }
            ]
          };

        return option;
    }

    function getGrabOneFile(){
        let archivo = 0;

        for(let i=0; i<data.length; i++){
            if(data[i].id==grab){
                archivo++;
            }
        }

        if(archivo==1){return true;}
        return false;
    }

    function epochToDate(epoch){
        var d = new Date(0);
        d.setUTCSeconds(epoch);
        return d;
    }

    function epochToDateLabel(epoch){
        var d = epochToDate(epoch);
        var seconds = d.getSeconds();
        var seconds = d.getSeconds(), minutes = d.getMinutes(), hours = d.getHours();
        if(seconds<10){seconds="0"+seconds;} 
        if(minutes<10){minutes="0"+minutes;}
        if(hours<10){hours="0"+hours;}

        var out = d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()+" "+hours+":"+minutes+":"+seconds;
        return out;
    }

    function secondsToDateLabel(seconds){
        var inicio = 0;

        if(seconds>=3600){
            inicio = 11;
        }else if(seconds>=60){
            inicio = 14;
        }else{
            inicio = 16;
        }

        var out = new Date(seconds * 1000).toISOString().substring(inicio, 19);
        return out;
    }

    return(
        <Grid container spacing={0} direction="column">
        <Box sx={{textAlign: 'center'}}>
            {(loading) ? (
                <Grid container direction="column" alignItems="center" justifyContent="center">
                    <Alert severity="info" sx={{mb:2}}>
                        <AlertTitle>Aviso</AlertTitle>
                        <strong>Este proceso puede tardar un rato si hay muchas grabaciones</strong>
                    </Alert>
                    <CircularProgressWithLabel value={progress} style={{'color': '#ED7D31'}} />
                </Grid>
            ) : (
                (error=="false") ? (
                    <div>
                    <Typography sx={{fontSize:14,mb:1}}>Selecciona un ID de una grabación para visualizar gráficos con estadísticas</Typography>
                    <ToggleButtonGroup value={grab} exclusive onChange={handleAlignment}  sx={{mb:1}}>
                        {grabs.map((g) => (
                            <ToggleButton value={g}>
                                {g}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    {(grabs.includes(grab) && !errorGrabs.includes(grab)) ? (
                        <div>
                        {(getGrabOneFile()) ? (
                            <Box display="flex" justifyContent="center" alignItems="center" sx={{mt:1}}>
                                <Alert severity="warning">
                                <strong>Esta grabación solo tiene un archivo. Los gráficos no están recomendados para este tipo de grabaciones.</strong>
                                </Alert>
                            </Box>
                        ) : ""}

                        <TableContainer sx={{mt:2,overflowY: "hidden"}} component={Paper}>
                            <Table sx={{backgroundColor: '#E9A272'}} size="small">
                                <TableHead>
                                <TableRow>
                                    <TableCell><b>ID</b></TableCell>
                                    <TableCell align="right"><b>Canal</b></TableCell>
                                    <TableCell align="right"><b>Duración</b></TableCell>
                                    <TableCell align="right"><b>Inicio&nbsp;(local)</b></TableCell>
                                    <TableCell align="right"><b>Fin&nbsp;(local)</b></TableCell>
                                    <TableCell align="right"><b>Archivos</b></TableCell>
                                    <TableCell align="right"><b>Tamaño&nbsp;(MBs)</b></TableCell>
                                </TableRow>
                                </TableHead>
                                <TableBody>
                                {grabaciones.map((g) => {
                                    if(g.id==grab)
                                    return <TableRow
                                                key={g.id}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                <TableCell component="th" scope="row" align="right"><b>{g.id}</b></TableCell>
                                                <TableCell align="right"><SmallChip size="small" label={g.canal} style={{backgroundColor:'white'}} variant="outlined" /></TableCell>
                                                <TableCell align="right">{secondsToDateLabel(g.fin-g.inicio)}</TableCell>
                                                <TableCell align="right">{epochToDateLabel(g.inicio)}</TableCell>
                                                <TableCell align="right">{epochToDateLabel(g.fin)}</TableCell>
                                                <TableCell align="right">{g.archivos}</TableCell>
                                                <TableCell align="right">{g.size}</TableCell>
                                            </TableRow>
                                })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <ReactECharts option={getOption(0)}/>
                        <ReactECharts option={getOptionPacks()}/>
                        <ReactECharts option={getOption(2)}/>
                        <ReactECharts option={getOption(1)}/>
                        <ReactECharts option={getOption(3)}/>
                        </div>
                    ) : ""}
                    {(grabs.includes(grab) && errorGrabs.includes(grab)) ? (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{mt:1}}>
                            <Alert severity="warning">
                            <AlertTitle>Aviso</AlertTitle>
                            <strong>Se han encontrado errores en la integridad de esta grabación. Compruebe dicha integridad en la sección de datos/grabaciones</strong>
                            </Alert>
                        </Box>
                    ) : ""}
                    </div>
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
        </Grid>
    );
}
