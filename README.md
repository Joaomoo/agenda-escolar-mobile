# Agenda Escolar CIM — base inicial

Aplicativo mobile para a turma piloto do Colégio Interação Modelo. A base foi preparada com Expo + React Native + JavaScript, com foco em Android e iOS.

## 1. Requisitos

- Node.js LTS instalado.
- npm.
- Expo Go para executar a interface inicial em um dispositivo físico (SDK 57 durante a transição do SDK 58).
- Android Studio para emulador Android, se desejado.
- Em Windows, é possível testar iOS em um iPhone físico usando Expo Go. O simulador iOS local exige macOS/Xcode; para gerar builds iOS a partir de Windows, use EAS Build em nuvem.

## 2. Instalação

No terminal, dentro da pasta do projeto:

```bash
npm install
npx expo start
```

Leia o QR Code com o Expo Go no celular. Para abrir um emulador Android, use `npm run android`.

> Esta base usa Expo SDK 57 para facilitar os primeiros testes com Expo Go durante a transição do SDK 58. Antes de atualizar o SDK, valide a compatibilidade das dependências com `npx expo-doctor` e siga o guia oficial de upgrade.

## 3. Firebase

1. Crie um projeto no Firebase Console.
2. Registre um aplicativo Web dentro do projeto Firebase (o Firebase JavaScript SDK usa essa configuração também no React Native).
3. Copie as credenciais para um arquivo `.env`, tomando `.env.example` como modelo.
4. Ative o provedor **Email/senha** no Firebase Authentication.
5. Crie o banco Cloud Firestore.
6. Cadastre manualmente as contas iniciais de professores e administradores no Authentication.
7. Crie documentos de perfil no Firestore e implemente as regras de autorização antes de disponibilizar qualquer área administrativa.

Exemplo de estrutura local:

```text
agenda-escolar-mobile/
├── .env                 # credenciais locais; não versionar
├── app.json
├── package.json
└── src/
```

A tela de login já chama o serviço Firebase quando as variáveis estão preenchidas. Sem as credenciais, ela informa que o Firebase precisa ser configurado.

## 4. Arquitetura de pastas

```text
src/
├── app/                    # Rotas do Expo Router
│   ├── (tabs)/              # Área pública do aluno
│   │   ├── _layout.js       # Navegação inferior
│   │   ├── index.js         # Início
│   │   ├── calendario.js    # Calendário por data
│   │   └── avisos.js        # Central de avisos
│   ├── painel/              # Área da equipe (esqueleto)
│   │   └── index.js
│   ├── _layout.js           # Layout raiz
│   └── login.js             # Login de professores/admins
├── components/              # Componentes reutilizáveis
├── constants/               # Cores e tokens visuais
├── data/                    # Dados de demonstração
├── services/                # Integrações externas (Firebase)
└── utils/                   # Funções auxiliares
```

## 5. Dependências incluídas

- `expo` e `react-native`: base do aplicativo.
- `expo-router`: navegação por arquivos.
- `expo-status-bar`: configuração da barra de status.
- `firebase`: Authentication, Firestore, Storage e Functions via SDK JavaScript.
- `@react-native-async-storage/async-storage`: persistência local da sessão do Firebase Authentication.
- `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`, `react-native-reanimated` e `react-native-worklets`: suporte da navegação e das telas.

### Dependências para adicionar na etapa de importação/notificações

Instale somente quando formos implementar essas partes:

```bash
npx expo install expo-document-picker expo-file-system expo-notifications expo-device
```

A extração do conteúdo do PDF deverá ser validada com o arquivo real. Se o PDF tiver texto selecionável, testar extração textual; se for uma imagem digitalizada, avaliar OCR. A conferência humana antes de publicar continuará obrigatória.

## 6. Decisões de implementação já refletidas

- O aluno consulta sem criar conta.
- A turma é única no MVP, mas os registros já possuem `turmaId` para facilitar expansão futura.
- A programação será armazenada por data real, não como grade fixa recorrente.
- Os PDFs importados deverão gerar rascunho; somente o administrador poderá revisar e publicar.
- Professores e administradores terão contas autenticadas.
- Os dados mostrados nas telas iniciais são demonstrativos e devem ser substituídos pela consulta ao Firestore.

## 7. Antes de produção

A tela `/painel` é apenas um esqueleto visual. Ainda não é uma área protegida. Antes de publicar, implementar:

- leitura do perfil do usuário após o login;
- autorização ADMIN/PROFESSOR validada no backend;
- regras do Firestore e Storage;
- Cloud Functions para ações privilegiadas e envio de notificações;
- validação de arquivos PDF, tamanho e tipo;
- logs e tratamento de erros.

Nunca coloque credenciais de administrador, chaves privadas de service account ou segredos de servidor no aplicativo mobile. As variáveis `EXPO_PUBLIC_*` são incorporadas ao bundle e não devem guardar segredos.
