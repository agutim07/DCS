DCS - Data Capture System

○ Instalaciones necesarias:

    - En el backend:
        • Java: JDK y JRE (mínimo Java 20) => Añadir la direcciçon carpeta jdk instalada a la variable del entorno del sistema PATH
        Para Linux:
            • Tcpdump
            • Tcpreplay (Aviso: la versión 4.3.4 no es válida)
            • Wireshark
        Para Windows:
            • Tcpdump de Microolap
    
    - En el frontend:
        • Npm (Node.js)
        • Java: JDK y JRE (mínimo Java 8).
        
        • React (npm i react)
        • Axios (npm i axios)
        • MUI (npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-date-pickers)
        • DayJS (npm i dayjs)
        • ECharts (npm i echarts echarts-for-react)
        • React Scripts (npm i -g react-scripts)
        • React Router (react-router-dom)

○ Ejecución:

    - Se deben ejecutar simultaneamente cada parte (frontend y backend). Más instrucciones en sus README.
    - (Aviso) El script startFullDCS.sh (EXCLUSIVO PARA LINUX) ejecuta ambas partes simultáneamente, pero debe estar instalado mate-terminal para su ejecución
