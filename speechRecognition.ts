import { NativeModules, Platform } from 'react-native';

type SpeechRecognitionResult = {
  text: string;
  confidence: number;
};

type SpeechRecognitionNativeModule = {
  checkPermission: () => Promise<boolean>;
  isAvailable: () => Promise<boolean>;
  startListening: (language: string) => Promise<SpeechRecognitionResult>;
  stopListening: () => Promise<boolean>;
  cancelListening: () => Promise<boolean>;
  destroy: () => Promise<boolean>;
};

const nativeModule: SpeechRecognitionNativeModule | null =
  Platform.OS === 'android'
    ? (NativeModules.SpeechRecognitionModule as SpeechRecognitionNativeModule)
    : null;

function ensureAvailable(): SpeechRecognitionNativeModule {
  if (!nativeModule) {
    throw new Error('语音识别功能仅支持 Android 设备。');
  }
  return nativeModule;
}

/**
 * 检查是否有录音权限
 */
export async function checkPermission(): Promise<boolean> {
  return ensureAvailable().checkPermission();
}

/**
 * 检查语音识别是否可用
 */
export async function isAvailable(): Promise<boolean> {
  return ensureAvailable().isAvailable();
}

/**
 * 开始语音识别
 * @param language 语言代码，例如 'zh-CN' (中文), 'en-US' (英文)
 */
export async function startListening(
  language: string = 'zh-CN',
): Promise<SpeechRecognitionResult> {
  return ensureAvailable().startListening(language);
}

/**
 * 停止语音识别
 */
export async function stopListening(): Promise<boolean> {
  return ensureAvailable().stopListening();
}

/**
 * 取消语音识别
 */
export async function cancelListening(): Promise<boolean> {
  return ensureAvailable().cancelListening();
}

/**
 * 销毁语音识别器
 */
export async function destroy(): Promise<boolean> {
  return ensureAvailable().destroy();
}

