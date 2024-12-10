import React from 'react';
import {View, Text, StyleSheet, ScrollView, useColorScheme} from 'react-native';

interface SectionContainerProps {
  title: string;
  children: React.ReactNode;
  horizontalScroll?: boolean;
}

const SectionContainer: React.FC<SectionContainerProps> = ({title, children, horizontalScroll = false}) => {
  const colorScheme = useColorScheme();
  
  return (
    <View style={styles.wrapper}>
      <Text style={[
        styles.sectionTitle,
        { color: colorScheme === 'dark' ? '#FFFFFF' : '#333333' }
      ]}>
        {title}
      </Text>
      {horizontalScroll ? (
        <ScrollView horizontal style={styles.container} showsHorizontalScrollIndicator={false}>
          {React.Children.map(children, (child) => (
            <View style={styles.cardWrapper}>{child}</View>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.container, styles.spaceBetween]}>
          {React.Children.map(children, (child) => (
            <View>{child}</View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 4,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginRight: 8,
  },
});

export default SectionContainer; 