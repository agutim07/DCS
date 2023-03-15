import java.io.*;
import java.time.Instant;
import java.util.*; 
import java.util.ArrayList;

//CLASE CAPTURE SYSTEM ->   SE ENCARGA DE TODAS LAS FUNCIONES RELACIONADAS CON LAS GRABACION
//                          ADEMÁS DEL BORRADO AUTOMÁTICO Y LA IMPORTACIÓN DE CANALES Y PARÁMETROS

public class CaptureSystem {
    private static String configFilePath = "config/config.properties"; //Archivo de configuración

    //estos nueve parámetros se importan desde el archivo de configuración 
    public static int port;
    public static String key;
    private static int timeForNewPack; 
    private static int maxPackets;  
    public static int secondsToDelete;  
    private static long maxMBs;  
    private static String channelFile = "";
    private static File captureFolder = new File("captures");
    public static String netinterface = "";

    
    private static ArrayList<String> canales;       //filtros de los canales importados
    private static ArrayList<Process> grabaciones;  //procesos de las grabaciones activas
    private static ArrayList<Long> grabacionStart;  //tiempo inicio de las grabaciones activas
    private static ArrayList<Task> grabacionTask;   //tarea de las grabaciones activas (solo Windows)
    
    private static LoggerSystem log;
    private static DataBase DB;
    

    public CaptureSystem(LoggerSystem inputLog, DataBase inputDB) throws FileNotFoundException, IOException{
        log = inputLog;
        DB = inputDB;

        //si la carpeta de capturas no está creada, la creamos
        if(!captureFolder.exists() || !captureFolder.isDirectory()){captureFolder.mkdir(); log.addInfo("Directorio de capturas creado");}

        //importamos los canales y los parameteros de configuracion
        CaptureSystem.getConfiguration();
        CaptureSystem.canales = obtainChs();

        //creamos las listas de info. de grabacion y las iniciamos vacias (o en 0)
        CaptureSystem.grabaciones = new ArrayList<Process>(); 
        CaptureSystem.grabacionStart = new ArrayList<Long>();
        CaptureSystem.grabacionTask = new ArrayList<Task>();
        for(int i=0; i<canales.size(); i++){
            Process process = null;
            grabaciones.add(process);
            grabacionStart.add(Long.valueOf(0));
            grabacionTask.add(null);
        }

    }

    //INICIO DE GRABACIÓN NORMAL
    public static String startRecording(int ch) {
        String filtros = "";  
        boolean existente = false;

        //buscamos el canal indicado, si existe obtenemos sus filtros
        for(int i=0; i<canales.size(); i++){
            if(ch==(i+1) && canales.get(i)!="null"){
                existente = true;
                if(grabaciones.get(ch-1)==null){
                    //solo obtenemos el filtro si no hay proceso => no está grabando ya ese canal
                    filtros = canales.get(i);
                }
            }
        } 

        //sino existe el canal o ya estaba grabando detenemos ejecucion
        if(!existente){log.addWarning("START RECORDING: Error, el canal indicado "+ch+" no existe"); return "El canal indicado "+ch+" no existe";}
        if(filtros==""){log.addWarning("START RECORDING: Error, el canal indicado "+ch+" ya estaba grabando"); return "El canal indicado "+ch+" ya estaba grabando";}

        //canal especial, todo el trafico = sin filtro
        if(filtros.equals("{todo el trafico}")){filtros="";}

        //si estamos en Windows debemos iniciar una grabacion especial
        if (System.getProperty("os.name").toLowerCase().contains("window")) {
            return startRecordingWindows(ch, filtros);
        }

        String cmd = "tcpdump "+filtros+" -w captures/cap_canal"+ch+"_%s -W "+maxPackets+" -G "+timeForNewPack+" -Z root";

        try {
            //creamos el proceso y esperamos 1 segundo a ver si se ha creado correctamente
            Process process = createProcess(cmd);
            Thread.sleep(1000);
            
            //Comprobamos que el proceso se ha iniciado bien y está activo
            if(processFinished(process)!=-1){
                log.addSevere("START RECORDING: Error al iniciar el canal "+ch);
                return("Error al iniciar: revise la syntax del canal y asegurese de que la ejecucion es con permisos de administrador");
            }else{
                //asignamos a la grabacion el tiempo de inicio (el actual), y su respectivo proceso
                grabacionStart.set((ch-1),System.currentTimeMillis()/1000l);
                grabaciones.set((ch-1),process);
                log.addInfo("START RECORDING: Canal "+ch+" iniciado");
                return("Grabacion iniciada");  
            }

        } catch (Exception e) {
            //si se produce una excepcion devolvemos fallo
            log.addSevere("START RECORDING: Error al iniciar el canal "+ch+" {"+e+"}");
            return("Error al ejecutar tcpdump");
        }
    }

    //INICIO DE GRABACIÓN ESPECIAL (EN WINDOWS)
    public static String startRecordingWindows(int ch, String filtros) {
        //este comando solo crea una pcap, ya que en Windows no se pueden crear nuevas automáticamente
        String cmd = "tcpdump "+filtros+" -w captures/cap_canal"+ch+"_"+Instant.now().getEpochSecond()+".pcap -Z root";

        try {
            //creamos el proceso y esperamos 1 segundo a ver si se ha creado correctamente
            Process process = createProcess(cmd);
            Thread.sleep(1000);
            
            //Comprobamos que el proceso se ha iniciado bien y está activo
            if(processFinished(process)!=-1){
                log.addSevere("START RECORDING: Error al iniciar el canal "+ch);
                return("Error al iniciar: revise la syntax del canal y asegurese de que la ejecucion es con permisos de administrador");
            }else{
                //asignamos a la grabacion el tiempo de inicio (el actual), y su respectivo proceso
                grabacionStart.set((ch-1),System.currentTimeMillis()/1000l);
                grabaciones.set((ch-1),process);
                log.addInfo("START RECORDING: Canal "+ch+" iniciado");
                //creamos una tarea que se encargara de crear sucesivas pcaps en Windows
                grabacionTask.set((ch-1), new Task(filtros, timeForNewPack, ch-1));
                grabacionTask.get(ch-1).start();
                return("Grabacion iniciada");  
            }

        } catch (Exception e) {
            //si se produce una excepcion devolvemos fallo
            log.addSevere("START RECORDING: Error al iniciar el canal "+ch+" {"+e+"}");
            return("Error al ejecutar tcpdump");
        }
    }

    //TAREA QUE CREA NUEVAS PCAPS EN WINDOWS CADA X SEGUNDOS
    static class Task extends Thread{
        String filtros;
        Integer seconds;
        Integer ch;

        //creamos una tarea con los filtros del canal, los segundos cada cuanto se genera una nueva pcap
        //y el numero del canal
        Task(String f, int s, int ch){
            super(ch+f);
            this.filtros = f;
            this.seconds = s;
            this.ch = ch;
        }

        public void run(){
            //loop representa el numero de paquetes de una grabacion creados
            int loop = 1;
            Process temp = null;
            try {
                //si loop es igual o mayor que el max. de paquetes que se pueden generar, detenemos la grabacion
                while(loop<maxPackets){
                    //esperamos x segundos hasta generar un nuevo paquete (con 2 de antelacion ya que se tarda en inciar)
                    Thread.sleep((seconds-2)*1000);
                        
                    String cmd = "tcpdump "+filtros+" -w captures/cap_canal"+(ch+1)+"_"+Instant.now().getEpochSecond()+".pcap -Z root";
                    try {
                        temp = createProcess(cmd);
                    } catch (IOException e) {
                        //si se produce una excepcion devolvemos fallo y paramos la grabacion
                        log.addSevere("RECORDING: La reproduccion "+(ch+1)+" ha fallado {"+e+"}");
                        stopRecording(ch+1);
                    }

                    //dormimos los dos segundos de antelacion de antes previamente a cerrar la anterior pcap
                    Thread.sleep(2000);

                    //cerramos la anterior pcap ya que ya se esta generando la nueva
                    //lo hacemos destruyendo su proceso y lo sustituimos por el nuevo recien creado
                    grabaciones.get(ch).destroy();
                    while(processFinished(grabaciones.get(ch))==-1){
                        Thread.sleep(200);
                    }
                    grabaciones.set((ch),temp);
                    temp = null;
                    loop++;
                }

                //si superamos el max. de paquetes eperamos a que termine la grabacion del actual
                Thread.sleep(seconds*1000);
                stopRecording(ch+1);
            } catch (InterruptedException e) {
                //si interrupimos la tarea es que estamos deteniendo la grabacion
                //por lo que si el proceso temporal esta activo lo tenemos que detener 
                if(temp!=null){temp.destroy();}
                Thread.currentThread().interrupt();
            }
        }
    }

    //PARADA DE GRABACIÓN 
    public static String stopRecording(int ch) {
        boolean correct = false;
        boolean existente = false;

        //nos aseguramos que el canal a detener exista y este grabando
        for(int i=0; i<canales.size(); i++){
            if(ch==(i+1) && canales.get(i)!="null"){
                existente = true;
                //si es especial (tiene tarea) debemos detenerla
                if(grabacionTask.get(i)!=null){
                    if(processFinished(grabaciones.get(i))!=-1){
                        //si el proceso de grabacion esta activo detenemos de forma normal (grabando datos al final)
                        //ademas de parar la tarea de la grabacion
                        grabaciones.set((i),null);
                        grabacionTask.get(i).interrupt();
                        grabacionTask.set((i),null);
                        log.addInfo("STOP RECORDING: Canal "+ch+" detenido");
                        DB.saveData(ch,grabacionStart.get(i)-4,System.currentTimeMillis()/1000l);
                        return("Grabacion detenida");  
                    }else{
                        //si la grabacion no esta activa y la tarea existe probablemente la grabacion se haya detenido
                        //pero la tarea no por algún fallo, por lo que detenemos la tarea
                        grabacionTask.get(i).interrupt();
                        grabacionTask.set((i),null);
                    }
                }

                if(grabaciones.get(i)!=null){
                    correct=true;
                }
            }
        }  

        //si o no existe el canal o esta ya parado devolvemos error
        if(!existente){log.addWarning("STOP RECORDING: Error, el canal indicado "+ch+" no existe"); return "El canal indicado "+ch+" no existe";}
        if(!correct){log.addWarning("STOP RECORDING: Error, el canal indicado "+ch+" no se puede detener porque no estaba iniciado"); return "El canal indicado "+ch+" no se puede detener porque no estaba iniciado";}

        try {
            //detenemos la grabacion y esperamos durante 7 loops de 0.2 segundos como maximo a que se haya detenido 
            grabaciones.get(ch-1).destroy();
            int tries = 0;
            while(processFinished(grabaciones.get(ch-1))==-1 && tries<7){
                Thread.sleep(200);
                tries++;
            }
            
            //si no se ha detenido devolvemos error
            if(processFinished(grabaciones.get(ch-1))==-1){
                log.addSevere("STOP RECORDING: Error al detener el canal "+ch);
                return("Error al detener la grabacion");
            }else{
                //si se ha detenido convertimos el proceso a null y guardamos los datos grabados -> desde el inicio
                //hasta el tiempo actual
                grabaciones.set((ch-1),null);
                log.addInfo("STOP RECORDING: Canal "+ch+" detenido");
                DB.saveData(ch,grabacionStart.get(ch-1)-4,System.currentTimeMillis()/1000l);
                return("Grabacion detenida");  
            }

        } catch (Exception e) {
            //si se produce una excepcion devolvemos fallo
            log.addSevere("STOP RECORDING: Error al detener el canal "+ch+" {"+e+"}");
            return("Error al ejecutar un comando " + e);
        }
    }


    //IMPORTAMOS CANALES Y SUS FILTROS
    public static ArrayList<String> obtainChs() throws FileNotFoundException, IOException{
        ArrayList<String> channels = new ArrayList<String>();
        
        //buscamos el archivo donde hemos especificado que estan los canales
        File file = new File(channelFile);
        if(!file.exists()){
            //sino encontramos el archivo devolvemos un error y en canales añadimos 'null'
            log.addSevere("Archivo de canales no encontrado");
            channels.add("null");
            return channels;
        }

        //si encontramos el archivo lo leemos linea a linea con un buffer
        BufferedReader br = new BufferedReader(new FileReader(file));
        String st;

        //cada linea es un filtro de un canal
        //lo añadimos al array y su posicion en el + 1 es el numero del canal
        br.readLine(); br.readLine();
        while ((st = br.readLine()) != null){
            channels.add(st);
        }

        log.addConfig("Archivo de canales importado correctamente");
        return channels;
    }

    //OBTENEMOS LOS CANALES Y SU ESTADO
    public ArrayList<String> getChannels(){
        boolean something = false;
        ArrayList<String> output = new ArrayList<>();

        //si el tamaño de los canales es 1 y el primero elemento es 'null' significa que no encontramos el archivo
        if(canales.size()==1 && canales.get(0)=="null"){
            log.addSevere("CHANNELS: Archivo de canales no encontrado");
            output.add("Archivo de configuracion de canales no encontrado"); 
            return output;
        }

        //recorremos canal a canal imprimiendo su estado
        for(int i=0; i<canales.size(); i++){
            something = true;
            //imprimos numero canal y su filtro
            String canal = "Canal "+(i+1)+": "+canales.get(i);
            //si esta grabando lo imprimimos asi como el tiempo que lleva grabando
            if(grabaciones.get(i)!=null){
                //tiempo que lleva grabando: tiempo actual menos tiempo de inicio de la grabacion
                long timepograbacion = (System.currentTimeMillis()/1000l) - grabacionStart.get(i);
                String cero = ""; if(timepograbacion%60<10){cero="0";};

                canal += " - Grabando - Tiempo: "+timepograbacion/60+":"+cero+timepograbacion%60;
            }else{
                //si no esta grabando lo imprimimos
                canal += " - Apagado";
            }
            output.add(canal);
        }

        //si something es falso quiere decir que no hemos encontrado ningun canal pero si el archivo de canales
        if(!something){
            log.addWarning("CHANNELS: Archivo de canales vacío");
            output.add("No hay canales disponibles");
        }
        return output;
        
    }

    //DEVUELVE EL ESTADO DE UN PROCESO
    private static int processFinished(Process process){
        //-1: el proceso no ha terminado aún
        //0: el proceso ha acabado
        int result;
        try {
            result = process.exitValue();
        } catch (IllegalThreadStateException itse) {
            return -1;
        }
        return result;
    }

    //MECANISMO DE BORRADO AUTOMÁTICO
    public static void deletionMechanism(){
        //conseguimos el espacio ocupado actualmente en la carpeta de capturas
        long MBs = getFolderMB(captureFolder);

        //si supera el tamaño a partir del cual tenemos escrito que se inicia el borrado automático lo iniciamos
        if(MBs>=maxMBs){
            //obtenemos el espacio que hay que eliminar para bajar del maximo
            long MBtoDelete = MBs - maxMBs;
            long MBsDeleted = 0;
            int deletedFiles = 0;

            //obtenemos todos los archivos en la carpeta y los ordenamos por antiguedad
            File[] files = captureFolder.listFiles();
            Arrays.sort(files, Comparator.comparingLong(File::lastModified));

            //los recorremos buscando archivos que empiecen por 'temp' o 'merge', que son archivos temporales prescindibles
            //en el momento que estemos por debajo del maximo de MBs detenemos el borrado
            for(int x=0; x<files.length; x++){
                if(MBsDeleted>MBtoDelete){break;}

                if(files[x].getName().substring(0, 4).equals("temp") || files[x].getName().substring(0, 5).equals("merge")){
                    long size = files[x].length() / (1024*1024);
                    MBsDeleted += size;
                    files[x].delete();
                    deletedFiles++;
                }
                
            }

            //recorremos los archivos borrando los mas antiguos
            //en el momento que estemos por debajo del maximo de MBs detenemos el borrado
            for(int i=0; i<files.length; i++){
                if(MBsDeleted>MBtoDelete){
                    break;
                }else{
                    long size = files[i].length() / (1024*1024);
                    MBsDeleted += size;
                    files[i].delete();
                    DB.deletionMechanism(files[i].getName());
                    deletedFiles++;
                }
                
            }

            log.addInfo("DELETION MECHANISM: Se han borrado "+deletedFiles+" capturas antiguas con un tamaño de "+MBsDeleted+"MBs por falta de espacio");
        }else{
            log.addInfo("DELETION MECHANISM: Hay "+MBs+"MBs ocupados, por lo que no se ha activado el mecansimo de borrado");
        }
    }

    //OBTENEMOS PARAMETROS DE CONFIGURACION
    public static void getConfiguration() throws IOException{
        //buscamos el archivo donde hemos especificado que estan los parametros de configuracion
        File file = new File(configFilePath);
        if(!file.exists()){
            //sino lo encontramos devolvemos error
            log.addSevere("Archivo de configuración no encontrado");
            return;
        }

        //vamos extrayendo parametro a parametro y logeando lo que extraemos por cada uno
        log.addConfig("Obteniendo parámetros de configuración");
        FileInputStream propsInput = new FileInputStream(configFilePath);
        Properties prop = new Properties();
        prop.load(propsInput);

        timeForNewPack = Integer.valueOf(prop.getProperty("timeForNewPack"));
        log.addConfig("Tiempo para crear nuevo paquete al grabar obtenido: "+timeForNewPack);
        maxPackets = Integer.valueOf(prop.getProperty("maxPackets"));
        log.addConfig("Número máximo de paquetes capturados por canal obtenido: "+maxPackets);
        netinterface = prop.getProperty("interface");
        log.addConfig("Interfaz de red para la reproducción obtenida: "+netinterface);
        secondsToDelete = Integer.valueOf(prop.getProperty("secondsToDelete"));
        log.addConfig("Segundos para comprobar espacio obtenido: "+secondsToDelete);
        maxMBs = Integer.valueOf(prop.getProperty("maxMBs"));
        log.addConfig("Tamaño máximo de capturas obtenido: "+maxMBs);
        channelFile = prop.getProperty("channelFile");
        log.addConfig("Dirección del archivo de canales obtenida: "+channelFile);
        port = Integer.valueOf(prop.getProperty("port"));
        log.addConfig("Puerto obtenido: "+port);
        key = prop.getProperty("key"); 
        log.addConfig("Clave encontrada");

        log.addConfig("Parámetros de configuración obtenidos");
    }

    //OBTENER ESPACIO OCUPADO EN LA CARPETA DE CAPTURAS
    private static long getFolderMB(File folder) {
        //recorremos archivo a archivo sumando su tamaño al tamaño total
        long length = 0;
        File[] files = folder.listFiles();

        int count = files.length;

        for (int i = 0; i < count; i++) {
            if (files[i].isFile()) {
                length += files[i].length();
            }
            else {
                length += getFolderMB(files[i]);
            }
        }
        return length / (1024 * 1024);
    }

    //CREAR PROCESO
    private static Process createProcess(String cmd) throws IOException{
        //en Linux se crea con proccessBuilder desde /bin/bash
        //en Windows con Runtime.exec()
        ProcessBuilder processBuilder = null;
 
        String operatingSystem = System.getProperty("os.name");
        if (operatingSystem.toLowerCase().contains("window")) {
            return Runtime.getRuntime().exec(cmd);
        }

        processBuilder = new ProcessBuilder("/bin/bash", "-c", cmd);
        processBuilder.redirectErrorStream(true);

        return processBuilder.start();
    }
}