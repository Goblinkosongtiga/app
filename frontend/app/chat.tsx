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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
  username: string;
  type: 'text' | 'image';
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeUser();
    loadMessages();
    // Simulasi koneksi mesh (akan diganti dengan implementasi real)
    simulateMeshConnection();
  }, []);

  const initializeUser = async () => {
    try {
      let storedUsername = await AsyncStorage.getItem('username');
      if (!storedUsername) {
        storedUsername = `User${Math.floor(Math.random() * 1000)}`;
        await AsyncStorage.setItem('username', storedUsername);
      }
      setUsername(storedUsername);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
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

  const simulateMeshConnection = () => {
    // Simulasi koneksi mesh - akan diganti dengan implementasi real
    setTimeout(() => {
      setIsConnected(true);
    }, 2000);

    // Simulasi pesan masuk dari peer lain
    setTimeout(() => {
      const incomingMessage: Message = {
        id: uuid.v4() as string,
        text: 'Halo! Saya terhubung melalui jaringan mesh!',
        timestamp: new Date(),
        isSent: false,
        username: 'MeshUser123',
        type: 'text',
      };
      handleIncomingMessage(incomingMessage);
    }, 5000);
  };

  const handleIncomingMessage = (message: Message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      saveMessages(newMessages);
      return newMessages;
    });
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: uuid.v4() as string,
      text: inputText.trim(),
      timestamp: new Date(),
      isSent: true,
      username: username,
      type: 'text',
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    setInputText('');

    // Simulasi pengiriman melalui mesh network
    if (isConnected) {
      // Di sini akan diimplementasikan pengiriman real melalui mesh/bluetooth
      console.log('Sending message via mesh network:', newMessage);
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

  const showMediaOptions = () => {
    Alert.alert(
      'Kirim Media',
      'Pilih jenis media yang ingin dikirim',
      [
        { text: 'Foto', onPress: () => console.log('Camera pressed') },
        { text: 'Galeri', onPress: () => console.log('Gallery pressed') },
        { text: 'File', onPress: () => console.log('File pressed') },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gobchat</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }
            ]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Terhubung' : 'Mencoba terhubung...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#ffffff" />
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
            onPress={showMediaOptions}
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
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { opacity: inputText.trim() ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
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
  settingsButton: {
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