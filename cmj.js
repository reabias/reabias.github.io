
var table = document.getElementById("data-table");
var connection_state = document.getElementById("connection-state");
var jump_state = document.getElementById("jump-state");

if ("serial" in navigator) {
    // The Web Serial API is supported.
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
              reader.releaseLock();
            }
          }
      }
}

function renameTableHeader(){
  var athlete_name = document.getElementById("athlete-name").value;
  console.log(athlete_name);
  document.getElementById("table-athlete-name").innerHTML = athlete_name;
}

function exportTable(){

  let theData = [];

  for (var i = 0, row; row = table.rows[i]; i++) {
    var row_cells = [];
    //rows would be accessed using the "row" variable assigned in the for loop
    for (var j = 0, col; col = row.cells[j]; j++) {
      //iterate through columns
      row_cells.push(col.innerHTML);
    } 
    theData.push(row_cells);
 }
  // Format it to CSV: join the contents inside the nested array into single string with comma separation between items and join the resulting strings with line break separation
  let csvFormat = theData.map(row => row.join(",")).join("\n");
  
  // Call the function, passing in a MIME of text/csv and setting the file extension to csv
  startBlobDownload('text/csv', csvFormat, "test-spreadsheet.csv");
}

function startBlobDownload(MIME, file, filename) {
    const data = file;
    const myBlob = new Blob([data], {type: MIME})
    blobURL = URL.createObjectURL(myBlob);

    const a = document.createElement('a');
    a.setAttribute('href', blobURL);
    a.setAttribute('download', filename);

    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(blobURL);
}