import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { bluetoothService } from '../services/BluetoothService';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface NearbyDevice {
  id: string;
  name: string;
  distance: number;
  lastSeen: Date;
  batteryLevel?: number;
}

export default function FeaturesScreen() {
  const router = useRouter();
  const [nearbyDevices, setNearbyDevices] = useState<NearbyDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [meshNodes, setMeshNodes] = useState<any[]>([]);

  useEffect(() => {
    loadNearbyDevices();
    loadMeshNetwork();
  }, []);

  const loadNearbyDevices = () => {
    // Simulasi perangkat terdekat untuk demo
    const mockDevices: NearbyDevice[] = [
      {
        id: '1',
        name: 'Emergency Station Alpha',
        distance: 25,
        lastSeen: new Date(),
        batteryLevel: 85
      },
      {
        id: '2',
        name: 'Hiking Group Leader',
        distance: 45,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000),
        batteryLevel: 67
      },
      {
        id: '3',
        name: 'Base Camp Communications',
        distance: 120,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        batteryLevel: 92
      }
    ];
    setNearbyDevices(mockDevices);
  };

  const loadMeshNetwork = () => {
    // Simulasi topologi mesh network
    const mockNodes = [
      { id: 'me', name: 'You', x: width/2, y: height/2, connections: ['node1', 'node2'] },
      { id: 'node1', name: 'Alice', x: width/2 - 80, y: height/2 - 60, connections: ['me', 'node3'] },
      { id: 'node2', name: 'Bob', x: width/2 + 80, y: height/2 - 60, connections: ['me', 'node3'] },
      { id: 'node3', name: 'Charlie', x: width/2, y: height/2 - 120, connections: ['node1', 'node2'] }
    ];
    setMeshNodes(mockNodes);
  };

  const scanForDevices = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    Alert.alert('Scanning', 'Mencari perangkat Gobchat terdekat...');
    
    try {
      await bluetoothService.startScanning();
      
      // Update nearby devices after scan
      setTimeout(() => {
        loadNearbyDevices();
        setIsScanning(false);
        Alert.alert('Scan Complete', 'Pemindaian selesai. Ditemukan perangkat baru!');
      }, 3000);
    } catch (error) {
      setIsScanning(false);
      Alert.alert('Error', 'Gagal memindai perangkat terdekat');
    }
  };

  const sendEmergencyBroadcast = () => {
    Alert.alert(
      'Emergency Broadcast',
      'Kirim sinyal darurat ke semua perangkat dalam jangkauan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim SOS',
          style: 'destructive',
          onPress: () => {
            Alert.alert('SOS Sent', 'Sinyal darurat telah dikirim ke jaringan mesh!');
          }
        }
      ]
    );
  };

  const shareLocation = () => {
    Alert.alert(
      'Share Location',
      'Bagikan lokasi Anda dengan perangkat terdekat?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bagikan',
          onPress: () => {
            Alert.alert('Location Shared', 'Lokasi telah dibagikan via mesh network!');
          }
        }
      ]
    );
  };

  const openFileSharing = () => {
    router.push('/file-transfer');
  };

  const openVoiceMessages = () => {
    router.push('/voice-chat');
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 50) return '#4CAF50';
    if (distance < 100) return '#FF9800';
    return '#FF5722';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return '#8a8a8a';
    if (level > 50) return '#4CAF50';
    if (level > 20) return '#FF9800';
    return '#FF5722';
  };

  const renderMeshNetwork = () => (
    <View style={styles.meshContainer}>
      <Text style={styles.sectionTitle}>Mesh Network Topology</Text>
      <View style={styles.networkMapContainer}>
        <Svg width={width - 32} height={200}>
          {/* Draw connections */}
          {meshNodes.map(node => 
            node.connections.map(connId => {
              const connNode = meshNodes.find(n => n.id === connId);
              if (!connNode || node.id >= connNode.id) return null;
              return (
                <Line
                  key={`${node.id}-${connId}`}
                  x1={node.x - 16}
                  y1={node.y - 100}
                  x2={connNode.x - 16}
                  y2={connNode.y - 100}
                  stroke="#e94560"
                  strokeWidth="2"
                  opacity={0.7}
                />
              );
            })
          )}
          
          {/* Draw nodes */}
          {meshNodes.map(node => (
            <React.Fragment key={node.id}>
              <Circle
                cx={node.x - 16}
                cy={node.y - 100}
                r="15"
                fill={node.id === 'me' ? '#e94560' : '#16213e'}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <SvgText
                x={node.x - 16}
                y={node.y - 70}
                fontSize="12"
                fill="#ffffff"
                textAnchor="middle"
              >
                {node.name}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>
    </View>
  );

  const FeatureCard = ({ icon, title, subtitle, onPress, color = '#e94560' }: any) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <View style={[styles.featureIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={28} color="#ffffff" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8a8a8a" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Features</Text>
        <TouchableOpacity onPress={scanForDevices} style={styles.scanButton}>
          <Ionicons 
            name={isScanning ? "stop" : "radar"} 
            size={24} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Mesh Network Visualization */}
        {renderMeshNetwork()}

        {/* Advanced Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Communication</Text>
          
          <FeatureCard
            icon="mic"
            title="Voice Messages"
            subtitle="Kirim pesan suara via Bluetooth"
            onPress={openVoiceMessages}
            color="#4CAF50"
          />

          <FeatureCard
            icon="folder-open"
            title="File Transfer"
            subtitle="Transfer file P2P tanpa internet"
            onPress={openFileSharing}
            color="#2196F3"
          />

          <FeatureCard
            icon="location"
            title="Share Location"
            subtitle="Bagikan koordinat GPS real-time"
            onPress={shareLocation}
            color="#FF9800"
          />

          <FeatureCard
            icon="warning"
            title="Emergency Broadcast"
            subtitle="SOS ke semua perangkat terdekat"
            onPress={sendEmergencyBroadcast}
            color="#FF5722"
          />
        </View>

        {/* Nearby Devices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Devices</Text>
            <Text style={styles.deviceCount}>{nearbyDevices.length} found</Text>
          </View>
          
          {nearbyDevices.map((device, index) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceHeader}>
                  <Ionicons name="radio" size={20} color="#e94560" />
                  <Text style={styles.deviceName}>{device.name}</Text>
                </View>
                
                <View style={styles.deviceStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="location-outline" size={16} color={getDistanceColor(device.distance)} />
                    <Text style={[styles.statText, { color: getDistanceColor(device.distance) }]}>
                      {device.distance}m
                    </Text>
                  </View>
                  
                  {device.batteryLevel && (
                    <View style={styles.statItem}>
                      <Ionicons name="battery-half" size={16} color={getBatteryColor(device.batteryLevel)} />
                      <Text style={[styles.statText, { color: getBatteryColor(device.batteryLevel) }]}>
                        {device.batteryLevel}%
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={16} color="#8a8a8a" />
                    <Text style={styles.statText}>
                      {Math.floor((Date.now() - device.lastSeen.getTime()) / 60000)}m ago
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Network Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Connected</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="flash" size={24} color="#FF9800" />
              <Text style={styles.statValue}>12ms</Text>
              <Text style={styles.statLabel}>Latency</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="swap-horizontal" size={24} color="#2196F3" />
              <Text style={styles.statValue}>2.4MB</Text>
              <Text style={styles.statLabel}>Transferred</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="cellular" size={24} color="#e94560" />
              <Text style={styles.statValue}>95%</Text>
              <Text style={styles.statLabel}>Signal</Text>
            </View>
          </View>
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
  scanButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  deviceCount: {
    fontSize: 14,
    color: '#8a8a8a',
  },
  meshContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  networkMapContainer: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#8a8a8a',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  connectButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8a8a8a',
    marginTop: 4,
  },
});