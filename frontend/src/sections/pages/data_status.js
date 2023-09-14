import React, {useEffect, useState} from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
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
import IconButton from '@mui/material/IconButton';
import SyncIcon from '@mui/icons-material/Sync';

import {styled} from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from "@mui/material";
import ReactECharts from 'echarts-for-react';

import axios from "axios";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function DataStatus(){
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState("false");
    const [status,setStatus] = useState({});

    useEffect(() => {
        update();
    }, []);

    async function update(){
        setLoading(true);
        try {
            const response = await axios.get(`/systemstatus`);
            let dataArray = response.data;

            let iter = {cpu:dataArray[0], memory:dataArray[1], space:dataArray[2], captures:dataArray[3], maxMBs:dataArray[4]};
            setStatus(iter);
        } catch(e) {
            setError("Error al intentar recuperar el estado del sistema");
            console.log(e);
        } 
        setLoading(false);
    }

    function getData(val,str){
        const gaugeData = [
            {
              value: val,
              name: str,
              title: {
                color: 'white',
                offsetCenter: ['0%', '-25%']
              },
              detail: {
                valueAnimation: true,
                offsetCenter: ['0%', '0%']
              }
            },
        ];

        return gaugeData;
    }

    function getOption(op){
        let statusValue;
        let col;
        
        if(op==0){statusValue=getData(Math.round(status.cpu*100),"Uso de CPU"); col='#D10000';}
        if(op==1){statusValue=getData(Math.round(status.memory*100),"Uso de memoria"); col='#C6B79B';}

        let option = {
            textStyle: {
                fontFamily: 'Copperplate Gothic Light'
            },
            series: [
              {
                type: 'gauge',
                startAngle: 90,
                endAngle: -270,
                pointer: {
                  show: false
                },
                progress: {
                  show: true,
                  overlap: false,
                  roundCap: true,
                  clip: false,
                  itemStyle: {
                    color: col,
                    borderWidth: 1,
                    borderColor: '#464646'
                  }
                },
                axisLine: {
                  lineStyle: {
                    width: 20
                  }
                },
                splitLine: {
                  show: false,
                  distance: 0,
                  length: 10
                },
                axisTick: {
                  show: false
                },
                axisLabel: {
                  show: false,
                  distance: 50
                },
                data: statusValue,
                title: {
                  fontSize: 12
                },
                detail: {
                  width: 50,
                  height: 14,
                  fontSize: 14,
                  color: col,
                  borderColor: col,
                  borderRadius: 20,
                  borderWidth: 1,
                  formatter: '{value}%'
                }
              }
            ]
          };

          return option;
    }

    function getOptionSpace(){
      const fullSpace =  Math.round(status.space);
      const caps =  Math.round(status.captures);
      const autom =  Math.round(status.maxMBs);

      const gaugeData = [
        {
          value: caps,
          name: 'Capturas',
          title: {
            color: 'white',
            offsetCenter: ['0%', '-65%']
          },
          detail: {
            valueAnimation: true,
            offsetCenter: ['0%', '-45%']
          }
        },
        {
          value: autom,
          name: 'Borrado automático',
          title: {
            color: 'white',
            offsetCenter: ['0%', '-15%']
          },
          detail: {
            valueAnimation: true,
            offsetCenter: ['0%', '5%']
          }
        },
        {
          name: 'Espacio libre',
          title: {
            color: 'white',
            offsetCenter: ['0%', '35%']
          },
          detail: {
            valueAnimation: true,
            offsetCenter: ['0%', '55%']
          }
        },
      ];

      let option = {
          textStyle: {
              fontFamily: 'Copperplate Gothic Light'
          },
          series: [
            {
              type: 'gauge',
              min: 0,
              max: fullSpace+caps,
              startAngle: 90,
              endAngle: -270,
              pointer: {
                show: false
              },
              progress: {
                show: false
              },
              axisLine: {
                roundCap: true,
                lineStyle: {
                  width: 20,
                  color: [
                    [caps/(fullSpace+caps), '#0096FF'],
                    [autom/(fullSpace+caps), '#F88379	'],
                    [1, 'white']
                  ]
                }
              },
              splitLine: {
                show: false,
                distance: 0,
                length: 10
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                show: false,
                distance: 50
              },
              data: gaugeData,
              title: {
                fontSize: 10
              },
              detail: {
                width: 60,
                height: 14,
                fontSize: 14,
                backgroundColor: 'inherit',
                borderRadius: 3,
                formatter: function (value) {
                  if(isNaN(parseFloat(value) && fullSpace>9999)){return parseInt((fullSpace/1024))+'GBs';}
                  if(isNaN(parseFloat(value))){return fullSpace+'MBs';}
                  if(value>9999){return (value/1024)+'GBs';}
                  return value+'MBs';
                }
              }
            }
          ]
        };

        return option;
  }

    return(
        <Grid container spacing={0} direction="column">
        <Box sx={{textAlign: 'center', backgroundColor:'#2c343c' , borderRadius: '10px'}}>
            {(loading) ? (
                <Grid container sx={{my:2}} direction="column" alignItems="center" justifyContent="center">
                    <CircularProgress style={{'color': '#ED7D31'}} />
                </Grid>
            ) : (
                (error=="false") ? (
                    <div>
                    <IconButton onClick={update}>
                        <SyncIcon sx={{color:'#ED7D31'}} fontSize="large"/>
                    </IconButton>
                    <Grid container direction='row'>
                        <Grid item xs={4}>
                            <ReactECharts option={getOption(0)}/>
                        </Grid>
                        <Grid item xs={4}>
                            <ReactECharts option={getOption(1)}/>
                        </Grid>
                        <Grid item xs={4}>
                            <ReactECharts option={getOptionSpace()}/>
                        </Grid>
                    </Grid>
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
