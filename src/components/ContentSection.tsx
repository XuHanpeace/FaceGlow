import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import TemplateCard from './TemplateCard';

interface Template {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  isPremium?: boolean;
}

interface ContentSectionProps {
  title: string;
  templates: Template[];
  categoryId: string;
  onTemplatePress: (templateId: string) => void;
  onViewAllPress: (categoryId: string, categoryName: string) => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  templates,
  categoryId,
  onTemplatePress,
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
          <Text style={styles.viewAllText}>查看全部 {'>'}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            title={template.title}
            imageUrl={template.imageUrl}
            likes={template.likes}
            isPremium={template.isPremium}
            onPress={onTemplatePress}
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
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
  },
});

export default ContentSection;
