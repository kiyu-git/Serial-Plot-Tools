const { SerialPort } = require('serialport');

const { ReadlineParser } = require('@serialport/parser-readline');

require('date-utils');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper functions moved to the top to resolve 'no-use-before-define'
const formatDate = (date) => {
  return date.toFormat('YYYY-MM-DD_HH24-MI-SS');
};

// ファイルサイズをわかりやすい単位にフォーマットする関数
const formatFileSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10); // Added radix
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};

const portMap = new Map();
const dataRecorderMap = new Map();

// handle serial port //
const getSerialPorts = async () => {
  return SerialPort.list();
};

const closeSerialPort = (webContents) => {
  const port = portMap.get(webContents.id);
  if (port !== undefined && port.isOpen) {
    port.close();
  }
};

const setSerialPort = (_portPath, webContents) => {
  return new Promise(function setSerialPortPromise(resolve, reject) {
    // Named function
    closeSerialPort(webContents);
    const port = new SerialPort(
      {
        path: _portPath,
        baudRate: 9600,
      },
      function portOpenCallback(err) {
        // Named function
        if (err) {
          reject(err.message);
        } else {
          resolve('connected');
        }
      }
    );

    portMap.set(webContents.id, port);

    const parser = port.pipe(
      new ReadlineParser({
        delimiter: '\r\n',
      })
    );

    parser.on('data', function parserDataCallback(_rawData) {
      // Named function
      const currentTime = new Date();
      const data = {
        timestamp: currentTime,
        rawData: _rawData.split(','),
      };
      webContents.send('newData', data);
      const dataRecorder = dataRecorderMap.get(webContents.id);
      if (dataRecorder != null) dataRecorder.saveData(data);
    });

    port.on('close', function portCloseCallback() {
      // Named function
      console.log('Port closed!');
    });
  });
};

// handle baudRate //
const setBaudRate = async (_baudRate, webContents) => {
  const port = portMap.get(webContents.id);
  if (port) {
    await port.update({ baudRate: Number(_baudRate) });
  }
};

// handle save  //
class DataRecorder {
  savePath = '';

  shouldRecord = false;

  numSamples = 0;

  startDate; // Renamed to camelCase

  webContents;

  constructor(webContents) {
    this.webContents = webContents;
    // 保存パスの作成
    // 2022-08-26_20-13-47
    this.startDate = new Date(); // Renamed to camelCase
    const startDateFormat = formatDate(this.startDate); // Renamed to camelCase
    const saveDir = path.join(
      os.homedir(),
      '/Documents/PlantAnalysis/Data',
      startDateFormat // Renamed to camelCase
    );
    // 保存先の作成
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
    this.savePath = path.join(saveDir, `${startDateFormat}.csv`); // Renamed to camelCase
    // 記録の開始
    this.shouldRecord = true;
  }

  saveData = (data) => {
    if (!this.shouldRecord) return;
    if (data.rawData[0].includes('*')) return;
    if (this.numSamples < 1) {
      this.numSamples += 1;
      return; // 最初の読み込みはこけることがあるので避ける
    }
    // 保存する
    // ファイルが存在するか確認
    if (!fs.existsSync(this.savePath)) {
      // ない場合headerを書き込み
      let headLine = '';
      headLine += 'timestamp';
      data.rawData.forEach((rawData) => {
        // Changed to forEach
        const headName = rawData.split(':')[0].trim();
        headLine += `,${headName}`;
      });
      fs.writeFileSync(this.savePath, `${headLine}\n`);
    }
    // ある場合は追記
    let dataLine = '';
    dataLine += data.timestamp;
    data.rawData.forEach((rawData) => {
      // Changed to forEach
      const point = rawData.match(/[+-]?(?:\d+\.?\d*|\.\d+)/)[0] || '0';
      dataLine += `,${point}`;
    });
    fs.appendFileSync(this.savePath, `${dataLine}\n`);
    // 計測時間・容量を通知
    const info = {};
    /// 計測時間
    const elapsedTime = new Date() - this.startDate.getTime(); // Renamed to camelCase
    const elapsedSeconds = Math.floor(elapsedTime / 1000) % 60;
    const elapsedMinutes = Math.floor(elapsedTime / 60000) % 60;
    const elapsedHour = Math.floor(elapsedTime / 3600000) % 24;
    const elapsedDay = Math.floor(elapsedTime / 86400000);
    let elapsedTimeFormat = elapsedDay < 1 ? '' : `${elapsedDay}days`; // Renamed to camelCase
    elapsedTimeFormat += `${String(elapsedHour).padStart(2, '0')}:${String(
      elapsedMinutes
    ).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;
    info.elapsedTime = elapsedTimeFormat;
    /// 容量
    try {
      const stats = fs.statSync(this.savePath);
      const fileSizeInBytes = stats.size;
      const fileSizeHumanReadable = formatFileSize(fileSizeInBytes);
      info.fileSize = fileSizeHumanReadable;
    } catch (err) {
      console.error(err);
    }

    this.webContents.send('info', info);
  };

  stopRecord = () => {
    this.shouldRecord = false;
  };
}

const recordStart = (webContents) => {
  const dataRecorder = new DataRecorder(webContents);
  dataRecorderMap.set(webContents.id, dataRecorder);
  return dataRecorder.savePath;
};

const recordStop = (webContents) => {
  const dataRecorder = dataRecorderMap.get(webContents.id);
  if (dataRecorder) {
    dataRecorder.stopRecord();
  }
  return 'sello';
};

module.exports = {
  getSerialPorts,
  setSerialPort,
  closeSerialPort,
  setBaudRate,
  recordStart,
  recordStop,
};
