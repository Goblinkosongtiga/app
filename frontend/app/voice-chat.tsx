import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

interface VoiceMessage {
  id: string;
  sender: string;
  duration: number;
  timestamp: Date;
  isSent: boolean;
  isPlaying: boolean;
  uri?: string;
}

export default function VoiceChatScreen() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadVoiceMessages();
    setupAudio();
    
    return () => {
      if (playingSound) {
        playingSound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const loadVoiceMessages = () => {
    // Mock voice messages for demo
    const mockMessages: VoiceMessage[] = [
      {
        id: '1',
        sender: 'Alice (Emergency Station)',
        duration: 15,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isSent: false,
        isPlaying: false,
      },
      {
        id: '2',
        sender: 'You',
        duration: 8,
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        isSent: true,
        isPlaying: false,
      },
      {
        id: '3',
        sender: 'Base Camp',
        duration: 22,
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        isSent: false,
        isPlaying: false,
      }
    ];
    setVoiceMessages(mockMessages);
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission', 'Izin mikrofon diperlukan untuk merekam pesan suara');
        return;
      }

      setIsRecording(true);
      setRecordingTime(0);
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);

      // Start recording animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Gagal memulai perekaman');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(1);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && recordingTime > 0) {
        const newMessage: VoiceMessage = {
          id: Date.now().toString(),
          sender: 'You',
          duration: recordingTime,
          timestamp: new Date(),
          isSent: true,
          isPlaying: false,
          uri: uri,
        };

        setVoiceMessages(prev => [...prev, newMessage]);
        Alert.alert('Terkirim', 'Pesan suara telah dikirim via Bluetooth!');
      }

      setRecording(null);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Gagal menghentikan perekaman');
    }
  };

  const playVoiceMessage = async (message: VoiceMessage) => {
    try {
      if (playingSound) {
        await playingSound.unloadAsync();
        setPlayingSound(null);
      }

      if (message.uri) {
        const { sound } = await Audio.Sound.createAsync({ uri: message.uri });
        setPlayingSound(sound);
        
        // Update playing state
        setVoiceMessages(prev => 
          prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, isPlaying: true }
              : { ...msg, isPlaying: false }
          )
        );

        await sound.playAsync();
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setVoiceMessages(prev => 
              prev.map(msg => ({ ...msg, isPlaying: false }))
            );
          }
        });
      } else {
        // Simulate playing for demo messages
        setVoiceMessages(prev => 
          prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, isPlaying: true }
              : { ...msg, isPlaying: false }
          )
        );

        setTimeout(() => {
          setVoiceMessages(prev => 
            prev.map(msg => ({ ...msg, isPlaying: false }))
          );
        }, message.duration * 1000);
      }
      
    } catch (error) {
      console.error('Error playing voice message:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderVoiceMessage = (message: VoiceMessage) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isSent ? styles.sentMessage : styles.receivedMessage
    ]}>
      {!message.isSent && (
        <Text style={styles.senderName}>{message.sender}</Text>
      )}
      
      <View style={styles.voiceMessageContent}>
        <TouchableOpacity 
          style={[styles.playButton, message.isPlaying && styles.playingButton]}
          onPress={() => playVoiceMessage(message)}
        >
          <Ionicons 
            name={message.isPlaying ? "pause" : "play"} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>
        
        <View style={styles.waveformContainer}>
          {/* Simple waveform visualization */}
          {Array.from({ length: 20 }).map((_, index) => (
            <View 
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.random() * 20 + 5,
                  backgroundColor: message.isPlaying 
                    ? (message.isSent ? '#ffffff' : '#e94560')
                    : '#8a8a8a'
                }
              ]}
            />
          ))}
        </View>
        
        <Text style={[
          styles.durationText,
          message.isSent ? styles.sentText : styles.receivedText
        ]}>
          {formatDuration(message.duration)}
        </Text>
      </View>
      
      <Text style={[
        styles.timestamp,
        message.isSent ? styles.sentTimestamp : styles.receivedTimestamp
      ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Voice Messages</Text>
          <Text style={styles.headerSubtitle}>Bluetooth Audio Chat</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
        <View style={styles.messagesContainer}>
          {voiceMessages.map(renderVoiceMessage)}
        </View>
      </ScrollView>

      <View style={styles.recordingContainer}>
        {isRecording && (
          <View style={styles.recordingInfo}>
            <Animated.View style={[
              styles.recordingIndicator,
              { opacity: recordingAnimation }
            ]}>
              <Ionicons name="radio-button-on" size={12} color="#FF5722" />
            </Animated.View>
            <Text style={styles.recordingTime}>
              Recording: {formatDuration(recordingTime)}
            </Text>
          </View>
        )}
        
        <View style={styles.recordingControls}>
          <TouchableOpacity 
            style={styles.recordButton}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={isRecording}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={32} 
              color="#ffffff" 
            />
          </TouchableOpacity>
          
          <Text style={styles.recordingHint}>
            {isRecording ? 'Release to send' : 'Hold to record'}
          </Text>
        </View>
      </View>
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
  headerSubtitle: {
    fontSize: 12,
    color: '#8a8a8a',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
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
  senderName: {
    fontSize: 12,
    color: '#8a8a8a',
    marginBottom: 8,
    fontWeight: '500',
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playingButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    marginRight: 12,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
    minHeight: 5,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sentText: {
    color: 'rgba(255,255,255,0.8)',
  },
  receivedText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
  },
  sentTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  receivedTimestamp: {
    color: '#8a8a8a',
  },
  recordingContainer: {
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingIndicator: {
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    color: '#FF5722',
    fontWeight: '600',
  },
  recordingControls: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#e94560',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingHint: {
    fontSize: 14,
    color: '#8a8a8a',
    textAlign: 'center',
  },
});