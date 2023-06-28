import java.io.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

//CLASE CAPTURE SYSTEM ->   SE ENCARGA DE TODAS LAS FUNCIONES RELACIONADAS CON LAS GRABACION
//                          ADEMAS DEL BORRADO AUTOMATICO Y LA IMPORTACION DE CANALES Y PARAMETROS

public class CaptureSystem {
    //estos nueve parámetros se importan desde el archivo de configuración 
    public static int port;
    public static String key;
    private static int timeForNewPack; 
    private static int maxPackets;  
    public static int secondsToDelete;  
    private static long maxMBs;  
    private static File captureFolder = new File("captures");
    public static String netinterface = "";

    
    private static ArrayList<Canales> canales;       //filtros de los canales importados
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
        int pos = -1;

        //buscamos el canal indicado, si existe obtenemos sus filtros
        for(int i=0; i<canales.size(); i++){
            if(canales.get(i).id==ch){
                existente = true;
                pos = i;
                if(grabaciones.get(i)==null){
                    //solo obtenemos el filtro si no hay proceso => no está grabando ya ese canal
                    filtros = canales.get(i).filtro;
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
            return startRecordingWindows(ch, filtros,pos);
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
                grabacionStart.set((pos),System.currentTimeMillis()/1000l);
                grabaciones.set((pos),process);
                log.addInfo("START RECORDING: Canal "+ch+" iniciado");
                return("Grabacion iniciada");  
            }

        } catch (Exception e) {
            //si se produce una excepcion devolvemos fallo
            log.addSevere("START RECORDING: Error al iniciar el canal "+ch+" {"+e+"}");
            return("Error al ejecutar tcpdump");
        }
    }

    public static boolean checkSyntax(String syn) throws IOException {
        String cmd = "tcpdump "+syn;

        try {
            //creamos el proceso y esperamos 1 segundo a ver si se ha creado correctamente
            Process process = createProcess(cmd);
            Thread.sleep(1000);
            
            //Comprobamos que el proceso se ha iniciado bien y está activo
            if(processFinished(process)!=-1){
                return false;
            }else{
                process.destroy();
                return true; 
            }
        }catch (Exception e){
            return false;
        }
    }

    public static boolean checkInstallations() throws IOException {
        Scanner s1 = new Scanner(Runtime.getRuntime().exec("apt list tcpdump").getInputStream()).useDelimiter("\\A");
        String output1 = s1.hasNext() ? s1.next() : "";
        String[] lines1 = output1.split("\r\n|\r|\n");

        if(lines1.length<2){
            return false;
        }else{
            return true;
        }
    }

    //chequeamos que tshark y wireshark esten instaladas
    public static int checkInstallationsGraph() throws IOException {
        Scanner s1 = new Scanner(Runtime.getRuntime().exec("apt list tshark").getInputStream()).useDelimiter("\\A");
        String output1 = s1.hasNext() ? s1.next() : "";
        String[] lines1 = output1.split("\r\n|\r|\n");

        Scanner s2 = new Scanner(Runtime.getRuntime().exec("apt list wireshark").getInputStream()).useDelimiter("\\A");
        String output2 = s2.hasNext() ? s2.next() : "";
        String[] lines2 = output2.split("\r\n|\r|\n");


        if(lines1.length<2 && lines2.length<2){return 0;}   //ninguna instalada
        if(lines1.length<2){return 1;}  //tshark no instalado
        if(lines2.length<2){return 2;}  //wireshark no instalado
        return 3;   //ambas instaladas
    }
        

    //INICIO DE GRABACIÓN ESPECIAL (EN WINDOWS)
    public static String startRecordingWindows(int ch, String filtros, int pos) {
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
                grabacionStart.set((pos),System.currentTimeMillis()/1000l);
                grabaciones.set((pos),process);
                log.addInfo("START RECORDING: Canal "+ch+" iniciado");
                //creamos una tarea que se encargara de crear sucesivas pcaps en Windows
                grabacionTask.set((pos), new Task(filtros, timeForNewPack, pos));
                grabacionTask.get(pos).start();
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
        int pos = -1;

        //nos aseguramos que el canal a detener exista y este grabando
        for(int i=0; i<canales.size(); i++){
            if(canales.get(i).id==ch){
                existente = true;
                pos = i;
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
            grabaciones.get(pos).destroy();
            int tries = 0;
            while(processFinished(grabaciones.get(pos))==-1 && tries<7){
                Thread.sleep(200);
                tries++;
            }
            
            //si no se ha detenido devolvemos error
            if(processFinished(grabaciones.get(pos))==-1){
                log.addSevere("STOP RECORDING: Error al detener el canal "+ch);
                return("Error al detener la grabacion");
            }else{
                //si se ha detenido convertimos el proceso a null y guardamos los datos grabados -> desde el inicio
                //hasta el tiempo actual
                grabaciones.set((pos),null);
                log.addInfo("STOP RECORDING: Canal "+ch+" detenido");
                DB.saveData(ch,grabacionStart.get(pos)-4,System.currentTimeMillis()/1000l);
                return("Grabacion detenida");  
            }

        } catch (Exception e) {
            //si se produce una excepcion devolvemos fallo
            log.addSevere("STOP RECORDING: Error al detener el canal "+ch+" {"+e+"}");
            return("Error al ejecutar un comando " + e);
        }
    }


    //IMPORTAMOS CANALES Y SUS FILTROS
    public static ArrayList<Canales> obtainChs() throws FileNotFoundException, IOException{
        ArrayList<Canales> channels = new ArrayList<>();
        
        log.addConfig("Obteniendo canales...");
        ArrayList<String> params = DB.getChannels();

        if(params.size()==0){
            //sino encontramos el archivo devolvemos un error y en canales añadimos 'null'
            log.addSevere("No se ha encontrado ningún canal");
            channels.add(null);
            return channels;
        }

        //añadimos los canales
        for(int i=0; i<params.size(); i+=2){
            channels.add(new Canales(Integer.parseInt(params.get(i)), params.get(i+1)));
        }

        log.addConfig("Archivo de canales importado correctamente");
        return channels;
    }

    public static void updateChs() throws FileNotFoundException, IOException{
        ArrayList<Canales> newCanales = obtainChs();

        ArrayList<Process> newGrabaciones = new ArrayList<Process>();
        ArrayList<Long> newGrabacionStart = new ArrayList<Long>();
        ArrayList<Task> newGrabacionTask = new ArrayList<Task>();

        for(int i=0; i<newCanales.size(); i++){
            boolean found = false;

            for(int x=0; x<canales.size(); x++){
                if(newCanales.get(i).id==canales.get(x).id){
                    found = true;

                    newGrabaciones.add(grabaciones.get(x));
                    newGrabacionStart.add(grabacionStart.get(x));
                    newGrabacionTask.add(grabacionTask.get(x));
                }
            }

            if(!found){
                Process process = null;
                newGrabaciones.add(process);
                newGrabacionStart.add(Long.valueOf(0));
                newGrabacionTask.add(null);
            }
        }

        CaptureSystem.canales = newCanales;
        CaptureSystem.grabaciones = newGrabaciones;
        CaptureSystem.grabacionStart = newGrabacionStart;
        CaptureSystem.grabacionTask = newGrabacionTask;
    }

    //OBTENEMOS LOS CANALES Y SU ESTADO
    public ArrayList<String> getChannels(){
        boolean something = false;
        ArrayList<String> output = new ArrayList<>();

        //si el tamaño de los canales es 1 y el primero elemento es 'null' significa que no encontramos el archivo
        if(canales.size()==1 && canales.get(0)==null){
            log.addSevere("CHANNELS: Archivo de canales no encontrado");
            output.add("Archivo de configuracion de canales no encontrado"); 
            return output;
        }

        //recorremos canal a canal imprimiendo su estado
        for(int i=0; i<canales.size(); i++){
            something = true;
            //imprimos numero canal y su filtro
            String canal = "Canal "+canales.get(i).id+": "+canales.get(i).filtro;
            //si esta grabando lo imprimimos asi como el tiempo que lleva grabando

            if(grabaciones.get(i)!=null && processFinished(grabaciones.get(i))!=-1){
                stopRecording(i+1);
            }
            
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

    public ArrayList<String> getChannelsRaw(Boolean extra){
        ArrayList<String> out = new ArrayList<>();

        for(int i=0; i<canales.size(); i++){
            out.add(String.valueOf(canales.get(i).id));
            out.add(canales.get(i).filtro);
            if(extra){
                if(grabaciones.get(i)!=null && processFinished(grabaciones.get(i))!=-1){
                    stopRecording(i+1);
                }
                
                if(grabaciones.get(i)!=null){
                    long timepograbacion = (System.currentTimeMillis()/1000l) - grabacionStart.get(i);
                    out.add(String.valueOf(timepograbacion));
                }else{
                    out.add("off");
                }
            }
        }

        return out;
    }

    public boolean checkChannel(int ch){
        for(int i=0; i<canales.size(); i++){
            if(canales.get(i).id==ch){
                return true;
            }
        }

        return false;
    }

    public static String checkChannelOff(int ch){
        int x = -1;

        for(int i=0; i<canales.size(); i++){
            if(canales.get(i).id==ch){
                if(grabaciones.get(i)==null){
                    x = i;
                }
            }
        }  

        if(x==-1){
            return "on";
        }

        return canales.get(x).filtro;
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

    //MECANISMO DE BORRADO AUTOMATICO
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
        log.addConfig("Obteniendo parámetros de configuración...");
        ArrayList<String> params = DB.getConfig();
        if(params.size()!=7){return;}
        

        timeForNewPack = Integer.valueOf(params.get(0));
        log.addConfig("Tiempo para crear nuevo paquete al grabar obtenido: "+timeForNewPack);
        maxPackets = Integer.valueOf(params.get(1));
        log.addConfig("Número máximo de paquetes capturados por canal obtenido: "+maxPackets);
        netinterface = params.get(2);
        log.addConfig("Interfaz de red para la reproducción obtenida: "+netinterface);
        secondsToDelete = Integer.valueOf(params.get(3));
        log.addConfig("Segundos para comprobar espacio obtenido: "+secondsToDelete);
        maxMBs = Integer.valueOf(params.get(4));
        log.addConfig("Tamaño máximo de capturas obtenido: "+maxMBs);
        port = Integer.valueOf(params.get(5));
        log.addConfig("Puerto obtenido: "+port);
        key = params.get(6);
        log.addConfig("Clave encontrada");

        log.addConfig("Parámetros de configuración obtenidos");
    }

    public static void updateConfiguration(int index, String value){
        switch(index){
            case 0:
                netinterface=value; break;
            case 1:
                timeForNewPack=Integer.valueOf(value); break;
            case 2:
                maxPackets=Integer.valueOf(value); break;
            case 3:
                secondsToDelete=Integer.valueOf(value); break;
            case 4:
                maxMBs=Integer.valueOf(value); break;
            case 5:
                key=value; break;
            default:
                break;
        }

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

    public static ArrayList<Integer> getTraffic() throws IOException, InterruptedException{
        ArrayList<TaskTraffic> runs = new ArrayList<>();

        for(int i=0; i<canales.size(); i++){
            String filtros = canales.get(i).filtro;
            if(filtros.equals("{todo el trafico}")){filtros="";}
            runs.add(new TaskTraffic(filtros));
            runs.get(i).start();
        }

        TimeUnit.SECONDS.sleep(6);

        ArrayList<Integer> packets = new ArrayList<>();
        for(int i=0; i<canales.size(); i++){
            int packs = runs.get(i).packets;
            packets.add(packs);
        }
        
        return packets;
    }

    static class TaskTraffic extends Thread{
        String filtros;
        int packets = 0;

        //creamos una tarea con los filtros del canal, los segundos cada cuanto se genera una nueva pcap
        //y el numero del canal
        TaskTraffic(String f){
            super(f);
            this.filtros = f;
            this.packets = 0;
        }

        @Override
        public void run(){
            String result = null;
            try (InputStream inputStream = Runtime.getRuntime().exec("timeout 5 tcpdump "+filtros).getInputStream();
                    Scanner s = new Scanner(inputStream).useDelimiter("\\A")) {
                result = s.hasNext() ? s.next() : null;
            } catch (IOException e) {
                e.printStackTrace();
            }

            String[] lines = result.split("\r\n|\r|\n");
            this.packets = lines.length;
        }
    }

    public ArrayList<Integer> grabacionesInfo() throws IOException, InterruptedException{
        log.addInfo("Obteniendo información de grabaciones existentes...");
        ArrayList<Integer> out = new ArrayList<>();
        ArrayList<ArrayList<String>> in = DB.getRecordsFiles();

        ArrayList<String> data = in.get(0);

        for(int i=0; i<data.size(); i++){
            String[] files = data.get(i).split(";");
            boolean allFiles = true;

            for(int x=0; x<files.length; x++){
                File f = new File(captureFolder+"/"+files[x]);
                if(!f.exists()){
                    allFiles = false;
                }
            }

            if(!allFiles){
                out.add(i+1);
                out.add(Integer.parseInt(in.get(1).get(i)));
                out.add(-1); out.add(-1); out.add(-1); out.add(-1);
                log.addWarning("Aviso: faltan paquetes en la grabación nº"+i);
            }else{
                log.addWarning("Obteniendo datos de la grabación nº"+i);
                ArrayList<ArrayList<Integer>> subdata = getCapInfo(files);
                log.addWarning("Datos de grabación nº"+i+" obtenidos correctamente");
                for(int x=0; x<subdata.size(); x++){
                    out.add(i+1);
                    out.add(Integer.parseInt(in.get(1).get(i)));
                    out.add(subdata.get(x).get(0)); out.add(subdata.get(x).get(1)); out.add(subdata.get(x).get(2)); out.add(subdata.get(x).get(3));
                }
            }
        }

        return out;
    }

    private ArrayList<ArrayList<Integer>> getCapInfo(String[] files) throws IOException, InterruptedException{
        ArrayList<ArrayList<Integer>> data = new ArrayList<>();
        ArrayList<TaskCapInfo> runs = new ArrayList<>();

        for(int x=0; x<files.length; x++){
            String file = files[x];
            runs.add(new TaskCapInfo(file));
            runs.get(x).start();
        }

        TimeUnit.SECONDS.sleep(6);

        for(int i=0; i<files.length; i++){
            ArrayList<Integer> subdata = runs.get(i).data;
            data.add(subdata);
        }

        return data;
    }

    static class TaskCapInfo extends Thread{
        String file;
        ArrayList<Integer> data;

        TaskCapInfo(String f){
            super(f);
            this.file = f;
            this.data = new ArrayList<>();
        }

        @Override
        public void run(){
            //tshark -T fields -e _ws.col.Protocol -e _ws.col.Info -r cap_canal3_1676913712
            String cmd = "capinfos "+captureFolder+"/"+file;
            Process proc = null;
            try {
                proc = createProcess(cmd);
            } catch (IOException e) {
                e.printStackTrace();
            }
            ArrayList<String> out = new ArrayList<>();
            ArrayList<Integer> subdata = new ArrayList<>();

            BufferedReader stdInput = new BufferedReader(new InputStreamReader(proc.getInputStream()));

            // Read the output from the command
            String s = null;
            try {
                while ((s = stdInput.readLine()) != null) {
                    out.add(s);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }

            String npacks = out.get(listContains(out, "Number of packets = ")).replaceAll("\\s+","");
            subdata.add(Integer.parseInt(npacks.substring(npacks.lastIndexOf("=") + 1)));

            String datarate = out.get(listContains(out, "Data byte rate:")).replaceAll("\\s+","");
            subdata.add(Integer.parseInt(datarate.substring(datarate.lastIndexOf(":") + 1 , datarate.lastIndexOf("kBps"))));

            String packrate = out.get(listContains(out, "Average packet rate:")).replaceAll("\\s+","");
            subdata.add(Integer.parseInt(packrate.substring(packrate.lastIndexOf(":") + 1 , packrate.lastIndexOf("packets/s"))));

            String packsize = out.get(listContains(out, "Average packet size:")).replaceAll("\\s+","");
            if(packsize.contains(",")){
                packsize = packsize.substring(packsize.lastIndexOf(":") + 1, packsize.lastIndexOf(","));
            }else{
                packsize = packsize.substring(packsize.lastIndexOf(":") + 1, packsize.lastIndexOf("bytes"));
            }
            subdata.add(Integer.parseInt(packsize));

            this.data = subdata;
        }
    }

    public ArrayList<String> grabacionesPackets() throws IOException, InterruptedException{
        log.addInfo("Obteniendo información de paquetes de grabaciones existentes...");
        ArrayList<String> out = new ArrayList<>();
        ArrayList<ArrayList<String>> in = DB.getRecordsFiles();

        ArrayList<String> data = in.get(0);

        for(int i=0; i<data.size(); i++){
            String[] files = data.get(i).split(";");
            boolean allFiles = true;

            for(int x=0; x<files.length; x++){
                File f = new File(captureFolder+"/"+files[x]);
                if(!f.exists()){
                    allFiles = false;
                }
            }

            out.add("?");
            out.add(Integer.toString(i+1));

            if(!allFiles){
                out.add("ERROR");
                log.addWarning("Aviso: faltan paquetes en la grabación nº"+i);
            }else{
                log.addWarning("Obteniendo datos de paquetes de la grabación nº"+i);
                ArrayList<String> subdata = getCapPacks(files);
                log.addWarning("Datos de paquetes de grabación nº"+i+" obtenidos correctamente");
                for(int x=0; x<subdata.size(); x++){
                    out.add(subdata.get(x));
                }
            }
        }

        return out;
    }

    private ArrayList<String> getCapPacks(String[] files) throws IOException, InterruptedException{
        ArrayList<String> data = new ArrayList<>();
        ArrayList<TaskCapPacks> runs = new ArrayList<>();

        for(int x=0; x<files.length; x++){
            String file = files[x];
            runs.add(new TaskCapPacks(file));
            runs.get(x).start();
        }

        TimeUnit.SECONDS.sleep(3);

        HashMap<String, Integer> map = new HashMap<String, Integer>();
        for(int i=0; i<files.length; i++){
            HashMap<String, Integer> subdata = runs.get(i).data;
            for (String clave:subdata.keySet()) {
                int num = subdata.get(clave);
                if(map.containsKey(clave)){
                    num+=map.get(clave);
                }
                map.put(clave, num);
            }
        }

        for (String clave:map.keySet()) {
            data.add(clave);
            data.add(Integer.toString(map.get(clave)));
        }
        return data;
    }

    static class TaskCapPacks extends Thread{
        String file;
        HashMap<String, Integer> data;

        TaskCapPacks(String f){
            super(f);
            this.file = f;
            this.data = new HashMap<String, Integer>();
        }

        @Override
        public void run(){
            String cmd = "tshark -T fields -e _ws.col.Protocol -e _ws.col.Info -r "+captureFolder+"/"+file;
            Process proc = null;
            try {
                proc = createProcess(cmd);
            } catch (IOException e) {
                e.printStackTrace();
            }

            HashMap<String, Integer> subdata = new HashMap<String, Integer>();
            BufferedReader stdInput = new BufferedReader(new InputStreamReader(proc.getInputStream()));

            // Read the output from the command
            String s = null;
            try {
                while ((s = stdInput.readLine()) != null) {
                    if(s.contains("\t")){
                        String p = s.substring(0, s.indexOf('\t'));
                        int num = 1;

                        if(subdata.containsKey(p)){
                            num+=subdata.get(p);
                        }

                        subdata.put(p, num);
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }

            this.data = subdata;
        }
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

    private static Integer listContains(ArrayList<String> list, String str){
        for(int i=0; i<list.size(); i++){
            if(list.get(i).contains(str)){
                return i;
            }
        }

        return -1;
    }

    static class Canales{
        int id;
        String filtro;

        Canales(int i, String f){
            this.id = i;
            this.filtro = f;
        }
    }
}