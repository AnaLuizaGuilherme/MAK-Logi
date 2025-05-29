// Importa o React para criar o componente funcional
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground} from 'react-native';

// Responsável pelas animações na tela
import LottieView from 'lottie-react-native';

// Componente principal da tela de "entrega finalizada"
export default function EntregaFinalizada({ navigation }) {
  return (
     <View style={styles.container}>
      {/* Confettis */}
      <LottieView
        source={require('../assets/confetti.json')}
        autoPlay
        loop
        resizeMode='cover'
        style={StyleSheet.absoluteFill}
      />

      <LottieView
        source={require('../assets/check.json')}
        autoPlay // inicia automaticamente
        loop={false} // não repete
        style={{ width: '50%', height: '30%' }}
      />

      {/* Título centralizado */}
      <Text style={styles.title}>Entregas Concluídas</Text>

      {/* Subtítulo orientando o entregador */}
      <Text style={styles.subtitle}>↩ Retorne ao galpão</Text>

      {/* Botão para voltar ao menu principal (tela "Home") */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Voltar ao Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'green',
        justifyContent: 'center',
        alignItems: 'center',
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
      },
      subtitle: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 30,
      },
      button: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 20,
      },
      buttonText: {
        fontSize: 18,
        color: '#000',
        fontWeight: 'bold',
      },
    });

