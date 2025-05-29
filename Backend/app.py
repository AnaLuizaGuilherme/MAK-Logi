# Importa o módulo Flask para criar uma API web
from flask import Flask, request, jsonify

# Importa o cliente da API do Google Maps
import googlemaps

# Importa permutations (não usado neste código)
from itertools import permutations

# Importa os (não utilizado também)
import os

# Cria a aplicação Flask
app = Flask(__name__)

# Inicializa o cliente do Google Maps com a chave de API
gmaps = googlemaps.Client(key='GOOGLE API')  # ⚠️ CUIDADO: evite deixar chaves públicas

# Função que geocodifica um endereço para coordenadas (lat, lng)
def geocode_endereco(endereco):
    try:
        # Realiza a geocodificação adicionando "Mogi das Cruzes - SP" como referência local
        res = gmaps.geocode(f"{endereco}, Mogi das Cruzes - SP")
        if res:
            # Extrai latitude e longitude do primeiro resultado
            loc = res[0]['geometry']['location']
            return (loc['lat'], loc['lng'])
    except Exception as e:
        # Mostra o erro se a geocodificação falhar
        print("Erro ao geocodificar:", e)
    return None  # Retorna None se falhar

# Função que calcula a distância em metros entre dois pontos usando a API do Google
def calcular_distancia(a, b):
    # Faz a consulta da distância entre origem e destino com modo "driving" (carro)
    res = gmaps.distance_matrix(origins=[a], destinations=[b], mode="driving")
    # Retorna a distância em metros
    return res['rows'][0]['elements'][0]['distance']['value']

# Algoritmo guloso que simula um Dijkstra simplificado para ordenar os pontos por proximidade
def dijkstra_multiponto(origem, pontos):
    visitados_ids = set()  # Armazena os objetos já visitados (usando id para evitar duplicatas)
    ordem = []  # Lista da ordem final da rota
    atual = origem  # Começa pela origem

    # Continua até todos os pontos serem visitados
    while len(visitados_ids) < len(pontos):
        # Filtra os que ainda não foram visitados
        nao_visitados = [p for p in pontos if id(p) not in visitados_ids]
        # Seleciona o ponto mais próximo da posição atual
        proximo = min(nao_visitados, key=lambda x: calcular_distancia(atual['coordenadas'], x['coordenadas']))
        # Adiciona o ponto selecionado na rota
        ordem.append(proximo)
        # Marca como visitado
        visitados_ids.add(id(proximo))
        # Atualiza a posição atual
        atual = proximo

    return ordem  # Retorna a lista ordenada dos pontos

# Define uma rota POST na API chamada /rota
@app.route("/rota", methods=["POST"])
def gerar_rota():
    # Obtém os dados JSON da requisição
    dados = request.json

    # Extrai a lista de endereços do campo "enderecos"
    enderecos = dados.get("enderecos", [])

    # Validação: se a lista estiver vazia, retorna erro
    if not enderecos:
        return jsonify({"erro": "Lista de endereços vazia"}), 400

    # Geocodifica todos os endereços
    for e in enderecos:
        e['coordenadas'] = geocode_endereco(e['endereco'])

    # Remove os endereços que não foram geocodificados com sucesso
    enderecos = [e for e in enderecos if e['coordenadas']]

    # Se nenhum endereço válido sobrou, retorna erro
    if not enderecos:
        return jsonify({"erro": "Nenhum endereço válido"}), 400

    # Separa os endereços em urgentes e normais com base no campo 'tipo'
    urgentes = [e for e in enderecos if e.get('tipo') == 'urgente']
    normais = [e for e in enderecos if e.get('tipo') != 'urgente']

    # Define a origem fixa da rota (ex: sede de distribuição)
    origem = {"endereco": "Base de Entregas", "coordenadas": (-23.514397, -46.187431)}

    # Gera a rota para os endereços urgentes (se houver)
    rota_urgente = dijkstra_multiponto(origem, urgentes) if urgentes else []

    # Gera a rota para os normais, começando do último urgente (ou da origem)
    rota_normal = dijkstra_multiponto(rota_urgente[-1] if rota_urgente else origem, normais) if normais else []

    # Junta a rota completa (urgentes + normais)
    rota_final = rota_urgente + rota_normal

    # Retorna a rota em formato JSON
    return jsonify({
        "rota": rota_final
    })

# Inicia o servidor Flask em modo debug se for executado diretamente
if __name__ == "__main__":
    app.run(debug=True)
