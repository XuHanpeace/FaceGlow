import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2; // 考虑边距和列间距

interface Template {
  id: string;
  imageUrl: string;
  height: number; // 新增height属性来支持不同高度
}

interface TemplateGridProps {
  templates: Template[];
  selectedId: string;
  onSelect: (template: Template) => void;
}

const TemplateGrid: React.FC<TemplateGridProps> = ({ templates, selectedId, onSelect }) => {
  // 将模板分成左右两列
  const leftTemplates = templates.filter((_, index) => index % 2 === 0);
  const rightTemplates = templates.filter((_, index) => index % 2 === 1);

  return (
    <View style={styles.container}>
      {/* 标题区域 */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>更多AI写真模板等你发掘</Text>
        <Text style={styles.subtitle}>探索独特风格，定制专属写真</Text>
      </View>

      {/* 瀑布流布局 */}
      <View style={styles.waterfall}>
        {/* 左列 */}
        <View style={styles.column}>
          {leftTemplates.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateItem,
                { height: template.height },
                selectedId === template.id && styles.selectedTemplate,
              ]}
              onPress={() => onSelect(template)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: template.imageUrl }} style={styles.templateImage} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 右列 */}
        <View style={styles.column}>
          {rightTemplates.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateItem,
                { height: template.height },
                selectedId === template.id && styles.selectedTemplate,
              ]}
              onPress={() => onSelect(template)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: template.imageUrl }} style={styles.templateImage} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  waterfall: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  templateItem: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#5EE7DF',
  },
  templateImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
});

export default TemplateGrid;
