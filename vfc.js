class VFCDevice{

  port;
  reader;
  writer;
  connection_state;

  readableStreamClosed;
  writableStreamClosed;

  nn_intervals = [];


  constructor(connection_state){
    this.connection_state = connection_state;
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
    console.log(port, reader);
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
            // Tratar valor
            this.nn_intervals.push(value);
            console.log(value);
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

  hrv_extraction(){

    var diff_nni = math.diff(this.nn_intervals);
    var length_int = this.nn_intervals.length;

    // Basic statistics
    var mean_nni = math.mean(this.nn_intervals);
    var median_nni = math.median(this.nn_intervals);
    var range_nni = math.max(this.nn_intervals) - math.min(this.nn_intervals);

    var sdsd = math.std(diff_nni);
    var rmssd = math.sqrt(math.mean(math.map(diff_nni, num => math.pow(num, 2))));

    var abs_diff_nni = math.map(diff_nni, function(num) {return math.abs(num)});
    var nni_50 = math.sum(math.filter(abs_diff_nni, num => num > 50));
    var pnni_50 = 100 * nni_50 / length_int;
    var nni_20 = math.sum(math.filter(abs_diff_nni, num => num > 20));
    var pnni_20 = 100 * nni_20 / length_int;

    // Feature found on github and not in documentation
    var cvsd = rmssd / mean_nni;

    // Features only for long term recordings
    var sdnn = math.std(this.nn_intervals);  // ddof = 1 : unbiased estimator => divide std by n-1
    var cvnni = sdnn / mean_nni;

    // // Heart Rate equivalent features
    // var heart_rate_list = math.divide(60000, this.nn_intervals)
    // var mean_hr = math.mean(heart_rate_list)
    // var min_hr = math.min(heart_rate_list)
    // var max_hr = math.max(heart_rate_list)
    // var std_hr = math.std(heart_rate_list)

    var time_domain_features = {
        'mean_nni': mean_nni,
        'sdnn': sdnn,
        'sdsd': sdsd,
        'nni_50': nni_50,
        'pnni_50': pnni_50,
        'nni_20': nni_20,
        'pnni_20': pnni_20,
        'rmssd': rmssd,
        'median_nni': median_nni,
        'range_nni': range_nni,
        'cvsd': cvsd,
        'cvnni': cvnni,
        // 'mean_hr': mean_hr,
        // "max_hr": max_hr,
        // "min_hr": min_hr,
        // "std_hr": std_hr,
    };

    return time_domain_features;
  }
}


function Timer(mins, target, cb) {
  this.counter = mins * 60;
  this.target = target;
  this.callback = cb;
}
Timer.prototype.pad = function(s) {
  return (s < 10) ? '0' + s : s;
}
Timer.prototype.start = function(s) {
  this.count();
}
Timer.prototype.stop = function(s) {
  this.count();
}
Timer.prototype.done = function(s) {
  if (this.callback) this.callback();
}
Timer.prototype.display = function(s) {
  this.target.innerHTML = this.pad(s);
}
Timer.prototype.count = function(s) {
  var self = this;
  self.display.call(self, self.counter);
  self.counter--;
  var clock = setInterval(function() {
      self.display(self.counter);
      self.counter--;
      if (self.counter < 0) {
          clearInterval(clock);
          self.done.call(self);
      }
  }, 1000);
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
  
  // Call the function, passing in a MIME of text/csv and setting the file extension to csv
  startBlobDownload('text/csv', csvFormat, "test-spreadsheet.csv");
}

var table = document.getElementById("data-table")
var table_body = document.getElementById("data-table-body");
var connection_state = document.getElementById("connection-state");
var timer_display = document.getElementById("timer-display");
var vfc = new VFCDevice(connection_state);

document.getElementById("bluetooth-connect").addEventListener( "click", async function() {
  await vfc.connect();
  this.style.display = "none";
  document.getElementById("bluetooth-disconnect").style.display = "block";
});

document.getElementById("bluetooth-disconnect").addEventListener("click", async function() {
  await vfc.disconnect();
  this.style.display = "none";
  document.getElementById("bluetooth-connect").style.display = "block";
});

document.getElementById("clear-button").addEventListener("click", function() {
  var new_tbody = document.createElement('tbody');
  table_body.parentNode.replaceChild(new_tbody, table_body)
});

document.getElementById("save-button").addEventListener("click", function() {
  renameTableHeader()
});


document.getElementById("export-button").addEventListener("click", function() {
  exportTable(table);
});

document.getElementById("start-button").addEventListener("click", function() {

  var time_input = document.getElementById("timer-input").value;

  new Timer(0.2, timer_display, function (){ // 10s timer
    vfc.read();
    new Timer(time_input, timer_display, async function() { // Variable time timer
      document.getElementById("bluetooth-disconnect").click();
      console.log(vfc.hrv_extraction()); 
      timer_display.innerHTML = "00:00";
      // TODO: Add return to table
    }).start();
  }).start();
});


