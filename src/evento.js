
import { supabase } from './supabase.js';

// Elementos da página
const eventForm = document.getElementById('event-form');
const gamesContainer = document.getElementById('games-container');
const eventMessage = document.getElementById('event-message');
const loginNotice = document.getElementById('login-notice');
const createEventButton = document.getElementById('create-event-button');

const titleInput = document.getElementById('titulo');
const descriptionInput = document.getElementById('descricao');
const dateInput = document.getElementById('data');
const timeInput = document.getElementById('horario');
const locationInput = document.getElementById('local');

let session = null;
let games = [];

// Mensagens
function showMessage(message, success = false) {
    eventMessage.textContent = message;
    eventMessage.style.color = success ? '#8fbd82' : '#D6A64F';
}

// Define a data mínima como hoje
function setMinimumDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    dateInput.min = `${year}-${month}-${day}`;
}

// Controla o acesso ao formulário
function updateAccess() {
    const loggedIn = Boolean(session);

    loginNotice.hidden = loggedIn;

    eventForm.querySelectorAll('input, textarea, button').forEach(element => {
        element.disabled = !loggedIn;
    });

    createEventButton.disabled = !loggedIn;

    renderGames();
}

// Carrega os jogos cadastrados no catálogo
async function loadGames() {
    gamesContainer.innerHTML = '<p>Carregando catálogo...</p>';

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
            imagem_url
        `)
        .order('titulo');

    if (error) {
        console.error('Erro ao carregar jogos:', error);
        gamesContainer.innerHTML =
            '<p>Não foi possível carregar os jogos do catálogo.</p>';
        return;
    }

    games = data || [];
    renderGames();
}

// Exibe os jogos disponíveis para seleção
function renderGames() {
    gamesContainer.innerHTML = '';

    if (games.length === 0) {
        gamesContainer.innerHTML = `
            <p>Nenhum jogo cadastrado ainda. Visite o catálogo para adicionar jogos.</p>
            <a href="/jogos.html" class="auth-link">Acessar catálogo de jogos</a>
        `;
        return;
    }

    games.forEach(game => {
        const card = document.createElement('label');
        card.className = 'event-game-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'event-game-checkbox';
        checkbox.value = game.id_jogo;
        checkbox.disabled = !session;

        const content = document.createElement('div');
        content.className = 'event-game-content';

        if (game.imagem_url) {
            const image = document.createElement('img');
            image.src = game.imagem_url;
            image.alt = `Capa de ${game.titulo}`;
            image.className = 'event-game-image';

            image.onerror = () => image.remove();

            content.appendChild(image);
        }

        const title = document.createElement('h3');
        title.textContent = game.titulo;
        content.appendChild(title);

        if (game.genero) {
            const genre = document.createElement('p');
            genre.textContent = game.genero;
            content.appendChild(genre);
        }

        const details = document.createElement('small');

        details.textContent =
            `${game.min_jogadores}–${game.max_jogadores} jogadores` +
            (game.duracao_min ? ` • ${game.duracao_min} min` : '') +
            (game.dificuldade ? ` • ${game.dificuldade}` : '');

        content.appendChild(details);

        card.appendChild(checkbox);
        card.appendChild(content);

        gamesContainer.appendChild(card);
    });
}

// Verifica a sessão atual
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao verificar sessão:', error);
        return;
    }

    session = data.session;
    updateAccess();
}

// Cria o evento e associa os jogos
eventForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!session) {
        showMessage('Entre na sua conta para criar um evento.');
        return;
    }

    const selectedGames = [
        ...document.querySelectorAll('.event-game-checkbox:checked')
    ].map(checkbox => Number(checkbox.value));

    if (selectedGames.length === 0) {
        showMessage('Selecione pelo menos um jogo para o evento.');
        return;
    }

    const date = dateInput.value;
    const time = timeInput.value;

    const eventDate = new Date(`${date}T${time}:00`);

    if (Number.isNaN(eventDate.getTime())) {
        showMessage('Informe uma data e um horário válidos.');
        return;
    }

    if (eventDate <= new Date()) {
        showMessage('A data do evento precisa ser futura.');
        return;
    }

    createEventButton.disabled = true;
    showMessage('Criando sua aventura...');

    try {
        // Primeiro, cadastra o evento
        const { data: createdEvent, error: eventError } = await supabase
            .from('evento')
            .insert({
                id_organizador: session.user.id,
                titulo: titleInput.value.trim(),
                descricao: descriptionInput.value.trim() || null,
                data_hora: eventDate.toISOString(),
                local: locationInput.value.trim() || null,
                status: 'Aberto'
            })
            .select('id_evento')
            .single();

        if (eventError) {
            throw eventError;
        }

        // Depois, associa os jogos selecionados ao evento
        const gameAssociations = selectedGames.map(gameId => ({
            id_evento: createdEvent.id_evento,
            id_jogo: gameId
        }));

        const { error: associationError } = await supabase
            .from('evento_jogo')
            .insert(gameAssociations);

        if (associationError) {
            // Tenta remover o evento caso a associação dos jogos falhe
            await supabase
                .from('evento')
                .delete()
                .eq('id_evento', createdEvent.id_evento)
                .eq('id_organizador', session.user.id);

            throw associationError;
        }

        showMessage('Aventura criada com sucesso!', true);

        eventForm.reset();
        document.querySelectorAll('.event-game-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        setMinimumDate();

    } catch (error) {
        console.error('Erro ao criar evento:', error);
        showMessage(
            error.message || 'Não foi possível criar o evento. Tente novamente.'
        );
    } finally {
        createEventButton.disabled = !session;
    }
});

// Inicialização
setMinimumDate();
await checkSession();
await loadGames();

// Atualiza a sessão caso o usuário entre ou saia da conta
supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession;
    updateAccess();
});
