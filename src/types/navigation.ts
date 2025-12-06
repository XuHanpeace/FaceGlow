import { Album } from "./model/activity";
import { UserWorkModel } from "./model/user_works";

export type RootStackParamList = {
  NewHome: {
    showRewardModal?: boolean;
    rewardAmount?: number;
  } | undefined;
  BeforeCreation: {
    albumData: Album;
    activityId: string;
  };
  CreationResult: {
    albumData: Album;
    selfieUrl?: string;
    activityId?: string;
    isAsyncTask?: boolean;
    resultImage?: string;
    workId?: string;
    activityTitle?: string;
  };
  AlbumMarket: {
    activityId: string;
    activityName: string;
  };
  NewProfile: undefined;
  SelfieGuide: {
    isNewUser?: boolean;
  } | undefined;
  NewAuth: {
    initialMode?: 'phone-verify' | 'register';
  } | undefined;
  VerificationCode: {
    phoneNumber: string;
    verificationId: string;
    authMode?: 'phone-verify' | 'register'; // 可选，系统会自动判断登录或注册
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
