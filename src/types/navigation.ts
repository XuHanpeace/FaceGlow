import { Album } from "./model/activity";
import { UserWorkModel } from "./model/user_works";

export type RootStackParamList = {
  MainTab: undefined;
  NewHome: undefined;
  BeforeCreation: {
    albumData: Album;
    activityId: string;
  };
  CreationResult: {
    albumData: Album;
    selfieUrl: string;
    activityId: string;
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
  UserWorkPreview: {
    work: UserWorkModel;
  };
  Detail: {
    id: string;
    title: string;
    content: string;
  };
  COSUploadTest: undefined;
  DatabaseTest: undefined;
};
