// Importa o handler de gestos para suporte a navegação por gestos
import 'react-native-gesture-handler';

// Componente root necessário para gestos funcionarem corretamente no Android
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Importa React e useEffect (usado para aplicar o modo imersivo)
import React, { useEffect } from 'react';

// Importa o container da navegação, responsável por manter o estado de navegação
import { NavigationContainer } from '@react-navigation/native';

// Importa o criador de navegação em pilha com estilo nativo
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importa controle da barra de navegação para esconder os botões
import * as NavigationBar from 'expo-navigation-bar';

// Importação das telas do aplicativo
import Home from './components/Home';
import SolicitarRotas from './components/SolicitarRotas';
import EscolherPontosEntregas from './components/EscolherPontosEntregas';
import Rota from './components/Rota';
import EntregaFinalizada from './components/EntregaFinalizada';
import Historico from './components/Historico';

// Cria a instância da pilha de navegação
const Stack = createNativeStackNavigator();

// Função principal do app
export default function App() {
  useEffect(() => {
    const ativarModoImersivo = async () => {
      await NavigationBar.setBehaviorAsync('immersive');
      await NavigationBar.setVisibilityAsync('hidden');
    };
    ativarModoImersivo();
  }, []);

  return (
    // Wrapper necessário para permitir gestos em todo o app
    <GestureHandlerRootView style={{ flex: 1 }}>

      {/* Container de navegação que encapsula toda a navegação do app */}
      <NavigationContainer>

        {/* Definição da pilha de telas */}
        <Stack.Navigator
          initialRouteName="Home" // Tela inicial
          screenOptions={{
            headerTitle: '', // Remove o título do header por padrão
            headerBackTitleVisible: false, // Oculta o título do botão de voltar
          }}
        >

          {/* Tela inicial - Menu principal */}
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }} // Oculta completamente o header
          />

          {/* Tela onde o entregador solicita as rotas */}
          <Stack.Screen
            name="SolicitarRotas"
            component={SolicitarRotas}
            options={{ title: 'Solicitar Rotas' }} // Título exibido no header
          />

          {/* Tela de seleção dos pontos de entrega da região escolhida */}
          <Stack.Screen
            name="EscolherPontosEntregas"
            component={EscolherPontosEntregas}
            options={{ title: 'Escolher Pontos de Entrega' }}
          />

          {/* Tela de visualização da rota no mapa */}
          <Stack.Screen
            name="Rota"
            component={Rota}
            options={{ title: 'Rota' }} // Título exibido no header
          />

          {/* Tela final após concluir todas as entregas */}
          <Stack.Screen
            name="EntregaFinalizada"
            component={EntregaFinalizada}
            options={{ headerShown: false }} // Oculta header nesta tela de conclusão
          />

          {/* Tela de histórico */}
          <Stack.Screen
            name="Historico"
            component={Historico}
            options={{ title: 'Histórico' }}
          />
        </Stack.Navigator>

      </NavigationContainer>
    </GestureHandlerRootView>
  );
}