// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */

import { contextBridge, ipcRenderer } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  openDataViewer: () => ipcRenderer.invoke('openDataViewer'),
  openRealtimeDataLogger: () => ipcRenderer.invoke('openRealtimeDataLogger'),
  getSerialPorts: () => ipcRenderer.invoke('getSerialPorts'),
  setSerialPort: (selectedPort: string) =>
    ipcRenderer.invoke('setSerialPort', selectedPort),
  closeSerialPort: () => ipcRenderer.invoke('closeSerialPort'),
  setBaudRate: (baudRate: string) =>
    ipcRenderer.invoke('setBaudRate', baudRate),
  recordStart: () => ipcRenderer.invoke('recordStart'),
  recordStop: () => ipcRenderer.invoke('recordStop'),
  openSaveFolder: (path: string) => ipcRenderer.invoke('openSaveFolder', path),
  openFileDialog: () => ipcRenderer.invoke('openFileDialog'),
  loadData: (path: string) => ipcRenderer.invoke('loadData', path),
  on: (channel: string, func: (...args: any[]) => void) => {
    // rendererでの受信用, funcはコールバック関数//
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
};

contextBridge.exposeInMainWorld('api', electronHandler);

export type ElectronHandler = typeof electronHandler;
