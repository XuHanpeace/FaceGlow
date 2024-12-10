import React from 'react';
import {View, Text, StyleSheet, useColorScheme} from 'react-native';
import type {RouteProp} from '@react-navigation/native';
import { useAppDispatch } from '../hooks/reduxHooks';
import { increment } from '../store/slices/counterSlice';

type RootStackParamList = {
  Detail: {
    id: string;
  };
};

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

type Props = {
  route: DetailScreenRouteProp;
};

const DetailScreen: React.FC<Props> = ({route}) => {
  const {id} = route.params;
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();

  React.useEffect(() => {
    dispatch(increment());
  }, [dispatch]);

  return (
    <View style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }
    ]}>
      <Text style={[
        styles.text,
        { color: colorScheme === 'dark' ? '#FFFFFF' : '#333333' }
      ]}>Detail Screen</Text>
      <Text style={[
        styles.text,
        { color: colorScheme === 'dark' ? '#FFFFFF' : '#333333' }
      ]}>ID: {id}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default DetailScreen; 