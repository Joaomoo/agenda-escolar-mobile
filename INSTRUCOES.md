# Agenda Escolar CIM — login definitivo e painel da equipe

Este patch substitui somente três arquivos:
- `src/services/authService.js`
- `src/app/login.js`
- `src/app/painel/index.js`

## O que muda
- O login autentica por email/senha e valida o documento `usuarios/{UID}` antes de navegar.
- O perfil precisa existir, estar ativo e ter `perfil` igual a `ADMIN` ou `PROFESSOR`.
- O painel valida novamente a sessão persistida ao abrir.
- A tela apresenta atalhos diferentes conforme o perfil.
- O botão Sair encerra a sessão Firebase.
- Os módulos de importação e lembretes aparecem como próximas etapas, sem simular operações ainda não implementadas.

## Como aplicar
1. Faça backup dos três arquivos indicados.
2. Extraia o ZIP na raiz da pasta `agenda-escolar-mobile`, mesclando as pastas `src` e substituindo os arquivos.
3. Preserve o arquivo `.env`.
4. Pare o Metro e execute `npx expo start -c`.
5. Entre com a conta ADMIN já criada no Firebase Authentication e vinculada ao documento `usuarios/{UID}`.
6. Confirme que o painel exibe o perfil ADMIN e que o botão Sair retorna à agenda pública.

## Requisitos de dados
O documento `usuarios/{UID}` deve conter:
- `nome` (string)
- `email` (string)
- `perfil` (`ADMIN` ou `PROFESSOR`)
- `ativo` (boolean `true`)

A autorização também deve permanecer nas regras do Firestore. Não dependa apenas da navegação ou dos controles visuais para proteger dados.
