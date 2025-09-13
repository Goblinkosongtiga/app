import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
  private deviceId: string = '';
  private deviceName: string = '';
  private connectedDevices: Map<string, PeerDevice> = new Map();
  private messageHandlers: ((message: BluetoothMessage) => void)[] = [];
  private connectionHandlers: ((device: PeerDevice, connected: boolean) => void)[] = [];
  private isScanning: boolean = false;
  private discoveredDevices: Map<string, PeerDevice> = new Map();
  private isBluetoothAvailable: boolean = false;

  constructor() {
    this.initializeDevice();
  }

  private async initializeDevice() {
    try {
      this.deviceName = Device.deviceName || 'Gobchat_Device';
      this.deviceId = await this.getOrCreateDeviceId();
      
      // Check if Bluetooth is available on this platform
      this.isBluetoothAvailable = Platform.OS !== 'web';
      
      if (Platform.OS === 'web') {
        console.log('Web platform detected - Bluetooth features limited');
      }
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
      if (Platform.OS === 'web') {
        // Web platform - limited Bluetooth support
        this.isBluetoothAvailable = false;
        console.log('Running on web - Bluetooth not available');
        return false;
      }

      // For mobile platforms, we would check actual Bluetooth state
      // For now, we'll simulate availability
      this.isBluetoothAvailable = true;
      console.log('Bluetooth service initialized for mobile platform');
      return true;
    } catch (error) {
      console.error('Error initializing Bluetooth service:', error);
      return false;
    }
  }

  async startScanning(): Promise<void> {
    try {
      if (!this.isBluetoothAvailable) {
        console.log('Bluetooth not available on this platform');
        return;
      }

      if (this.isScanning) {
        console.log('Already scanning');
        return;
      }

      console.log('Starting to scan for Gobchat devices...');
      this.isScanning = true;
      this.discoveredDevices.clear();

      // For real implementation, this would use actual Bluetooth scanning
      // For now, we simulate the scanning process
      this.simulateDeviceDiscovery();

      // Stop scanning after 30 seconds
      setTimeout(() => {
        this.stopScanning();
      }, 30000);

    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
    }
  }

  private simulateDeviceDiscovery() {
    // This would be replaced with real Bluetooth device discovery
    // Currently just logs that scanning is active
    console.log('Scanning for nearby Gobchat devices...');
    
    // In real implementation, discovered devices would be added to discoveredDevices
    // and connection handlers would be notified
  }

  stopScanning(): void {
    this.isScanning = false;
    console.log('Stopped scanning for devices');
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      if (!this.isBluetoothAvailable) {
        console.log('Bluetooth not available');
        return false;
      }

      if (this.connectedDevices.has(deviceId)) {
        console.log('Already connected to device:', deviceId);
        return true;
      }

      console.log('Attempting to connect to device:', deviceId);
      
      // For real implementation, this would establish actual Bluetooth connection
      // For now, we simulate successful connection
      const mockDevice: PeerDevice = {
        id: deviceId,
        name: `Gobchat_${deviceId.slice(0, 8)}`,
        rssi: -50,
        isConnected: true,
        services: ['gobchat-service']
      };

      this.discoveredDevices.set(deviceId, mockDevice);
      this.notifyConnectionHandlers(mockDevice, true);

      console.log('Successfully connected to device:', mockDevice.name);
      return true;

    } catch (error) {
      console.error('Error connecting to device:', deviceId, error);
      return false;
    }
  }

  async sendMessage(text: string, type: 'text' | 'image' = 'text'): Promise<boolean> {
    if (!this.isBluetoothAvailable) {
      console.log('Bluetooth not available - message stored locally only');
      return false;
    }

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

    console.log('Sending message via Bluetooth:', text);
    
    // For real implementation, this would send via actual Bluetooth connection
    // For now, we simulate successful sending
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const device = this.discoveredDevices.get(deviceId);
      if (device) {
        device.isConnected = false;
        this.connectedDevices.delete(deviceId);
        this.notifyConnectionHandlers(device, false);
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
    return this.getConnectedDevices().length;
  }

  getDeviceInfo() {
    return {
      id: this.deviceId,
      name: this.deviceName
    };
  }

  isBluetoothReady(): boolean {
    return this.isBluetoothAvailable;
  }
}

export const bluetoothService = new BluetoothService();