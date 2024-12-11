export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Profile: undefined;
  Notifications: undefined;
  Detail: {
    id: string;
    title: string;
    content?: string;
  };
}; 