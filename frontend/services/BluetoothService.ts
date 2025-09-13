import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device as ExpoDevice from 'expo-device';

interface BluetoothMessage {
  id: string;
  text: string;
  timestamp: Date;
  sender: string;
  type: 'text' | 'image';
}

interface PeerDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  services: string[];
}

export class BluetoothService {
  private bleManager: BleManager;
  private deviceId: string = '';
  private deviceName: string = '';
  private connectedDevices: Map<string, Device> = new Map();
  private messageHandlers: ((message: BluetoothMessage) => void)[] = [];
  private connectionHandlers: ((device: PeerDevice, connected: boolean) => void)[] = [];
  private scanSubscription: Subscription | null = null;
  private isScanning: boolean = false;
  private discoveredDevices: Map<string, PeerDevice> = new Map();

  // Service UUID untuk Gobchat (custom UUID)
  private readonly GOBCHAT_SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
  private readonly GOBCHAT_MESSAGE_CHARACTERISTIC = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
  private readonly GOBCHAT_NOTIFY_CHARACTERISTIC = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

  constructor() {
    this.bleManager = new BleManager();
    this.initializeDevice();
  }

  private async initializeDevice() {
    try {
      this.deviceName = ExpoDevice.deviceName || 'Gobchat_Device';
      this.deviceId = await this.getOrCreateDeviceId();
    } catch (error) {
      console.error('Error initializing device:', error);
    }
  }

  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('bluetooth_device_id');
      if (!deviceId) {
        deviceId = `gobchat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('bluetooth_device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error managing device ID:', error);
      return `gobchat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  async initialize(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      
      if (state !== State.PoweredOn) {
        console.log('Bluetooth is not powered on. Current state:', state);
        return false;
      }

      console.log('Bluetooth service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Bluetooth service:', error);
      return false;
    }
  }

  async startScanning(): Promise<void> {
    try {
      if (this.isScanning) {
        console.log('Already scanning');
        return;
      }

      console.log('Starting to scan for Gobchat devices...');
      this.isScanning = true;
      this.discoveredDevices.clear();

      this.scanSubscription = this.bleManager.startDeviceScan(
        [this.GOBCHAT_SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }

          if (device && device.name && device.name.includes('Gobchat')) {
            const peerDevice: PeerDevice = {
              id: device.id,
              name: device.name,
              rssi: device.rssi || -100,
              isConnected: false,
              services: device.serviceUUIDs || []
            };

            this.discoveredDevices.set(device.id, peerDevice);
            console.log('Discovered Gobchat device:', device.name);

            // Auto-connect to discovered Gobchat devices
            this.connectToDevice(device.id);
          }
        }
      );

      // Stop scanning after 30 seconds
      setTimeout(() => {
        this.stopScanning();
      }, 30000);

    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
    }
  }

  stopScanning(): void {
    if (this.scanSubscription) {
      this.scanSubscription.remove();
      this.scanSubscription = null;
    }
    this.isScanning = false;
    console.log('Stopped scanning for devices');
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      if (this.connectedDevices.has(deviceId)) {
        console.log('Already connected to device:', deviceId);
        return true;
      }

      console.log('Connecting to device:', deviceId);
      const device = await this.bleManager.connectToDevice(deviceId);
      
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevices.set(deviceId, device);

      // Setup message listening
      await this.setupMessageListener(device);

      const peerDevice = this.discoveredDevices.get(deviceId);
      if (peerDevice) {
        peerDevice.isConnected = true;
        this.notifyConnectionHandlers(peerDevice, true);
      }

      console.log('Successfully connected to device:', device.name);
      return true;

    } catch (error) {
      console.error('Error connecting to device:', deviceId, error);
      return false;
    }
  }

  private async setupMessageListener(device: Device): Promise<void> {
    try {
      await device.monitorCharacteristicForService(
        this.GOBCHAT_SERVICE_UUID,
        this.GOBCHAT_NOTIFY_CHARACTERISTIC,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            try {
              const messageData = JSON.parse(Buffer.from(characteristic.value, 'base64').toString());
              const message: BluetoothMessage = {
                id: messageData.id || Date.now().toString(),
                text: messageData.text,
                timestamp: new Date(messageData.timestamp),
                sender: messageData.sender,
                type: messageData.type || 'text'
              };

              this.notifyMessageHandlers(message);
            } catch (parseError) {
              console.error('Error parsing received message:', parseError);
            }
          }
        }
      );
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  async sendMessage(text: string, type: 'text' | 'image' = 'text'): Promise<boolean> {
    if (this.connectedDevices.size === 0) {
      console.log('No connected devices to send message to');
      return false;
    }

    const message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString(),
      sender: this.deviceName,
      type
    };

    const messageBuffer = Buffer.from(JSON.stringify(message)).toString('base64');
    let successCount = 0;

    for (const [deviceId, device] of this.connectedDevices) {
      try {
        await device.writeCharacteristicWithResponseForService(
          this.GOBCHAT_SERVICE_UUID,
          this.GOBCHAT_MESSAGE_CHARACTERISTIC,
          messageBuffer
        );
        successCount++;
        console.log('Message sent to device:', deviceId);
      } catch (error) {
        console.error('Error sending message to device:', deviceId, error);
        // Remove failed device from connected list
        this.connectedDevices.delete(deviceId);
        
        const peerDevice = this.discoveredDevices.get(deviceId);
        if (peerDevice) {
          peerDevice.isConnected = false;
          this.notifyConnectionHandlers(peerDevice, false);
        }
      }
    }

    return successCount > 0;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        await device.cancelConnection();
        this.connectedDevices.delete(deviceId);

        const peerDevice = this.discoveredDevices.get(deviceId);
        if (peerDevice) {
          peerDevice.isConnected = false;
          this.notifyConnectionHandlers(peerDevice, false);
        }

        console.log('Disconnected from device:', deviceId);
      }
    } catch (error) {
      console.error('Error disconnecting device:', deviceId, error);
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connectedDevices.keys()).map(deviceId =>
      this.disconnectDevice(deviceId)
    );
    
    await Promise.all(disconnectPromises);
    this.stopScanning();
  }

  // Event handlers
  onMessage(handler: (message: BluetoothMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onConnection(handler: (device: PeerDevice, connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  private notifyMessageHandlers(message: BluetoothMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(device: PeerDevice, connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(device, connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Getters
  getConnectedDevices(): PeerDevice[] {
    return Array.from(this.discoveredDevices.values()).filter(device => device.isConnected);
  }

  getDiscoveredDevices(): PeerDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  isBluetoothScanning(): boolean {
    return this.isScanning;
  }

  getConnectionCount(): number {
    return this.connectedDevices.size;
  }

  getDeviceInfo() {
    return {
      id: this.deviceId,
      name: this.deviceName
    };
  }
}

export const bluetoothService = new BluetoothService();