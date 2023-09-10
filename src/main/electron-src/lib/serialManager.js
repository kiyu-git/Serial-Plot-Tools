const {
  SerialPort
} = require('serialport');

const {
  ReadlineParser
} = require('@serialport/parser-readline')

const childProcess = require('child_process');
const util = require('util');
const exec = util.promisify(childProcess.exec);

const getSerialPorts = async () => {
  closeSerialPort();
  return SerialPort.list();
}

let port;

const setSerialPort = (_portPath, _webContents) => {
  return new Promise(function (resolve, reject) {
    port = new SerialPort({
      path: _portPath,
      baudRate: 9600
    }, function (err) {
      if (err) {
        reject(err.message);
      } else {
        resolve("connected");
      }
    });

    const parser = port.pipe(new ReadlineParser({
      delimiter: '\r\n'
    }));

    parser.on('data', function (_rawData) {
      const dt = new Date();
      const timeStamp = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes().toString().padStart(2, "0")}:${dt.getSeconds().toString().padStart(2, "0")}`;
      const data = {
        timestamp: timeStamp,
        rawData: _rawData.split(",")
      }
      _webContents.send("newData", data);
    });

    port.on("close", function () {
      console.log("Port closed!");
    });
  })
}

const closeSerialPort = () => {
  if (port !== undefined && port.isOpen) {
    port.close();
  }
}


module.exports = {
  getSerialPorts,
  setSerialPort,
  closeSerialPort
};
