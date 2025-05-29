// Importações Padrões
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import LottieView from 'lottie-react-native';

// Declara o componente funcional Home
export default function Home({ navigation }) {

  // Retorna o conteúdo visual do componente
  return (
    // Container principal da tela, estilizado com styles.container
    <View style={styles.container}>
      <View style={styles.fundoAnimado}>
        {/* Cidade */}
        <LottieView
          source={require('../assets/city.json')}
          autoPlay
          loop
          speed={0.5}
          style={{ width: 500, height: 300 }}
        />
      </View>     

      <Image
        source={require('../assets/splash-icon.png')} // sua imagem de fundo
        style={styles.background}
      ></Image>

      {/* View interna usada para centralizar os elementos horizontalmente */}
      <View style={{ alignItems: 'center' }}>

        {/* Título de boas-vindas*/}
        <Text style={styles.title}>Bem vindo{'\n'}Entregador</Text>

        {/* Botão que leva para a tela de solicitar rotas */}
        <TouchableOpacity
          style={styles.buttonRotas}
          // Ao pressionar, navega para a tela 'SolicitarRotas'
          onPress={() => navigation.navigate('SolicitarRotas')} 
        >
          {/* Texto dentro do botão */}
          <Text style={styles.buttonRotasText}>Solicitar Rotas</Text>
        </TouchableOpacity>

        {/* Botão que leva para a tela de histórico de entregas */}
        <TouchableOpacity
          style={styles.buttonHistorico}
          // Ao pressionar, navega para a tela 'Historico'
          onPress={() => navigation.navigate('Historico')} 
        >
          {/* Texto dentro do botão */}
          <Text style={styles.buttonHistoricoText}>Histórico de Entregas</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    zIndex: -3,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: 250,
    height: 400,
    marginLeft: 70,
    resizeMode: 'contain',    
    alignItems: 'center',
    zIndex: -1,
  },
  title: {
    fontSize: 50,
    fontWeight: '600',
    marginBottom: 40,
    textAlign: 'center',
  },
  fundoAnimado: {
  ...StyleSheet.absoluteFillObject,
  marginTop: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: -2,
  },
  buttonRotas: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonRotasText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonHistorico: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonHistoricoText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
});
