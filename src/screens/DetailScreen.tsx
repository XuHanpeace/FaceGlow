import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { closeNativeScreen } from '../navigation/nativeNavigationUtils';

type DetailScreenProps = {
  route: {
    params: {
      id: string;
      title: string;
      content: string;
    };
  };
};

const DetailScreen: React.FC<DetailScreenProps> = ({ route }) => {
  const { title, content } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  const handleClose = () => {
    closeNativeScreen();
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <View style={[
        styles.header,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }
      ]}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>{title}</Text>
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
        <Text style={[
          styles.contentText,
          { color: isDarkMode ? '#ccc' : '#333' }
        ]}>{content}</Text>
      </ScrollView>
    </View>
  );
};

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
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
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
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default DetailScreen; 