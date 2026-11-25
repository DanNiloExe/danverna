
# Danverna Lúdica 🎲

A Danverna Lúdica é um projeto desenvolvido para facilitar a organização de encontros de jogos de tabuleiro. A ideia surgiu da vontade de reunir amigos em torno de uma mesa, tornando mais simples compartilhar informações sobre os encontros, confirmar presenças e conhecer os jogos disponíveis.

O projeto reúne funcionalidades de autenticação, gerenciamento de eventos e um catálogo de jogos, em uma interface inspirada no universo das tavernas e da fantasia medieval.

## Funcionalidades

- **Cadastro e login:** criação de contas e autenticação de usuários.
- **Eventos:** criação e divulgação de encontros, com data, horário, local e descrição.
- **Confirmação de presença:** participantes podem confirmar ou cancelar sua participação.
- **Detalhes do evento:** visualização das informações do encontro, jogos associados e participantes confirmados.
- **Catálogo de jogos:** consulta de jogos cadastrados, com informações sobre gênero, quantidade de jogadores, duração e dificuldade.
- **Gerenciamento de jogos:** usuários podem cadastrar, editar e excluir os próprios jogos.
- **Pesquisa e filtros:** localização de jogos por título e gênero.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e responsividade |
| JavaScript | Funcionalidades e interações |
| Vite | Ambiente de desenvolvimento e build |
| Supabase | Banco de dados, autenticação e API |
| PostgreSQL | Gerenciamento dos dados |
| Git e GitHub | Versionamento e hospedagem do código |

## Estrutura do projeto

```text
danverna/
├── public/
│   └── images/
├── src/
│   ├── css/
│   │   ├── style.css
│   │   └── auth.css
│   ├── main.js
│   ├── auth.js
│   ├── evento.js
│   ├── evento-detalhe.js
│   ├── jogos.js
│   └── supabase.js
├── index.html
├── login.html
├── cadastro.html
├── evento.html
├── evento-detalhe.html
├── jogos.html
├── package.json
└── README.md
```

## Executando localmente

Para executar o projeto em ambiente de desenvolvimento, é necessário ter o Node.js instalado.

1. Clone o repositório:

```bash
git clone https://github.com/DanNiloExe/danverna.git
```

2. Acesse a pasta:

```bash
cd danverna
```

3. Instale as dependências:

```bash
npm install
```

4. Configure as variáveis de ambiente do Supabase em um arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_publica
```

5. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá o endereço local para acessar a aplicação no navegador.

## Banco de dados e autenticação

O Supabase é responsável pelo armazenamento dos dados e pela autenticação dos usuários.

As operações realizadas pela aplicação utilizam a API do Supabase, com políticas de segurança em nível de linha (RLS) para controlar o acesso às informações.

As credenciais devem ser configuradas por variáveis de ambiente e não devem ser publicadas no repositório.

## Publicação

A aplicação está preparada para publicação utilizando a Vercel, com integração ao repositório do GitHub.

**Repositório:** https://github.com/DanNiloExe/danverna

---

Desenvolvido como projeto pessoal de estudo e aplicação prática de desenvolvimento web.
