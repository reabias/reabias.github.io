
if ("serial" in navigator) {
    // The Web Serial API is supported.
    var table = document.getElementById("device-return");
    var connection_state = document.getElementById("connection-state");

    document.getElementById("bluetooth-connect").onclick = async () => {
        // Prompt user to select any serial port.
        // Access to the custom Bluetooth RFCOMM service above will be allowed.
        const port = await navigator.serial.requestPort();
        await port.open({baudRate: 115200});
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        connection_state.innerHTML = "Estado da Conexão: <strong>Conectado</strong>"

        
        while (port.readable) {
          try {
            while (true) {
              const {value, done} = await reader.read();
              if (done) {
                // Allow the serial port to be closed later.
                reader.releaseLock();
                connection_state.innerHTML = "Estado da Conexão: <strong>Desconectado</strong>"
                break;
              }
              if (value) {
                console.log(value)
              }
            }
            } catch (error) {
              // TODO: Handle non-fatal read error.
            }
          }
      }
}   