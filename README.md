# 🌸 CicloFit — Sincronização de Treinos com o Ciclo Menstrual

O **CicloFit** é uma aplicação web *full-stack* que adapta prescrições de exercícios de musculação e mensagens motivacionais às fases fisiológicas do ciclo menstrual. O sistema conta com um servidor local em **Node.js/Express** para servir a interface e disponibilizar endpoints de monitoramento, além de um front-end interativo que integra fontes externas de dados e apresenta um calendário mensal inspirado no aplicativo **Flo**.

---

## 📋 Índice

1. [Arquitetura e Funcionamento de Cada Parte](#-arquitetura-e-funcionamento-de-cada-parte)
2. [Estrutura de Diretórios](#-estrutura-de-diretórios)
3. [Pré-requisitos e Instalação](#-pré-requisitos-e-instalação)
4. [Execução do Projeto](#-execução-do-projeto)
5. [Endpoints e Métodos HTTP (API Local)](#-endpoints-e-métodos-http-api-local)
6. [Fontes de Dados, APIs Externas e Métodos HTTP](#-fontes-de-dados-apis-externas-e-métodos-http)
7. [Regras de Negócio do Ciclo Menstrual](#-regras-de-negócio-do-ciclo-menstrual)
8. [Autoria](#-autoria)

---

## ⚙️ Arquitetura e Funcionamento de Cada Parte

O projeto divide-se entre um servidor back-end responsável pela entrega de arquivos estáticos e status operacional, e um cliente front-end responsável pela lógica de cálculo hormonal, renderização do calendário e consumo assíncrono de dados:

* **`server.js` (Back-end / Servidor HTTP):**
  * Inicializa uma aplicação **Express** configurada com middlewares de suporte a JSON (`express.json()`) e **CORS** (`cors()`).
  * Serve os recursos estáticos da pasta `public/` (`index.html`, `style.css` e `app.js`).
  * Expõe a rota principal de navegação e um endpoint REST para verificação de disponibilidade da API.
* **`public/index.html` (Estrutura da Interface):**
  * Organiza o layout responsivo utilizando **Bootstrap 5.3.3**.
  * Divide a interface em quatro blocos principais: configuração e calendário mensal do ciclo, seletor de grupamento muscular e controle de fichas, painel de frase motivacional e grade de exercícios recomendados.
* **`public/style.css` (Estilização e Identidade Visual):**
  * Define o grid responsivo de 7 colunas para o calendário mensal estilo **Flo** (`Dom` a `Sáb`), adaptável a telas de desktop e smartphones, estilizando cada fase com cores distintas (coral para menstruação, turquesa para janela fértil, borda pontilhada para ovulação, lilás para folicular e âmbar para lútea), além do design dos cartões de treino.
* **`public/app.js` (Lógica de Negócio e Integração de Dados):**
  * **Motor de Calendário:** Calcula dinamicamente o dia atual do ciclo (`D1` a `Dn`) para qualquer data passada ou futura com base na data do primeiro dia da última menstruação e na duração informada (15 a 60 dias).
  * **Cache e Filtragem de Treinos:** Faz o download da base de exercícios em memória (`cachedApiExercises`) na primeira requisição para evitar múltiplas chamadas de rede, filtra apenas exercícios de força (`strength` / `weightlifting`) compatíveis com o grupo muscular selecionado e sorteia 6 itens sem repetição.
  * **Tradução Híbrida:** Traduz os nomes dos exercícios do inglês para o português usando um dicionário local de termos técnicos de musculação (`termsTranslationPT`), recorrendo à API **MyMemory** quando o termo não está mapeado localmente e aplicando substituições por expressões regulares (*regex*) como plano de contingência (*fallback*).

---

## 📁 Estrutura de Diretórios

```text
CicloFit/
├── public/
│   ├── index.html          # Estrutura HTML5 da aplicação
│   ├── style.css           # Folha de estilos customizada e tema do calendário Flo
│   └── app.js              # Lógica do calendário, regras fisiológicas e consumo de dados
├── server.js               # Configuração do servidor Express e rotas HTTP
├── package.json            # Metadados, scripts e dependências do projeto
├── package-lock.json       # Árvore exata de versões das dependências instaladas
├── .gitignore              # Exclusão de node_modules/ e variáveis de ambiente
└── README.md               # Documentação técnica do projeto
```

---

## 🛠️ Pré-requisitos e Instalação

### Pré-requisitos
* **Node.js:** versão `18.0.0` ou superior (exigido pelo Express `^5.3.0`).
* **npm:** gerenciador de pacotes instalado junto com o Node.js.
* **Acesso à Internet:** necessário no navegador para carregar o Bootstrap via CDN e consultar as bases e serviços externos de exercícios, citações e tradução.

### Passo a Passo de Instalação

1. **Clone o repositório:**
   ```bash
  git clone https://github.com/dinaazvd/CicloFit.git
   ```

2. **Acesse o diretório do projeto:**
   ```bash
   cd CicloFit
   ```

3. **Instale as dependências (`express` e `cors`):**
   ```bash
   npm install
   ```

---

## ▶️ Execução do Projeto

1. **Inicie o servidor Node.js:**
   ```bash
   npm start
   ```
   *(Este comando executa `node server.js` conforme definido em `package.json`).*

2. **Confirme a inicialização no terminal:**
   ```text
   Servidor a correr com sucesso em http://localhost:3000
   ```
   *(Caso exista uma variável de ambiente `PORT` definida no sistema, o servidor utilizará essa porta automaticamente).*

3. **Acesse a aplicação:**
   Abra o navegador em `http://localhost:3000`.

---

## 🔌 Endpoints e Métodos HTTP (API Local)

O servidor local definido em `server.js` implementa apenas rotas de leitura (`GET`), não realizando persistência em banco de dados no back-end:

| Método HTTP | Rota | Descrição | Código de Status | Tipo de Resposta |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Entrega o arquivo estático principal `public/index.html`. | `200 OK` | `text/html` |
| `GET` | `/api/status` | Endpoint REST de *health check* para verificar se a API está ativa e sua versão. | `200 OK` | `application/json` |

### Exemplo de Resposta — `GET /api/status`
```json
{
  "status": "Servidor online",
  "versao": "1.0.0"
}
```

---

## 🌐 Fontes de Dados, APIs Externas e Métodos HTTP

No front-end (`public/app.js`), a aplicação realiza requisições assíncronas via `fetch` utilizando o método **`GET`**. Abaixo está o detalhamento de cada fonte de dados e serviço externo integrado, suas referências oficiais e os métodos documentados:

### 1. Fonte de Dados de Exercícios (`Free Exercise DB`)
* **Repositório e Documentação Oficial:** https://github.com/yuhonas/free-exercise-db
* **URL consumida:** `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`
* **Natureza da fonte e acesso:**
  * Trata-se de uma **base de dados aberta em formato JSON** (e não uma API REST com endpoints ou métodos HTTP documentados).
  * O **CicloFit** realiza a leitura direta desse arquivo estático via **`GET`** (com `AbortController` e timeout de `4000 ms`) para carregar o catálogo completo uma única vez no cache em memória (`cachedApiExercises`).
* **Campos consumidos do JSON:**
  * `name` *(string)*: Nome original do exercício em inglês.
  * `primaryMuscles` *(array de strings)*: Músculos principais trabalhados, cruzados com o filtro selecionado (`pernas`, `superiores`, `core` ou `fullbody`).
  * `category` *(string)*: Filtrado para aceitar apenas `"strength"` ou `"weightlifting"`.
* **Dados enriquecidos localmente:** Cada exercício sorteado recebe parâmetros padronizados de prescrição (`series`: `"3 a 4 séries"`, `reps`: `"10 a 12 reps"`, `rest`: `"60s a 90s"`).

### 2. Frases Motivacionais (`DummyJSON Quotes`)
* **Documentação Oficial:** https://dummyjson.com/docs/quotes
* **Endpoint consumido:** `https://dummyjson.com/quotes/random`
* **Métodos HTTP documentados e utilizados:**
  * A documentação oficial do recurso **Quotes** apresenta endpoints de consulta via **`GET`** (listar todas as citações em `/quotes`, buscar por ID em `/quotes/{id}` e obter uma citação aleatória em `/quotes/random`).
  * O **CicloFit** utiliza **`GET`** na rota `/quotes/random` para exibir uma frase motivacional diferente a cada geração de treino.
* **Campos consumidos do JSON:**
  * `quote` *(string)*: Texto da citação sorteada.
  * `author` *(string)*: Nome do autor da frase.

### 3. Tradução Automática (`MyMemory Translation API`)
* **Especificação Oficial:** https://mymemory.translated.net/doc/spec.php
* **Endpoint consumido:** `https://api.mymemory.translated.net/get?q={texto}&langpair=en|pt-br`
* **Métodos HTTP documentados e utilizados:**
  * Embora a API MyMemory também documente outras operações (como `/set` para envio de pares de tradução e importação de memórias de tradução), o endpoint **`/get`** utilizado pelo projeto recebe requisições **`GET`** com os parâmetros via *query string* (`q` para o texto de origem e `langpair` para o par de idiomas).
  * O **CicloFit** utiliza **`GET`** em `/get` para traduzir dinamicamente as citações e os nomes de exercícios não mapeados no dicionário interno.
* **Campos consumidos do JSON:**
  * `responseData.translatedText` *(string)*: Texto traduzido para Português (PT-BR).

---

## 📊 Regras de Negócio do Ciclo Menstrual

A função `getPhaseFromCycleDay(cycleDay, totalDays)` calcula proporcionalmente os marcos de cada fase de acordo com a duração configurada pela usuária (padrão de **28 dias**):

| Fase | Cálculo de Dias (Exemplo em 28 dias) | Prescrição Fisiológica Aplicada |
| :--- | :--- | :--- |
| **Menstrual** | Dia `1` até `round(totalDays * 0.18)` *(Dias 1 a 5)* | Intensidade moderada (50–60% 1RM), descansos de 90s a 120s e cadência suave. |
| **Folicular** | Após o fim da menstruação até o início da janela fértil *(Dias 6 a 9)* | Subida de estrogénio; foco em hipertrofia com progressão de carga (70–80% 1RM). |
| **Período Fértil** | `ovulationDay - 4` até `ovulationDay + 1` *(Dias 10 a 15)* | Alta disposição neuromuscular; indicado para progressão de cargas (75–85% 1RM). |
| **Dia da Ovulação** | `totalDays - 14` *(Dia 14)* | Pico hormonal e força máxima; recomendado para cargas elevadas (80–85% 1RM). |
| **Lútea** | Após o período fértil até o fim do ciclo *(Dias 16 a 28)* | Progesterona elevada; foco em cadência controlada (3s excêntrica) e máquinas guiadas. |

---

## 👩‍💻 Autoria

Projeto desenvolvido para a disciplina **OAT 2 – Desenvolvimento de API’s** por **Diná Azevedo** & **Maria Fabiana Martins**.