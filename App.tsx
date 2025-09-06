/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StyleSheet, View, SafeAreaView, StatusBar} from 'react-native';
import { Provider } from 'react-redux';
import StackNavigator from './src/navigation/StackNavigator';
import {RootStackParamList} from './src/types/navigation';
import { ModalProvider } from './src/components/modal';
import { store } from './src/store';
import AuthGuard from './src/components/AuthGuard';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <ModalProvider>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <View style={styles.container}>
          <NavigationContainer>
            <AuthGuard>
              <StackNavigator />
            </AuthGuard>
          </NavigationContainer>
        </View>
      </ModalProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default App;
