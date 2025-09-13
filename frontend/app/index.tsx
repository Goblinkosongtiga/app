import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubbles" size={80} color="#16213e" />
          </View>
          <Text style={styles.appName}>Gobchat</Text>
          <Text style={styles.tagline}>Advanced Mesh Networking & Bluetooth Chat</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="bluetooth" size={24} color="#0f3460" />
            <Text style={styles.featureText}>Real-Time Bluetooth Communication</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="mic" size={24} color="#0f3460" />
            <Text style={styles.featureText}>Voice Messages & Audio Chat</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="folder" size={24} color="#0f3460" />
            <Text style={styles.featureText}>P2P File Transfer</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={24} color="#0f3460" />
            <Text style={styles.featureText}>Location Sharing & Emergency SOS</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="radio" size={24} color="#0f3460" />
            <Text style={styles.featureText}>Mesh Network Topology</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Gobchat Pro - Advanced peer-to-peer communication with mesh networking, 
            voice messages, file transfer, dan emergency broadcast tanpa internet.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.buttonText}>Start Chatting</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.featureButton}
              onPress={() => router.push('/features')}
            >
              <Ionicons name="grid" size={20} color="#e94560" />
              <Text style={styles.featureButtonText}>Advanced Features</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings" size={20} color="#8a8a8a" />
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#e94560',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#8a8a8a',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    color: '#ffffff',
    marginLeft: 16,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#8a8a8a',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#e94560',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e94560',
    borderRadius: 10,
    marginRight: 8,
  },
  featureButtonText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#16213e',
    borderRadius: 10,
    marginLeft: 8,
  },
  settingsButtonText: {
    color: '#8a8a8a',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});