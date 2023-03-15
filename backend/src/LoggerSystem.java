import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.logging.FileHandler;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

//CLASE LOGGER ->   CREA EL ARCHIVO DE LOGS (SINO ESTA YA CREADO) Y VA AÑADIENDO NUEVOS

public class LoggerSystem {
    private final static Logger LOG = Logger.getLogger("DataCaptureSystem");

    public LoggerSystem() throws SecurityException, IOException{
        //CREA LA CARPETA DE 'LOGS' SI ESTA NO ESTA YA CREADA
        File logsFolder = new File("logs");
        if(!logsFolder.exists() || !logsFolder.isDirectory()){logsFolder.mkdir();}

        Logger globalLogger = Logger.getLogger("");
        //CODIGO PARA ELIMINAR IMPRESION DE LOGS EN CONSOLA
        Handler[] handlers = globalLogger.getHandlers();
        for (Handler handler : handlers) {
            globalLogger.removeHandler(handler);
        }
        //
        globalLogger.setLevel(Level.CONFIG);

        //CREA Y CONFIGURA EL ARCHIVO CON LOS LOGS
        Handler fileHandler = new FileHandler("logs/DCS.log", true);

        fileHandler.setFormatter(new SimpleFormatter() {
          private static final String format = "[%1$tF %1$tT] [%2$-7s] %3$s %n";
          @Override
          public synchronized String format(LogRecord lr) {
              return String.format(format,
                      new Date(lr.getMillis()),
                      lr.getLevel().getLocalizedName(),
                      lr.getMessage()
              );
          }
        });

        LOG.addHandler(fileHandler);
        fileHandler.setLevel(Level.ALL);
    }

    public void addSevere(String output){LOG.log(Level.SEVERE, output);}    //añade un log de nivel severo (error grave)
    public void addWarning(String output){LOG.log(Level.WARNING, output);}  //añade un log de nivel aviso  (error suave)
    public void addInfo(String output){LOG.log(Level.INFO, output);}        //añade un log de nivel informacion
    public void addConfig(String output){LOG.log(Level.CONFIG, output);}    //añade un log de nivel configuracion
}
