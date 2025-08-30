/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaView} from 'react-native';
import StackNavigator from './src/navigation/StackNavigator';
import {RootStackParamList} from './src/types/navigation';
import { ModalProvider } from './src/components/modal';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

function App(): JSX.Element {
  return (
    <ModalProvider>
      <SafeAreaView style={{flex: 1}}>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </ModalProvider>
  );
}

export default App;
