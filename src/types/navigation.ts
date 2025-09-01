export type RootStackParamList = {
  MainTab: undefined;
  Home: undefined;
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
