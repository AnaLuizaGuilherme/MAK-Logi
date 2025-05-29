// Importações Padrões
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

// Bairros/Regiões
const regioes = [
  'Centro',
  'Braz Cubas',
  'Vila Mogilar',
  'Vila Oliveira',
  'Vila Mogi Moderno',
  'Jundiapeba',
  'Socorro',
  'Jardim Camila',
];

// Declara o componente funcional EscolherRegiao
export default function EscolherRegiao({ navigation }) {

  // Função chamada quando o usuário seleciona uma região, leva para a tela 'EscolherPontosEntregas', passando a região como parâmetro
  const regiaoSelecionada = (regiao) => {
    navigation.navigate('EscolherPontosEntregas', { regiao });
  };
  
  return (
    <View style={styles.container}>

      {/* Título da tela */}
      <Text style={styles.title}>Escolha Região de Entrega</Text>

      {/* Lista de regiões renderizada em 2 colunas */}
      <FlatList
        data = {regioes} // Fonte de dados: array de regiões
        keyExtractor = {(item) => item} // Chave única para cada item (usa o próprio nome da região)
        numColumns={2} // Exibe dois botões por linha
        columnWrapperStyle={styles.row} // Estilo aplicado a cada linha da grade
        contentContainerStyle={styles.list} // Estilo aplicado ao container da lista como um todo

        // Função que define como cada item será renderizado
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.button}
            // Ao pressionar, chama a função passando a região selecionada
            onPress={() => regiaoSelecionada(item)} 
          >
            {/* Nome da região dentro do botão */}
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  list: {
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 25,
    paddingHorizontal: 45,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
});
