// Importações Padrões
import React, { useState, useEffect  } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, NativeModules, Alert } from 'react-native';

// Importa ícones da biblioteca Fontisto (usado para checkbox visual)
import Fontisto from 'react-native-vector-icons/Fontisto';

// Importa um componente que faz o texto deslizar
import TextTicker from 'react-native-text-ticker';

// Importa os dados estáticos das regiões e endereços de entrega
import regioesData from '../data/lugares.json';

import axios from 'axios';

// Importa lottie para animação
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

// Componente principal da tela de seleção de rotas
export default function EscolherRotas({ route, navigation }) {
  // Extrai a região recebida da tela anterior via props de rota
  const { regiao } = route.params;

  // Busca os endereços da região escolhida no JSON (se não houver, retorna array vazio)
  const enderecos = regioesData[regiao] || [];

  // Estado que armazena os endereços selecionados pelo usuário
  const [selecionados, setSelecionados] = useState([]);

  // Mostrar animação de loading
  const [loading, setLoading] = useState(false);

  // Função que alterna a seleção de um endereço
  const toggleEndereco = (endereco) => {
    setSelecionados((prev) =>
      prev.some((e) => e.id === endereco.id) // Se já estiver selecionado
        ? prev.filter((e) => e.id !== endereco.id) // Remove da lista
        : [...prev, endereco] // Se não estiver, adiciona
    );
  };

  // Função que valida e envia os dados dos endereços escolhidos para a próxima tela
  const handleGerarRota = async () => {
    setLoading(true); // mostra a animação

    //Verifica se tem endereços
    if (selecionados.length === 0) {
      alert('Selecione pelo menos um endereço para continuar.');
      return;
    }
    
    //Conecta a API
    try {
      const response = await axios.post("https://projeto-ipyv.onrender.com/rota", {
        enderecos: selecionados
      });

      console.log("Resposta da API:", response.data);

      const rotaOrdenada = response.data.rota;

      if (!rotaOrdenada || !Array.isArray(rotaOrdenada)) {
        alert("Erro ao gerar sua Rota");
        return;
      }

      navigation.navigate('Rota', { enderecos: rotaOrdenada });

      } catch (err) {
          Alert.alert(
            'Atenção!',
            'Erro ao gerar sua rota,\nTente novamente.',
          )
          navigation.goBack(); // volta à tela anterior se der erro
      } finally {
        setLoading(false); // esconde a animação
      }
  };

  // Renderização do componente
  return (
    <View style={styles.container}>
      {/*Esconde a animação até apertar o botão*/}
      {loading && (
        <View style={styles.overlay}>
          <Text style={styles.loadingText}>Gerando sua rota...</Text>
          <LottieView
            source={require('../assets/mapLoading.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200, marginBottom: 30 }}
          />
        </View>
      )}
      {/* Título principal da tela */}
      <Text style={styles.title}>Selecione os endereços de Entrega</Text>
      {/* Subtítulo que mostra a região escolhida */}
      <Text style={styles.subtitle}>{ regiao }</Text>

      {/* Lista rolável dos endereços */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Percorre todos os endereços da região e renderiza individualmente */}
        {enderecos.map((endereco) => {
          // Verifica se o endereço está na lista de selecionados
          const isSelected = selecionados.some((e) => e.id === endereco.id);

          return (
            <TouchableOpacity
              key={endereco.id} // Chave única por item
              style={styles.item}
              onPress={() => toggleEndereco(endereco)} // Alterna a seleção ao clicar
            >
              <View style={styles.itemContent}>
                <View style={styles.textContainer}>
                  {/* Exibe o texto do endereço com rolagem (caso seja muito longo) */}
                  <TextTicker
                    style={styles.itemText}
                    duration={6000}
                    loop
                    bounce={false} 
                    repeatSpacer={50}
                    marqueeDelay={500}
                    scrollSpeed={10}
                  >
                    {/* Rendezira os endereços */}
                    {endereco.endereco}
                  </TextTicker>
                </View>

                {/* Ícone de checkbox (preenchido se estiver selecionado) */}
                <Fontisto
                  name={isSelected ? 'checkbox-active' : 'checkbox-passive'}
                  size={16}
                  color={isSelected ? '#1E40AF' : '#9CA3AF'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Botão fixo no fim da tela para confirmar e gerar a rota junto a confirmação */}
      <TouchableOpacity
        style={styles.botao}
        onPress={() => {
          Alert.alert(
            'Atenção!',
            'Uma vez selecionado os endereços,\nnão poderão mais ser alterados.\n\nSerá preciso finalizar todas as entregas para gerar outra rota.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Confirmar', onPress: handleGerarRota }
            ]
          );
        }}
      >
        <Text style={styles.botaoTexto}>Gerar Rota</Text>
      </TouchableOpacity>
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loadingText: {
    fontSize: 22,
    fontWeight: '900', // bem espesso
    color: '#1E40AF',
    textAlign: 'center',
    textShadowColor: '#ccc', // opcional para dar mais "destaque"
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Espaço extra para não esconder conteúdo atrás do botão
  },
  item: {
  backgroundColor: '#E5E7EB',
  paddingVertical: 18,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row', // Texto + ícone lado a lado
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
    overflow: 'hidden', // Garante que o texto rolante não ultrapasse o limite
  },
  itemText: {
    fontSize: 15,
    color: '#111827',
    paddingRight: 10, 
  },
  botao: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    marginLeft: 15,
    paddingBottom: 16,
    alignItems: 'center',
    borderRadius: 8,
    position: 'absolute', // Fixa o botão no fim da tela
    bottom: 10,
    width: '100%',
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
