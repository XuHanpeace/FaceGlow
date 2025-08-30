import { NativeModules, Platform } from 'react-native';

interface NativeNavigationInterface {
  openNewScreen: (screenName: string, params: object) => void;
  closeScreen: () => void;
}

const { NativeNavigation } = NativeModules;

if (!NativeNavigation) {
  console.error(
    `NativeNavigation module is not available on ${Platform.OS}. Make sure it is properly linked.`,NativeModules
  );
}

export default NativeNavigation as NativeNavigationInterface; 