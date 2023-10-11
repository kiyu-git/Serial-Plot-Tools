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
const {
  web
} = require('webpack');

// handle serial port //
const getSerialPorts = async () => {
  closeSerialPort();
  return SerialPort.list();
}


let port;
let webContents;

const setSerialPort = (_portPath, _webContents) => {
  return new Promise(function (resolve, reject) {
    closeSerialPort();
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

    webContents = _webContents;

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
      webContents.send("newData", data);
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
  numSamples = 0;
  constructor() {
    // 保存パスの作成
    // 2022-08-26_20-13-47
    const start_date = new Date();
    const start_date_format = formatDate(start_date);
    const saveDir = path.join(os.homedir(), "/Documents/PlantAnalysis/Data", start_date_format)
    // 保存先の作成
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, {
      recursive: true
    });
    this.savePath = path.join(saveDir, `${start_date_format}.csv`);
    // 記録の開始
    this.shouldRecord = true;
  }

  saveData = (data) => {
    if (!this.shouldRecord) return;
    if (data.rawData[0].includes("*")) return;
    if (this.numSamples < 1) {
      this.numSamples += 1;
      return; //最初の読み込みはこけることがあるので避ける
    }
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
    // 計測時間・容量を通知
    const info = {}
    /// 計測時間
    const elapsed_time = new Date() - start_date.getTime();
    const elapsedSeconds = Math.floor(elapsed_time / 1000) % 60;
    const elapsedMinutes = Math.floor(elapsed_time / 60000) % 60;
    const elapsedHour = Math.floor(elapsed_time / 3600000) % 24;
    const elapsedDay = Math.floor(elapsed_time / 86400000);
    let elapsed_time_format = elapsedDay < 1 ? "" : `${elapsedDay}days`
    elapsed_time_format += `${String(elapsedHour).padStart(2, "0")}:${String(elapsedMinutes).padStart(2, "0")}:${String(elapsedSeconds).padStart(2, "0")}`
    info.elapsedTime = elapsed_time_format;
    /// 容量
    try {
      const stats = fs.statSync(this.savePath);
      const fileSizeInBytes = stats.size;
      const fileSizeHumanReadable = formatFileSize(fileSizeInBytes);
      info.fileSize = fileSizeHumanReadable;
    } catch (err) {
      console.error(err);
    }

    webContents.send("info", info);
  }

  stopRecord = () => {
    this.shouldRecord = true;
  }
}

const recordStart = () => {
  dataRecorder = new DataRecorder();
  return dataRecorder.savePath;
}

const recordStop = () => {
  dataRecorder.stopRecord();
  return "sello"
}

const formatDate = (date) => {
  return date.toFormat('YYYY-MM-DD_HH24-MI-SS');
}

// ファイルサイズをわかりやすい単位にフォーマットする関数
const formatFileSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports = {
  getSerialPorts,
  setSerialPort,
  closeSerialPort,
  recordStart,
  recordStop
};
