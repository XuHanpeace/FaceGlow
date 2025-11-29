import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  StatusBar,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { colors } from '../config/theme';

const ScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isScanning, setIsScanning] = useState(true);

  const onReadCode = (event: any) => {
    if (!isScanning) return;
    
    const scannedValue = event.nativeEvent.codeStringValue;
    if (scannedValue && (scannedValue.startsWith('faceglow://') || scannedValue.startsWith('http'))) {
      setIsScanning(false);
      
      // 如果是 faceglow schema，直接打开触发热更新
      // 如果是 http 链接，也尝试打开，可能是下载页或其他
      Linking.openURL(scannedValue).catch(err => {
        Alert.alert('错误', '无法打开链接: ' + scannedValue);
        setIsScanning(true);
      });
      
      // 扫描成功后返回
      navigation.goBack();
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Camera
        style={styles.camera}
        scanBarcode={true}
        onReadCode={onReadCode}
        showFrame={true}
        laserColor={colors.primary}
        frameColor='white'
        barcodeFrameSize={{ width: 280, height: 280 }}
      />
      
      <View style={styles.header}>
        <BackButton iconType="close" onPress={handleBackPress} absolute={false} />
        <Text style={styles.title}>扫描二维码</Text>
        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
});

export default ScanScreen;
