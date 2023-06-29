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
import ReactECharts from 'echarts-for-react';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ToggleButton = styled(MuiToggleButton)({
    color: "black",
    "&.Mui-selected, &.Mui-selected:hover": {
      color: "black",
      backgroundColor: '#ED7D31'
    }
});

export default function DataGraph({selected}){
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState("false");
    
    const [data, setData] = useState({});
    const [grabs, setGrabs] = useState([]);
    const [errorGrabs, setErrorGrabs] = useState([]);

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
                }
            } catch(e) {
                setError("Error al intentar recuperar los datos de las grabaciones");
                console.log(e);
            } 
            setLoading(false);
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
                text: label1
            },
            color: 'rgb(237, 125, 49)',
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: xData,
                boundaryGap: false,
            },
            yAxis: {
                type: 'value'
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

    return(
        <Grid container spacing={0} direction="column">
        <Box sx={{textAlign: 'center'}}>
            {(loading) ? (
                <Grid container direction="column" alignItems="center" justifyContent="center">
                    <Alert severity="info">
                        <AlertTitle>Aviso</AlertTitle>
                        <strong>Este proceso puede durar un rato si hay muchas grabaciones</strong>
                    </Alert>
                    <CircularProgress sx={{color:'#ED7D31', mt:2}}/>
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
                        
                        <ReactECharts option={getOption(0)}/>
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
