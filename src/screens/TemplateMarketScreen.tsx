import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (screenWidth - 60) / numColumns;

type TemplateMarketScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TemplateMarketScreenRouteProp = RouteProp<RootStackParamList, 'TemplateMarket'>;

interface Template {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  isPremium?: boolean;
}

// 模拟数据
const mockTemplates: Record<string, Template[]> = {
  'art-branding': [
    {
      id: 'art-1',
      title: 'Glam AI',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
      likes: 6000,
      isPremium: true,
    },
    {
      id: 'art-2',
      title: 'Glam AI',
      imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
      likes: 10000,
      isPremium: true,
    },
    {
      id: 'art-3',
      title: 'Glam AI',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      likes: 8500,
      isPremium: true,
    },
    {
      id: 'art-4',
      title: 'Glam AI',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
      likes: 7200,
      isPremium: false,
    },
  ],
  'community': [
    {
      id: 'community-1',
      title: 'Product Showcase',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop',
      likes: 3200,
      isPremium: false,
    },
    {
      id: 'community-2',
      title: 'Pet Portrait',
      imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=600&fit=crop',
      likes: 4500,
      isPremium: false,
    },
    {
      id: 'community-3',
      title: 'Lifestyle',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
      likes: 2800,
      isPremium: false,
    },
    {
      id: 'community-4',
      title: 'Portrait',
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
      likes: 3800,
      isPremium: false,
    },
  ],
};

const TemplateMarketScreen: React.FC = () => {
  const navigation = useNavigation<TemplateMarketScreenNavigationProp>();
  const route = useRoute<TemplateMarketScreenRouteProp>();
  const { categoryId, categoryName } = route.params;

  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    // 根据分类ID加载模板数据
    const categoryTemplates = mockTemplates[categoryId] || [];
    setTemplates(categoryTemplates);
  }, [categoryId]);

  const handleTemplatePress = (templateId: string) => {
    navigation.navigate('BeforeCreation', {
      templateId,
      templateData: {
        // 这里可以传递模板数据
      },
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.templateItem}
      onPress={() => handleTemplatePress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.templateImage}
          resizeMode="cover"
        />
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumIcon}>👑</Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.likesContainer}>
          <Text style={styles.likesIcon}>❤️</Text>
          <Text style={styles.likesText}>
            {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 模板列表 */}
      <FlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  templateItem: {
    width: itemWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: itemWidth * 1.5,
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  premiumIcon: {
    fontSize: 12,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  likesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TemplateMarketScreen;