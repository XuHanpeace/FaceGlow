import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle
} from 'react-native';
import { CategoryConfigRecord } from '../types/model/config';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface FilterSectionProps {
  // Parent Tabs
  functionTypes: CategoryConfigRecord[];
  selectedFunctionType: string;
  onSelectFunctionType: (code: string) => void;

  // Sub Tabs
  themeStyles: CategoryConfigRecord[];
  selectedThemeStyle: string;
  onSelectThemeStyle: (code: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ANIMATION_DURATION = 200; // Faster animation

// --- Animated Tab Item Component ---
// This component handles its own text color animation based on selection state
const AnimatedTabItem: React.FC<{
  item: CategoryConfigRecord;
  isSelected: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
  onPress: () => void;
}> = ({ item, isSelected, onLayout, onPress }) => {
  // Animation value for color: 0 = unselected, 1 = selected
  const colorAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isSelected ? 1 : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: false, // Color interpolation is not supported by native driver
    }).start();
  }, [isSelected]);

  // Interpolate colors
  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 1.0)', '#000000']
  });
  
  const iconColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 1.0)', '#000000']
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onLayout={onLayout}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Background for unselected state (Gray Pill) - absolute to be behind text but on top of nothing? 
          Actually, parent container has background? No. 
          The design says: Unselected pills should be gray bg, white text.
          Selected pill is indicated by the moving white block (which is behind this touchable).
          So we need a static gray background for EACH item?
          If we put a gray background here, the white moving block (which is zIndex 0) will be covered if we are opaque.
          If unselected items have gray bg, and selected items rely on the white block...
          We can have a View here that has gray bg. 
          BUT, when the white block slides UNDER this view, if this view is gray, we won't see the white block?
          Wait, if the selected item ALSO has gray bg, then the white block is hidden.
          
          Solution: 
          The white moving block is `position: absolute` in the ScrollView.
          The Tab Items are rendered on top (zIndex 1).
          
          If unselected items need a "gray pill" look:
          We can render a gray View inside this Touchable.
          BUT, for the SELECTED item, we want the white block to show.
          So the gray background must fade out when selected? Or just be transparent?
          The moving white block effectively "replaces" the gray background.
          
          Let's make the gray background vanish when selected?
          Or: The moving white block is the "Selected State".
          The unselected items are "Gray Pills".
          We can animate the opacity of the gray background from 1 (unselected) to 0 (selected).
      */}
      <Animated.View
        style={[
          styles.tabItemBackground, // Gray rounded rect
          {
            opacity: colorAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0] // Hide gray bg when selected (because white block is behind)
            })
          }
        ]}
      />

      <View style={styles.tabContent}>
        {item.icon && (
          <Animated.Text style={[styles.icon, { color: iconColor }]}>
            <FontAwesome name={item.icon} size={16} />
          </Animated.Text>
        )}
        <Animated.Text style={[styles.tabText, { color: textColor, fontWeight: isSelected ? 'bold' : '600' }]}>
          {item.category_label}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );
};


export const FilterSection: React.FC<FilterSectionProps> = ({
  functionTypes,
  selectedFunctionType,
  onSelectFunctionType,
  themeStyles,
  selectedThemeStyle,
  onSelectThemeStyle,
}) => {
  // --- Parent Tabs Logic ---
  const [layouts, setLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation Values
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // Combine "All" with types
  const allFunctionType: CategoryConfigRecord = {
    category_id: 'all',
    category_code: 'all',
    category_label: '全部',
    category_type: 'function_type',
    is_active: true,
    sort_order: 0,
    created_at: 0,
    updated_at: 0,
    extra_config: { description: '' }
  };
  
  const mainTabs = [allFunctionType, ...functionTypes];

  const onTabLayout = (code: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts(prev => ({ ...prev, [code]: { x, width } }));
  };

  useEffect(() => {
    const layout = layouts[selectedFunctionType];
    if (layout) {
      // Animate Indicator
      Animated.parallel([
        Animated.timing(indicatorX, {
          toValue: layout.x,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(indicatorWidth, {
          toValue: layout.width,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ]).start();

      // Scroll into view with centering
      if (scrollViewRef.current) {
        // Calculate center position correctly accounting for layout.width
        const centerX = layout.x + layout.width / 2;
        // Center in screen (approximate, assuming ScrollView is full width)
        const scrollX = centerX - SCREEN_WIDTH / 2;
        scrollViewRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
      }
    }
  }, [selectedFunctionType, layouts]);

  const selectedItem = mainTabs.find(t => t.category_code === selectedFunctionType);
  const description = selectedItem?.extra_config?.description;

  // --- Sub Tabs Logic ---
  const allThemeStyle: CategoryConfigRecord = {
    category_id: 'sub_all',
    category_code: 'all',
    category_label: 'All',
    category_type: 'theme_style',
    is_active: true,
    sort_order: 0,
    created_at: 0,
    updated_at: 0,
  };
  
  // 构建子分类列表，确保按照 sort_order 排序
  const sortedThemeStyles = [...themeStyles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const subTabsList = sortedThemeStyles.length > 0 ? [allThemeStyle, ...sortedThemeStyles] : [];

  return (
    <View style={styles.container}>
      {/* Parent Tabs */}
      <View style={styles.mainTabsContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Animated Indicator (White Block) */}
          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [{ translateX: indicatorX }],
                width: indicatorWidth,
              },
            ]}
          />

          {mainTabs.map((item) => {
            const isSelected = selectedFunctionType === item.category_code;
            return (
              <AnimatedTabItem
                key={item.category_id}
                item={item}
                isSelected={isSelected}
                onLayout={(e) => onTabLayout(item.category_code, e)}
                onPress={() => onSelectFunctionType(item.category_code)}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Description Area */}
      {description && (
         <View style={styles.descriptionContainer}>
             <Text style={styles.descriptionText}>{description}</Text>
         </View>
      )}

      {/* Sub Tabs */}
      {subTabsList.length > 0 && (
        <View style={styles.subTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subScrollContent}>
            {subTabsList.map((item) => {
              const isSelected = selectedThemeStyle === item.category_code;
              return (
                <TouchableOpacity
                  key={item.category_id}
                  style={[
                      styles.subTabItem, 
                      isSelected ? styles.selectedSubTabItem : styles.unselectedSubTabItem
                  ]}
                  onPress={() => onSelectThemeStyle(item.category_code)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                      styles.subTabText, 
                      isSelected ? styles.selectedSubTabText : styles.unselectedSubTabText
                  ]}>
                    {item.category_label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  mainTabsContainer: {
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 10, // Restored padding
    alignItems: 'center',
    height: 44,
  },
  indicator: {
    position: 'absolute',
    height: 36, // Match tab item height
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    top: 4, // Centered vertically (44 - 36) / 2
    zIndex: 0,
  },
  tabItem: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginRight: 10, // Increased margin between capsules
    zIndex: 1,
    position: 'relative',
    // marginTop removed to allow alignItems: 'center' to handle vertical centering perfectly
  },
  tabItemBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#333333', // Gray background for unselected state
    borderRadius: 18,
    zIndex: -1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
    fontSize: 16, 
    // Color handled by animation
  },
  tabText: {
    fontSize: 15,
    // Color and weight handled by animation
  },
  
  // Description
  descriptionContainer: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },

  // Sub Tabs
  subTabsContainer: {
    marginBottom: 4,
  },
  subScrollContent: {
    paddingHorizontal: 4,
  },
  subTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6, // Reduced margin
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedSubTabItem: {
    backgroundColor: '#333333', // Gray background
  },
  selectedSubTabItem: {
    backgroundColor: '#FFFFFF', // White background
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unselectedSubTabText: {
    color: '#FFFFFF',
  },
  selectedSubTabText: {
    color: '#000000',
    fontWeight: '600',
  },
});
