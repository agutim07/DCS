import java.io.*;
import java.sql.*;
import java.util.ArrayList;

//CLASE DATABASE -> SE ENCARGA DE TODO EL CONTACTO CON LA BASE DE DATOS MySQL

public class DataBase {
    private static Connection connection = null;
    boolean status;
    private static LoggerSystem log;

    private static File captureFolder = new File("captures");   //esta es la carpeta donde almacenamos todas las capturas

    public static Connection getConn() throws Exception {
        //para crear la conexion con nuestra base de datos necesitamos el jar de sqlite (includo en la libreria) y la base de datos (en la carpeta db si se ha creado correctamente)
        if(connection == null){
            String jdbcURL = "jdbc:sqlite:database/dcs.db";
            connection = DriverManager.getConnection(jdbcURL);
        }

        return connection;
    }

    public DataBase(LoggerSystem inputLog){
        log = inputLog;
        
        try {
            //creamos la tabla de grabaciones si esta no existe
            String creation = "CREATE TABLE IF NOT EXISTS grabaciones (id INTEGER PRIMARY KEY AUTOINCREMENT, canal INTEGER NOT NULL, start INTEGER NOT NULL, stop INTEGER NOT NULL, archivos TEXT);";
            Statement statement = getConn().createStatement();
            statement.execute(creation);

            status = true;
            log.addInfo("Conexión a la base de datos completada con éxito");

        }catch(SQLException e){
            //una excepcion de sql significaria que no hemos podido conectar con la base de datos, error
            status = false;
            log.addSevere("No se ha podido conectar a la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido conectar con la base de datos, error
            status = false;
            log.addSevere("No se ha podido conectar a la base de datos {"+e+"}");
            e.printStackTrace();
        }
    }

    //OBTENEMOS LA CONFIGURACIÓN DE LA BASE DE DATOS
    public ArrayList<String> getConfig(){
        ArrayList<String> config = new ArrayList<>();

        String check = "SELECT * FROM config";
        
        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(check);

            ResultSet rs  = pstmt.executeQuery();
            if (rs.next()) {
                config.add(Integer.toString(rs.getInt("timeForNewPack")));
                config.add(Integer.toString(rs.getInt("maxPackets")));
                config.add(rs.getString("interface"));
                config.add(Integer.toString(rs.getInt("secondsToDelete")));
                config.add(Integer.toString(rs.getInt("maxMBs")));
                config.add(Integer.toString(rs.getInt("port")));
                config.add(rs.getString("key"));
            }

            log.addInfo("BD: Se ha obtenido la configuración de la base de datos correctamente");
        }catch (SQLException e) {
            //una excepcion de sql significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido obtener la configuración de la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido obtener la configuración de la base de datos {"+e+"}");
            e.printStackTrace();
        }

        return config;
    }

    //OBTENEMOS LOS CANALES DE LA BASE DE DATOS
    public ArrayList<String> getChannels(){
        ArrayList<String> canales = new ArrayList<>();
        int id = 0;

        String check = "SELECT * FROM canales";
        
        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(check);

            ResultSet rs  = pstmt.executeQuery();
            while (rs.next()) {
                id++;
                if(rs.getInt("on")==1){
                    canales.add(Integer.toString(id));
                    canales.add(rs.getString("filtro"));
                }
            }

            log.addInfo("BD: Se han obtenido los canales de la base de datos correctamente");
        }catch (SQLException e) {
            //una excepcion de sql significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido obtener los canales de la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido obtener los canales de la base de datos {"+e+"}");
            e.printStackTrace();
        }

        return canales;
    }

    //GUARDAR DATOS: PARA GUARDAR INFORMACION DE UNA GRABACION UNA VEZ LA HEMOS DETENIDO
    public void saveData(int ch, long start, long stop){
        if(!status){
            //si no consegumos conectar previamente con la base de datos no podremos ejecutar esta funcion
            log.addSevere("BD: No se ha podido subir la información a la base de datos ya que no hay conexión");
            return;
        }

        //en 'pcaps' almacenaremos todas las pcaps generadas por la grabacion separadas unas de otra con ';'
        String pcaps = "";
        ArrayList<String> packets = getPackets(ch, start, stop);
        if(packets.size()==0){return;}

        for(int i=0; i<packets.size(); i++){
            pcaps+=packets.get(i)+";";
        }

        //insertamos el canal donde se ha grabado, el inicio y el fin (en epoch), y las pcaps generadas
        String insert = "INSERT INTO grabaciones(canal, start, stop, archivos) VALUES(?,?,?,?)";
        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(insert);
            pstmt.setInt(1, ch);
            pstmt.setLong(2, start);
            pstmt.setLong(3, stop);
            pstmt.setString(4, pcaps);
            pstmt.executeUpdate();
            log.addInfo("BD: Se han subido los datos de la grabación satisfactoriamente");
        }catch (SQLException e) {
            //una excepcion de sql significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido subir la información de la grabación {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido subir la información de la grabación {"+e+"}");
            e.printStackTrace();
        }
    }

    //EXTRAER PCAP'S: GRABACIONES QUE INCLUYEN INICIO Y FIN, SOLO INICIO O SOLO FIN
    public ArrayList<String> getData(int ch, long start, long stop, int op){
        //op -> 0 = grabacion que corta inicio y fin 
        //      1 = grabación en la izq: corta inicio 
        //      3 = grabación a la derecha: corta fin

        String archivos = "";

        String check = "";
        switch(op){
            case 0: check = "SELECT archivos FROM grabaciones WHERE start <= ? AND stop >= ? AND canal = ?";
                    break;
            case 1: check = "SELECT archivos FROM grabaciones WHERE ? > start AND ? < stop AND ? > stop AND canal = ?";
                    break;
            case 3: check = "SELECT archivos FROM grabaciones WHERE ? > start AND ? < stop AND ? < start AND canal = ?";
                    break;
        }
        
        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(check);
            //dependiendo de la opcion cambiamos los parametros por unos u otros valores
            switch(op){
                case 0: pstmt.setLong(1, start);
                        pstmt.setLong(2, stop);
                        pstmt.setInt(3, ch);
                        break;
                case 1: pstmt.setLong(1, start);
                        pstmt.setLong(2, start);
                        pstmt.setLong(3, stop);
                        pstmt.setInt(4, ch);
                        break;
                case 3: pstmt.setLong(1, stop);
                        pstmt.setLong(2, stop);
                        pstmt.setLong(3, start);
                        pstmt.setInt(4, ch);
                        break;
            }

            ResultSet rs  = pstmt.executeQuery();
            while (rs.next()) {
                archivos = rs.getString("archivos");
            }

            log.addInfo("BD: Se ha consultado información con la base de datos satisfactoriamente");
        }catch (SQLException e) {
            //una excepcion de sql significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }

        //creamos un array donde irán las pcaps una a una
        ArrayList<String> packets = new ArrayList<>();
        if(archivos.equals("")){
            //si el archivo estaba vacio añadimos al incio del array "false"
            packets.add("false");
        }else{
            //vamos diviendo los archivos en segmentos separados por ';' y los añadimos al array
            //cada segmento es un nombre de pcap
            ArrayList<Integer> divisiones = new ArrayList<>();
            for (int n=0; n<archivos.length(); n++){ 
                if(archivos.charAt(n)==';'){divisiones.add(n);}
            }

            packets.add(archivos.substring(0, divisiones.get(0)));
            for(int i=1; i<divisiones.size(); i++){
                packets.add(archivos.substring(divisiones.get(i-1)+1, divisiones.get(i)));
            }
        }
        
        return packets;
    }

    //EXTRAER PCAP'S: GRABACIONES QUE ESTAN ENTRE INICIO Y FIN
    public ArrayList<String> getMultipleData(int ch, long start, long stop){
        //para grabaciones especiales, paquetes en el medio
        ArrayList<String> archivos = new ArrayList<>();
        boolean found = false;

        String check = "SELECT archivos FROM grabaciones WHERE ? <= start AND ? >= stop AND canal = ?";
        
        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(check);
            pstmt.setLong(1, start);
            pstmt.setLong(2, stop);
            pstmt.setInt(3, ch);

            ResultSet rs  = pstmt.executeQuery();
            while (rs.next()) {
                found = true;
                archivos.add(rs.getString("archivos"));
            }

            log.addInfo("BD: Se ha consultado información con la base de datos satisfactoriamente");
        }catch (SQLException e) {
            //una excepcion de sql significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }

        //creamos un array donde irán las pcaps una a una
        ArrayList<String> packets = new ArrayList<>();
        if(!found){
            //si no encontramos ninguna grabacion añadimos al incio del array "false"
            packets.add("false");
            return packets;
        }

        //extraemos los archivos de todas las grabaciones y los ordenamos
        archivos = sortMultipleRecordings(archivos);

        //vamos diviendo los archivos en segmentos separados por ';' y los añadimos al array
        //cada segmento es un nombre de pcap
        for(int x=0; x<archivos.size(); x++){
            ArrayList<Integer> divisiones = new ArrayList<>();
            for (int n=0; n<archivos.get(x).length(); n++){ 
                if(archivos.get(x).charAt(n)==';'){divisiones.add(n);}
            }

            packets.add(archivos.get(x).substring(0, divisiones.get(0)));
            for(int i=1; i<divisiones.size(); i++){
                packets.add(archivos.get(x).substring(divisiones.get(i-1)+1, divisiones.get(i)));
            }
        }
        
        return packets;
    }

    //EXTRAER PCAP'S: GRABACIONES DE UN CANAL
    public ArrayList<Long> getChannelData(int ch){
        ArrayList<Long> data = new ArrayList<>();

        String check = "SELECT start,stop FROM grabaciones WHERE canal = ?";
        
        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(check);
            pstmt.setLong(1, ch);

            ResultSet rs  = pstmt.executeQuery();
            while (rs.next()) {
                data.add(rs.getLong("start"));
                data.add(rs.getLong("stop"));
            }

            log.addInfo("BD: Se ha consultado información con la base de datos satisfactoriamente");
        }catch (SQLException e) {
            //una excepcion de sql significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            //una excepcion significaria que no hemos podido subir a la base de datos, error
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }

        return data;
    }

    //MECANISMO DE BORRADO: ELIMINA UNA PCAP DE UNA GRABACIÓN
    public void deletionMechanism(String file){
        log.addInfo("BD: Mecanismo de borrado automático en proceso");

        //extraemos el tiempo y el canal del nombre de la pcap
        long time = Long.parseLong(getFileTime(file));  
        int ch = Integer.valueOf(getFileCh(file));

        //buscamos la grabacion donde se encuentra esa pcap
        String check = "SELECT archivos FROM grabaciones WHERE ? > start AND ? < stop AND canal = ?";
        String archivos = "";

        PreparedStatement pstmt;
        try {
            pstmt = getConn().prepareStatement(check);
            pstmt.setLong(1, time);
            pstmt.setLong(2, time);
            pstmt.setInt(3, ch);

            ResultSet rs  = pstmt.executeQuery();
            while (rs.next()) {
                archivos = rs.getString("archivos");
            }

            log.addInfo("BD: Se ha consultado información con la base de datos satisfactoriamente");
        }catch (SQLException e) {
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }catch (Exception e) {
            log.addSevere("BD: No se ha podido consultar información con la base de datos {"+e+"}");
            e.printStackTrace();
        }

        //en el string de archivos de la grabacion eliminamos la pcap
        String nuevo = archivos.replace(file+";", "");

        if(nuevo.length()==0){
            //si eliminando la pcap no queda ninguna más, directamente borramos toda la grabación
            String delete = "DELETE FROM grabaciones WHERE ? > start AND ? < stop AND canal = ?";
            PreparedStatement pstmt2;

            try {
                pstmt2 = getConn().prepareStatement(delete);
                pstmt2.setLong(1, time);
                pstmt2.setLong(2, time);
                pstmt2.setInt(3, ch);

                pstmt2.executeUpdate();
                log.addInfo("BD: Se han borrado datos de grabaciones ya no disponibles");
            }catch (SQLException e) {
                log.addWarning("BD: No se ha podido borrar datos de grabaciones ya no disponibles {"+e+"}");
                e.printStackTrace();
            }catch (Exception e) {
                log.addWarning("BD: No se ha podido borrar datos de grabaciones ya no disponibles {"+e+"}");
                e.printStackTrace();
            }
        }else{
            //si eliminando la pcap quedan más, actualizamos los archivos de la grabacion sin la pcap eliminada
            String update = "UPDATE grabaciones SET archivos=? WHERE ? > start AND ? < stop AND canal = ?";
            PreparedStatement pstmt2;

            try {
                pstmt2 = getConn().prepareStatement(update);
                pstmt2.setString(1, nuevo);
                pstmt2.setLong(2, time);
                pstmt2.setLong(3, time);
                pstmt2.setInt(4, ch);

                pstmt2.executeUpdate();
                log.addInfo("BD: Se han actualizado datos de grabaciones eliminando archivos ya no disponibles");
            }catch (SQLException e) {
                log.addWarning("BD: No se ha podido actualizar datos de grabaciones ya no disponibles {"+e+"}");
                e.printStackTrace();
            }catch (Exception e) {
                log.addWarning("BD: No se ha podido actualizar datos de grabaciones ya no disponibles {"+e+"}");
                e.printStackTrace();
            }
        }
    }

    //OBTENER ARCHIVOS PCAP'S CAPTURADOS: RECORRE LA CARPETA DE CAPTURAS Y DEVUELVE LAS PCAPS DE UN RANGO Y CANAL
    private static ArrayList<String> getPackets(int ch, long start, long stop) {
        ArrayList<String> out = new ArrayList<>();
        File[] files = captureFolder.listFiles();
        int count = files.length;

        for (int i = 0; i < count; i++) {
            //recorremos todos los archivos dentro del directorio de capturas

            if (files[i].isFile() && files[i].getName().length()>=21 && files[i].getName().substring(0,9).equals("cap_canal")) {
                //para ser una pcap debe ser un archivo (no directorio) y una longuitud de minimo 21 (cap_canal{canal_num}_{epoch_time})
                String name = files[i].getName();
                boolean error = false;
                int channel = 0;
                long startTime = 0;

                try {
                    channel = Integer.valueOf(getFileCh(name));
                    startTime = Long.parseLong(getFileTime(name));  
                } catch (NumberFormatException e) {
                    //si no hay numeros donde deberia haberlos no es una pcap generada por este programa
                    error = true;
                }
                
                //miramos si el canal y tiempo de la pcap coincide con lo buscado
                if(!error && ch==channel && startTime>=start && startTime<stop){
                    out.add(name);
                }
            }
        }

        return sortPackets(out);
    }

    //ORDENAR PCAP'S: ORDENA PCAPS DE MENOR A MAYOR EN BASE A CUANDO SE GRABARON
    private static ArrayList<String> sortPackets(ArrayList<String> packs){
        String temp = "";

        for (int i = 0; i < packs.size(); i++) {     
            for (int j = i+1; j < packs.size(); j++) {
                Long itime = Long.parseLong(getFileTime(packs.get(i)));  
                Long jtime = Long.parseLong(getFileTime(packs.get(j)));  
                if(itime > jtime) {    
                    temp = packs.get(i);    
                    packs.set(i, packs.get(j));  
                    packs.set(j, temp);
                }     
            }    
        } 

        return packs;
    }

    //ORDENAR PCAP'S DE MULTIPLES GRABACIONES: ORDENA PCAPS DE DISTINTAS GRABACIONES
    private static ArrayList<String> sortMultipleRecordings(ArrayList<String> packs){
        String temp = "";
        //aqui no se ordenan los archivos, sino las distintas grabaciones y sus archivos de menor a mayor

        for (int i = 0; i < packs.size(); i++) {     
            for (int j = i+1; j < packs.size(); j++) {
                int iDiv = 0; int jDiv = 0;
                for (int n=0; n<packs.get(i).length(); n++){ 
                    if(packs.get(i).charAt(n)==';'){iDiv = n; break;}
                }
                for (int n=0; n<packs.get(j).length(); n++){ 
                    if(packs.get(j).charAt(n)==';'){jDiv = n; break;}
                }
                String iPack = packs.get(i).substring(0, iDiv);
                String jPack = packs.get(j).substring(0, jDiv);

                Long itime = Long.parseLong(getFileTime(iPack));  
                Long jtime = Long.parseLong(getFileTime(jPack));  
                if(itime > jtime) {    
                    temp = packs.get(i);    
                    packs.set(i, packs.get(j));  
                    packs.set(j, temp);
                }     
            }    
        } 

        return packs;
    }

    //devuelve el canal del nombre de una pcap
    private static String getFileCh(String f){
        int division = -2;
        //buscamos el numero desde 'cap_canal' (pos 9) hasta el segundo '_'
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

        return f.substring(9,division);
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
}
