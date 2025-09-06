import { Album } from "./model/activity";

export type RootStackParamList = {
  MainTab: undefined;
  NewHome: undefined;
  BeforeCreation: {
    albumData: Album;
  };
  AlbumMarket: {
    activityId: string;
    activityName: string;
  };
  Settings: undefined;
  Profile: undefined;
  NewProfile: undefined;
  TestCenter: undefined;
  SelfieGuide: undefined;
  Notifications: undefined;
  Login: undefined;
  NewAuth: undefined;
  Subscription: undefined;
  ServiceTest: undefined;
  Detail: {
    id: string;
    title: string;
    content: string;
  };
  COSUploadTest: undefined;
  DatabaseTest: undefined;
};
