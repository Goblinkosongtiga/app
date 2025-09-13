import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [meshEnabled, setMeshEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username') || '';
      const storedMeshEnabled = await AsyncStorage.getItem('meshEnabled');
      const storedBluetoothEnabled = await AsyncStorage.getItem('bluetoothEnabled');
      const storedAutoConnect = await AsyncStorage.getItem('autoConnect');
      const storedNotifications = await AsyncStorage.getItem('notifications');

      setUsername(storedUsername);
      setMeshEnabled(storedMeshEnabled !== 'false');
      setBluetoothEnabled(storedBluetoothEnabled !== 'false');
      setAutoConnect(storedAutoConnect !== 'false');
      setNotifications(storedNotifications !== 'false');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username tidak boleh kosong');
      return;
    }
    
    try {
      await AsyncStorage.setItem('username', username.trim());
      Alert.alert('Berhasil', 'Username berhasil disimpan');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan username');
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Hapus Semua Data',
      'Apakah Anda yakin ingin menghapus semua pesan dan pengaturan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['messages', 'username']);
              Alert.alert('Berhasil', 'Semua data berhasil dihapus');
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus data');
            }
          }
        }
      ]
    );
  };

  const showNetworkInfo = () => {
    Alert.alert(
      'Informasi Jaringan',
      'Gobchat menggunakan teknologi mesh networking dan Bluetooth untuk komunikasi peer-to-peer tanpa memerlukan internet.\n\nFitur ini memungkinkan Anda berkomunikasi bahkan saat tidak ada koneksi internet.',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    icon 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={styles.settingItem}>
      <Ionicons name={icon as any} size={24} color="#e94560" />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#2a2a3e', true: '#e94560' }}
        thumbColor={value ? '#ffffff' : '#8a8a8a'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.usernameContainer}>
            <Ionicons name="person" size={24} color="#e94560" />
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Masukkan username"
              placeholderTextColor="#8a8a8a"
              maxLength={20}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveUsername}>
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konektivitas</Text>
          
          <SettingItem
            title="Jaringan Mesh"
            subtitle="Aktivkan komunikasi mesh peer-to-peer"
            value={meshEnabled}
            onValueChange={(value) => {
              setMeshEnabled(value);
              saveSetting('meshEnabled', value);
            }}
            icon="wifi"
          />

          <SettingItem
            title="Bluetooth"
            subtitle="Aktivkan komunikasi via Bluetooth"
            value={bluetoothEnabled}
            onValueChange={(value) => {
              setBluetoothEnabled(value);
              saveSetting('bluetoothEnabled', value);
            }}
            icon="bluetooth"
          />

          <SettingItem
            title="Auto Connect"
            subtitle="Otomatis terhubung ke peer terdekat"
            value={autoConnect}
            onValueChange={(value) => {
              setAutoConnect(value);
              saveSetting('autoConnect', value);
            }}
            icon="refresh"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifikasi</Text>
          
          <SettingItem
            title="Notifikasi Pesan"
            subtitle="Tampilkan notifikasi untuk pesan baru"
            value={notifications}
            onValueChange={(value) => {
              setNotifications(value);
              saveSetting('notifications', value);
            }}
            icon="notifications"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi</Text>
          
          <TouchableOpacity style={styles.infoItem} onPress={showNetworkInfo}>
            <Ionicons name="information-circle" size={24} color="#e94560" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Tentang Jaringan</Text>
              <Text style={styles.infoSubtitle}>Pelajari cara kerja mesh networking</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8a8a8a" />
          </TouchableOpacity>

          <View style={styles.infoItem}>
            <Ionicons name="code-working" size={24} color="#e94560" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Versi Aplikasi</Text>
              <Text style={styles.infoSubtitle}>Gobchat v1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
            <Ionicons name="trash" size={20} color="#ffffff" />
            <Text style={styles.dangerButtonText}>Hapus Semua Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  usernameInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8a8a8a',
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#8a8a8a',
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingVertical: 16,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});