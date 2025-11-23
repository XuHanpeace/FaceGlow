import { Album } from "./model/activity";
import { UserWorkModel } from "./model/user_works";

export type RootStackParamList = {
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
  VerificationCode: {
    phoneNumber: string;
    verificationId: string;
    authMode: 'phone-verify' | 'register';
  };
  Subscription: undefined;
  RevenueCatSubscription: undefined;
  RevenueCatPaywall: undefined;
  CoinPurchase: undefined;
  ServiceTest: undefined;
  SubscriptionTest: undefined;
  UserWorkPreview: {
    work: UserWorkModel;
  };
  AboutUs: undefined;
  Detail: {
    id: string;
    title: string;
    content: string;
  };
  COSUploadTest: undefined;
  DatabaseTest: undefined;
};
