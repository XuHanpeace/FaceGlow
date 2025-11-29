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
  NewProfile: undefined;
  SelfieGuide: undefined;
  NewAuth: {
    initialMode?: 'phone-verify' | 'register';
  } | undefined;
  VerificationCode: {
    phoneNumber: string;
    verificationId: string;
    authMode: 'phone-verify' | 'register';
  };
  Subscription: undefined;
  CoinPurchase: undefined;
  UserWorkPreview: {
    work?: UserWorkModel;
    initialWorkId?: string;
    worksList?: UserWorkModel[];
  };
  AboutUs: undefined;
  WebView: {
    url: string;
    title?: string;
  };
};
