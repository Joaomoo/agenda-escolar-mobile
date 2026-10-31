# Agenda Escolar CIM — Importador de programação (primeira versão)

## O que este módulo faz

- Abre o seletor de documentos e recebe um PDF.
- Converte a página do PDF em imagem no próprio dispositivo.
- Executa OCR local usando ML Kit.
- Tenta identificar os cinco dias, períodos, horários, matérias e professores pela posição das linhas reconhecidas.
- Converte marcadores `####` / `#####` em `AULA_VAGA` automaticamente.
- Sinaliza células sem texto reconhecido para revisão.
- Exige a data da segunda-feira da semana antes de permitir a publicação.
- Permite editar matérias, professores e horários.
- Publica a programação e as aulas no Firestore somente após a revisão.
- Se já existir uma programação publicada para a mesma segunda-feira, marca as aulas anteriores como não publicadas e mantém o documento antigo com status `SUBSTITUIDA`, preservando os registros anteriores no banco.

## Limites desta primeira versão

1. Um PDF deve conter uma única página com uma grade semanal. O cronograma enviado pelo CIM é de uma página, portanto este é o primeiro caso coberto.
2. O OCR é executado no aparelho e não depende de Cloud Storage nem Cloud Functions. Os componentes de lista também passam a identificar visualmente períodos vagos e intervalos.
3. O PDF original não é arquivado na nuvem. O nome do arquivo e os dados extraídos ficam no Firestore; o documento original permanece com o administrador.
4. A importação foi preparada para tabelas no formato do cronograma CIM. Outros layouts poderão exigir ajustes no parser.
5. A extração OCR ainda precisa ser validada em um development build Android e iOS com PDFs reais. O preview de conferência continua obrigatório.

## Instalação de dependências

Dentro da pasta do projeto:

```bash
npx expo install expo-document-picker expo-build-properties expo-dev-client
npm install expo-mlkit-ocr@0.2.7 react-native-pdf-to-image@4.0.0
```

## Aplicar arquivos

Faça backup e mescle os arquivos deste patch na raiz do projeto, substituindo:

- `src/app/painel/index.js`

Adicione:

- `src/app/painel/importar.js`
- `src/services/programImportService.js`
- `src/services/scheduleService.js`
- `src/utils/cimTimetableParser.js`
- `src/components/ui.js`

Mescle a configuração de plugins de `app.json` e adicione `eas.json`. Se o seu `app.json` já tiver outras configurações, preserve-as; o patch mantém o scheme e os identificadores definidos no projeto inicial.

**Não substitua nem apague seu `.env`.**

## Development build obrigatório

`expo-mlkit-ocr` e `react-native-pdf-to-image` usam código nativo e não funcionam no Expo Go.

Depois de instalar:

```bash
npx expo start -c
```

Isso só inicia o Metro. Para testar OCR no aparelho, gere um development build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

Instale o APK gerado no celular e abra-o. Para iOS, use:

```bash
npx eas-cli@latest build --profile development --platform ios
```

A configuração do OCR requer iOS 16 ou superior nesta versão do módulo. Builds para iPhone físico podem exigir configuração de assinatura Apple no EAS.

## Importante sobre Firebase Storage e o plano Spark

O módulo não usa Firebase Storage para não depender de upgrade de cobrança. A documentação atual do Firebase informa que Cloud Storage for Firebase exige o plano Blaze para acesso aos buckets, inclusive no caso de novos projetos Spark. O OCR local mantém a primeira versão sem esse requisito.

## Teste recomendado

1. Entre como ADMIN.
2. Abra Painel da equipe → Importar programação.
3. Selecione `Cronograma_CIM.pdf`.
4. Informe a segunda-feira correspondente à semana representada no documento.
5. Toque em Analisar PDF.
6. Confira os dias, horários, matérias e professores.
7. Confirme que os dois marcadores `####` do 8º período (quarta e quinta) foram identificados como `Aula vaga`.
8. Corrija qualquer célula não reconhecida e confirme os horários.
9. Publique. O resultado esperado para o PDF enviado é 38 aulas regulares + 2 períodos vagos, mais os intervalos de lanche se os horários forem reconhecidos.

Se o Firebase solicitar um índice composto ao substituir uma semana já publicada, abra o link de criação de índice exibido no erro e aguarde o índice ficar pronto.

Se o OCR falhar em separar a tabela, não publique. Envie a mensagem e uma captura do preview para ajustar o parser.
