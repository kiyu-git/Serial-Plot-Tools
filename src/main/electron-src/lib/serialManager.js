const { SerialPort } = require('serialport');

const { ReadlineParser } = require('@serialport/parser-readline')

require('date-utils');
const path = require("path");
const fs = require("fs");
const os = require("os");

const portMap = new Map();
const dataRecorderMap = new Map();

// handle serial port //
const getSerialPorts = async () => {
  return SerialPort.list();
}

const setSerialPort = (_portPath, webContents) => {
  return new Promise(function (resolve, reject) {
    closeSerialPort(webContents);
    const port = new SerialPort({
      path: _portPath,
      baudRate: 9600
    }, function (err) {
      if (err) {
        reject(err.message);
      } else {
        resolve("connected");
      }
    });

    portMap.set(webContents.id, port);

    const parser = port.pipe(new ReadlineParser({
      delimiter: '\r\n'
    }));

    parser.on('data', function (_rawData) {
      const currentTime = new Date();
      const data = {
        timestamp: currentTime,
        rawData: _rawData.split(",")
      }
      webContents.send("newData", data);
      const dataRecorder = dataRecorderMap.get(webContents.id);
      if (dataRecorder != null) dataRecorder.saveData(data);
    });

    port.on("close", function () {
      console.log("Port closed!");
    });
  })
}

const closeSerialPort = (webContents) => {
  const port = portMap.get(webContents.id);
  if (port !== undefined && port.isOpen) {
    port.close();
  }
}

// handle baudRate //
const setBaudRate = async (_baudRate, webContents) => {
  const port = portMap.get(webContents.id);
  if (port) {
    await port.update({ baudRate: Number(_baudRate) });
  }
}

// handle save  //
class DataRecorder {
  savePath = ""
  shouldRecord = false;
  numSamples = 0;
  start_date;
  webContents;
  constructor(webContents) {
    this.webContents = webContents;
    // 保存パスの作成
    // 2022-08-26_20-13-47
    this.start_date = new Date();
    const start_date_format = formatDate(this.start_date);
    const saveDir = path.join(os.homedir(), "/Documents/PlantAnalysis/Data", start_date_format)
    // 保存先の作成
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
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
    const elapsed_time = new Date() - this.start_date.getTime();
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

    this.webContents.send("info", info);
  }

  stopRecord = () => {
    this.shouldRecord = true;
  }
}

const recordStart = (webContents) => {
  const dataRecorder = new DataRecorder(webContents);
  dataRecorderMap.set(webContents.id, dataRecorder);
  return dataRecorder.savePath;
}


const recordStop = (webContents) => {
  const dataRecorder = dataRecorderMap.get(webContents.id);
  if (dataRecorder) {
    dataRecorder.stopRecord();
  }
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
  setBaudRate,
  recordStart,
  recordStop
};
