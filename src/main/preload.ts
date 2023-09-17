// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */

import { contextBridge, ipcRenderer } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  getSerialPorts: () => ipcRenderer.invoke('getSerialPorts'),
  setSerialPort: (selectedPort: string) =>
    ipcRenderer.invoke('setSerialPort', selectedPort),
  recordStart: () => ipcRenderer.invoke('recordStart'),
  recordStop: () => ipcRenderer.invoke('recordStop'),
  on: (channel: string, func: (...args: any[]) => void) => {
    //rendererでの受信用, funcはコールバック関数//
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
};

contextBridge.exposeInMainWorld('api', electronHandler);

export type ElectronHandler = typeof electronHandler;
