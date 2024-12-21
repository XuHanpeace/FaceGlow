/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { closeNativeScreen } from './src/navigation/nativeNavigationUtils';

function App(): JSX.Element {
  useEffect(() => {
    console.log('[App2] Component mounted');
    console.log('[App2] Global params:', (global as any).params);
  }, []);

  const isDarkMode = useColorScheme() === 'dark';
  const params = (global as any).params || {};

  console.log('[App2] Rendering with params:', params);

  const handleClose = () => {
    console.log('[App2] Closing screen');
    closeNativeScreen();
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <View style={[
        styles.header,
        { borderBottomColor: isDarkMode ? '#333' : '#eee' }
      ]}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>{params.title || '详情'}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Text style={[
            styles.closeButtonText,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>关闭</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {params.image && (
          <Image
            source={{ uri: params.image }}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => console.log('[App2] Image loaded')}
            onError={(error) => console.log('[App2] Image load error:', error)}
          />
        )}
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? '#ccc' : '#666' }
        ]}>{params.subtitle || ''}</Text>
        <Text style={[
          styles.count,
          { color: isDarkMode ? '#999' : '#999' }
        ]}>浏览次数：{params.count || 0}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  count: {
    fontSize: 14,
  },
});

// 添加组件名称以便调试
App.displayName = 'RecommendationDetail';

export default App;
