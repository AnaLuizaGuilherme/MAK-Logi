// Importações Padrões
import { View, Text, StyleSheet } from 'react-native';

// Responsável pelas animações na tela
import LottieView from 'lottie-react-native';

export default function Historico({ navigation }) {
  return (
    <View style={styles.container}>
        <Text style = {styles.title}>Em obras</Text>
        <LottieView
            source={require('../assets/placa.json')}
            autoPlay
            loop
            style={StyleSheet.absoluteFill}
        />

        <LottieView
            source={require('../assets/borda.json')}
            autoPlay
            loop
            style = {[styles.top, StyleSheet.absoluteFill]}
        ></LottieView>

        <LottieView
            source={require('../assets/borda.json')}
            autoPlay
            loop
            style = {[styles.down, StyleSheet.absoluteFill]}
        ></LottieView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // ocupa a tela inteira
    justifyContent: 'center', // centraliza verticalmente
    alignItems: 'center', // centraliza horizontalmente
  },
  title: {
    fontSize: 80,
    fontWeight: '600',
    marginBottom: 500,
    textAlign: 'center',
  },
  top: {
    marginBottom: 700
  },
  down: {
    marginTop: 600
  }
});

