import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AlbumCard from './AlbumCard';
import { Album } from '../types/model/activity';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface ContentSectionProps {
  title: string;
  albums: Album[];
  categoryId: string;
  activityId: string;
  onAlbumPress: (album: Album, activityId: string) => void;
  onViewAllPress: (categoryId: string, categoryName: string) => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  albums,
  categoryId,
  activityId,
  onAlbumPress,
  onViewAllPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => onViewAllPress(categoryId, title)}
        >
          <Text style={styles.viewAllText}>查看全部</Text>
          <FontAwesome name="chevron-right" size={12} color="rgba(255,255,255,0.6)" style={styles.viewAllIcon} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {albums.map((album, index) => (
          <AlbumCard
            key={index}
            album={album}
            onPress={() => onAlbumPress(album, activityId)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllIcon: {
    marginLeft: 4,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
  },
});

export default ContentSection;
