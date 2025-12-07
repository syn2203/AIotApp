import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, Text, useColorScheme, View } from 'react-native';
import tw from 'twrnc';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function AppContent({ isDarkMode }: { isDarkMode: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      style={tw.style(
        'flex-1',
        isDarkMode ? 'bg-slate-900' : 'bg-slate-100',
      )}
    >
      <View
        style={tw.style(
          'px-4 pb-3',
          isDarkMode ? 'bg-slate-800' : 'bg-white',
          { paddingTop: safeAreaInsets.top },
        )}
      >
        <Text
          style={tw.style(
            'text-lg font-semibold',
            isDarkMode ? 'text-white' : 'text-slate-900',
          )}
        >
          Tailwind 样式已启用
        </Text>
        <Text
          style={tw.style(
            'text-sm mt-1',
            isDarkMode ? 'text-slate-300' : 'text-slate-600',
          )}
        >
          现在可以直接在 React Native 中使用类如 px-4、bg-slate-800 等工具类。
        </Text>
      </View>
      <View style={tw`flex-1`}>
        <NewAppScreen
          templateFileName="App.tsx"
          safeAreaInsets={safeAreaInsets}
        />
      </View>
    </View>
  );
}

export default App;
