const {
  SerialPort
} = require('serialport');

const {
  ReadlineParser
} = require('@serialport/parser-readline')

require('date-utils');
const path = require("path");
const fs = require("fs");
const os = require("os");

// handle serial port //
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
      if (dataRecorder != null) dataRecorder.saveData(data);
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

// handle save  //
let dataRecorder;
class DataRecorder {
  savePath = ""
  shouldRecord = false;
  constructor() {
    // 保存パスの作成
    // 2022-08-26_20-13-47
    const date = new Date();
    const currentTime = date.toFormat('YYYY-MM-DD_HH24-MI-SS');
    const saveDir = path.join(os.homedir(), "/Documents/PlantAnalysis/Data", currentTime)
    // 保存先の作成
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, {
      recursive: true
    });
    this.savePath = path.join(saveDir, `${currentTime}.csv`);
    // 記録の開始
    this.shouldRecord = true;
  }

  saveData = (data) => {
    if (!this.shouldRecord) return;
    if (data.rawData[0].includes("*")) return;
    // 保存する
    // ファイルが存在するか確認
    if (!fs.existsSync(this.savePath)) {
      // ない場合headerを書き込み
      let headLine = "";
      headLine += "timestamp"
      for (const rawData of data.rawData) {
        const headName = rawData.split(':')[0].trim();
        headLine += `,${headName}`
      }
      fs.writeFileSync(this.savePath, `${headLine}\n`);
    }
    // ある場合は追記
    let dataLine = "";
    dataLine += data.timestamp;
    for (const rawData of data.rawData) {
      const point = rawData.match(/[+-]?(?:\d+\.?\d*|\.\d+)/)[0] || '0';
      dataLine += `,${point}`
    }
    fs.appendFileSync(this.savePath, `${dataLine}\n`);
  }

  stopRecord = () => {
    this.shouldRecord = true;
  }
}

const recordStart = () => {
  dataRecorder = new DataRecorder();
  return "hello"
}

const recordStop = () => {
  dataRecorder.stopRecord();
  return "sello"
}


module.exports = {
  getSerialPorts,
  setSerialPort,
  closeSerialPort,
  recordStart,
  recordStop
};
