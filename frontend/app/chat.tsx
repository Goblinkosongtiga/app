import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { bluetoothService } from '../services/BluetoothService';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
  username: string;
  type: 'text' | 'image';
}

interface PeerDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  services: string[];
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState('');
  const [connectedPeers, setConnectedPeers] = useState<PeerDevice[]>([]);
  const [isBluetoothReady, setIsBluetoothReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeApp();
    
    return () => {
      // Cleanup on unmount
      bluetoothService.disconnectAll();
    };
  }, []);

  const initializeApp = async () => {
    try {
      await initializeUser();
      await requestBluetoothPermissions();
      await initializeBluetooth();
      loadMessages();
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Gagal menginisialisasi aplikasi');
    }
  };

  const initializeUser = async () => {
    try {
      let storedUsername = await AsyncStorage.getItem('username');
      if (!storedUsername) {
        storedUsername = `GobUser${Math.floor(Math.random() * 1000)}`;
        await AsyncStorage.setItem('username', storedUsername);
      }
      setUsername(storedUsername);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allPermissionsGranted = Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allPermissionsGranted) {
          Alert.alert(
            'Izin Diperlukan',
            'Gobchat memerlukan izin Bluetooth dan Lokasi untuk berkomunikasi dengan perangkat lain',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    return true;
  };

  const initializeBluetooth = async () => {
    try {
      const initialized = await bluetoothService.initialize();
      setIsBluetoothReady(initialized);

      if (initialized) {
        // Setup message handler
        const removeMessageHandler = bluetoothService.onMessage((message) => {
          const newMessage: Message = {
            id: message.id,
            text: message.text,
            timestamp: message.timestamp,
            isSent: false,
            username: message.sender,
            type: message.type,
          };
          
          setMessages(prev => {
            const updated = [...prev, newMessage];
            saveMessages(updated);
            return updated;
          });

          // Auto scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        // Setup connection handler
        const removeConnectionHandler = bluetoothService.onConnection((device, connected) => {
          setConnectedPeers(bluetoothService.getConnectedDevices());
          
          if (connected) {
            console.log(`Terhubung dengan ${device.name}`);
          } else {
            console.log(`Terputus dari ${device.name}`);
          }
        });

        // Start scanning for devices
        startScanning();

        return () => {
          removeMessageHandler();
          removeConnectionHandler();
        };
      } else {
        Alert.alert(
          'Bluetooth Tidak Tersedia',
          'Pastikan Bluetooth diaktifkan untuk menggunakan Gobchat',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      Alert.alert('Error', 'Gagal menginisialisasi Bluetooth');
    }
  };

  const startScanning = async () => {
    if (!isBluetoothReady) {
      Alert.alert('Error', 'Bluetooth belum siap');
      return;
    }

    setIsScanning(true);
    try {
      await bluetoothService.startScanning();
      setIsScanning(bluetoothService.isBluetoothScanning());
    } catch (error) {
      console.error('Error starting scan:', error);
      Alert.alert('Error', 'Gagal memulai pencarian perangkat');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    bluetoothService.stopScanning();
    setIsScanning(false);
  };

  const loadMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('messages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (!isBluetoothReady) {
      Alert.alert('Error', 'Bluetooth belum siap');
      return;
    }

    if (connectedPeers.length === 0) {
      Alert.alert(
        'Tidak Ada Koneksi',
        'Tidak ada perangkat yang terhubung. Pesan akan disimpan secara lokal.',
        [{ text: 'OK' }]
      );
    }

    const newMessage: Message = {
      id: uuid.v4() as string,
      text: inputText.trim(),
      timestamp: new Date(),
      isSent: true,
      username: username,
      type: 'text',
    };

    // Add to local messages
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    setInputText('');

    // Send via Bluetooth
    try {
      const sent = await bluetoothService.sendMessage(newMessage.text, 'text');
      if (!sent && connectedPeers.length > 0) {
        Alert.alert('Warning', 'Gagal mengirim pesan ke beberapa perangkat');
      }
    } catch (error) {
      console.error('Error sending message via Bluetooth:', error);
    }

    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isSent ? styles.sentMessage : styles.receivedMessage
    ]}>
      {!item.isSent && (
        <Text style={styles.username}>{item.username}</Text>
      )}
      <Text style={[
        styles.messageText,
        item.isSent ? styles.sentMessageText : styles.receivedMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.timestamp,
        item.isSent ? styles.sentTimestamp : styles.receivedTimestamp
      ]}>
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  const showConnectionInfo = () => {
    const deviceInfo = bluetoothService.getDeviceInfo();
    const connectionCount = bluetoothService.getConnectionCount();
    
    Alert.alert(
      'Info Koneksi',
      `Perangkat: ${deviceInfo.name}\n` +
      `ID: ${deviceInfo.id.substring(0, 8)}...\n` +
      `Terhubung: ${connectionCount} perangkat\n` +
      `Status: ${isBluetoothReady ? 'Siap' : 'Tidak Siap'}`,
      [
        { text: 'Scan Ulang', onPress: startScanning },
        { text: 'OK' }
      ]
    );
  };

  const getConnectionStatus = () => {
    if (!isBluetoothReady) return 'Bluetooth tidak aktif';
    if (isScanning) return 'Mencari perangkat...';
    if (connectedPeers.length === 0) return 'Tidak ada koneksi';
    return `Terhubung: ${connectedPeers.length} perangkat`;
  };

  const getStatusColor = () => {
    if (!isBluetoothReady) return '#FF5722';
    if (isScanning) return '#FF9800';
    if (connectedPeers.length === 0) return '#FF5722';
    return '#4CAF50';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerCenter} onPress={showConnectionInfo}>
          <Text style={styles.headerTitle}>Gobchat</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor() }
            ]} />
            <Text style={styles.statusText}>
              {getConnectionStatus()}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={isScanning ? stopScanning : startScanning}
        >
          <Ionicons 
            name={isScanning ? "stop" : "scan"} 
            size={24} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.mediaButton}
            onPress={() => Alert.alert('Coming Soon', 'Fitur media akan segera tersedia')}
          >
            <Ionicons name="add" size={24} color="#e94560" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ketik pesan..."
            placeholderTextColor="#8a8a8a"
            multiline
            maxLength={500}
            editable={isBluetoothReady}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { opacity: (inputText.trim() && isBluetoothReady) ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isBluetoothReady}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#8a8a8a',
  },
  scanButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e94560',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 4,
  },
  username: {
    fontSize: 12,
    color: '#8a8a8a',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  sentTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  receivedTimestamp: {
    color: '#8a8a8a',
  },
  inputContainer: {
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    color: '#ffffff',
    backgroundColor: '#1a1a2e',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
});