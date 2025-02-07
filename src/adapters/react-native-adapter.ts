import {
  StorageType,
  AbstractSDKRequest,
  IRequestOptions,
  IUploadRequestOptions,
} from '@cloudbase/adapter-interface';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. 实现网络请求类
class RNRequest extends AbstractSDKRequest {
  public post(options: IRequestOptions) {
    return fetch(options.url, {
      method: 'POST',
      headers: options.headers,
      body: options.data,
    }).then(res => res.json());
  }

  public upload(options: IUploadRequestOptions) {
    const formData = new FormData();
    formData.append('file', {
      uri: options.file,
      name: options.fileName,
      type: options.mimeType,
    });

    return fetch(options.url, {
      method: 'POST',
      headers: options.headers,
      body: formData,
    }).then(res => res.json());
  }

  public download(options: IRequestOptions) {
    return fetch(options.url, {
      method: 'GET',
      headers: options.headers,
    }).then(res => res.blob());
  }
}

// 2. 实现本地存储
const RNStorage = {
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  getItem: (key: string) => AsyncStorage.getItem(key),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
};

// 3. 实现WebSocket（使用React Native原生WebSocket）
class RNWebSocket {
  private socket: WebSocket;

  constructor(url: string, options: object = {}) {
    this.socket = new WebSocket(url);
  }

  get onopen() {
    return (cb: () => void) => {
      this.socket.onopen = cb;
    };
  }

  // 其他事件监听器类似实现...
}

// 4. 创建适配器
const ReactNativeAdapter = {
  runtime: 'react-native',
  isMatch: () => {
    return true;
  },
  genAdapter: () => ({
    root: {}, // React Native没有全局window对象
    reqClass: RNRequest,
    wsClass: RNWebSocket as any,
    localStorage: RNStorage,
    primaryStorage: StorageType.local,
    getAppSign: () => {
      // 从原生模块获取应用签名（需原生开发配合）
      return 'your-react-native-app-signature';
    },
  }),
};

export default ReactNativeAdapter;
