import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, Text } from 'react-native';

interface ControlPanelProps {
  selectedImage: string | null;
  onUpload: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ selectedImage, onUpload }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(80)).current;

  const toggleExpand = () => {
    const toValue = isExpanded ? 80 : 400;
    setIsExpanded(!isExpanded);
    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.controlBar, { height: animatedHeight }]}>
        <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
          <Image
            source={{ uri: 'https://img.icons8.com/?size=100&id=2775&format=png&color=000000' }}
            style={[styles.arrowIcon, isExpanded && styles.arrowIconRotated]}
          />
        </TouchableOpacity>

        {isExpanded && <Text style={styles.title}>加入你的正脸照来换脸</Text>}

        <View style={styles.contentContainer}>
          {selectedImage ? (
            <View style={styles.imageRow}>
              <Image
                source={{ uri: selectedImage }}
                style={[styles.selectedImage, isExpanded && styles.expandedImage]}
              />
              <Image
                source={{ uri: 'https://img.icons8.com/?size=100&id=7811&format=png&color=000000' }}
                style={[styles.arrowIcon, isExpanded && styles.expandedArrow]}
              />
              <TouchableOpacity onPress={onUpload}>
                <View style={[styles.addButton, isExpanded && styles.expandedImage]}>
                  <Image
                    source={{
                      uri: 'https://img.icons8.com/?size=100&id=1501&format=png&color=000000',
                    }}
                    style={styles.plusIcon}
                  />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, isExpanded && styles.expandedImage]}
              onPress={onUpload}
            >
              <Image
                source={{ uri: 'https://img.icons8.com/?size=100&id=1501&format=png&color=000000' }}
                style={styles.plusIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        {!isExpanded && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => {
              onUpload();
              if (!isExpanded) toggleExpand();
            }}
          >
            <Text style={styles.uploadButtonText}>添加</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 80,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  expandButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  arrowIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  selectedImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  expandedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    width: '48%',
    height: '48%',
    tintColor: '#666',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5EE7DF',
    borderRadius: 20,
    zIndex: 1,
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  expandedPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 80, // controlBar的高度
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    position: 'absolute',
    top: 25,
    left: 70,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  expandedArrow: {
    width: 40,
    height: 40,
  },
});

export default ControlPanel;
