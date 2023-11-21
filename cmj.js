
class CMJDevice{

  port;
  reader;
  writer;
  connection_state;
  jump_state;
  table_body;
  dados = {"tempo": [], "altura": []};
  tempo = 0;
  altura = 0;
  ended = false;

  readableStreamClosed;
  writableStreamClosed;

  constructor(connection_state, jump_state, table_body){
    this.connection_state = connection_state;
    this.jump_state = jump_state;
    this.table_body = table_body;
  }


  async connect(){
    const myBluetoothServiceUuid = "00001101-0000-1000-8000-00805f9b34fb";
    const port = await navigator.serial.requestPort({
      allowedBluetoothServiceClassIds: [myBluetoothServiceUuid],
      filters: [{ bluetoothServiceClassId: myBluetoothServiceUuid }],
    });
    await port.open({baudRate: 115200}).catch();
    const textDecoder = new TextDecoderStream();
    const textEncoder = new TextEncoderStream();
    this.readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    this.writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    this.writer = textEncoder.writable.getWriter();
    this.connection_state.innerHTML = "Estado da Conexão: <strong>Conectado</strong>"

    this.port = port;
    this.reader = reader;
    console.log(port.getInfo());
  }


  async read(){
    while (this.port.readable) {
      try {
        while (true) {
          const {value, done} = await this.reader.read();
          if (done) {
            break;
          }
          if (value) {
            if(value == 0){
              console.log("Pronto para saltar:");
              this.jump_state.style.backgroundColor = "#20b825"
            }
            else if(!value.includes(",")){
              this.dados.altura.push(value);
            }
            else if(value.includes(",")){
              var infos = value.split(",");
              this.dados.altura.push(infos[0]);
              this.dados.tempo.push(infos[1]);
              this.dados.altura = this.dados.altura.join('');
              this.tempo = parseFloat(this.dados.tempo);
              this.altura = parseFloat(this.dados.altura);
              this.ended = true;
            }
          }
          if(this.ended){
            // Create an empty <tr> element and add it to the 1st position of the table:
            var row = this.table_body.insertRow(-1);

            // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);

            // Add some text to the new cells:
            cell1.innerHTML = this.tempo;
            cell2.innerHTML = this.altura;

            this.jump_state.style.backgroundColor = "#b82020"
            this.dados = {"tempo": [], "altura": []};
            this.ended = false;
          }
        }
        } catch (error) {
          break;
        } finally {
          this.reader.releaseLock();
        }
      }
  }

  async disconnect(){

    this.reader.cancel();
    await this.readableStreamClosed.catch(() => { /* Ignore the error */ });

    this.writer.close();
    await this.writableStreamClosed;

    await this.port.close();
    this.connection_state.innerHTML = "Estado da Conexão: <strong>Desconectado</strong>"
  }
}

function renameTableHeader(){
  var athlete_name = document.getElementById("athlete-name").value;
  console.log(athlete_name);
  document.getElementById("table-athlete-name").innerHTML = athlete_name;
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

function exportTable(table){
  
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
  
  var athlete_name = document.getElementById("table-athlete-name").innerHTML;
  var data = new Date();
  var filename = `${athlete_name}CMJ - ${data.toDateString()}.csv`;

  // Call the function, passing in a MIME of text/csv and setting the file extension to csv
  startBlobDownload('text/csv', csvFormat, filename);
}

var table = document.getElementById("data-table")
var table_body = document.getElementById("data-table-body");
var connection_state = document.getElementById("connection-state");
var jump_state = document.getElementById("jump-state");
var cmj = new CMJDevice(connection_state, jump_state, table_body);

document.getElementById("bluetooth-connect").addEventListener( "click", async function() {
  await cmj.connect();
  this.style.display = "none";
  document.getElementById("bluetooth-disconnect").style.display = "block";
  await cmj.read();
});

document.getElementById("bluetooth-disconnect").addEventListener("click", async function() {
  await cmj.disconnect();
  this.style.display = "none";
  document.getElementById("bluetooth-connect").style.display = "block";
});

document.getElementById("clear-button").addEventListener("click", function() {
  var new_tbody = document.createElement('tbody');
  new_tbody.id = "data-table-body";
  table_body.parentNode.replaceChild(new_tbody, table_body);
  table_body = document.getElementById("data-table-body");
  cmj.table_body = table_body;
});

document.getElementById("save-button").addEventListener("click", function() {
  renameTableHeader()
});
document.getElementById("export-button").addEventListener("click", function() {
  exportTable(table);
});