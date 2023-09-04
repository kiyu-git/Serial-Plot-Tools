import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortInfo } from 'serialport';
import '../../App.scss';

export function SelectPort() {
  const buttonGetAvailableSerialPorts = useRef<HTMLButtonElement>(null);
  const selectAvailablePorts = useRef<HTMLSelectElement>(null);
  const [availablePorts, SetAvailablePorts] = useState<Array<PortInfo>>([]);

  const getAvailableSerialPorts = async () => {
    SetAvailablePorts([]);
    const availableSerialPorts = await window.api.getSerialPorts();
    console.log(availablePorts);
    SetAvailablePorts(availableSerialPorts);
  };
  useEffect(() => {
    getAvailableSerialPorts();
  }, []);

  const setSerialPort = (value: string) => {
    window.api.setSerialPort(value);
  };

  return (
    <div>
      <h1>Please select serial port</h1>
      <p>
        シリアルポートが現れない場合は、接続を再度確認してから、再読み込みボタンを押してください。
      </p>
      <label className="selectbox-005">
        <select
          ref={selectAvailablePorts}
          onChange={(e) => setSerialPort(e.target.value)}
        >
          <option value="">選択してください</option>
          {availablePorts.map((availablePort) => (
            <option value={availablePort.path} key={availablePort.path}>
              {availablePort.manufacturer === undefined
                ? availablePort.path
                : `${availablePort.path} (${availablePort.manufacturer})`}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={getAvailableSerialPorts}
        ref={buttonGetAvailableSerialPorts}
      >
        再読み込み
      </button>
      <div>
        <Link to="/AdjustGain" state={{ test: 'test' }}>
          <button>次へ</button>
        </Link>
      </div>
    </div>
  );
}
