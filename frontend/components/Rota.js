// Importações Padrão
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, BackHandler, ScrollView} from 'react-native';

// Importa o componente de mapa e seus elementos (marcadores e linhas)
import MapView, { Marker, Polyline } from 'react-native-maps';

// Importa o método para solicitar permissão de localização
import { requestForegroundPermissionsAsync } from 'expo-location';

// Importa utilitário para decodificar polylines da API do Google Maps
import PolyLineDecoder from '@mapbox/polyline';

// Cliente HTTP para requisições de API
import axios from 'axios';

// Importa ícones da biblioteca Ionicons (usado para o botão de centralizar)
import { Ionicons } from '@expo/vector-icons';

// Importa componente de aba deslizante
import { Modalize } from 'react-native-modalize';

// Importa controle de foco da tela (executar efeito quando a tela for exibida)
import { useFocusEffect } from '@react-navigation/native';

// Declaração do componente funcional que representa a tela da rota
export default function Rota({ route, navigation }) {
  // Extrai os endereços passados como parâmetro da tela anterior
  const { enderecos } = route.params;

  // Declara os estados da aplicação
  const [routeCoords, setRouteCoords] = useState([]); // Coordenadas da linha da rota no mapa
  const [currentIndex, setCurrentIndex] = useState(0); // Índice atual na simulação de movimento pela rota
  const [location, setLocation] = useState(null); // Localização inicial do entregador
  const [markerDestination, setMarkerDestination] = useState([]); // Lista de coordenadas dos pontos de entrega
  const [visitedMarkers, setVisitedMarkers] = useState([]); // Índices dos pontos de entrega já visitados

  const [followLocation, setFollowLocation] = useState(true); // Controla se o mapa deve seguir o entregador
  const [zoomScale, setZoomScale] = useState(1); // Escala dinâmica usada para ajustar tamanho dos marcadores
  const [instrucoes, setInstrucoes] = useState([]); // Lista de instruções da entrega (ex: siga reto, vire à esquerda)
  const [mostrarInstrucao, setMostrarInstrucao] = useState(true); // Controla se a instrução deve ser exibida no modal

  const [cancelados, setCancelados] = useState([]); // Índices dos pontos de entrega cancelados
  const [motivoCancelamento, setMotivoCancelamento] = useState(null); // Motivo selecionado para o cancelamento
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null); // Índice do endereço que será cancelado
  const [mostrarMotivos, setMostrarMotivos] = useState(false); // Controla se os motivos de cancelamento devem ser exibidos

  const mapRef = useRef(null); // Referência ao componente MapView (usado para animar ou centralizar a câmera)
  const cancelarModalRef = useRef(null); // Referência ao Modalize do cancelamento de entrega
  const modalRef = useRef(null); // Referência ao Modalize principal com a lista e instruções


  // Chave da API do Google (deve ser protegida em produção)
  const API_KEY = 'GOOGLE API';

  // Função que solicita a permissão de localização ao usuário
  async function requestLocationPermissions() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      // Define uma origem fixa como exemplo
      const origem = {
        latitude: -23.514397,
        longitude: -46.187431,
      };
      setLocation(origem); // Atualiza o estado da localização
    }
  }

  // Executa a função de permissão ao montar o componente
  useEffect(() => {
    requestLocationPermissions();
  }, []);

  // Quando a localização estiver disponível, busca a rota
  useEffect(() => {
    if (location && enderecos.length > 0) {
      fetchRoute();
    }
  }, [location]);

  // Função que realiza a geocodificação dos endereços e monta a rota
  async function fetchRoute() {
    try {
      // Converte todos os endereços em coordenadas geográficas (latitude e longitude)
      const geocodeMarkers = await Promise.all(
        // Mapeia todos os endereços recebidos via props (route.params.enderecos)
        enderecos.map(async (endereco) => {
          // Concatena o nome da cidade ao endereço para garantir geocodificação correta
          const enderecoCompleto = endereco.endereco + ', Mogi das Cruzes - SP';

          // Requisição GET para a API de geocodificação do Google Maps
          const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address: enderecoCompleto, // Endereço completo passado como parâmetro
              key: API_KEY,              // Chave da API usada para autenticação
            }
          });

          // Se a resposta contém resultados válidos
          if (geoRes.data.results.length > 0) {
            // Extrai as coordenadas (latitude e longitude) do primeiro resultado retornado
            const loc = geoRes.data.results[0].geometry.location;

            // Faz um pequeno ajuste manual na latitude (para evitar sobreposição, por exemplo)
            const adjustedLat = loc.lat - 0.00003;

            // Retorna o objeto com latitude ajustada e longitude original
            return { latitude: adjustedLat, longitude: loc.lng };
          } else {
            // Se não houver resultado válido, retorna null (será filtrado depois)
            return null;
          }
        })
      );

      // Filtra somente os endereços válidos
      const validMarkers = geocodeMarkers.filter(Boolean);
      setMarkerDestination(validMarkers);

      // Define origem e destino
      const origin = `${location.latitude},${location.longitude}`;
      const destination = `${validMarkers[validMarkers.length - 1].latitude},${validMarkers[validMarkers.length - 1].longitude}`;
      const waypoints = validMarkers
        .slice(0, -1)
        .map(p => `${p.latitude},${p.longitude}`)
        .join('|');

      // Faz a requisição para a rota no Google Maps Directions API
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin,        // Ponto de partida (latitude,longitude)
          destination,   // Último ponto de entrega (latitude,longitude)
          waypoints,     // Demais paradas entre origem e destino
          key: API_KEY,  // Chave da API do Google Maps
          mode: 'driving', // Modo de locomoção: carro (poderia ser 'walking', 'bicycling' etc.)
          language: 'pt-BR', // Instruções em português
        }
      });

      // Se encontrou ao menos uma rota válida
      if (response.data.routes.length) {
        // Após obter os dados da rota
        const steps = response.data.routes[0].legs[0].steps;
        // Mapeia instruções de cada passo da rota
        const novasInstrucoes = steps.map(step => step.html_instructions.replace(/<[^>]+>/g, ''));
        // Salva no estado
        setInstrucoes(novasInstrucoes);

        // Decodifica os pontos comprimidos da polyline para coordenadas reais
        const points = PolyLineDecoder.decode(response.data.routes[0].overview_polyline.points);

        // Converte os pontos decodificados em um array de objetos com latitude e longitude
        const routeCoordinates = points.map(point => ({
          latitude: point[0],   // Primeiro item da tupla é latitude
          longitude: point[1],  // Segundo item da tupla é longitude
        }));

        // Atualiza o estado com as coordenadas da rota (para desenhar no mapa)
        setRouteCoords(routeCoordinates);
      } else {
        // Caso não encontre nenhuma rota, exibe um aviso no console
        console.warn("Nenhuma rota encontrada");
      }

    } catch (error) {
      console.error("Erro ao buscar rota:", error); // ← tratamento de erro
      alert("Erro ao buscar rota: " + error.message);
    }
  }

    // Simula o deslocamento do veículo ao longo da rota
    useEffect(() => {
      // Se ainda não há coordenadas de rota, sai da função
      if (routeCoords.length === 0) return;

      // Cria um intervalo que simula o avanço do veículo ponto a ponto
      const interval = setInterval(() => {
        // Atualiza o índice atual de posição
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1; // Próximo ponto a ser alcançado

          // Enquanto não chegou no final da rota
          if (nextIndex < routeCoords.length) {
            // Função auxiliar que calcula a distância entre dois pontos
            const distancia = (a, b) => {
              const dx = a.latitude - b.latitude;
              const dy = a.longitude - b.longitude;
              return Math.sqrt(dx * dx + dy * dy); // Distância euclidiana
            };

            // Para cada destino (ponto de entrega) da lista
            markerDestination.forEach((dest, i) => {
              const pontoAtual = routeCoords[nextIndex]; // Posição atual do "veículo"
              const d = distancia(pontoAtual, dest);     // Distância até o destino

              if (d < 0.0005) { // Se estiver a menos de ~50 metros
                if (cancelados.includes(i)) return; // não marca se foi cancelado
                
                // Marca o ponto como visitado, se ainda não tiver sido
                setVisitedMarkers(prev => {
                  if (!prev.includes(i)) {
                    return [...prev, i]; // Adiciona o índice à lista de visitados
                  }
                  return prev; // Se já foi visitado, mantém a lista como está
                });
              }
            });

            return nextIndex; // Avança para o próximo ponto da rota
          } else {
            // Quando chega ao final da rota, para o intervalo
            clearInterval(interval);
            return prevIndex; // Não avança mais
          }
        });
      }, 300); // Intervalo de 300ms entre cada "movimento" do veículo

      // Cleanup: limpa o intervalo caso o componente seja desmontado
      return () => clearInterval(interval);
    }, [routeCoords]); // Só executa quando routeCoords for preenchido

  useEffect(() => {
    // Se o modo de seguir localização está desativado, ou se o mapa ou coordenada atual ainda não estão disponíveis, não faz nada
    if (!followLocation || !mapRef.current || !routeCoords[currentIndex]) return;

    // Anima a câmera do mapa para centralizar na coordenada atual da rota
    mapRef.current.animateCamera(
      {
        center: routeCoords[currentIndex], // Define o ponto central da câmera como o ponto atual da rota
        pitch: 0,                          // Inclinação da câmera (0 = vista de cima, 90 = horizontal)
        heading: 0,                        // Direção da câmera (0 = norte); pode ser alterado conforme a direção do trajeto
        zoom: 17,                          // Nível de aproximação (17 é um zoom alto, ideal para ruas)
      },
      { duration: 300 }                    // Tempo da animação em milissegundos
    );
  }, [currentIndex, followLocation]); // Executa esse efeito sempre que o ponto da rota muda ou se o modo de seguir for ativado
  

    // Função chamada quando o usuário clica no botão de "seguir localização"
  const handleFollowPress = () => {
  // Ativa o modo de seguir a localização no mapa
  setFollowLocation(true);

  // Verifica se a referência do mapa existe e se há coordenada atual válida
  if (mapRef.current && routeCoords[currentIndex]) {
    // Anima a câmera do mapa para centralizar na posição atual do veículo
    mapRef.current.animateCamera(
      {
        center: routeCoords[currentIndex], // Define o ponto central da câmera como o ponto atual da rota
        pitch: 0,                          // Inclinação da câmera (0 = vista perpendicular do topo)
        heading: 0,                        // Direção (0 = norte); pode ser ajustado para simular direção real
        zoom: 17,                          // Nível de aproximação; 17 é bem próximo (ideal para ver ruas)
      },
      { duration: 400 }                    // Duração da animação em milissegundos
    );
  }
};

  // Função executada sempre que o usuário movimenta o mapa manualmente
  const handleRegionChange = (region) => {
    // Calcula um fator de escala com base na área visível do mapa (latitudeDelta = zoom aproximado)
    const scale = Math.min(2, 0.04 / region.latitudeDelta);

    // Atualiza o estado com a nova escala de zoom (pode ser usada para ajustar tamanho de ícones, texto etc.)
    setZoomScale(scale);
  };

  // Renderiza a tela principal
  return (
    <View style={styles.container}>
      {/*Verifica se a localização está disponível antes de renderizar o mapa*/}
      {location && (
        <MapView
          ref={mapRef} // Referência do mapa usada para manipular a câmera
          style={styles.map} // Estilo aplicado ao mapa
          initialRegion={{ // Define a posição inicial da câmera do mapa
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01, // Zoom vertical
            longitudeDelta: 0.01 // Zoom horizontal
          }}
          onPanDrag={() => setFollowLocation(false)} // Quando o usuário arrasta o mapa, desativa o follow automático
          onRegionChangeComplete={handleRegionChange} // Atualiza o zoom scale quando a região do mapa muda
        >
          {/* Mostra marcador azul na posição atual da rota (simulada)*/}
          {routeCoords.length > 0 && currentIndex < routeCoords.length && (
            <Marker
              coordinate={routeCoords[currentIndex]} // Coordenada atual do veículo
              title="Você" // Título do marcador
              pinColor="blue" // Cor do marcador
            />
          )}

          {/* Adiciona os marcadores dos pontos de entrega*/}
          {markerDestination.map((coord, index) => {
            if (cancelados.includes(index)) return null; // Não renderiza marcadores cancelados

            const dynamicSize = 12 * zoomScale; // Calcula tamanho do marcador baseado no zoom
            const dynamicBorder = 2 * zoomScale; // Calcula borda proporcional ao zoom

            return (
            // Define um marcador no mapa para a coordenada da entrega
            <Marker key={index} coordinate={coord} pinColor="black">
              {/* Exibe um círculo preenchido (visitado) ou vazio (pendente)*/}
              <View
                style={
                  visitedMarkers.includes(index) // Se o ponto já foi visitado...
                    ? [
                        styles.markerFilled, // Usa estilo preenchido
                        {
                          width: dynamicSize, // Tamanho dinâmico proporcional ao zoom
                          height: dynamicSize,
                          borderRadius: dynamicSize / 2 // Formato circular
                        }
                      ]
                    : [
                        styles.markerEmpty, // Usa estilo de marcador vazio
                        {
                          width: dynamicSize, // Tamanho igual ao preenchido
                          height: dynamicSize,
                          borderRadius: dynamicSize / 2, // Formato circular
                          borderWidth: dynamicBorder // Define espessura da borda
                        }
                      ]
                }
              />
            </Marker>
          );
        })}

          {/* Desenha a linha azul conectando todos os pontos da rota */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords} // Lista de coordenadas da linha
              strokeColor="#0000FF" // Cor da linha azul
              strokeWidth={5} // Espessura da linha
            />
          )}
        </MapView>
      )}

      {/* Exibe botão para recentralizar o mapa caso o usuário tenha arrastado manualmente */}
      {!followLocation && (
        <TouchableOpacity
          style={[styles.button, { zIndex: 10, bottom: 150 }]} // Posicionamento e prioridade do botão
          onPress={handleFollowPress} // Ação ao pressionar: centraliza o mapa novamente
        >
          <Ionicons name="locate" size={28} color="white" /> {/* Ícone do botão */}
        </TouchableOpacity>
      )}

      <Modalize
        ref={modalRef}
        modalHeight={700}
        alwaysOpen={150}
        onPositionChange={(pos) => {
          setMostrarInstrucao(pos === 'top' ? false : true);
        }}
        handlePosition="inside"
        panGestureEnabled={true}
        closeOnOverlayTap={true}
        modalStyle={styles.modal}
        scrollViewProps={{
          scrollEnabled: false, // desativa rolagem automática
        }}
      >
        <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
          
          {/* Conteúdo scrollável (endereços) */}
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }} // Espaço extra no final da lista para evitar que o conteúdo fique escondido
            showsVerticalScrollIndicator={false} // Oculta a barra de rolagem vertical
          >
            {/* Verifica se deve mostrar instruções e se elas já foram carregadas */}
            {mostrarInstrucao && instrucoes.length > 0 ? (
              // Exibe a primeira instrução atual da rota
              <>
                <Text style={styles.modalTitle}>Instrução atual</Text>
                <Text style={styles.modalText}>➡ {instrucoes[0]}</Text>
              </>
            ) : mostrarInstrucao ? (
              // Caso ainda não tenham instruções carregadas, exibe mensagem de carregamento
              <Text style={styles.modalText}>Carregando instruções...</Text>
            ) : null}

            {/* Título para a lista de entregas */}
            <Text style={[styles.modalTitle, { marginTop: 16 }]}>Entregas</Text>

            {/* Renderiza cada endereço da lista de entregas */}
            {enderecos.map((e, index) => (
              <View
                key={index} // Chave única para cada item da lista
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }} // Layout horizontal para ícone + texto + botão
              >
                {/* Ícone que representa o status da entrega */}
                <Ionicons
                  name={
                    cancelados.includes(index)
                      ? 'close-circle' // Vermelho = cancelado
                      : visitedMarkers.includes(index)
                      ? 'checkmark-circle' // Verde = concluído
                      : 'ellipse-outline' // Cinza = pendente
                  }
                  size={18} // Tamanho do ícone
                  color={
                    cancelados.includes(index)
                      ? 'red'
                      : visitedMarkers.includes(index)
                      ? 'green'
                      : 'gray'
                  }
                  style={{ marginRight: 8 }} // Espaçamento entre o ícone e o texto
                />

                {/* Texto do endereço, com estrela se for do tipo "urgente" */}
                <Text style={{ fontSize: 14, flex: 1 }}>
                  {e.endereco} {e.tipo === 'urgente' && '⭐'}
                </Text>

                {/* Botão de cancelar a entrega, visível apenas se ainda não foi concluída ou cancelada */}
                {!visitedMarkers.includes(index) && !cancelados.includes(index) && (
                  <TouchableOpacity
                    onPress={() => {
                      setEnderecoSelecionado(index); // Define o índice da entrega que será cancelada
                      cancelarModalRef.current?.open(); // Abre o modal de seleção de motivo de cancelamento
                    }}
                  >
                    <Ionicons name="close" size={20} color="black" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Botão fixo no final do modal */}
          <TouchableOpacity
            disabled={!(visitedMarkers.length + cancelados.length >= enderecos.length)} // Só habilita se tudo resolvido
            style={{
              backgroundColor:
                visitedMarkers.length + cancelados.length >= enderecos.length
                ? '#1E40AF' // Azul: pronto para finalizar
                : '#9CA3AF', // Cinza: incompleto
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 16,
            }}
            onPress={() => navigation.navigate('EntregaFinalizada')} //ao pressionar vai até EntregaFinalizada.js
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              Finalizar Entregas ({visitedMarkers.length}/{enderecos.length})
            </Text>
          </TouchableOpacity>
        </View>
      </Modalize>

        {/* Aba secundária para selecionar motivo do cancelamento */}
        <Modalize
          ref={cancelarModalRef} // Referência para controle da aba de cancelamento
          modalHeight={700} // Altura da aba
          handlePosition="inside" // Alça interna
          modalStyle={styles.modal} // Estilo aplicado
          closeOnOverlayTap={true} // Permite fechar ao tocar fora
          scrollViewProps={{
            scrollEnabled: !mostrarInstrucao, // Desativa rolagem se instruções visíveis
            showsVerticalScrollIndicator: false // Esconde barra
          }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Motivo de Cancelamento da Entrega</Text>

            {/* Lista de motivos de cancelamento com botões tipo rádio */}
            {['Cliente Ausente', 'Endereço Incorreto', 'Pacote perdido', 'Outro'].map((motivo) => (
              <TouchableOpacity
                key={motivo}
                onPress={() => setMotivoCancelamento(motivo)} // Define motivo escolhido
                style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}
              >
                <Ionicons
                  name={motivoCancelamento === motivo ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color="black"
                  style={{ marginRight: 8 }}
                />
                <Text>{motivo}</Text>
              </TouchableOpacity>
            ))}

            {/* Botão que confirma o cancelamento da entrega */}
            <TouchableOpacity
              onPress={() => {
                if (motivoCancelamento && enderecoSelecionado !== null) {
                  setCancelados((prev) => [...prev, enderecoSelecionado]); // Adiciona à lista de cancelados
                  setMotivoCancelamento(null); // Limpa motivo
                  setEnderecoSelecionado(null); // Limpa índice
                  cancelarModalRef.current?.close(); // Fecha o modal
                }
              }}
              style={{
                marginTop: 16,
                backgroundColor: '#1E40AF',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar Entrega</Text>
            </TouchableOpacity>
          </View>
        </Modalize>
    </View>
  )};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa todo o espaço disponível da tela
    backgroundColor: '#fff', // Fundo branco
  },
  map: {
    flex: 1, // Faz o mapa expandir para preencher o espaço
    width: '100%', // Garante que o mapa ocupe toda a largura
  },
  markerFilled: {
    backgroundColor: 'black' // Marcador de entrega concluída (círculo preto)
  },
  markerEmpty: {
    backgroundColor: 'white', // Marcador de entrega pendente (círculo branco)
    borderColor: 'black' // Borda preta para dar contraste
  },
  button: {
    position: 'absolute', // Posicionamento flutuante
    bottom: 100, // Distância do fundo da tela
    right: 20, // Distância da borda direita
    backgroundColor: '#1E40AF', // Azul escuro
    padding: 12, // Espaçamento interno
    borderRadius: 50, // Deixa o botão redondo
    elevation: 5, // Sombra para destaque em Android
  },
  modal: {
    borderTopLeftRadius: 16, // Arredonda canto superior esquerdo do modal
    borderTopRightRadius: 16, // Arredonda canto superior direito do modal
    backgroundColor: 'white', // Fundo branco do modal
  },
  modalContent: {
    padding: 20, // Espaçamento interno do conteúdo do modal
  },
  modalTitle: { 
    fontSize: 22, // Tamanho do título
    fontWeight: 'bold', // Negrito para destaque
    marginBottom: 10 // Espaço abaixo do título
  },
  modalText: { 
    fontSize: 18, // Tamanho do texto das instruções
    marginBottom: 6 // Espaço abaixo do texto
  },
});
