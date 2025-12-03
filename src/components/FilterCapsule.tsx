import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface FilterCapsuleProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string; // FontAwesome icon name
}

export const FilterCapsule: React.FC<FilterCapsuleProps> = ({ label, selected, onPress, icon }) => {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <FontAwesome 
          name={icon} 
          size={14} 
          style={[styles.icon, selected && styles.selectedIcon]} 
        />
      )}
      <Text style={[styles.label, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  icon: {
    marginRight: 6,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedIcon: {
    color: '#000000',
  },
  selectedText: {
    color: '#000000',
    fontWeight: '600',
  },
});

