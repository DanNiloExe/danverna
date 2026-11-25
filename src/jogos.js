
import { supabase } from './supabase.js';

// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const gamesList = document.getElementById('games-list');
const searchInput = document.getElementById('search-game');
const genreFilter = document.getElementById('filter-genre');

const registerSection = document.getElementById('register-game-section');
const loginNotice = document.getElementById('login-notice');
const registerForm = document.getElementById('register-game-form');
const gameMessage = document.getElementById('game-message');

const submitButton = document.getElementById('game-submit');
const cancelEditButton = document.getElementById('cancel-edit');

const gameFields = {
    title: document.getElementById('game-title'),
    genre: document.getElementById('game-genre'),
    minPlayers: document.getElementById('game-min'),
    maxPlayers: document.getElementById('game-max'),
    duration: document.getElementById('game-duration'),
    difficulty: document.getElementById('game-difficulty'),
    image: document.getElementById('game-image')
};

// ========================================
// ESTADO DA APLICAÇÃO
// ========================================

let games = [];
let session = null;
let editingGameId = null;
let gamesRequestId = 0;

// ========================================
// CARTÕES DO CATÁLOGO
// ========================================

function createGameCard(game) {
    const card = document.createElement('article');
    card.className = 'catalog-card';

    if (game.imagem_url) {
        const image = document.createElement('img');

        image.src = game.imagem_url;
        image.alt = `Capa de ${game.titulo}`;
        image.className = 'catalog-game-image';
        image.loading = 'lazy';

        image.onerror = () => image.remove();

        card.appendChild(image);
    }

    const title = document.createElement('h3');
    title.textContent = game.titulo;

    const genre = document.createElement('p');
    genre.className = 'catalog-genre';
    genre.textContent = game.genero || 'Gênero não informado';

    const details = document.createElement('div');
    details.className = 'catalog-details';

    const players = document.createElement('span');
    players.textContent =
        `♟ ${game.min_jogadores}–${game.max_jogadores} jogadores`;

    const duration = document.createElement('span');
    duration.textContent = game.duracao_min
        ? `◷ ${game.duracao_min} minutos`
        : 'Duração não informada';

    const difficulty = document.createElement('span');
    difficulty.textContent =
        `Dificuldade: ${game.dificuldade || 'Não informada'}`;

    details.append(players, duration, difficulty);
    card.append(title, genre, details);

    // Ações disponíveis apenas para quem cadastrou o jogo.
    if (session && game.id_cadastrador === session.user.id) {
        const actions = document.createElement('div');
        actions.className = 'catalog-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Editar';
        editButton.className = 'edit-game-button';

        editButton.addEventListener('click', () => {
            editGame(game);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Excluir';
        deleteButton.className = 'delete-game-button';

        deleteButton.addEventListener('click', () => {
            deleteGame(game);
        });

        actions.append(editButton, deleteButton);
        card.appendChild(actions);
    }

    return card;
}

// ========================================
// PESQUISA E FILTROS
// ========================================

function renderGames() {
    const search = searchInput.value.trim().toLowerCase();
    const genre = genreFilter.value;

    const filteredGames = games.filter(game => {
        const title = (game.titulo || '').toLowerCase();

        const matchesTitle = title.includes(search);
        const matchesGenre = !genre || game.genero === genre;

        return matchesTitle && matchesGenre;
    });

    gamesList.replaceChildren();

    if (filteredGames.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Nenhum jogo encontrado.';

        gamesList.appendChild(emptyMessage);
        return;
    }

    filteredGames.forEach(game => {
        gamesList.appendChild(createGameCard(game));
    });
}

function populateGenres() {
    const selectedGenre = genreFilter.value;

    const genres = [
        ...new Set(
            games
                .map(game => game.genero)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

    genreFilter.replaceChildren();

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Todos os gêneros';

    genreFilter.appendChild(allOption);

    genres.forEach(genre => {
        const option = document.createElement('option');

        option.value = genre;
        option.textContent = genre;

        genreFilter.appendChild(option);
    });

    genreFilter.value = genres.includes(selectedGenre)
        ? selectedGenre
        : '';
}

// ========================================
// CARREGAMENTO DOS JOGOS
// ========================================

async function loadGames() {
    const requestId = ++gamesRequestId;

    gamesList.textContent = 'Carregando catálogo...';

    try {
        const { data, error } = await supabase
            .from('jogo')
            .select(`
                id_jogo,
                titulo,
                genero,
                min_jogadores,
                max_jogadores,
                duracao_min,
                dificuldade,
                imagem_url,
                id_cadastrador
            `)
            .order('titulo', { ascending: true });

        if (error) throw error;

        // Ignora consultas antigas que terminaram depois de uma nova.
        if (requestId !== gamesRequestId) return;

        games = data || [];

        populateGenres();
        renderGames();

    } catch (error) {
        if (requestId !== gamesRequestId) return;

        console.error('Erro ao carregar jogos:', error);

        gamesList.textContent =
            'Não foi possível carregar o catálogo. Verifique sua conexão.';
    }
}

// ========================================
// AUTENTICAÇÃO
// ========================================

function updateAuthInterface() {
    registerSection.hidden = !session;
    loginNotice.hidden = Boolean(session);

    renderGames();
}

async function initialize() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao verificar sessão:', error);
    }

    session = data?.session || null;

    updateAuthInterface();

    await loadGames();
}

// ========================================
// EDIÇÃO DE JOGOS
// ========================================

function editGame(game) {
    if (!session || game.id_cadastrador !== session.user.id) {
        return;
    }

    editingGameId = game.id_jogo;

    gameFields.title.value = game.titulo;
    gameFields.genre.value = game.genero || '';
    gameFields.minPlayers.value = game.min_jogadores;
    gameFields.maxPlayers.value = game.max_jogadores;
    gameFields.duration.value = game.duracao_min || '';
    gameFields.difficulty.value = game.dificuldade || '';
    gameFields.image.value = game.imagem_url || '';

    submitButton.textContent = 'Salvar alterações';
    cancelEditButton.hidden = false;

    gameMessage.textContent = `Editando: ${game.titulo}`;

    registerSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ========================================
// FORMULÁRIO
// ========================================

function resetForm() {
    editingGameId = null;

    registerForm.reset();

    gameFields.minPlayers.value = 2;
    gameFields.maxPlayers.value = 4;

    submitButton.textContent = 'Cadastrar jogo';
    cancelEditButton.hidden = true;

    gameMessage.textContent = '';
}

cancelEditButton.addEventListener('click', resetForm);

// ========================================
// EXCLUSÃO DE JOGOS
// ========================================

async function deleteGame(game) {
    if (!session || game.id_cadastrador !== session.user.id) {
        return;
    }

    const confirmed = confirm(
        `Deseja realmente excluir "${game.titulo}" do catálogo?\n\n` +
        'Essa ação também removerá suas associações com eventos.'
    );

    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from('jogo')
            .delete()
            .eq('id_jogo', game.id_jogo)
            .eq('id_cadastrador', session.user.id);

        if (error) throw error;

        if (editingGameId === game.id_jogo) {
            resetForm();
        }

        await loadGames();

    } catch (error) {
        console.error('Erro ao excluir jogo:', error);
        alert('Não foi possível excluir o jogo.');
    }
}

// ========================================
// VALIDAÇÃO DOS DADOS
// ========================================

function getGameData() {
    const titulo = gameFields.title.value.trim();
    const genero = gameFields.genre.value.trim();

    const minJogadores = Number(gameFields.minPlayers.value);
    const maxJogadores = Number(gameFields.maxPlayers.value);

    const duracao = gameFields.duration.value;
    const dificuldade = gameFields.difficulty.value;

    const imageUrl = gameFields.image.value.trim();

    if (!titulo) {
        throw new Error('Informe o título do jogo.');
    }

    if (
        !Number.isInteger(minJogadores) ||
        !Number.isInteger(maxJogadores) ||
        minJogadores < 1 ||
        maxJogadores < minJogadores
    ) {
        throw new Error(
            'Verifique a quantidade mínima e máxima de jogadores.'
        );
    }

    if (duracao && (!Number.isFinite(Number(duracao)) || Number(duracao) < 1)) {
        throw new Error('Informe uma duração válida.');
    }

    if (imageUrl) {
        try {
            const parsedUrl = new URL(imageUrl);

            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error();
            }
        } catch {
            throw new Error('Informe uma URL de imagem válida.');
        }
    }

    return {
        titulo,
        genero: genero || null,
        min_jogadores: minJogadores,
        max_jogadores: maxJogadores,
        duracao_min: duracao ? Number(duracao) : null,
        dificuldade: dificuldade || null,
        imagem_url: imageUrl || null
    };
}

// ========================================
// CADASTRO E ATUALIZAÇÃO
// ========================================

async function saveGame(event) {
    event.preventDefault();

    if (!session) {
        gameMessage.textContent =
            'Entre na sua conta para cadastrar jogos.';
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
        const gameData = getGameData();
        const isEditing = editingGameId !== null;

        let query;

        if (isEditing) {
            query = supabase
                .from('jogo')
                .update(gameData)
                .eq('id_jogo', editingGameId)
                .eq('id_cadastrador', session.user.id);
        } else {
            query = supabase
                .from('jogo')
                .insert({
                    ...gameData,
                    id_cadastrador: session.user.id
                });
        }

        const { error } = await query;

        if (error) throw error;

        resetForm();

        gameMessage.textContent = isEditing
            ? 'Jogo atualizado com sucesso!'
            : 'Jogo cadastrado com sucesso!';

        await loadGames();

    } catch (error) {
        console.error('Erro ao salvar jogo:', error);

        gameMessage.textContent = error.message ||
            'Não foi possível salvar o jogo.';

    } finally {
        submitButton.disabled = false;

        if (editingGameId === null) {
            submitButton.textContent = 'Cadastrar jogo';
        }
    }
}

registerForm.addEventListener('submit', saveGame);

// ========================================
// EVENTOS DA INTERFACE
// ========================================

searchInput.addEventListener('input', renderGames);
genreFilter.addEventListener('change', renderGames);

// ========================================
// INICIALIZAÇÃO E MUDANÇAS DE AUTENTICAÇÃO
// ========================================

supabase.auth.onAuthStateChange((event, newSession) => {
    if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED'
    ) {
        session = newSession;

        updateAuthInterface();
    }
});

initialize();
