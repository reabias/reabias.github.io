
if ("serial" in navigator) {
    // The Web Serial API is supported.
    var table = document.getElementById("device-return");
    var connection_state = document.getElementById("connection-state");
    var jump_state = document.getElementById("jump-state");
    var dados = {"tempo": [], "altura": []};
    var tempo = 0;
    var altura = 0;
    var ended = false;

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
                if(value == 0){
                  console.log("Pronto para saltar:");
                  jump_state.style.backgroundColor = "#20b825"
                }
                else if(!value.includes(",")){
                  dados.altura.push(value);
                }
                else if(value.includes(",")){
                  infos = value.split(",");
                  dados.altura.push(infos[0]);
                  dados.tempo.push(infos[1]);
                  dados.altura = dados.altura.join('');
                  tempo = parseFloat(dados.tempo);
                  altura = parseFloat(dados.altura);
                  console.log(dados.altura);
                  console.log(dados.tempo);
                  ended = true;
                }
              }
              if(ended){
                // Create an empty <tr> element and add it to the 1st position of the table:
                var row = table.insertRow(-1);

                // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);

                // Add some text to the new cells:
                cell1.innerHTML = tempo;
                cell2.innerHTML = altura;

                jump_state.style.backgroundColor = "#b82020"
                dados = {"tempo": [], "altura": []};
                ended = false;
              }
            }
            } catch (error) {
              // TODO: Handle non-fatal read error.
            }
          }
      }
}   