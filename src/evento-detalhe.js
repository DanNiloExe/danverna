
import { supabase } from './supabase.js';

const container = document.getElementById('event-detail-container');
const headerActions = document.getElementById('header-actions');

let currentSession = null;
let currentEvent = null;
let userConfirmed = false;

const params = new URLSearchParams(window.location.search);
const eventId = params.get('id');

// =========================================
// CABEÇALHO
// =========================================

async function updateHeader(session) {
    if (!headerActions) return;

    headerActions.replaceChildren();

    if (!session) {
        const login = document.createElement('a');
        login.href = `/login.html?evento=${eventId}`;
        login.className = 'btn-login';
        login.textContent = 'Entrar';

        const register = document.createElement('a');
        register.href = '/cadastro.html';
        register.className = 'btn-primary';
        register.textContent = 'Criar conta';

        headerActions.append(login, register);
        return;
    }

    const { data: profile, error } = await supabase
        .from('usuario')
        .select('apelido')
        .eq('id_usuario', session.user.id)
        .maybeSingle();

    if (error) {
        console.error('Erro ao buscar perfil:', error);
    }

    const createEvent = document.createElement('a');
    createEvent.href = '/evento.html';
    createEvent.className = 'btn-primary';
    createEvent.textContent = 'Criar evento';

    const userLink = document.createElement('a');
    userLink.href = '#';
    userLink.className = 'user-greeting';
    userLink.textContent = `♙ ${profile?.apelido || 'Aventureiro'}`;

    const logout = document.createElement('button');
    logout.className = 'btn-login logout-button';
    logout.textContent = 'Sair';

    logout.addEventListener('click', async () => {
        logout.disabled = true;
        logout.textContent = 'Saindo...';

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Erro ao sair:', error);
            logout.disabled = false;
            logout.textContent = 'Sair';
            return;
        }

        window.location.reload();
    });

    headerActions.append(createEvent, userLink, logout);
}

// =========================================
// FORMATAÇÃO
// =========================================

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// =========================================
// CARREGAR EVENTO
// =========================================

async function loadEvent() {
    if (!eventId || !/^\d+$/.test(eventId)) {
        showError('Evento não encontrado.');
        return;
    }

    try {
        const { data: evento, error } = await supabase
            .from('evento')
            .select(`
                id_evento,
                titulo,
                descricao,
                data_hora,
                local,
                status,
                evento_jogo (
                    jogo (
                        id_jogo,
                        titulo,
                        genero,
                        imagem_url
                    )
                )
            `)
            .eq('id_evento', eventId)
            .maybeSingle();

        if (error) throw error;

        if (!evento) {
            showError('Não encontramos esse evento.');
            return;
        }

        currentEvent = evento;

        const eventStatus = (evento.status || '').toLowerCase();

        if (
            new Date(evento.data_hora) < new Date() ||
            eventStatus === 'cancelado'
        ) {
            showError('Este evento não está mais disponível.');
            return;
        }

        await loadAttendance();
        renderEvent();

    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        showError('Não foi possível carregar os detalhes do evento.');
    }
}

// =========================================
// CARREGAR PARTICIPANTES
// =========================================

async function loadAttendance() {
    const { data: participants, error } = await supabase.rpc(
        'listar_participantes_evento',
        {
            p_id_evento: currentEvent.id_evento
        }
    );

    if (error) throw error;

    currentEvent.participants = participants || [];

    if (!currentSession) {
        userConfirmed = false;
        return;
    }

    const { data: confirmation, error: confirmationError } = await supabase
        .from('confirmacao_de_presenca')
        .select('id_confirmacao')
        .eq('id_usuario', currentSession.user.id)
        .eq('id_evento', currentEvent.id_evento)
        .eq('status', 'Vai')
        .maybeSingle();

    if (confirmationError) throw confirmationError;

    userConfirmed = Boolean(confirmation);
}

// =========================================
// EXIBIR EVENTO
// =========================================

function renderEvent() {
    container.replaceChildren();

    const article = document.createElement('article');
    article.className = 'event-detail-card';

    // Cabeçalho
    const heading = document.createElement('div');
    heading.className = 'event-detail-heading';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'DETALHES DA AVENTURA';

    const title = document.createElement('h1');
    title.textContent = currentEvent.titulo;

    const status = document.createElement('span');
    status.className = 'event-status';
    status.textContent = currentEvent.status || 'Aberto';

    heading.append(eyebrow, title, status);

    // Descrição
    const description = document.createElement('p');
    description.className = 'event-detail-description';
    description.textContent =
        currentEvent.descricao || 'Um novo encontro aguarda você.';

    // Informações
    const information = document.createElement('div');
    information.className = 'event-detail-information';

    information.append(
        createInformationItem(
            '◷',
            'Data',
            formatDate(currentEvent.data_hora)
        ),
        createInformationItem(
            '◴',
            'Horário',
            formatTime(currentEvent.data_hora)
        ),
        createInformationItem(
            '⌖',
            'Local',
            currentEvent.local || 'Local a definir'
        )
    );

    // Jogos
    const gamesSection = document.createElement('section');
    gamesSection.className = 'detail-section';

    const gamesTitle = document.createElement('h2');
    gamesTitle.textContent = 'Jogos do encontro';

    const gamesSubtitle = document.createElement('p');
    gamesSubtitle.className = 'detail-section-description';
    gamesSubtitle.textContent =
        'Conheça os jogos selecionados para esta aventura.';

    const gamesList = document.createElement('div');
    gamesList.className = 'detail-games-list';

    const games = (currentEvent.evento_jogo || [])
        .map(item => item.jogo)
        .filter(Boolean);

    if (games.length > 0) {
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'detail-game-card';

            const imageArea = document.createElement('div');
            imageArea.className = 'detail-game-image-area';

            if (game.imagem_url) {
                const image = document.createElement('img');
                image.src = game.imagem_url;
                image.alt = `Capa de ${game.titulo}`;
                image.className = 'detail-game-cover';
                image.onerror = () => {
                    image.remove();
                    imageArea.classList.add('no-game-image');
                };

                imageArea.appendChild(image);
            } else {
                imageArea.classList.add('no-game-image');

                const placeholder = document.createElement('span');
                placeholder.textContent = '⚄';
                imageArea.appendChild(placeholder);
            }

            const gameInfo = document.createElement('div');
            gameInfo.className = 'detail-game-info';

            const gameName = document.createElement('h3');
            gameName.textContent = game.titulo;

            const gameGenre = document.createElement('p');
            gameGenre.textContent = game.genero || 'Gênero não informado';

            gameInfo.append(gameName, gameGenre);
            gameCard.append(imageArea, gameInfo);
            gamesList.appendChild(gameCard);
        });
    } else {
        const emptyGames = document.createElement('p');
        emptyGames.className = 'detail-muted';
        emptyGames.textContent = 'Nenhum jogo informado para este encontro.';
        gamesList.appendChild(emptyGames);
    }

    gamesSection.append(gamesTitle, gamesSubtitle, gamesList);

    // Participantes
    const participantsSection = document.createElement('section');
    participantsSection.className = 'detail-section';

    const participantsHeading = document.createElement('div');
    participantsHeading.className = 'participants-heading';

    const participantsTitle = document.createElement('h2');
    participantsTitle.textContent = 'Aventureiros confirmados';

    const participantsCount = document.createElement('span');
    participantsCount.className = 'participants-total';
    participantsCount.textContent =
        `${currentEvent.participants.length} confirmado(s)`;

    participantsHeading.append(participantsTitle, participantsCount);

    const participantsList = document.createElement('div');
    participantsList.className = 'participants-list';

    if (currentEvent.participants.length > 0) {
        currentEvent.participants.forEach(participant => {
            const participantName = document.createElement('div');
            participantName.className = 'participant-name';

            const icon = document.createElement('span');
            icon.textContent = '♙';

            const name = document.createElement('span');
            name.textContent = participant.apelido || 'Aventureiro';

            participantName.append(icon, name);
            participantsList.appendChild(participantName);
        });
    } else {
        const noParticipants = document.createElement('p');
        noParticipants.className = 'detail-muted';
        noParticipants.textContent =
            'Ainda não há aventureiros confirmados. Seja o primeiro!';

        participantsList.appendChild(noParticipants);
    }

    participantsSection.append(
        participantsHeading,
        participantsList
    );

    // Presença
    const attendanceSection = document.createElement('section');
    attendanceSection.className = 'detail-attendance';

    const attendanceContent = document.createElement('div');

    const attendanceTitle = document.createElement('h2');
    attendanceTitle.textContent = 'Vai participar da aventura?';

    const attendanceDescription = document.createElement('p');
    attendanceDescription.textContent = currentSession
        ? 'Confirme sua presença e faça parte deste encontro.'
        : 'Entre na sua conta para confirmar sua presença.';

    attendanceContent.append(attendanceTitle, attendanceDescription);

    const attendanceButton = document.createElement('button');
    attendanceButton.className = 'event-button detail-attendance-button';
    attendanceButton.type = 'button';

    if (!currentSession) {
        attendanceButton.textContent = 'Entrar para participar';

        attendanceButton.addEventListener('click', () => {
            window.location.href = `/login.html?evento=${eventId}`;
        });
    } else {
        updateAttendanceButton(attendanceButton);

        attendanceButton.addEventListener('click', async () => {
            await toggleAttendance(attendanceButton);
        });
    }

    attendanceSection.append(attendanceContent, attendanceButton);

    article.append(
        heading,
        description,
        information,
        gamesSection,
        participantsSection,
        attendanceSection
    );

    container.appendChild(article);

    document.title = `${currentEvent.titulo} | A Taverna`;
}

// =========================================
// COMPONENTES
// =========================================

function createInformationItem(icon, label, value) {
    const item = document.createElement('div');
    item.className = 'detail-information-item';

    const iconElement = document.createElement('span');
    iconElement.className = 'detail-information-icon';
    iconElement.textContent = icon;

    const content = document.createElement('div');
    content.className = 'detail-information-content';

    const itemLabel = document.createElement('span');
    itemLabel.className = 'detail-information-label';
    itemLabel.textContent = label;

    const itemValue = document.createElement('p');
    itemValue.textContent = value;

    content.append(itemLabel, itemValue);
    item.append(iconElement, content);

    return item;
}

function updateAttendanceButton(button) {
    button.textContent = userConfirmed
        ? 'Cancelar presença'
        : 'Confirmar presença';

    button.classList.toggle('attendance-confirmed', userConfirmed);
}

// =========================================
// CONFIRMAR / CANCELAR PRESENÇA
// =========================================

async function toggleAttendance(button) {
    button.disabled = true;
    button.textContent = 'Aguarde...';

    try {
        if (userConfirmed) {
            const { error } = await supabase
                .from('confirmacao_de_presenca')
                .delete()
                .eq('id_usuario', currentSession.user.id)
                .eq('id_evento', currentEvent.id_evento);

            if (error) throw error;

        } else {
            const { error } = await supabase
                .from('confirmacao_de_presenca')
                .insert({
                    id_usuario: currentSession.user.id,
                    id_evento: currentEvent.id_evento,
                    status: 'Vai'
                });

            if (error) throw error;
        }

        await loadAttendance();
        renderEvent();

    } catch (error) {
        console.error('Erro ao atualizar presença:', error);

        alert(
            'Não foi possível atualizar sua presença. Tente novamente.'
        );

        updateAttendanceButton(button);

    } finally {
        button.disabled = false;
    }
}

// =========================================
// ERROS
// =========================================

function showError(message) {
    container.replaceChildren();

    const errorBox = document.createElement('div');
    errorBox.className = 'empty-state detail-error';

    const icon = document.createElement('span');
    icon.textContent = '⚜';

    const title = document.createElement('h3');
    title.textContent = message;

    const back = document.createElement('a');
    back.href = '/#events-section';
    back.className = 'event-button';
    back.textContent = 'Voltar para a taverna';

    errorBox.append(icon, title, back);
    container.appendChild(errorBox);
}

// =========================================
// INICIALIZAÇÃO
// =========================================

async function initialize() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao verificar sessão:', error);
    }

    currentSession = data?.session || null;

    await updateHeader(currentSession);
    await loadEvent();
}

initialize();

supabase.auth.onAuthStateChange((event, session) => {
    if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED'
    ) {
        currentSession = session;
        updateHeader(session);

        if (currentEvent) {
            loadAttendance()
                .then(renderEvent)
                .catch(error => {
                    console.error(
                        'Erro ao atualizar participantes:',
                        error
                    );
                });
        }
    }
});
