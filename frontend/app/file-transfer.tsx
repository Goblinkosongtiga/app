import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface FileTransfer {
  id: string;
  filename: string;
  size: number;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  direction: 'sending' | 'receiving';
  peer: string;
  timestamp: Date;
  uri?: string;
}

export default function FileTransferScreen() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [totalBandwidth, setTotalBandwidth] = useState(0);

  useEffect(() => {
    loadRecentTransfers();
  }, []);

  const loadRecentTransfers = () => {
    // Mock recent transfers for demo
    const mockTransfers: FileTransfer[] = [
      {
        id: '1',
        filename: 'emergency_map.pdf',
        size: 2458760, // ~2.4MB
        type: 'document',
        progress: 100,
        status: 'completed',
        direction: 'receiving',
        peer: 'Emergency Station Alpha',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: '2',
        filename: 'trail_photo.jpg',
        size: 1024000, // 1MB
        type: 'image',
        progress: 75,
        status: 'transferring',
        direction: 'sending',
        peer: 'Hiking Group Leader',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: '3',
        filename: 'offline_route.gpx',
        size: 45600, // ~45KB
        type: 'other',
        progress: 100,
        status: 'completed',
        direction: 'sending',
        peer: 'Base Camp Communications',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      }
    ];
    setTransfers(mockTransfers);
    
    // Calculate total bandwidth usage
    const totalSize = mockTransfers
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.size, 0);
    setTotalBandwidth(totalSize);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await initiateFileTransfer(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Gagal memilih file');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Izin akses galeri diperlukan');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await initiateFileTransfer({
          name: `image_${Date.now()}.jpg`,
          size: file.fileSize || 0,
          uri: file.uri,
          mimeType: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const initiateFileTransfer = async (file: any) => {
    try {
      const fileType = getFileType(file.mimeType || file.name);
      const newTransfer: FileTransfer = {
        id: Date.now().toString(),
        filename: file.name,
        size: file.size || 0,
        type: fileType,
        progress: 0,
        status: 'pending',
        direction: 'sending',
        peer: 'Available Peers',
        timestamp: new Date(),
        uri: file.uri,
      };

      setTransfers(prev => [newTransfer, ...prev]);

      // Simulate file transfer process
      simulateFileTransfer(newTransfer.id);
      
      Alert.alert(
        'File Transfer Started',
        `Memulai transfer ${file.name} via Bluetooth mesh network`
      );
    } catch (error) {
      console.error('Error initiating transfer:', error);
      Alert.alert('Error', 'Gagal memulai transfer file');
    }
  };

  const simulateFileTransfer = (transferId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setTransfers(prev => prev.map(t => 
          t.id === transferId 
            ? { ...t, progress: 100, status: 'completed' }
            : t
        ));
      } else {
        setTransfers(prev => prev.map(t => 
          t.id === transferId 
            ? { ...t, progress: Math.floor(progress), status: 'transferring' }
            : t
        ));
      }
    }, 500);
  };

  const getFileType = (mimeType: string): FileTransfer['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'other';
  };

  const getFileIcon = (type: FileTransfer['type']) => {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'audio': return 'musical-notes';
      case 'document': return 'document-text';
      default: return 'document';
    }
  };

  const getStatusColor = (status: FileTransfer['status']) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'transferring': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'failed': return '#FF5722';
      default: return '#8a8a8a';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const cancelTransfer = (transferId: string) => {
    Alert.alert(
      'Cancel Transfer',
      'Batalkan transfer file ini?',
      [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: () => {
            setTransfers(prev => prev.map(t => 
              t.id === transferId 
                ? { ...t, status: 'failed', progress: 0 }
                : t
            ));
          }
        }
      ]
    );
  };

  const renderTransferItem = (transfer: FileTransfer) => (
    <View key={transfer.id} style={styles.transferItem}>
      <View style={styles.transferHeader}>
        <View style={styles.fileInfo}>
          <Ionicons 
            name={getFileIcon(transfer.type)} 
            size={24} 
            color="#e94560" 
          />
          <View style={styles.fileDetails}>
            <Text style={styles.filename}>{transfer.filename}</Text>
            <Text style={styles.fileSize}>
              {formatFileSize(transfer.size)} • {transfer.peer}
            </Text>
          </View>
        </View>
        
        <View style={styles.transferStatus}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={transfer.direction === 'sending' ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color={getStatusColor(transfer.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(transfer.status) }]}>
              {transfer.status}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTime(transfer.timestamp)}</Text>
        </View>
      </View>
      
      {transfer.status === 'transferring' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${transfer.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{transfer.progress}%</Text>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => cancelTransfer(transfer.id)}
          >
            <Ionicons name="close" size={16} color="#FF5722" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Transfer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Transfer Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Files</Text>
          
          <View style={styles.optionsGrid}>
            <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
              <Ionicons name="image" size={32} color="#4CAF50" />
              <Text style={styles.optionTitle}>Photos</Text>
              <Text style={styles.optionSubtitle}>From gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionCard} onPress={pickDocument}>
              <Ionicons name="document-text" size={32} color="#2196F3" />
              <Text style={styles.optionTitle}>Documents</Text>
              <Text style={styles.optionSubtitle}>PDF, DOC, etc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Network Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Statistics</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="swap-horizontal" size={20} color="#e94560" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{formatFileSize(totalBandwidth)}</Text>
                <Text style={styles.statLabel}>Total Transferred</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="#4CAF50" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Active Peers</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={20} color="#FF9800" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>245 KB/s</Text>
                <Text style={styles.statLabel}>Transfer Speed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transfers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transfers</Text>
          
          {transfers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#8a8a8a" />
              <Text style={styles.emptyText}>No file transfers yet</Text>
              <Text style={styles.emptySubtext}>Send or receive files via Bluetooth mesh</Text>
            </View>
          ) : (
            <View style={styles.transfersList}>
              {transfers.map(renderTransferItem)}
            </View>
          )}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#8a8a8a',
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statContent: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#8a8a8a',
    marginTop: 2,
  },
  transfersList: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  transferItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  filename: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#8a8a8a',
  },
  transferStatus: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 11,
    color: '#8a8a8a',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a3e',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#ffffff',
    marginRight: 12,
    minWidth: 35,
  },
  cancelButton: {
    padding: 4,
  },
  emptyState: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8a8a8a',
    textAlign: 'center',
    marginTop: 8,
  },
});