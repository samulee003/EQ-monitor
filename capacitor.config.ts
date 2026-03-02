import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imxin.app',
  appName: '今心 ImXin',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#fdfaf3'
  }
};

export default config;
