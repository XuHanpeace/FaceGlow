export type RootStackParamList = {
  MainTab: undefined;
  NewHome: undefined;
  BeforeCreation: {
    templateId: string;
    templateData?: any;
  };
  TemplateMarket: {
    categoryId: string;
    categoryName: string;
  };
  Settings: undefined;
  Profile: undefined;
  NewProfile: undefined;
  TestCenter: undefined;
  SelfieGuide: undefined;
  Notifications: undefined;
  Login: undefined;
  Detail: {
    id: string;
    title: string;
    content: string;
  };
  COSUploadTest: undefined;
  DatabaseTest: undefined;
};
