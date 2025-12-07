import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import tw from 'twrnc';
import {
  isServiceRunning,
  openAccessibilitySettings,
  openApp as openTargetApp,
  tap,
  swipe,
  pasteText,
} from '../automation';

interface CommandExecutorProps {
  commandText: string;
}

/**
 * 命令执行组件
 * 接收文字命令并执行相应的自动化操作
 */
export default function CommandExecutor({ commandText }: CommandExecutorProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const [serviceEnabled, setServiceEnabled] = useState<boolean | null>(null);
  const [statusText, setStatusText] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<string[]>([]);
  const [manualCommand, setManualCommand] = useState('');
  const lastCommandRef = useRef<string>('');

  const ensureAndroid = () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        '仅支持 Android',
        '跨应用自动化依赖 Android 无障碍接口，iOS 出于安全限制无法后台控制其他应用。',
      );
      return false;
    }
    return true;
  };

  const handleCheckService = async () => {
    if (!ensureAndroid()) {
      return;
    }
    setBusyAction('check');
    try {
      const enabled = await isServiceRunning();
      setServiceEnabled(enabled);
      setStatusText(
        enabled
          ? '无障碍服务已开启，可直接发送点击/滑动。'
          : '无障碍未开启，点击"打开无障碍设置"并启用 XAIApp 自动化服务。',
      );
    } catch (error) {
      console.error('检查无障碍状态失败', error);
      setStatusText('无法获取无障碍状态，请在系统设置中确认。');
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenAccessibilitySettings = async () => {
    if (!ensureAndroid()) {
      return;
    }
    setBusyAction('settings');
    try {
      await openAccessibilitySettings();
      setStatusText('已跳转到无障碍设置，请启用 "XAIApp 自动化服务" 后返回。');
    } catch (error) {
      console.error('打开无障碍设置失败', error);
      setStatusText('无法打开无障碍设置，请手动前往 设置 > 无障碍。');
    } finally {
      setBusyAction(null);
    }
  };

  /**
   * 解析并执行命令
   */
  const handleExecuteCommand = useCallback(async (command: string) => {
    if (!ensureAndroid()) {
      return;
    }

    if (!serviceEnabled) {
      Alert.alert('提示', '请先开启无障碍服务');
      return;
    }

    setBusyAction('execute');
    const trimmedCommand = command.trim().toLowerCase();

    try {
      let result = '';

      // 解析命令类型
      if (trimmedCommand.includes('打开') || trimmedCommand.includes('启动')) {
        // 提取包名或应用名
        const packageMatch = trimmedCommand.match(/打开\s*(\S+)|启动\s*(\S+)/);
        if (packageMatch) {
          const packageName = packageMatch[1] || packageMatch[2];
          const opened = await openTargetApp(packageName);
          result = opened
            ? `已启动应用: ${packageName}`
            : `未找到应用: ${packageName}`;
        } else {
          result = '无法识别应用名称，请使用格式：打开 com.example.app';
        }
      } else if (trimmedCommand.includes('点击')) {
        // 提取坐标 (示例：点击 100,200)
        const coordMatch = trimmedCommand.match(/点击\s*(\d+)\s*[,，]\s*(\d+)/);
        if (coordMatch) {
          const x = parseInt(coordMatch[1], 10);
          const y = parseInt(coordMatch[2], 10);
          await tap(x, y);
          result = `已点击坐标: (${x}, ${y})`;
        } else {
          result = '无法识别坐标，请使用格式：点击 100,200';
        }
      } else if (trimmedCommand.includes('滑动')) {
        // 提取滑动坐标 (示例：滑动 100,200 到 300,400)
        const swipeMatch = trimmedCommand.match(
          /滑动\s*(\d+)\s*[,，]\s*(\d+)\s+到\s+(\d+)\s*[,，]\s*(\d+)/,
        );
        if (swipeMatch) {
          const startX = parseInt(swipeMatch[1], 10);
          const startY = parseInt(swipeMatch[2], 10);
          const endX = parseInt(swipeMatch[3], 10);
          const endY = parseInt(swipeMatch[4], 10);
          await swipe(startX, startY, endX, endY);
          result = `已滑动: (${startX}, ${startY}) -> (${endX}, ${endY})`;
        } else {
          result = '无法识别滑动坐标，请使用格式：滑动 100,200 到 300,400';
        }
      } else if (trimmedCommand.includes('输入') || trimmedCommand.includes('粘贴')) {
        // 提取要输入的文本
        const textMatch = trimmedCommand.match(/输入\s+(.+)|粘贴\s+(.+)/);
        if (textMatch) {
          const text = textMatch[1] || textMatch[2];
          await pasteText(text);
          result = `已输入文本: ${text}`;
        } else {
          result = '无法识别文本内容，请使用格式：输入 你好世界';
        }
      } else {
        result = `无法识别命令: ${command}`;
      }

      // 添加到执行历史
      setExecutionHistory(prev => [
        `[${new Date().toLocaleTimeString()}] ${command} -> ${result}`,
        ...prev,
      ]);
      setStatusText(result);
    } catch (error) {
      console.error('执行命令失败', error);
      const errorMsg = `执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
      setStatusText(errorMsg);
      setExecutionHistory(prev => [
        `[${new Date().toLocaleTimeString()}] ${command} -> ${errorMsg}`,
        ...prev,
      ]);
    } finally {
      setBusyAction(null);
    }
  }, [serviceEnabled]);

  useEffect(() => {
    // 当接收到新的命令文本时，自动执行（避免重复执行相同命令）
    if (commandText && commandText.trim() && commandText !== lastCommandRef.current) {
      lastCommandRef.current = commandText;
      handleExecuteCommand(commandText);
    }
  }, [commandText, handleExecuteCommand]);

  const handleManualExecute = () => {
    if (manualCommand.trim()) {
      handleExecuteCommand(manualCommand);
      setManualCommand('');
    }
  };

  const inputStyle = tw.style(
    'flex-1 rounded-xl px-3 py-2 text-base',
    isDarkMode
      ? 'bg-slate-800 text-white border border-slate-700'
      : 'bg-white border border-slate-200 text-slate-900',
  );

  const anyBusy = busyAction !== null;

  return (
    <View
      style={tw.style(
        'rounded-2xl p-4 gap-3',
        isDarkMode ? 'bg-slate-800' : 'bg-white',
        isDarkMode ? undefined : tw`border border-slate-200`,
      )}
    >
      <Text
        style={tw.style(
          'text-lg font-semibold',
          isDarkMode ? 'text-white' : 'text-slate-900',
        )}
      >
        命令执行
      </Text>
      <Text
        style={tw.style(
          'text-sm leading-6',
          isDarkMode ? 'text-slate-300' : 'text-slate-700',
        )}
      >
        接收并执行文字命令，支持打开应用、点击、滑动、输入等操作。
      </Text>

      {/* 无障碍服务状态 */}
      <View style={tw`gap-2`}>
        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity
            disabled={anyBusy}
            onPress={handleOpenAccessibilitySettings}
            style={tw.style(
              'flex-1 rounded-xl py-3 px-4',
              isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600',
              anyBusy ? 'opacity-70' : undefined,
            )}
          >
            <Text style={tw`text-center text-white text-sm font-semibold`}>
              打开无障碍设置
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={anyBusy}
            onPress={handleCheckService}
            style={tw.style(
              'flex-1 rounded-xl py-3 px-4',
              isDarkMode ? 'bg-slate-700' : 'bg-slate-200',
              anyBusy ? 'opacity-70' : undefined,
            )}
          >
            <Text
              style={tw.style(
                'text-center text-sm font-semibold',
                isDarkMode ? 'text-white' : 'text-slate-900',
              )}
            >
              刷新状态
            </Text>
          </TouchableOpacity>
        </View>
        <Text
          style={tw.style(
            'text-sm leading-6',
            isDarkMode ? 'text-slate-200' : 'text-slate-800',
          )}
        >
          {statusText ||
            (serviceEnabled === null
              ? '尚未检测无障碍状态。'
              : serviceEnabled
                ? '无障碍已开启，可直接下发指令。'
                : '无障碍未开启，请在系统设置中打开。')}
        </Text>
      </View>

      {/* 手动输入命令 */}
      <View style={tw`gap-2`}>
        <Text
          style={tw.style(
            'text-sm font-semibold',
            isDarkMode ? 'text-slate-200' : 'text-slate-800',
          )}
        >
          手动输入命令：
        </Text>
        <View style={tw`flex-row gap-2`}>
          <TextInput
            value={manualCommand}
            onChangeText={setManualCommand}
            placeholder="例如：打开 com.tencent.mm"
            placeholderTextColor={isDarkMode ? '#94a3b8' : '#94a3b8'}
            style={inputStyle}
            editable={!anyBusy}
          />
          <TouchableOpacity
            disabled={anyBusy || !manualCommand.trim()}
            onPress={handleManualExecute}
            style={tw.style(
              'rounded-xl py-3 px-4',
              isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600',
              anyBusy || !manualCommand.trim() ? 'opacity-70' : undefined,
            )}
          >
            <Text style={tw`text-center text-white text-sm font-semibold`}>
              执行
            </Text>
          </TouchableOpacity>
        </View>
        <Text
          style={tw.style(
            'text-xs leading-5',
            isDarkMode ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          支持命令：打开/启动 [包名]、点击 [x,y]、滑动 [x1,y1] 到 [x2,y2]、输入/粘贴 [文本]
        </Text>
      </View>

      {/* 执行历史 */}
      {executionHistory.length > 0 && (
        <View style={tw`gap-2`}>
          <Text
            style={tw.style(
              'text-sm font-semibold',
              isDarkMode ? 'text-slate-200' : 'text-slate-800',
            )}
          >
            执行历史：
          </Text>
          <ScrollView
            style={tw.style(
              'max-h-40 rounded-xl p-3',
              isDarkMode ? 'bg-slate-700' : 'bg-slate-50',
            )}
          >
            {executionHistory.map((item, index) => (
              <Text
                key={index}
                style={tw.style(
                  'text-xs leading-5 mb-1',
                  isDarkMode ? 'text-slate-300' : 'text-slate-700',
                )}
              >
                {item}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

