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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { fetchTemplates } from '../store/middleware/asyncMiddleware';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (screenWidth - 60) / numColumns;

type TemplateMarketScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TemplateMarketScreenRouteProp = RouteProp<RootStackParamList, 'TemplateMarket'>;

// 使用Redux中的Template类型
import type { Template } from '../store/middleware/asyncMiddleware';

const TemplateMarketScreen: React.FC = () => {
  const navigation = useNavigation<TemplateMarketScreenNavigationProp>();
  const route = useRoute<TemplateMarketScreenRouteProp>();
  const { categoryId, categoryName } = route.params;
  
  const dispatch = useAppDispatch();
  
  // 从Redux获取模板数据
  const templates = useTypedSelector((state) => state.templates.templates[categoryId] || []);
  const isLoading = useTypedSelector((state) => state.templates.loading);
  const error = useTypedSelector((state) => state.templates.error);

  useEffect(() => {
    // 如果该分类的模板数据为空，则发起请求
    if (templates.length === 0) {
      dispatch(fetchTemplates({ categoryId }));
    }
  }, [categoryId, templates.length, dispatch]);

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

  // 渲染加载状态
  if (isLoading) {
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

        {/* 加载状态 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>加载模板中...</Text>
        </View>
      </View>
    );
  }

  // 渲染错误状态
  if (error) {
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

        {/* 错误状态 */}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>加载失败: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => dispatch(fetchTemplates({ categoryId }))}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TemplateMarketScreen;