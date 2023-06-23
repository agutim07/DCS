DCS - Data Capture System - Backend

○ Instalaciones necesarias:

    • Java: JDK y JRE (mínimo Java 8).
    • En la carpeta lib se debe incluir el .jar de SQLite JDBC
    Para Linux:
        • Tcpdump
        • Tcpreplay (Aviso: la versión 4.3.4 no es válida)
        • Wireshark
    Para Windows:
        • Tcpdump de Microolap

○ Ejecución:

    • En Linux: ./startDCS.sh (Aviso: antes de ejecutarse se le debe haber otorgado permisos de ejecución con chmod +x startDCS.sh).
    • En Windows: javac -classpath . -d ./bin/ ./src/*.java ; java -cp "lib/*;./bin" Server
