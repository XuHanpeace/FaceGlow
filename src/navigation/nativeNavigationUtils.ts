import NativeNavigation from '../native/NativeNavigation';

export const openNewNativeScreen = (screenName: string, params: object = {}) => {
  NativeNavigation.openNewScreen(screenName, params);
};

export const closeNativeScreen = () => {
  NativeNavigation.closeScreen();
}; 