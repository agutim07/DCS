import java.io.*;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

//CLASE REPLAY SYSTEM ->    SE ENCARGA DE TODAS LAS FUNCIONES RELACIONADAS CON LA REPRODUCCIÓN

public class ReplaySystem {
    private static ArrayList<reproduccion> reproducciones = new ArrayList<>();

    private static String netinterface = "";    //interfaz por la cual se reinyectaran los paquetes
                                                //obtenida del archivo de configuracion
    
    private static LoggerSystem log;
    private static DataBase DB;
    private static String packetsToDelete = "";

    public ReplaySystem(LoggerSystem inputLog, DataBase inputDB, String in) throws FileNotFoundException, IOException{
        log = inputLog;
        DB = inputDB;
        netinterface = in;

        ReplaySystem.reproducciones = new ArrayList<>();
    }

    public void changeInterface(String in){
        netinterface = in;
    }

    //INICIO DE REPRODUCCION
    public String startReplay(int ch, long inicio, long fin) throws InterruptedException, IOException{
        String replayPackets = "";
        int sleep = 0;

        if(!checkInterface(netinterface)){
            log.addWarning("START REPLAY: Error, la interfaz establecida no existe en el equipo");
            return("La interfaz establecida no existe en el equipo");
        }

        //buscamos la 1ª opcion de reproduccion -> el rango a reinyectar esta todo dentro de una grabacion
        ArrayList<String> packetsOP1 = DB.getData(ch, inicio, fin,0);
        if(packetsOP1.get(0).equals("false")){
            //tenemos la 2ª opcion de reproduccion -> hay que coger varias grabaciones, o esperar x segundos a reproducir, o ambos
            ArrayList<ArrayList<String>> packetsOP2 = obtainSpecialPackets(ch, inicio, fin);
            if(packetsOP2==null){
                //si ni con la segunda opcion encontramos paquetes devolvemos error: no hay datos en el rango de rep.
                log.addWarning("START REPLAY: Error, los datos introducidos no se corresponden con ninguna grabación existente");
                return("Los datos introducidos no se corresponden con ninguna grabacion existente");
            }
            
            //comprobamos si hay que esperar antes de inciar la rep, y si hay que hacerlo lo almacenamos
            sleep = Integer.valueOf(packetsOP2.get(3).get(0));
            //obtenemos los paquetes a reinyectar como rep especial (ya que hemos tenido que usar la 2ª opcion)
            replayPackets = specialReplay(ch, inicio, fin, packetsOP2);
            
        }else{
            //obtenemos los paquetes a reinyectar como rep normal (ya que hemos tenido que usar la 1ª opcion) 
            replayPackets = normalReplay(ch, inicio, fin, packetsOP1);
        }

        //si los submetodos nos han dado error devolvemos el error
        if(replayPackets.equals("Error al intentar cortar los paquetes de datos") || replayPackets.equals("Las grabaciones solicitadas ya no existen, posiblemente fueran borradas por falta de espacio")
            || replayPackets.equals("Error al intentar concatenar los paquetes de datos")){
            return replayPackets;
        }

        //creamos la reproduccion y asignamos sus parametros
        boolean added = false;
        int repLength = (int) (fin-inicio); //longuitud
        reproduccion rep = new reproduccion(System.currentTimeMillis()/1000l, inicio, repLength, ch);   //reproduccion
        if(sleep>0){rep.setSleep(sleep);}   //segundos a esperar antes de reinyectar

        checkProcess(); //chequeamos las reproducciones activas

        //añadimos la rep creada en la primera posicion libre
        int i = 0;
        for(i=0; i<reproducciones.size() && !added; i++){
            if(!reproducciones.get(i).on){
                added = true;
                reproducciones.set(i,rep);
                reproducciones.get(i).setID(i);
            }
        }

        //si no hay posiciones libres aumentamos el array de reproduciones
        if(!added){
            rep.setID(i);
            reproducciones.add(rep);
        }

        //iniciamos la reproduccion y devolvemos lo que imprima el metodo
        return rep.start(replayPackets,0);
    }


    //MODIFICACION DE REPRODUCCIONES 
    public String modifyReplay(int num, int seconds, double speed) throws InterruptedException, IOException{
        //podemos modificar la velocidad, el tiempo de reproduccion, o ambos
        speed = (double) Math.round(speed * (int) Math.pow(10, 1)) / (int) Math.pow(10, 1); //redondeamos la velocidad a un 1 digito decimal
        boolean isSpeedChange = false;
        //mode 1 = salto en la rep. mode 2 = cambio de velocidad
        int mode = 1;
        //si la velocidad es mayor a 0 y los segundos es 0 es un cambio de velocidad
        if(speed>0 && seconds==0){isSpeedChange=true; mode=2;}

        num--;  //num es el numero de reproduccion, que en el array tiene la posicion num-1
        checkProcess();

        //comprobamos si la rep existe
        if(reproducciones.size()<=(num) || !reproducciones.get(num).on){
            num++;
            log.addWarning("MODIFY REPLAY: Error, la reproducción indicada "+(num)+" no existe"); 
            return "La reproduccion indicada "+(num)+" no existe, revise las existentes con /reproducciones";
        }

        //si es un salto comprobamos que los segundos a saltar esten dentro de la longuitud de la reproduccion
        if(!isSpeedChange && (seconds>=reproducciones.get(num).length || 0>seconds)){
            log.addWarning("JUMP REPLAY: Error, se quiere saltar al segundo "+seconds+" de una reproducción de "+reproducciones.get(num).length+" segundos"); 
            return "Imposible, se quiere saltar al segundo "+seconds+" de una reproduccion de "+reproducciones.get(num).length+" segundos";
        }

        //si es un cambio de velocidad comprobamos que esta velocidad no este ya aplicada a la rep.
        if(isSpeedChange){
            if(speed==reproducciones.get(num).speed){
                log.addWarning("SPEED REPLAY: Error, se quiere cambiar a velocidad x"+speed+" y la reproducción ya tiene esta velocidad"); 
                return "La reproduccion ya esta a velocidad x"+speed;
            }
            //si es un cambio de velocidad habrá que iniciar la nueva rep. en el momento exacto actual
            //por lo que también se produce un salto, al segundo actual en el cual está la rep.
            seconds=(int) (((System.currentTimeMillis()/1000l) - reproducciones.get(num).start)*reproducciones.get(num).speed) + reproducciones.get(num).jump;
        }

        //creamos los parámetros de la nueva rep. que vamos a crear (la modificada)
        Long inicio = reproducciones.get(num).iTime+seconds;
        Long fin = reproducciones.get(num).iTime+reproducciones.get(num).length;
        int ch = reproducciones.get(num).canal;

        //aqui se vuelven a obtener los paquetes de la nueva reproduccion como lo hicimos en el metodo de inicio normal
        String replayPackets = "";
        int sleep = 0;

        ArrayList<String> packetsOP1 = DB.getData(ch, inicio, fin,0);
        if(packetsOP1.get(0).equals("false")){
            ArrayList<ArrayList<String>> packetsOP2 = obtainSpecialPackets(ch, inicio, fin);
            if(packetsOP2==null){
                log.addWarning("MODIFY REPLAY: Error, los datos introducidos no se corresponden con ninguna grabación existente");
                return("Los datos introducidos no se corresponden con ninguna grabacion existente");
            }
            
            sleep = Integer.valueOf(packetsOP2.get(3).get(0));
            replayPackets = specialReplay(ch, inicio, fin, packetsOP2);
            
        }else{
            replayPackets = normalReplay(ch, inicio, fin, packetsOP1);
        }

        if(replayPackets.equals("Error al intentar cortar los paquetes de datos") || replayPackets.equals("Las grabaciones solicitadas ya no existen, posiblemente fueran borradas por falta de espacio")
            || replayPackets.equals("Error al intentar concatenar los paquetes de datos")){
            return replayPackets;
        }


        //detenemos la reproduccion anterior, la original no modificada
        if(!reproducciones.get(num).stop().equals("Reproduccion detenida")){
            return("Error al detener la reproduccion anterior");
        }

        //si es un cambio de velocidad cambiamos el parametro en la rep.
        if(isSpeedChange){
            reproducciones.get(num).setSpeed(speed);
            //si hay tiempo de espera pre-reinyeccion lo asignamos también en base a la nueva velocidad
            if(sleep>0){sleep=(int) (sleep/speed);}
        }else{
            //si hay tiempo de espera pre-reinyeccion lo asignamos en base a la nueva velocidad de la rep.
            //solo hay que cambiarlo si la velocidad es >1
            if(reproducciones.get(num).speed>1 && sleep>0){
                sleep=(int) (sleep/reproducciones.get(num).speed);
            };
        }

        //cambiamos parametros de la reproduccion original a la nueva modificada
        reproducciones.get(num).setSleep(sleep);
        reproducciones.get(num).setJump(seconds);
        reproducciones.get(num).setStart((System.currentTimeMillis()/1000l));

        //iniciamos la reproduccion y devolvemos lo que imprima el metodo
        return reproducciones.get(num).start(replayPackets,mode);
    
    }

    //OBTENEMOS PAQUETES FINALES DE UNA REPRODUCCION NORMAL (1 GRABACION)
    public String normalReplay(int ch, long inicio, long fin, ArrayList<String> packets) throws InterruptedException{
        int capInicio = 0;
        int capFin = 0;
        
        //cogemos aquellos paquetes de la grabacion que esten en el rango de reproduccion
        for(int i=0; i<packets.size(); i++){
            long in = Long.parseLong(getFileTime(packets.get(i)));
            long fn = 0;
            if(i==(packets.size()-1)){fn=fin;}else{fn=Long.parseLong(getFileTime(packets.get(i+1)));}

            if(inicio>=in && inicio<fn){capInicio=i;}
            if(fin>in && fin<=fn){capFin=i;}
        }

        //comprobamos que existe cada pcap a reinyectar en la carpeta de capturas
        for(int x=capInicio; x<=capFin; x++){
            File f = new File("captures/"+packets.get(x));
            if(!f.exists()){
                log.addWarning("START REPLAY: Error, las grabaciones solicitadas ya no existen");
                this.packetsToDelete = packets.get(x);
                return("Las grabaciones solicitadas ya no existen, posiblemente fueran borradas por falta de espacio");
            }
        }

        //si hay que cortar o bien la pcap de inicio o la de fin lo hacemos y devolvemos los paquetes finales a reinyectar
        int cut = getCut(packets, capInicio, capFin, inicio, fin);
        return cut(packets, capInicio, capFin, cut, inicio, fin);
    }

    //OBTENEMOS QUE PAQUETES HAY QUE REINYECTAR DE UNA REPRODUCCION ESPECIAL ASI COMO SI HAY QUE DORMIR
    public ArrayList<ArrayList<String>> obtainSpecialPackets(int ch, long inicio, long fin){
        //este metodo devuelve un array de arrays de string
        ArrayList<ArrayList<String>> output = new ArrayList<>();

        //comprobamos que tipo de grabaciones tiene el rango a reinyectar y las añadimos al output
        ArrayList<String> packets1 = DB.getData(ch, inicio, fin,1); output.add(packets1);    //grabacion que corta el rango por el inicio (posicion 0 del array)
        ArrayList<String> packets2 = DB.getMultipleData(ch, inicio, fin); output.add(packets2); //grabacion o grabaciones que están dentro del rango (posicion 1 del array)
        ArrayList<String> packets3 = DB.getData(ch, inicio, fin,3); output.add(packets3);   //grabacion que corta el rango por el final (posicion 2 del array)

        if(packets1.get(0).equals("false") && packets2.get(0).equals("false") && packets3.get(0).equals("false")){
            //si no hay ningun tipo devolvemos null
            return null;
        }

        //comprobamos si hay que esperar segundos pre-inyeccion
        ArrayList<String> sleep = new ArrayList<>();

        if(!packets1.get(0).equals("false")){
            //si el rango tiene grabacion que corta por el inicio no habra que esperar nada
            sleep.add("0");
        }else{
            //si el rango no tiene grabacion que corta por el inicio habra que esperar
            //la diferencia de segundos entre el inicio de reinyeccion y el primer paquete a reinyectar
            long realInicio;
            if(!packets2.get(0).equals("false")){
                realInicio = Long.parseLong(getFileTime(packets2.get(0)));
            }else{
                realInicio = Long.parseLong(getFileTime(packets3.get(0)));
            }
            int sleepSecs = (int) (realInicio - inicio);
            sleep.add(Integer.toString(sleepSecs));
        }

        //añadimos la espera al output (posicion 3 del array)
        output.add(sleep);
        return output;
    }

    //OBTENEMOS PAQUETES FINALES DE UNA REPRODUCCION ESPECIAL (MULTIPLES GRABACION)
    public String specialReplay(int ch, long inicio, long fin, ArrayList<ArrayList<String>> input) throws InterruptedException{
        String replayPackets = "";
        ArrayList<String> packets1 = input.get(0);
        ArrayList<String> packets2 = input.get(1);
        ArrayList<String> packets3 = input.get(2);

        //caso 1 - grabacion que corta por inicio
        if(!packets1.get(0).equals("false")){
            int capInicio = 0;
            int capFin = packets1.size()-1;

            //cogemos aquellos paquetes de la grabacion a partir del primero cuyo tiempo sea mayor al del inicio de la grabacion
            for(int i=0; i<packets1.size(); i++){
                long in = Long.parseLong(getFileTime(packets1.get(i)));
                long fn = 0;
                if(i==(packets1.size()-1)){fn=fin;}else{fn=Long.parseLong(getFileTime(packets1.get(i+1)));}

                if(inicio>=in && inicio<fn){capInicio=i;}
            }

            //comprobamos que existe cada pcap a reinyectar en la carpeta de capturas
            for(int x=capInicio; x<=capFin; x++){
                File f = new File("captures/"+packets1.get(x));
                if(!f.exists()){
                    log.addWarning("START REPLAY: Error, las grabaciones solicitadas ya no existen");
                    this.packetsToDelete = packets1.get(x);
                    return("Las grabaciones solicitadas ya no existen, posiblemente fueran borradas por falta de espacio");
                }
            }

            //cortamos la primera captura cogida para que su inicio coincida con el de la reinyeccion
            String cut = cut(packets1, capInicio, capFin, 1, inicio, fin);
            if(cut.equals("Error al intentar cortar los paquetes de datos")){return cut;}
            replayPackets+=cut;
        }

        //caso 2 - grabacion o grabaciones que están dentro del rango
        if(!packets2.get(0).equals("false")){
            //aqui directamente nos quedamos con todos los paquetes, sin cortes
            int capInicio = 0;
            int capFin = packets2.size()-1;

            //comprobamos que existe cada pcap a reinyectar en la carpeta de capturas
            for(int x=capInicio; x<=capFin; x++){
                File f = new File("captures/"+packets2.get(x));
                if(!f.exists()){
                    log.addWarning("START REPLAY: Error, las grabaciones solicitadas ya no existen");
                    this.packetsToDelete = packets2.get(x);
                    return("Las grabaciones solicitadas ya no existen, posiblemente fueran borradas por falta de espacio");
                }
            }

            //cut en este caso simplemente añade 'captures/' al inicio de cada nombre de paquete
            String cut = cut(packets2, capInicio, capFin, -1, inicio, fin);
            replayPackets+=cut;
        }

        //caso 3 - grabacion que corta por final
        if(!packets3.get(0).equals("false")){
            int capInicio = 0;
            int capFin = 0;

            //cogemos aquellos paquetes de la grabacion hasta el primero cuyo tiempo sea mayor al del final de la grabacion
            for(int i=0; i<packets3.size(); i++){
                long in = Long.parseLong(getFileTime(packets3.get(i)));
                long fn = 0;
                if(i==(packets3.size()-1)){fn=fin;}else{fn=Long.parseLong(getFileTime(packets3.get(i+1)));}

                if(fin>in && fin<=fn){capFin=i;}
            }

            //comprobamos que existe cada pcap a reinyectar en la carpeta de capturas
            for(int x=capInicio; x<=capFin; x++){
                File f = new File("captures/"+packets3.get(x));
                if(!f.exists()){
                    log.addWarning("START REPLAY: Error, las grabaciones solicitadas ya no existen");
                    this.packetsToDelete = packets3.get(x);
                    return("Las grabaciones solicitadas ya no existen, posiblemente fueran borradas por falta de espacio");
                }
            }

            //cortamos la ultima captura cogida para que su final coincida con el de la reinyeccion
            String cut = cut(packets3, capInicio, capFin, 2, inicio, fin);
            if(cut.equals("Error al intentar cortar los paquetes de datos")){return cut;}
            replayPackets+=cut;
        }

        //por si hay tiempos vacios (sin entrada de paquetes) entre varias grabaciones
        //concatenamos todos los paquetes a reinyectar en uno solo, así respetaremos estos tiempos 
        //vacios
        long count = replayPackets.chars().filter(cha -> cha == ' ').count();
        log.addInfo("REPLAY MERGE: Se va a proceder a concatenar "+count+" paquete/s");
        String cutName = "captures/merge"+inicio+ch;
        String cmd = "mergecap -w "+cutName+"  "+replayPackets;
        Process process;
        try {
            process = createProcess(cmd);
        } catch (Exception e) {
            log.addSevere("REPLAY MERGE: Error al intentar concatenar los paquetes de datos {"+e+"}");
            return("Error al intentar concatenar los paquetes de datos");
        }

        while(process.isAlive()){
            Thread.sleep(200);
        }

        //comprobamos que se haya concatenado correctamente
        File f = new File(cutName);
        if(!f.exists()){
            log.addSevere("REPLAY MERGE: Error al intentar concatenar los paquetes de datos");
            return("Error al intentar concatenar los paquetes de datos");
        }

        //directamente devolvemos el archivo concatenado
        log.addInfo("REPLAY MERGE: Grabación especial, se han concatenado varias grabaciones");
        return cutName+" ";
    }

    //METODO DE CORTE DE PCAPS
    private static String cut(ArrayList<String> packets, int capI, int capF, int cut, long in, long fn) throws InterruptedException{
        //parametros de entrada: packets (todos los paquetes de la reinyeccion), capI (captura a cortar por inicio o por fin + inicio),
        //capF (captura a cortar por fin), cut (tipo de corte), in (tiempo de inicio de la rep), fn (tiempo de final de la rep)
        String packs = "";
        if(cut==0 || cut==1 || cut==2){
            //0 = cortamos una pcap por inicio y fin
            //1 = cortamos una pcap por inicio
            //2 = cortamos una pcap por fin
            log.addInfo("REPLAY CUT: Se va a proceder a cortar 1 archivo de datos");
            //el nombre del archivo cortado sera temp + el tiempo de inicio
            String cutName = "temp"+in;
            String cmd = "";
            if(cut==0){cmd="editcap -A '"+epochToDateExact(in)+"' -B '"+epochToDateExact(fn)+"' "+"captures/"+packets.get(capI)+" "+"captures/"+cutName;}
            if(cut==1){cmd="editcap -A '"+epochToDateExact(in)+"' "+"captures/"+packets.get(capI)+" "+"captures/"+cutName;}
            if(cut==2){cmd="editcap -B '"+epochToDateExact(fn)+"' "+"captures/"+packets.get(capF)+" "+"captures/"+cutName;}
            Process process;
            try {
                process = createProcess(cmd);
            } catch (Exception e) {
                log.addSevere("REPLAY CUT: Error al intentar cortar los paquetes de datos {"+e+"}");
                return("Error al intentar cortar los paquetes de datos");
            }

            //ahora debemos añadir '/captures' al inicio de todas las pcaps a reinyectar
            if(cut==0 || cut==1){packs+="captures/"+cutName + " ";}
            if(cut==1){
                for(int i=(capI+1); i<=capF; i++){
                    packs+="captures/"+packets.get(i)+" ";
                }
            }
            if(cut==2){
                for(int i=(capI); i<capF; i++){
                    packs+="captures/"+packets.get(i)+" ";
                }
                packs+="captures/"+cutName + " ";
            }

            while(process.isAlive()){
                Thread.sleep(200);
            }

            //comprobamos que la nueva pcap cortada se ha creado correctamente
            File f = new File("captures/"+cutName);
            if(!f.exists()){
                log.addSevere("REPLAY CUT: Error al intentar cortar los paquetes de datos");
                return("Error al intentar cortar los paquetes de datos");
            }

            log.addInfo("REPLAY CUT: Capturas de datos cortada correctamente");
            return(packs);
        }

        if(cut==3){
            //3 = cortamos una pcap por inicio y otra por fin
            log.addInfo("REPLAY CUT: Se van a proceder a cortar 2 archivos de datos");
            //el nombre del archivo cortado por inicio sera temp + el tiempo de inicio
            String cutName1 = "temp"+in;
            String cmd1 = "editcap -A '"+epochToDateExact(in)+"' "+"captures/"+packets.get(capI)+" "+"captures/"+cutName1;
            //el nombre del archivo cortado por final sera temp + el tiempo de final
            String cutName2 = "temp"+fn;
            String cmd2 = "editcap -B '"+epochToDateExact(fn)+"' "+"captures/"+packets.get(capF)+" "+"captures/"+cutName2;
            
            Process process1; Process process2;
            try {
                process1 = createProcess(cmd1);
                process2 = createProcess(cmd2);
            } catch (Exception e) {
                log.addSevere("REPLAY CUT: Error al intentar cortar los paquetes de datos {"+e+"}");
                return("Error al intentar cortar los paquetes de datos");
            }

            //ahora debemos añadir '/captures' al inicio de todas las pcaps a reinyectar
            packs+="captures/"+cutName1 + " ";
            for(int i=(capI+1); i<capF; i++){
                packs+="captures/"+packets.get(i)+" ";
            }
            packs+="captures/"+cutName2 + " ";

            while(process1.isAlive() || process2.isAlive()){
                Thread.sleep(200);
            }

             //comprobamos que las nuevas pcaps cortadas se han creado correctamente
            File f1 = new File("captures/"+cutName1); File f2 = new File("captures/"+cutName2);
            if(!f1.exists() || !f2.exists()){
                log.addSevere("REPLAY CUT: Error al intentar cortar los paquetes de datos");
                return("Error al intentar cortar los paquetes de datos");
            }

            log.addInfo("REPLAY CUT: Capturas de datos cortadas correctamente");
            return(packs);
        }

        //-1 = simplemente añadimos '/captures' al inicio de todas las pcaps a reinyectar
        for(int i=(capI); i<=capF; i++){
            packs+="captures/"+packets.get(i)+" ";
        }
        return(packs);
    }

    //OBTENEMOS EL TIPO DE CORTE A APLICAR EN LOS PAQUETES DE LA REINYECCION
    //ESTE METODO SOLO SE USA EN REINYECCION NORMAL (1 GRABACION)
    private static int getCut(ArrayList<String> packets, int capI, int capF, long inicio, long fin){
        //0 = cortar una PCAP por inicio y fin juntas | 1 = cortar solo inicio | 2 = cortar solo fin | 3 = cortar fin e inicio separado
        long in = Long.parseLong(getFileTime(packets.get(capI)));
        long fn = 0;
        if(capF!=(packets.size()-1)){fn=Long.parseLong(getFileTime(packets.get(capF+1)));}

        if(capI == capF && inicio!=in && fin!=fn){return 0;}
        if(inicio!=in && fin!=fn){return 3;}
        if(inicio!=in){return 1;}
        if(fin!=fn){return 2;}

        //-1 = coincide exactamente
        return -1;
    }

    //DEVUELVE EL ESTADO DE LAS REPRODUCCIONES: INFORMACION DE LAS ACTIVAS
    public ArrayList<String> getStatus(){
        checkProcess();
        ArrayList<String> estados = new ArrayList<>();
        boolean exists = false;

        //recorremos reproduccion a reproduccion imprimiendo su estado
        for(int i=0; i<reproducciones.size(); i++){
            if(reproducciones.get(i).on){
                exists = true;
                //imprimos reproduccion y el canal que esta reinyectando
                String iter = "Reproduccion "+(reproducciones.get(i).id+1)+": Canal "+reproducciones.get(i).canal+" - ";
                //imprimimos inicio y fin de la rep en formato fecha normal
                iter+= epochToDate(reproducciones.get(i).iTime)+" a "+epochToDate(reproducciones.get(i).iTime+reproducciones.get(i).length)+" - ";
                int secondsTotal = reproducciones.get(i).length; 
                int secondsPassed = (int) (((System.currentTimeMillis()/1000l) - reproducciones.get(i).start)*reproducciones.get(i).speed) + reproducciones.get(i).jump;
                String cero = ""; if(secondsPassed%60<10){cero="0";}; String cero2 = ""; if(secondsTotal%60<10){cero2="0";};
                //imprimimos cuanto lleva la reproduccion respecto al total y su velocidad
                iter+=secondsPassed/60+":"+cero+secondsPassed%60+" de "+secondsTotal/60+":"+cero2+secondsTotal%60;
                iter+=" - Velocidad: x"+reproducciones.get(i).speed;

                estados.add(iter);
            }
        }

        if(!exists){
            //sino hay ninguna rep lo imprimimos 
            log.addWarning("REPRODUCCIONES: No hay ninguna reproducción activa");
            estados.add("No hay ninguna reproduccion activa en el momento. Para iniciar una vaya a /replay");
        }

        return estados;
    }

    public ArrayList<Double> getStatusRaw(){
        checkProcess();
        ArrayList<Double> estados = new ArrayList<>();
        boolean exists = false;

        //recorremos reproduccion a reproduccion imprimiendo su estado
        for(int i=0; i<reproducciones.size(); i++){
            if(reproducciones.get(i).on){
                exists = true;
                //imprimos reproduccion y el canal que esta reinyectando
                estados.add((double) (reproducciones.get(i).id+1));
                estados.add((double) reproducciones.get(i).canal);
                //imprimimos inicio y fin de la rep en formato fecha normal
                estados.add((double) reproducciones.get(i).iTime);
                estados.add((double) reproducciones.get(i).iTime+reproducciones.get(i).length);

                int secondsPassed = (int) (((System.currentTimeMillis()/1000l) - reproducciones.get(i).start)*reproducciones.get(i).speed) + reproducciones.get(i).jump;
                estados.add((double) secondsPassed);
                //imprimimos cuanto lleva la reproduccion respecto al total y su velocidad
                estados.add(reproducciones.get(i).speed);
            }
        }

        if(!exists){
            //sino hay ninguna rep lo imprimimos 
            log.addWarning("REPRODUCCIONES: No hay ninguna reproducción activa");
        }

        return estados;
    }

    //DETIENE UNA REPRODUCCION
    public static String stopReplay(int num) {
        checkProcess();

        num = num - 1;  //la reproduccion en el array de reps. es el num de la rep. - 1
        if(reproducciones.size()<=(num) || !reproducciones.get(num).on){
            //si la reproduccion no existe devolvemos error
            num++;
            log.addWarning("STOP REPLAY: Error, la reproducción indicada "+(num)+" no existe"); 
            return "La reproduccion indicada "+(num)+" no existe, revise las existentes con /reproducciones";
        }

        return reproducciones.get(num).stop();
    }

    //COMPROBAMOS EL ESTADO DE LAS REPRODUCCIONES ACTIVAS
    private static void checkProcess(){
        for(int i=0; i<reproducciones.size(); i++){
            if(reproducciones.get(i).on){
                boolean specialCase = false; //special: la grabación está durmiendo y aún no se ha inciado
                int secondsPassed = (int) ((System.currentTimeMillis()/1000l) - reproducciones.get(i).start);
                if(reproducciones.get(i).sleep>0 && secondsPassed<reproducciones.get(i).sleep){specialCase=true;}

                if(!specialCase && !reproducciones.get(i).process.isAlive()){
                    //si el proceso de la reproduccion ya no existe pero esta sigue encendida la apagamos
                    reproducciones.get(i).setOff();
                }
            }
        }
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

    //CONVERSOR DE TIMEPO EPOCH A FORMATO DE FECHA NORMAL (PARA QUE EL CLIENTE LA VISUALICE)
    private static String epochToDate(long e){
        LocalDateTime localDateTime = LocalDateTime.ofInstant(Instant.ofEpochSecond(e), ZoneId.systemDefault());
        //formato de fecha: dd-MM-yyyy HH:mm:ss
        DateTimeFormatter customFormat = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
        return localDateTime.format(customFormat);
    }

    //CONVERSOR DE TIMEPO EPOCH A FORMATO DE FECHA EXACTA (PARA USARSE EN COMANDOS)
    private static String epochToDateExact(long e){
        Date date = new Date(e*1000);

        SimpleDateFormat sdf;
        //formato de fecha: yyyy-MM-dd'T'HH:mm:ss.SSSXXX
        sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(date);
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

    //devuelve el tiempo (que es el tiempo de inicio) del nombre de una pcap
    private static String getFileTime(String f){
        int division = -2;
        //buscamos el numero desde el segundo '_' hasta el final del string
        for(int i=0; i<f.length(); i++){
            if(f.charAt(i)=='_'){
                if(division==-2){
                    division++;
                }else{
                    division=i; break;
                }
            }
        }
        if(division<=0){return "error";}

        return f.substring(division+1);
    }

    //chequeamos que tcpreplay y wireshark esten instaladas
    public static int checkInstallations() throws IOException {
        Scanner s1 = new Scanner(Runtime.getRuntime().exec("apt list tcpreplay").getInputStream()).useDelimiter("\\A");
        String output1 = s1.hasNext() ? s1.next() : "";
        String[] lines1 = output1.split("\r\n|\r|\n");

        Scanner s2 = new Scanner(Runtime.getRuntime().exec("apt list wireshark").getInputStream()).useDelimiter("\\A");
        String output2 = s2.hasNext() ? s2.next() : "";
        String[] lines2 = output2.split("\r\n|\r|\n");


        if(lines1.length<2 && lines2.length<2){return 0;}   //ninguna instalada
        if(lines1.length<2){return 1;}  //tcpreplay no instalado
        if(lines2.length<2){return 2;}  //wireshark no instalado
        return 3;   //ambas instaladas
    }

    //chequeamos si la interfaz existe
    public static boolean checkInterface(String in) throws IOException {
        Scanner s1 = new Scanner(Runtime.getRuntime().exec("ip a show "+in+" up").getInputStream()).useDelimiter("\\A");
        String output1 = s1.hasNext() ? s1.next() : "";
        String[] lines1 = output1.split("\r\n|\r|\n");

        if(lines1.length<2){return false;} 
        return true; 
    }

    public static boolean deletePackets(){
        if(packetsToDelete.equals("")){
            return false;
        }else{
            DB.deletionMechanism(packetsToDelete);
            return true;
        }
    }


    //CLASE REPRODUCCION
    class reproduccion{
        int id;         //id
        Long start;     //inicio actual de la reproducción
        Long iTime;     //inicio real de la grabación que se está reproduciendo
        Integer jump;   //si la reproduccion ha hecho un salto, o lo va hacer (segundos a los que se ha saltado)
        Double speed;   //velocidad
        Process process;//proceso de reproduccion
        Boolean on;     //estado de la reproduccion (true encencido, false apagado)
        Integer length; //longuitud de la rep (en segundos)
        Integer canal;  //canal
        Integer sleep;  //segundos de espera previos a la reinyeccion
        Task wait;      //tarea encargada de dormir previamente a iniciar la reinyeccion

        //creacion de la rep, especificando: comienzo actual, comienzo real del rango a reinyectar, longuitud, y canal
        reproduccion(long s, long i, int l, int c){
            this.on = false;
            this.process = null;
            this.start = s;
            this.iTime = i;
            this.length = l;
            this.canal = c;
            this.sleep = 0;
            this.jump = 0;
            this.speed = 1.0;
        }

        public void setOff() {
            this.on = false;
        }

        public void setID(int id) {
            this.id = id;
        }

        public void setStart(Long start) {
            this.start = start;
        }

        public void setITime(Long iTime) {
            this.iTime = iTime;
        }

        public void setLength(Integer length) {
            this.length = length;
        }

        public void setCanal(Integer canal) {
            this.canal = canal;
        }

        public void setSleep(Integer sleep) {
            this.sleep = sleep;
        }

        public void setJump(Integer jump) {
            this.jump = jump;
        }

        public void setSpeed(Double speed) {
            this.speed = speed;
        }

        //INICIO DE REPRODUCCION (PUENTE)
        public String start(String replayPackets, int mode){
            //mode: 0 inicio normal, 1 salto, 2 cambio de velocidad
            if(sleep==0){
                return startNormal(replayPackets,mode);
            }else{
                return startSpecial(replayPackets,mode);
            }
        }

        //INICIO NORMAL DE REPRODUCCION (SIN ESPERA PREINYECCION)
        public String startNormal(String replayPackets, int mode){
            Long inicio = iTime;
            Long fin = inicio + length;
            String speedChange = "";
            //si la velocidad no es igual a 1 (velocidad por defecto de tcpreplay) debemos especificarla en el comando
            if(speed!=1.0){speedChange="-x "+speed;}

            try {
                //creamos el proceso y esperamos 1 segundo a ver si se ha creado correctamente
                Process p = createProcess("tcpreplay "+speedChange+" -i "+netinterface+" "+replayPackets);
                Thread.sleep(1000);
                
                //Comprobamos que el proceso se ha iniciado bien y está activo
                if(processFinished(p)!=-1 && processFinished(p)!=0){
                    if(mode==0){
                        log.addSevere("START REPLAY: Error al iniciar la reproduccion");
                        return("Error al iniciar la reproduccion: asegurese de que la ejecucion es con permisos de administrador");
                    }
                    if(mode==1){
                        log.addSevere("JUMP REPLAY: Error al saltar a un punto de la reproduccion");
                        return("Error al saltar a un punto de la reproduccion: asegurese de que la ejecucion es con permisos de administrador");
                    }
                    if(mode==2){
                        log.addSevere("SPEED REPLAY: Error al modificar la velocidad de la reproduccion");
                        return("Error al modificar la velocidad de la reproduccion: asegurese de que la ejecucion es con permisos de administrador");
                    }
                }else{
                    //asignamos a el proceso a su variable correspodente y marcamos la grabacion como encendida
                    process = p;
                    on=true;
                    if(mode==0){
                        log.addInfo("START REPLAY: reproducción iniciada del canal "+canal+" desde "+epochToDate(inicio)+" a "+epochToDate(fin));
                        return("Reproduccion iniciada correctamente: grabacion del canal "+canal+" desde "+epochToDate(inicio)+" a "+epochToDate(fin)); 
                    }
                    if(mode==1){
                        log.addInfo("JUMP REPLAY: reproducción "+Integer.sum(id, 1)+" saltada al segundo "+jump);
                        return("Reproduccion saltada correctamente: reproduccion "+Integer.sum(id, 1)+" saltada al segundo "+jump); 
                    }
                    if(mode==2){
                        log.addInfo("SPEED REPLAY: velocidad de reproducción "+Integer.sum(id, 1)+" cambiada a x"+speed);
                        return("Velocidad de reproduccion cambiada correctamente: reproduccion "+Integer.sum(id, 1)+" cambiada a x"+speed); 
                    }
                }

            } catch (Exception e) {
                //si se produce una excepcion devolvemos fallo
                if(mode==0){
                    log.addSevere("START REPLAY: Error al iniciar la reproduccion {"+e+"}");
                }
                if(mode==1){
                    log.addSevere("JUMP REPLAY: Error al saltar la reproduccion {"+e+"}");
                }
                if(mode==2){
                    log.addSevere("SPEED REPLAY: Error al cambiar velocidad de reproduccion {"+e+"}");
                }
                return("Error al ejecutar tcpreplay "+e);
            }

            //si en este punto no se ha devuelto nada un error habra ocurrido (llegar aqui es un caso muy improbable)
            return "Error";
        }

        //INICIO ESPECIAL DE REPRODUCCION (CON ESPERA PREINYECCION)
        public String startSpecial(String replayPackets, int mode){
            Long inicio = iTime;
            Long fin = inicio + length;

            //creamos una tarea que se ocupara de esperar los segundos necesarios y despues iniciar
            wait = new Task(replayPackets,sleep);
            on=true;    //marcamos la grabacion como encendida
            wait.start();
            log.addInfo("REPLAY: la grabación tiene un inicio sin tráfico grabado, que comenzará a enviarse en "+sleep+ " segundos");
            if(mode==0){
                log.addInfo("START REPLAY: reproducción "+Integer.sum(id, 1)+" iniciada del canal "+canal+" desde "+epochToDate(inicio)+" a "+epochToDate(fin));
                return("Reproduccion iniciada correctamente: grabacion del canal "+canal+" desde "+epochToDate(inicio)+" a "+epochToDate(fin)); 
            }
            if(mode==1){
                log.addInfo("JUMP REPLAY: reproducción "+Integer.sum(id, 1)+" saltada al segundo "+jump);
                return("Reproduccion saltada correctamente: reproduccion "+Integer.sum(id, 1)+" saltada al segundo "+jump); 
            }
            if(mode==2){
                log.addInfo("SPEED REPLAY: velocidad de reproducción "+Integer.sum(id, 1)+" cambiada a x"+speed);
                return("Velocidad de reproduccion cambiada correctamente: reproduccion "+Integer.sum(id, 1)+" cambiada a x"+speed); 
            }

            //si en este punto no se ha devuelto nada un error habra ocurrido (llegar aqui es un caso muy improbable)
            return "Error";
        }

        //INICIO ESPECIAL DE REPRODUCCION (DESPUES DE HACER LA ESPERA PREINYECCION)
        public void startSpecial2(String replayPackets){
            String speedChange = "";
            //si la velocidad no es igual a 1 (velocidad por defecto de tcpreplay) debemos especificarla en el comando
            if(speed!=1.0){speedChange="-x "+speed;}

            log.addInfo("REPLAY: tras el inicio sin tráfico, la reproducción "+Integer.sum(id, 1)+" se comenzará a enviar");
            try {
                //creamos el proceso y esperamos 1 segundo a ver si se ha creado correctamente
                Process p = createProcess("tcpreplay "+speedChange+" -i "+netinterface+" "+replayPackets);
                Thread.sleep(1000);
                
                //Comprobamos que el proceso se ha iniciado bien y está activo
                if(processFinished(p)!=-1 && processFinished(p)!=0){
                    log.addSevere("START REPLAY: Error al iniciar la reproduccion con tcpreplay");
                    on=false;
                }else{
                    //asignamos a el proceso a su variable correspodente y marcamos la grabacion como encendida
                    on=true;
                    process = p;
                    log.addInfo("START REPLAY: reproducción iniciada correctamente con tcpreplay"); 
                }

            } catch (Exception e) {
                //si se produce una excepcion logueamos el fallo
                on=false;
                log.addSevere("START REPLAY: Error al iniciar la reproduccion con tcpreplay {"+e+"}");
            }
        }

        //DETENCION DE REPRODUCCION
        public String stop(){
            int secondsPassed = (int) ((System.currentTimeMillis()/1000l) - start);

            if(sleep>0 && secondsPassed<sleep){
                //si la reproduccion no ha empezado aun (esta durmiendo) simplemente detenemos la tarea de espera y marcamos como apagada
                wait.interrupt();
                on = false;
                log.addInfo("STOP REPLAY: Reproducción "+Integer.sum(id, 1)+" detenida");
                return("Reproduccion detenida");  
            }else{
                try {
                    //detenemos la rep y esperamos durante 7 loops de 0.2 segundos como maximo a que se haya detenido 
                    process.destroy();
                    int tries = 0;
                    while(processFinished(process)==-1 && tries<7){
                        Thread.sleep(200);
                        tries++;
                    }
                    
                    //si no se ha detenido devolvemos error
                    if(processFinished(process)==-1){
                        log.addSevere("STOP REPLAY: Error al detener la reproducción "+Integer.sum(id, 1));
                        return("Error al detener la reproduccion");
                    }else{
                        //si se ha detenido la marcamos como apagada
                        on = false;
                        log.addInfo("STOP REPLAY: Reproducción "+Integer.sum(id, 1)+" detenida");
                        return("Reproduccion detenida");  
                    }
        
                } catch (Exception e) {
                    //si se produce una excepcion devolvemos fallo
                    log.addSevere("STOP REPLAY: Error al detener la reproducción "+Integer.sum(id, 1)+" {"+e+"}");
                    return("Error al ejecutar un comando " + e);
                }
            }
        }

        //TAREA ENCARGADA DE DORMIR UNA REPRODUCCION HASTA QUE EMPIECE SU REINYECCION
        class Task extends Thread{
            String replayPackets;
            Integer sleep;
    
            Task(String name, Integer s){
                super(name);
                this.replayPackets = name;
                this.sleep = s;
            }
    
            public void run(){
                try {
                    //esperamos hasta que el primer paquete tenga que entrar a la red
                    Thread.sleep(sleep*1000);
                    //comenzamos la reinyeccion
                    startSpecial2(replayPackets);
                } catch (InterruptedException e) {
                    //detenemos la tarea (que estaria durmiendo)
                    Thread.currentThread().interrupt();
                }
            }
        }
    }
}
