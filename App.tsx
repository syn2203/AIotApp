import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import tw from 'twrnc';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import VoiceToText from './components/VoiceToText';
import CommandExecutor from './components/CommandExecutor';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [commandText, setCommandText] = useState('');

  const handleTextGenerated = (text: string) => {
    setCommandText(text);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={tw.style(
          'flex-1',
          isDarkMode ? 'bg-slate-900' : 'bg-slate-100',
        )}
      >
        <View
          style={tw.style(
            'px-4 pb-3',
            isDarkMode ? 'bg-slate-800' : 'bg-white',
          )}
        >
          <Text
            style={tw.style(
              'text-lg font-semibold',
              isDarkMode ? 'text-white' : 'text-slate-900',
            )}
          >
            XAI 语音助手
          </Text>
          <Text
            style={tw.style(
              'text-sm mt-1',
              isDarkMode ? 'text-slate-300' : 'text-slate-600',
            )}
          >
            通过语音输入指令，自动执行应用操作和自动化任务。
          </Text>
        </View>

        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4 pb-10 gap-4`}
        >
          {/* 录音转文字组件 */}
          <VoiceToText onTextGenerated={handleTextGenerated} />

          {/* 命令执行组件 */}
          <CommandExecutor commandText={commandText} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
