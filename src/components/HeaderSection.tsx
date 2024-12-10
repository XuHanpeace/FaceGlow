import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  subtitle,
  description,
}) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#fff' : '#333' }
      ]}>{title}</Text>
      {subtitle && (
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>{subtitle}</Text>
      )}
      {description && (
        <Text style={[
          styles.description,
          { color: isDarkMode ? '#999' : '#666' }
        ]}>{description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
  },
});

export default HeaderSection; 