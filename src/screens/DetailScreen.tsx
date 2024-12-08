import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../App';
import { useAppDispatch } from '../hooks/reduxHooks';
import { increment } from '../store/slices/counterSlice';

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

type Props = {
  route: DetailScreenRouteProp;
};

const DetailScreen: React.FC<Props> = ({route}) => {
  const {id} = route.params;
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(increment());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Detail Screen</Text>
      <Text style={styles.text}>ID: {id}</Text>
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