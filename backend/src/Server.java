import java.io.IOException;
import java.io.OutputStream;
import java.net.*;
import java.util.ArrayList;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.util.Timer;
import java.util.TimerTask;

//CLASE SERVER ->   SE ACTIVA LA APP EN EL PUERTO Y SE CREAN LAS URLS PERTINENTES
//                  CONTROL DE PETICIONES/RESPUESTAS CLIENTE-SERVIDOR

public class Server{

    static CaptureSystem dataCaptureSystem;
    static ReplaySystem dataReplaySystem;
    static LoggerSystem log;
    static DataBase DB;
    static int port;
    static boolean logged = false;  //indica si se ha inciado sesion o no
    static String so = System.getProperty("os.name").toLowerCase();
    static String key;

    public static void main(String[] args) throws IOException, InterruptedException {
        //shutDownTask se ejecuta cuando la aplicación se apaga (normalmente con CTRL+C desde la terminal)
        ShutDownTask shutDownTask = new ShutDownTask();
        Runtime.getRuntime().addShutdownHook(shutDownTask);

        //iniciamos los cuatro subarchivos principales para el funcionamiento de la app y los asignamos a variables: loggerSystem, dataBase, captureSystem, replaySystem
        log = new LoggerSystem();
        DB = new DataBase(log);
        if(!DB.status){
            System.out.println("ERROR FATAL: No hay conexión a la base de datos");
            return;
        }

        dataCaptureSystem = new CaptureSystem(log,DB);
        dataReplaySystem = new ReplaySystem(log,DB,dataCaptureSystem.netinterface);
        port = dataCaptureSystem.port;
        key = dataCaptureSystem.key;

        //si dentro de DCS port es 0 o key es null, probablemente no se hayan asignado: lo que querrá decir que o no hemos encontrado .config o estos valores son erróneos 
        //se pararía la ejecución del programa
        if(port==0 || key==null){
            System.out.println("ERROR FATAL: Opciones de configuración no encontradas en la base de datos");
            return;
        }

        //creamos el servidor HTTP en el puerto condigurado y todas las URLS que tendremos disponibles
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        //API URLs
        server.createContext("/", new MainHandler());
        server.createContext("/info", new InfoHandler());
        server.createContext("/login", new LoginHandler());
        server.createContext("/canales", new CanalesHandler());
        server.createContext("/logout", new LogoutHandler());
        server.createContext("/start", new StartHandler());
        server.createContext("/stop", new StopHandler());
        server.createContext("/replay", new ReplayHandler());
        server.createContext("/jumpreplay", new JumpReplayHandler());
        server.createContext("/speedreplay", new SpeedReplayHandler());
        server.createContext("/reproducciones", new StatusHandler());
        
        //FRONT URLs
        server.createContext("/canalesRaw", new CanalesRawHandler());
        server.createContext("/canalesRawFull", new CanalesRawFullHandler());
        server.createContext("/getFullCanales", new GetAllCanalesRawHandler());
        server.createContext("/canalesData", new CanalesDataHandler());
        server.createContext("/data", new DataHandler());
        server.createContext("/replayRaw", new ReplayRawHandler());
        server.createContext("/stopreplay", new StopReplayHandler());
        server.createContext("/modifyreplay", new ModifyReplayHandler());
        server.createContext("/reproduccionesRaw", new StatusRawHandler());
        server.createContext("/checkinstall", new CheckHandler());
        server.createContext("/getconfig", new ConfigHandler());
        server.createContext("/updateconfig", new UpdateConfigHandler());
        server.createContext("/changekey", new UpdateKeyHandler());
        server.createContext("/gettraffic", new GetTrafficHandler());
        server.createContext("/modifych", new ModifyChHandler());
        server.createContext("/addch", new AddChHandler());
        server.createContext("/deletepackets", new DeletePacketsHandler());
        server.createContext("/deleterecord", new DeleteHandler());
        server.createContext("/checkintegrity", new CheckIntegrityHandler());
        server.createContext("/recordinfo", new RecordInfoHandler());
        server.createContext("/systemstatus", new SystemStatusHandler());
        server.setExecutor(null); // creamos un ejecutador por defecto
        server.start();

        log.addInfo("Servidor corriendo en el puerto "+port);
        System.out.println("El servidor está corriendo en el puerto "+port);
        System.out.println("Clave para conectar: "+key);

        //cada x segundos (x especificado en .config) se comprobara el espacio del directorio de capturas
        //este código se encarga de lanzar el mecanismo de comprobacion de espacio en bucle cada x segundos
        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                log.addInfo("DELETION MECHANISM: Comprobando espacio...");
                dataCaptureSystem.deletionMechanism();
            }
        }, 0, dataCaptureSystem.secondsToDelete*1000);

    }

    //URL -> PAGINA INDICE
    static class MainHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");
            response.append("Bienvenido a <b>Sistema de Captura de Datos</b><br/>");
            response.append("Para informacion sobre las funciones disponibles vaya a <b>/info</b><br/>");
            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),200);
        }
    }

    //URL -> PAGINA INFO: TODAS LAS URLS Y LAS SINTAXIS PARA QUE SEAN FUNCIONALES
    static class InfoHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");
            response.append("<b>/login?key=n</b> -> para iniciar sesion {SUSTITUIR n POR LA CLAVE} <br/>");
            response.append("<b>/canales</b> -> para ver los canales y su estado <br/>");
            response.append("<b>/reproducciones</b> -> para ver las reproducciones activas y su estado <br/>");
            response.append("<b>/start?canal=n</b> -> para comenzar la grabacion en un canal {SUSTITUIR n POR EL NUMERO DEL CANAL} <br/>");
            response.append("<b>/stop?canal=n</b> -> para detener la grabacion en un canal {SUSTITUIR n POR EL NUMERO DEL CANAL} <br/>");
            response.append("<b>/replay?canal=n&inicio=i&fin=f</b> -> para reinyectar una grabacion de un canal y un rango de tiempo concreto **<br/>");
            response.append("<b>/stopreplay?reproduccion=n</b> -> para detener una reproduccion {SUSTITUIR n POR EL NUMERO DE REPRODUCCION ACTIVA}<br/>");
            response.append("<b>/jumpreplay?reproduccion=n&segundos=s</b> -> para saltar a un tiempo de una rep activa {SUSTITUIR n POR EL NUMERO DE REP ACTIVA, s POR LOS SEGUNDOS DESDE SU INICIO QUE SE QUIEREN AVANZAR}<br/>");
            response.append("<b>/speedreplay?reproduccion=n&velocidad=v</b> -> para modificar la velocidad de una rep activa {SUSTITUIR n POR EL NUMERO DE REP ACTIVA, v POR LA VELOCIDAD DE REPRODUCCION}<br/>");
            response.append("<br/>");
            response.append("** Para reproduccion: SUSTITUIR n POR EL NUMERO DEL CANAL, i POR EL INICIO Y f POR EL FIN DEL RANGO DE TIEMPO QUE SE QUIERE REINYECTAR {EN UNIX EPOCH}<br/>");
            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),200);
        }
    }

    //URL -> PAGINA LOGIN: PARA INCIAR SESIÓN
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");
            String parameters = httpExchange.getRequestURI().getQuery();

            if(logged){
                //si ya se ha inciado sesion no se podrá iniciar de nuevo
                log.addWarning("LOGIN: Fallo, ya se ha iniciado sesión");
                response.append("Ya ha iniciado sesion <br/>");
            }else if(!logged && (parameters==null || parameters.length()<=4 || !parameters.substring(0,4).equals("key="))){
                //error de syntax, devolvemos el codigo 400: bad request
                code = 400;
                log.addWarning("LOGIN: Error, syntax incorrecto");
                response.append("Syntax incorrecto, recuerde: <b>/login?key=n</b> -> para iniciar sesion {SUSTITUIR n POR LA CLAVE} <br/>");
            }else{
                //el syntax es correcto y no se ha iniciado sesion aún
                String pass = parameters.substring(4);
                if(pass.equals(key)){
                    //inicio correcto
                    log.addInfo("LOGIN: Inicio de sesión correcto");
                    response.append("Clave correcta, ha iniciado sesion <br/>");
                    logged = true;
                }else{
                    //inicio incorrecto
                    log.addWarning("LOGIN: Error, clave incorrecta");
                    response.append("Clave incorrecta <br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(), code);
        }
    }

    //URL -> PAGINA LOGOUT
    static class LogoutHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            logged = false;
            response.append("ok <br/>");

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(), code);
        }
    }

    //URL -> PAGINA CANALES: VER EL ESTADO DE LOS CANALES
    static class CanalesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                //este array incluirá en cada posicion informacion sobre un canal concreto
                ArrayList<String> canales = dataCaptureSystem.getChannels();
                for(int i=0; i<canales.size(); i++){
                    //si la primera posicion del array es el string inferior significa que el DCS no hay importado ningun canal, devolvemos 404: not found
                    if(i==0 && canales.get(i).equals("Archivo de configuracion de canales no encontrado")){code=404;}
                    response.append(canales.get(i)+ "<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class CanalesRawHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                //este array incluirá en cada posicion informacion sobre un canal concreto
                ArrayList<String> canales = dataCaptureSystem.getChannelsRaw(false);
                if(canales.size()==0){
                    response.append("error");
                }else{
                    response.append(canales);
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class GetAllCanalesRawHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                //este array incluirá en cada posicion informacion sobre un canal concreto
                ArrayList<String> canales = DB.getFullChannels();
                if(canales.size()==0){
                    response.append("error");
                }else{
                    response.append(canales);
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class CanalesRawFullHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                //este array incluirá en cada posicion informacion sobre un canal concreto
                ArrayList<String> canales = dataCaptureSystem.getChannelsRaw(true);
                if(canales.size()==0){
                    response.append("error");
                }else{
                    response.append(canales);
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class CanalesDataHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                int ch = Integer.parseInt(parameters.substring(6));

                //este array incluirá cada dos posiciones el inicio y fin de las grabaciones
                ArrayList<Long> canales = DB.getChannelData(ch);
                if(canales.size()==0){
                    response.append("empty");
                }else{
                    response.append(canales);
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class DataHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                //este array incluirá cada 5 posiciones el canal, inicio, fin, nº de paquetes y tamaño de cada grabacion
                ArrayList<Long> data = DB.getRecords();
                if(data.size()==0){
                    response.append("empty");
                }else{
                    response.append(data);
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class CheckIntegrityHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                int id = Integer.parseInt(parameters.substring(3));

                response.append(DB.checkIntegrity(id));
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class DeleteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                int tipo = Integer.parseInt(parameters.substring(0,1));
                int id = Integer.parseInt(parameters.substring(5));

                response.append(DB.deletion(id,tipo));
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class DeletePacketsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                if(dataReplaySystem.deletePackets()){
                    response.append("OK");
                }else{
                    response.append("error");
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class RecordInfoHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            String parameters = httpExchange.getRequestURI().getQuery();
            int tipo = Integer.parseInt(parameters);

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                if(tipo==0){
                    ArrayList<Integer> info = new ArrayList<>();
                    try {
                        info = dataCaptureSystem.grabacionesInfo();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    if(info.size()==0){
                        response.append("empty");
                    }else{
                        response.append(info);
                    }
                }
                if(tipo>=1){
                    ArrayList<String> info = new ArrayList<>();
                    try {
                        if(tipo==2){
                            info = dataCaptureSystem.grabacionesPackets(true);
                        }else{
                            info = dataCaptureSystem.grabacionesPackets(false);
                        }
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    if(info.size()==0){
                        response.append("empty");
                    }else{
                        response.append(info);
                    }
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA START: PARA INCIAR GRABACIONES
    static class StartHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                if(Server.checkSyntax(parameters)){
                    log.addInfo("START RECORDING: Intento de inicio grabacion en el canal "+parameters.substring(6));
                    String output = dataCaptureSystem.startRecording(Integer.parseInt(parameters.substring(6)));
                    response.append(output+"<br/>");
                    if(!output.equals("Grabacion iniciada")){code=500;} //si DCS devuelve cualquier cosa distinta al string previo la grabacion no se ha iniciado, devolvemos 500: error del servidor
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("START RECORDING: Error, syntax incorrecto");
                    response.append("Syntax incorrecto, recuerde: <b>/start?canal=n</b> -> para comenzar la grabacion en un canal {SUSTITUIR n POR EL NUMERO DEL CANAL}<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA STOP: PARA DETENER GRABACIONES
    static class StopHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                if(Server.checkSyntax(parameters)){
                    log.addInfo("STOP RECORDING: Intento de parada de grabacion en el canal "+parameters.substring(6));
                    String output = dataCaptureSystem.stopRecording(Integer.parseInt(parameters.substring(6)));
                    response.append(output+"<br/>");
                    if(!output.equals("Grabacion detenida")){code=500;} //si DCS devuelve cualquier cosa distinta al string previo la grabacion no se ha detenido, devolvemos 500: error del servidor
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("STOP RECORDING: Error, syntax incorrecto");
                    response.append("Syntax incorrecto, recuerde: <b>/stop?canal=n</b> -> para detener la grabacion en un canal {SUSTITUIR n POR EL NUMERO DEL CANAL}<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA REPLAY: PARA INICIAR REPRODUCCIONES
    static class ReplayHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else if(!DB.status){
                //si desde DB no se consiguio conectar a la base de datos no podremos usar las funciones de reproduccion, devolvemos 500: error del servidor
                log.addWarning("START REPLAY: No disponible debido a que no hay conexion con la base de datos");
                response.append("No disponible debido a que no hay conexion con la base de datos<br/>"); 
                code=500;
            }else if(so.contains("window")){
                //si el SO en el que estamos es Windows no podremos usar las funciones de reproduccion, devolvemos el código 401: unauthorized
                log.addWarning("START REPLAY: La reproducción solo está disponible en sistemas Linux");
                response.append("La reproduccion y sus funciones solo estan disponibles en sistemas Linux<br/>"); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                //en el array pos tenemos dos posiciones de caracteres dentro de la sintaxis enviada: el que marca el fin del canal y el que marca el fin del tiempo de inicio
                //si la primera posicion es -1 los valores no se han conseguido obtener correctamente
                int pos[] = Server.checkSyntaxRep(parameters);
                if(pos[0]!=-1){
                    int ch = Integer.parseInt(parameters.substring(6,pos[0]));
                    long inicio = Long.parseLong(parameters.substring(pos[0]+8,pos[1]));  
                    long fin = Long.parseLong(parameters.substring(pos[1]+5));  

                    if(!dataCaptureSystem.checkChannel(ch)){
                        code = 400;
                        log.addWarning("START REPLAY: Error, el canal indicado "+ch+" no existe");
                        response.append("El canal indicado "+ch+" no existe<br/>");
                    }else{
                        String output = "";
                        log.addInfo("START REPLAY: Intento de reproduccion del canal "+ch+" desde "+inicio+" a "+fin);
                        try {
                            output = dataReplaySystem.startReplay(ch, inicio, fin);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        response.append(output+"<br/>");

                        //si DRS devuelve cualquier cosa distinta al string previo la reproduccion no se ha iniciado, devolvemos 500: error del servidor
                        if(!output.substring(0, 21).equals("Reproduccion iniciada")){code=500;} 
                    }
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("START REPLAY: Error, syntax incorrecto");
                    response.append("Syntax incorrecto, recuerde: <b>/replay?canal=n&inicio=i&fin=f</b> -> para reinyectar una grabacion de un canal y un rango de tiempo concreto<br/>");
                    response.append("*SUSTITUIR n POR EL NUMERO DEL CANAL, i POR EL INICIO Y f POR EL FIN DEL RANGO DE TIEMPO QUE SE QUIERE REINYECTAR {EN UNIX EPOCH}<br/>");
                    response.append("**LA FECHA DE INICIO DEBE SER INFERIOR A LA DE FIN<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class ReplayRawHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else if(!DB.status){
                //si desde DB no se consiguio conectar a la base de datos no podremos usar las funciones de reproduccion, devolvemos 500: error del servidor
                log.addWarning("START REPLAY: No disponible debido a que no hay conexion con la base de datos");
                response.append("No disponible debido a que no hay conexion con la base de datos"); 
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                //en el array pos tenemos dos posiciones de caracteres dentro de la sintaxis enviada: el que marca el fin del canal y el que marca el fin del tiempo de inicio
                //si la primera posicion es -1 los valores no se han conseguido obtener correctamente
                int pos[] = Server.checkSyntaxRep(parameters);
                if(pos[0]!=-1){
                    int ch = Integer.parseInt(parameters.substring(6,pos[0]));
                    long inicio = Long.parseLong(parameters.substring(pos[0]+8,pos[1]));  
                    long fin = Long.parseLong(parameters.substring(pos[1]+5));  

                    if(!dataCaptureSystem.checkChannel(ch)){
                        log.addWarning("START REPLAY: Error, el canal indicado "+ch+" no existe");
                        response.append("El canal indicado "+ch+" no existe");
                    }else{
                        String output = "";
                        log.addInfo("START REPLAY: Intento de reproduccion del canal "+ch+" desde "+inicio+" a "+fin);
                        try {
                            output = dataReplaySystem.startReplay(ch, inicio, fin);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        response.append(output);
                    }
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    log.addWarning("START REPLAY: Error, syntax incorrecto");
                    response.append("Valores incorrectos en los tiempos");
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA STOP REPLAY: PARA DETENER REPRODUCCIONES
    static class StopReplayHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else if(so.contains("window")){
                //si el SO en el que estamos es Windows no podremos usar las funciones de reproduccion, devolvemos el código 401: unauthorized
                log.addWarning("STOP REPLAY: La reproducción solo está disponible en sistemas Linux");
                response.append("La reproduccion y sus funciones solo estan disponibles en sistemas Linux<br/>"); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                if(Server.checkSyntaxStopRep(parameters)){
                    log.addInfo("STOP REPLAY: Intento de parada de reproduccion "+parameters.substring(13));
                    String output = dataReplaySystem.stopReplay(Integer.parseInt(parameters.substring(13)));
                    response.append(output+"<br/>");

                    //si DRS devuelve cualquier cosa distinta al string previo la reproduccion no se ha detenido, devolvemos 500: error del servidor
                    if(!output.equals("Reproduccion detenida")){code=500;}
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("STOP REPLAY: Error, syntax incorrecto");
                    response.append("Syntax incorrecto, recuerde: <b>/stopreplay?reproduccion=n</b> -> para detener una reproduccion {SUSTITUIR n POR EL NUMERO DE REPRODUCCION ACTIVA}<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA JUMP REPLAY: PARA SALTAR DENTRO DE UNA REPRODUCCION
    static class JumpReplayHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else if(so.contains("window")){
                //si el SO en el que estamos es Windows no podremos usar las funciones de reproduccion, devolvemos el código 401: unauthorized
                log.addWarning("JUMP REPLAY: La reproducción solo está disponible en sistemas Linux");
                response.append("La reproduccion y sus funciones solo estan disponibles en sistemas Linux<br/>"); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                //check marca la posicion del caracter dentro de la sintaxis enviada: el que marca el fin del numero de reproduccion
                //si es -1 los valores no se han conseguido obtener correctamente
                int check = Server.checkSyntaxJumpRep(parameters);
                if(check!=-1){
                    String output = "";
                    log.addInfo("JUMP REPLAY: Intento de salto de la reproduccion "+parameters.substring(13,check)+" al segundo "+parameters.substring(check+10));
                    try {
                        output = dataReplaySystem.modifyReplay(Integer.parseInt(parameters.substring(13,check)),Integer.parseInt(parameters.substring(check+10)),0.0);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    response.append(output+"<br/>");

                    //si DRS devuelve cualquier cosa distinta al string previo la reproduccion no se ha saltado, devolvemos 500: error del servidor
                    if(!output.substring(0, 20).equals("Reproduccion saltada")){code=500;}
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("JUMP REPLAY: Error, syntax incorrecto");
                    response.append("Syntax incorrecto, recuerde: <b>/jumpreplay?reproduccion=n&segundos=s</b> -> para saltar a un tiempo de una rep activa {SUSTITUIR n POR EL NUMERO DE REP ACTIVA, s POR LOS SEGUNDOS DESDE SU INICIO QUE SE QUIEREN AVANZAR}<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA SPEED REPLAY: PARA MODIFICAR LA VELOCIDAD DE UNA REPRODUCCION
    static class SpeedReplayHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else if(so.contains("window")){
                //si el SO en el que estamos es Windows no podremos usar las funciones de reproduccion, devolvemos el código 401: unauthorized
                log.addWarning("SPEED REPLAY: La reproducción solo está disponible en sistemas Linux");
                response.append("La reproduccion y sus funciones solo estan disponibles en sistemas Linux<br/>"); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                //check marca la posicion del caracter dentro de la sintaxis enviada: el que marca el fin del numero de reproduccion
                //si es -1 los valores no se han conseguido obtener correctamente
                int check = Server.checkSyntaxSpeedRep(parameters);
                if(check!=-1){
                    String output = "";
                    log.addInfo("SPEED REPLAY: Intento de cambio de velocidad de la reproduccion "+parameters.substring(13,check)+" a velocidad x"+parameters.substring(check+11));
                    try {
                        output = dataReplaySystem.modifyReplay(Integer.parseInt(parameters.substring(13,check)),0,Double.parseDouble(parameters.substring(check+11)));
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    response.append(output+"<br/>");

                    //si DRS devuelve cualquier cosa distinta al string previo la reproduccion no ha cambiado velocidad, devolvemos 500: error del servidor
                    if(!output.substring(0, 34).equals("Velocidad de reproduccion cambiada")){code=500;}
                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("SPEED REPLAY: Error, syntax incorrecto");
                    response.append("Syntax incorrecto, recuerde: <b>/speedreplay?reproduccion=n&velocidad=v</b> -> para modificar la velocidad de una rep activa {SUSTITUIR n POR EL NUMERO DE REP ACTIVA, v POR LA VELOCIDAD DE REPRODUCCION}<br/>");
                    response.append("*La velocidad de reproduccion a la cual cambiar debera estar entre 0.1 (x0.1) y 10 (x10)<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class ModifyReplayHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                response.append(notLogged()); 
                log.addWarning("Intento de acceso a sección no permitido");
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();

                ArrayList<Double> data = Server.checkSyntaxModifyRep(parameters);
                if(data.size()!=0){
                    int mode = data.get(0).intValue();
                    int rep = data.get(1).intValue();

                    if(mode==1){
                        int secs = data.get(2).intValue();
                        String output = "";

                        log.addInfo("JUMP REPLAY: Intento de salto de la reproduccion "+rep+" al segundo "+secs);
                        try {
                            output = dataReplaySystem.modifyReplay(rep,secs,0.0);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }

                        if(output.substring(0, 20).equals("Reproduccion saltada")){
                            response.append("Reproduccion modificada correctamente: salto de tiempo");
                        }else{
                            response.append(output);
                        }
                    }

                    if(mode==2){
                        Double speed = data.get(2);
                        String output = "";

                        log.addInfo("SPEED REPLAY: Intento de cambio de velocidad de la reproduccion "+rep+" a velocidad x"+speed);
                        try {
                            output = dataReplaySystem.modifyReplay(rep,0,speed);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }

                        if(output.substring(0, 34).equals("Velocidad de reproduccion cambiada")){
                            response.append("Reproduccion modificada correctamente: cambio de velocidad");
                        }else{
                            response.append(output);
                        }
                    }

                    if(mode==3){
                        int secs = data.get(2).intValue();
                        Double speed = data.get(3);
                        String output = "", output2="";

                        log.addInfo("JUMP REPLAY: Intento de salto de la reproduccion "+rep+" al segundo "+secs);
                        log.addInfo("SPEED REPLAY: Intento de cambio de velocidad de la reproduccion "+rep+" a velocidad x"+speed);

                        try {
                            output = dataReplaySystem.modifyReplay(rep,secs,0.0);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }

                        try {
                            output2 = dataReplaySystem.modifyReplay(rep,0,speed);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        
                        if(output.substring(0, 20).equals("Reproduccion saltada")){
                            if(output2.substring(0, 34).equals("Velocidad de reproduccion cambiada")){
                                response.append("Reproduccion modificada correctamente: salto de tiempo y cambio de velocidad");
                            }else{
                                response.append("Salto de tiempo correcto pero cambio de velocidad erróneo: "+output);
                            }
                        }else{
                            response.append(output);
                        }
                    }

                }else{
                    //error de syntax, devolvemos el codigo 400: bad request
                    code = 400;
                    log.addWarning("MODIFY REPLAY: Error, syntax incorrecto");
                    response.append("Syntax incorrecto");
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA STATUS: PARA VER EL ESTADO DE LAS REPRODUCCIONES
    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
             //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();
            response.append("<html><body>");

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else if(!DB.status){
                //si desde DB no se consiguio conectar a la base de datos no podremos usar las funciones de reproduccion, devolvemos 500: error del servidor
                response.append("REPRODUCCIONES: No disponible debido a que no hay conexion con la base de datos<br/>"); 
                code=500;
            }else if(so.contains("window")){
                //si el SO en el que estamos es Windows no podremos usar las funciones de reproduccion, devolvemos el código 401: unauthorized
                log.addWarning("REPRODUCCIONES: La reproducción solo está disponible en sistemas Linux");
                response.append("La reproduccion y sus funciones solo estan disponibles en sistemas Linux<br/>"); 
                code=401;
            }else{
                //este array incluirá en cada posicion informacion sobre una reproduccion concreta
                ArrayList<String> reps = dataReplaySystem.getStatus();
                for(int i=0; i<reps.size(); i++){
                    //si la primera posicion del array es el string inferior significa que el DRS no ha encontrado ninguna reproduccion activa, devolvemos 404: not found
                    if(i==0 && reps.get(i).equals("No hay ninguna reproduccion activa en el momento. Para iniciar una vaya a /replay")){code=404;}
                    response.append(reps.get(i)+ "<br/>");
                }
            }

            response.append("</body></html>");
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class StatusRawHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
             //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                //este array incluirá en cada posicion informacion sobre una reproduccion concreta
                ArrayList<Double> reps = dataReplaySystem.getStatusRaw();
                if(reps.size()==0){
                    response.append("empty");
                }else{
                    response.append(reps);
                }
            }
            
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> PAGINA CHECK: CHEQUEAR INSTALACIONES
    static class CheckHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            String parameters = httpExchange.getRequestURI().getQuery();
            int chequeo = Integer.parseInt(parameters);

            //2 = chequeo para la datos/graficos
            //1 = chequeo para la reproduccion
            //0 = chequeo para la grabaccion
            if(chequeo==2){
                log.addInfo("Comprobando instalaciones para graficos de datos...");
                if(!so.contains("linux")){
                    response.append("La funcion para visualizar graficos solo esta disponible en S0's Linux"); //-1 = el SO no es linux
                }else{
                    int state = dataCaptureSystem.checkInstallationsGraph();
                    if(state==0){response.append("Faltan las instalaciones de tshark y wireshark para obtener los datos de las grabaciones");}
                    if(state==1){response.append("Falta la instalacion de tshark para obtener los datos de las grabaciones");}
                    if(state==2){response.append("Falta la instalacion de wireshark para obtener los datos de las grabaciones");}
                    if(state==3){response.append("OK");}
                    
                }
            }
            if(chequeo==1){
                log.addInfo("Comprobando instalaciones para reproduccion...");
                if(!so.contains("linux")){
                    response.append("La funcion de reproduccion solo esta disponible en S0's Linux"); //-1 = el SO no es linux
                }else{
                    int state = dataReplaySystem.checkInstallations();
                    if(state==0){response.append("Faltan las instalaciones de tcpreplay y wireshark para reproducir");}
                    if(state==1){response.append("Falta la instalacion de tcpreplay para reproducir");}
                    if(state==2){response.append("Falta la instalacion de wireshark para reproducir");}
                    if(state==3){response.append("OK");}
                    
                }
            }
            if(chequeo==0){
                log.addInfo("Comprobando instalaciones para grabacion...");
                if(!so.contains("linux")){
                    response.append("windows");
                }else{
                    Boolean state = dataCaptureSystem.checkInstallations();
                    if(!state){
                        response.append("Falta la instalacion de tcpdump para grabar");
                    }else{
                        response.append("OK");
                    }
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> OBTENER PARAMETROS DE CONFIGURACION
    static class ConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                log.addInfo("Obteniendo parametros de configuracion...");
                ArrayList<String> config = DB.getConfig();
                response.append(config);
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> ACTUALIZAR PARAMETROS DE CONFIGURACION
    static class UpdateConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                log.addInfo("Se van a actualizar los parametros de configuracion");
                String parameters = httpExchange.getRequestURI().getQuery();
                ArrayList<String> params = getConfigFromSyntax(parameters);
                String result = DB.updateConfig(params);
                if(result=="OK"){
                    log.addInfo("Parametros de configuracion actualizados correctamente");
                    for(int i=0; i<5; i++){
                        if(params.get(i)!="0"){
                            dataCaptureSystem.updateConfiguration(i, params.get(i));
                            if(i==0){
                                dataReplaySystem.changeInterface(params.get(0));
                            }
                        }
                    }
                }
                response.append(result);
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    //URL -> ACTUALIZAR CLAVE
    static class UpdateKeyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                log.addInfo("Se va a actualizar la clave");
                String parameters = httpExchange.getRequestURI().getQuery();
                ArrayList<String> params = getKeysFromSyntax(parameters);

                if(params.get(0).equals(key)){
                    String result = DB.updateKey(params.get(1));
                    if(result=="OK"){
                        log.addInfo("Clave actualizada correctamente");
                        dataCaptureSystem.updateConfiguration(5, params.get(1));
                        key = params.get(1);
                    }
                    response.append(result);
                }else{
                    response.append("Error al modificar: la clave antigua no es correcta");
                }
            }
            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class GetTrafficHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                log.addInfo("Se va a intentar obtener el tráfico");
                ArrayList<Integer> tf;
                try {
                    tf = dataCaptureSystem.getTraffic();
                    response.append(tf);
                } catch (InterruptedException e) {
                    code=401;
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class ModifyChHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                ArrayList<Integer> params = modifyChSyntax(parameters);
                if(params==null){
                    code=400;
                }else{
                    String ch = "";
                    String result = "";

                    if(params.get(0)==0){
                        log.addInfo("Se va a intentar deshabilitar el canal "+params.get(1));
                        ch = CaptureSystem.checkChannelOff(params.get(1));
                        if(ch=="on"){
                            response.append("El canal "+params.get(1)+" no se puede deshabilitar porque esta grabando"); 
                        }else{
                            result = DB.modifyCH(ch, 0);
                            response.append(result);
                        }
                    }else{
                        log.addInfo("Se va a intentar habilitar el canal "+params.get(1));
                        ArrayList<String> canales = DB.getFullChannels();
                        for(int i=0; i<canales.size(); i++){
                            if(Integer.toString(params.get(1)).equals(canales.get(i))){
                                ch = canales.get(i+1);
                                break;
                            }
                        }

                        if(ch==""){
                            code=400;
                        }else{
                            result = DB.modifyCH(ch, 1);
                            response.append(result);
                        }
                    }

                    if(result=="OK"){
                        CaptureSystem.updateChs();
                    }
                    
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class AddChHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                String parameters = httpExchange.getRequestURI().getQuery();
                if(CaptureSystem.checkSyntax(parameters)){
                    if(DB.addCH(parameters)){
                        response.append("OK");
                        CaptureSystem.updateChs();
                    }else{
                        response.append("No se ha podido añadir el canal");
                    }
                }else{
                    response.append("Syntax de canal no valido");
                    if(so.contains("window")){
                        response.append(" (se recomienda añadir canales desde un SO Linux)");
                    }
                }
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }

    static class SystemStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange httpExchange) throws IOException {
            //inicializamos el codigo de respuesta que proporcionará HTTP: en 200, que es el de éxito
            int code = 200;
            StringBuilder response = new StringBuilder();

            if(!logged){
                //si no se ha inciado sesion no se podrá acceder a esta sección, devolvemos el código 401: unauthorized
                log.addWarning("Intento de acceso a sección no permitido");
                response.append(notLogged()); 
                code=401;
            }else{
                log.addInfo("Se va a intentar obtener el estado del sistema");
                ArrayList<Double> res = dataCaptureSystem.getSystemStatus();
                response.append(res);
            }

            Server.writeResponse(httpExchange, response.toString(),code);
        }
    }


    //este método devuelve una cadena y un codigo HTTP al usuario que ha realizado una peticion HTTP
    public static void writeResponse(HttpExchange httpExchange, String response, int code) throws IOException {
        httpExchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        httpExchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        httpExchange.getResponseHeaders().add("Access-Control-Allow-Headers", "*");
        httpExchange.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
        httpExchange.getResponseHeaders().add("Access-Control-Allow-Credentials-Header", "*");

        httpExchange.sendResponseHeaders(code, response.length());
        OutputStream os = httpExchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
    
    //para comprobar si la sintaxis de inciar o detener grabaciones es correcta
    public static boolean checkSyntax(String query){
        //debe existir, ser mayor o igual a 6 caracteres de longuitud, y empezar por "canal="
        if(query==null || query.length()<=6 || !query.substring(0,6).equals("canal=")){
            return false;
        }else{
            //despues de "canal=" debe haber un numero int valido
            String num = query.substring(6);
            try {
                int value = Integer.parseInt(num);
                return true;
            } catch (NumberFormatException e) {

            }

            return false;
        }
    }

    //para comprobar si la sintaxis de detener una reproduccion es correcta
    public static boolean checkSyntaxStopRep(String query){
        //debe existir, ser mayor o igual a 13 caracteres de longuitud, y empezar por "reproduccion="
        if(query==null || query.length()<=13 || !query.substring(0,13).equals("reproduccion=")){
            return false;
        }else{
            //despues de "reproduccion=" debe haber un numero int valido
            String num = query.substring(13);
            try {
                int value = Integer.parseInt(num);
                return true;
            } catch (NumberFormatException e) {

            }

            return false;
        }
    }

    //para comprobar si la sintaxis de saltar una reproduccion es correcta
    public static int checkSyntaxJumpRep(String query){
        //debe existir, ser mayor o igual a 23 caracteres de longuitud, y empezar por "reproduccion="
        if(query==null || query.length()<=23 || !query.substring(0,13).equals("reproduccion=")){
            return -1;
        }else{
            //buscamos el primer &, que marcara el fin del parametro del nº de reproduccion y el comienzo de los segundos
            //lo asignamos a pos1, que lo inicializaremos a -1 y se mantendra con ese valor sino encontramos un &
            int pos1 = -1;
            for(int i=0; i<query.length(); i++){
                if(query.charAt(i)=='&'){pos1=i; break;}
            }
            if(pos1==-1){return -1;}

            //los diez caracteres posteriores al &, este incluido, deben ser "&segundos="
            if(!query.substring(pos1,pos1+10).equals("&segundos=")){
                return -1;
            }

            //las cadenas despues de reproduccion= y de segundos= deben ser int's validos
            String num = query.substring(13,pos1);
            String seconds = query.substring(pos1+10);
            try {
                int value = Integer.parseInt(num);
                int secs = Integer.parseInt(seconds);
            } catch (NumberFormatException e) {
                return -1;
            }

            return pos1;
        }
    }

    //para comprobar si la sintaxis de cambio de velocidad de una reproduccion es correcta
    public static int checkSyntaxSpeedRep(String query){
        //debe existir, ser mayor o igual a 24 caracteres de longuitud, y empezar por "reproduccion="
        if(query==null || query.length()<=24 || !query.substring(0,13).equals("reproduccion=")){
            return -1;
        }else{
            //buscamos el primer &, que marcara el fin del parametro del nº de reproduccion y el comienzo de la velocidad
            //lo asignamos a pos1, que lo inicializaremos a -1 y se mantendra con ese valor sino encontramos un &
            int pos1 = -1;
            for(int i=0; i<query.length(); i++){
                if(query.charAt(i)=='&'){pos1=i; break;}
            }
            if(pos1==-1){return -1;}

            //los diez caracteres posteriores al &, este incluido, deben ser "&velocidad="
            if(!query.substring(pos1,pos1+11).equals("&velocidad=")){
                return -1;
            }

            //las cadenas despues de reproduccion= y de velocidad= deben ser un int y un double, respectivamente, validas
            String num = query.substring(13,pos1);
            String speed = query.substring(pos1+11);
            try {
                int value = Integer.parseInt(num);
                double s = Double. parseDouble(speed);
                if(s<0.1 || s>10){return -1;}
            } catch (NumberFormatException e) {
                return -1;
            }

            return pos1;
        }
    }
    
    //para comprobar si la sintaxis de inicio de una reproduccion es correcta
    public static int[] checkSyntaxRep(String query){
        int[] pos = new int[]{-1,-1};

        //debe existir, ser mayor a 22 caracteres de longuitud, y empezar por "canal="
        if(query==null || query.length()<22 || !query.substring(0,6).equals("canal=")){
            return new int[]{-1,-1};
        }else{
            //buscamos los dos primeros &, que uno marca el comienzo del parametro incio y otro el del parametro fin
            //asignamos el primero a pos[0] y el segundo a pos[1], que hemos inicializado a -1 y se mantendran con ese valor sino encontramos su correspondiente &
            int app = 0;
            for(int i=0; i<query.length(); i++){
                if(query.charAt(i)=='&'){
                    if(app==2){return new int[]{-1,-1};}
                    pos[app] = i;
                    app++;
                }
            }
            if(app!=2){return new int[]{-1,-1};}

            //los 8 caracteres posteriores al primer &, este incluido, deben ser "&inicio="
            //los 5 caracteres posteriores al segundo &, este incluido, deben ser "&fin="
            if(!query.substring(pos[0],pos[0]+8).equals("&inicio=") || !query.substring(pos[1],pos[1]+5).equals("&fin=")){
                return new int[]{-1,-1};
            }

            //las cadenas despues de 'canal=', de 'inicio=' y de 'fin=' deben ser int's validos
            String num = query.substring(6,pos[0]);
            String inicio = query.substring(pos[0]+8,pos[1]);
            String fin = query.substring(pos[1]+5);
            if(fin.length()!=inicio.length()){return new int[]{-1,-1};}

            try {
                int ch = Integer.parseInt(num);
                long i = Long.parseLong(inicio);  
                long f = Long.parseLong(fin);  
                if(i>=f){return new int[]{-1,-1};}
                
            } catch (NumberFormatException e) {
                return new int[]{-1,-1};
            }
        }

        return pos;
    }

    public static ArrayList<Double> checkSyntaxModifyRep(String query){
        if(query==null){
            return new ArrayList<>();
        }else{
            ArrayList<Double> out = new ArrayList<>();
            Double mode = Double.parseDouble(query.substring(0,1));
            out.add(mode);

            //buscamos dos &'s'
            int pos1 = -1, pos2 = -1;
            for(int i=0; i<query.length(); i++){
                if(query.charAt(i)=='&'){
                    if(pos1==-1){
                        pos1=i;
                    }else{
                        pos2=i;
                        break;
                    }
                }
            }

            if(pos1==-1 || pos2==-1){return new ArrayList<>();}
            Double rep = Double.parseDouble(query.substring(pos1+1,pos2));
            out.add(rep);
            
            if(mode!=3){
                Double item = Double.parseDouble(query.substring(pos2+1));
                out.add(item);
            }else{
                int pos3 = -1;
                for(int i=0; i<query.length(); i++){
                    if(query.charAt(i)=='&' && i!=pos1 && i!=pos2){
                        pos3=i;
                        break;
                    }
                }

                if(pos3==-1){return new ArrayList<>();}
                Double time = Double.parseDouble(query.substring(pos2+1,pos3));
                out.add(time);

                Double speed = Double.parseDouble(query.substring(pos3+1));
                out.add(speed);
            }

            return out;
        }
    }

    public static ArrayList<String> getConfigFromSyntax(String query){
        ArrayList<String> config = new ArrayList<>();

        for(int i=0; i<5; i++){
            int inIndx = -1;
            int paramLen = -1;

            switch(i){
                case 0: inIndx = query.indexOf("interface="); paramLen=10; break;
                case 1: inIndx = query.indexOf("newpack="); paramLen=8; break;
                case 2: inIndx = query.indexOf("maxpacks="); paramLen=9; break;
                case 3: inIndx = query.indexOf("checktime="); paramLen=10; break;
                case 4: inIndx = query.indexOf("maxMBs="); paramLen=7; break;
                default: break;
            }

            if(inIndx==-1){
                config.add("0");
            }else{
                int x = inIndx+paramLen;
                int y = x;
                while(y!=(query.length()) && query.charAt(y)!='&'){
                    y++;
                }
                config.add(query.substring(x,y));
            }
        }

        return config;
    }

    public static ArrayList<String> getKeysFromSyntax(String query){
        ArrayList<String> keys = new ArrayList<>();

        for(int i=0; i<2; i++){
            int inIndx = -1;
            int paramLen = 4;

            switch(i){
                case 0: inIndx = query.indexOf("old="); break;
                case 1: inIndx = query.indexOf("new="); break;
                default: break;
            }

            if(inIndx==-1){
                keys.add("0");
            }else{
                int x = inIndx+paramLen;
                int y = x;
                while(y!=(query.length()) && query.charAt(y)!='&'){
                    y++;
                }
                keys.add(query.substring(x,y));
            }
        }

        return keys;
    }

    public static ArrayList<Integer> modifyChSyntax(String query){
        ArrayList<Integer> out = new ArrayList<>();

        try {
            int mode = Integer.parseInt(query.substring(0,1));
            int ch = Integer.parseInt(query.substring(2));
            out.add(mode); 
            out.add(ch);
        } catch (NumberFormatException e) {
            return null;
        }

        return out;
    }

    //se ejecuta si se apaga el programa: simplemente imprime por pantalla y añade al log el cierre inmediato
    private static class ShutDownTask extends Thread {
        @Override
        public void run() {
            log.addInfo("Cierre de programa iniciado");
            System.out.println();
            System.out.println("Cerrando programa...");
        }
    }

    //respuesta del servidor si no se ha iniciado sesion
    private static String notLogged(){return "No ha iniciado sesion: <b>/login?key=n</b> -> para iniciar sesion {SUSTITUIR n POR LA CLAVE} <br/>";};
}