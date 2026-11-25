
import { supabase } from './supabase.js';

const eventsContainer = document.getElementById('events-container');
const eventCounter = document.getElementById('event-counter');
const headerActions = document.getElementById('header-actions');

let currentSession = null;
let eventsRequestId = 0;
let headerRequestId = 0;

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
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

async function createEventCard(evento, confirmacoes) {
    const article = document.createElement('article');
    article.className = 'event-card';
    article.id = `evento-${evento.id_evento}`;

    const title = document.createElement('h3');
    title.textContent = evento.titulo;

    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent =
        evento.descricao || 'Um novo encontro aguarda você.';

    const date = document.createElement('span');
    date.textContent = `◷ ${formatDate(evento.data_hora)}`;

    const time = document.createElement('span');
    time.textContent = `◴ ${formatTime(evento.data_hora)}`;

    const location = document.createElement('span');
    location.textContent = `⌖ ${evento.local || 'Local a definir'}`;

    const information = document.createElement('div');
    information.className = 'event-information';
    information.append(date, time, location);

    const gamesSection = document.createElement('div');
    gamesSection.className = 'event-games';

    const gamesTitle = document.createElement('h4');
    gamesTitle.textContent = 'Jogos disponíveis';

    const gamesList = document.createElement('div');
    gamesList.className = 'event-games-list';

    const eventGames = (evento.evento_jogo || [])
        .map(item => item.jogo)
        .filter(Boolean);

    if (eventGames.length > 0) {
        eventGames.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'event-game-item';

            if (game.imagem_url) {
                const image = document.createElement('img');
                image.src = game.imagem_url;
                image.alt = `Capa de ${game.titulo}`;
                image.className = 'event-game-cover';
                image.onerror = () => image.remove();

                gameItem.appendChild(image);
            }

            const gameName = document.createElement('span');
            gameName.textContent = game.titulo;

            gameItem.appendChild(gameName);
            gamesList.appendChild(gameItem);
        });
    } else {
        const noGames = document.createElement('p');
        noGames.textContent = 'Nenhum jogo informado.';
        gamesList.appendChild(noGames);
    }

    gamesSection.append(gamesTitle, gamesList);

    const status = document.createElement('span');
    status.className = 'event-status';
    status.textContent = evento.status || 'Aberto';

    const attendanceSection = document.createElement('div');
    attendanceSection.className = 'event-attendance';

    const participantCount = document.createElement('p');
    participantCount.className = 'participant-count';
    participantCount.textContent =
        `♙ ${confirmacoes.quantidade} pessoa(s) confirmada(s)`;

    const attendanceButton = document.createElement('button');
    attendanceButton.className = 'event-button';
    attendanceButton.type = 'button';

    function updateAttendanceButton(confirmed) {
        attendanceButton.textContent = confirmed
            ? 'Cancelar presença'
            : 'Confirmar presença';

        attendanceButton.classList.toggle(
            'attendance-confirmed',
            confirmed
        );
    }

    if (!currentSession) {
        attendanceButton.textContent = 'Participar →';

        attendanceButton.addEventListener('click', () => {
            window.location.href =
                `/login.html?evento=${evento.id_evento}`;
        });
    } else {
        updateAttendanceButton(confirmacoes.usuarioConfirmou);

        attendanceButton.addEventListener('click', async () => {
            attendanceButton.disabled = true;
            attendanceButton.textContent = 'Aguarde...';

            try {
                if (confirmacoes.usuarioConfirmou) {
                    const { error } = await supabase
                        .from('confirmacao_de_presenca')
                        .delete()
                        .eq('id_usuario', currentSession.user.id)
                        .eq('id_evento', evento.id_evento);

                    if (error) throw error;

                    confirmacoes.quantidade = Math.max(
                        0,
                        confirmacoes.quantidade - 1
                    );

                    confirmacoes.usuarioConfirmou = false;
                } else {
                    const { error } = await supabase
                        .from('confirmacao_de_presenca')
                        .insert({
                            id_usuario: currentSession.user.id,
                            id_evento: evento.id_evento,
                            status: 'Vai'
                        });

                    if (error) throw error;

                    confirmacoes.quantidade += 1;
                    confirmacoes.usuarioConfirmou = true;
                }

                participantCount.textContent =
                    `♙ ${confirmacoes.quantidade} pessoa(s) confirmada(s)`;

                updateAttendanceButton(confirmacoes.usuarioConfirmou);

            } catch (error) {
                console.error('Erro ao atualizar presença:', error);

                alert(
                    'Não foi possível atualizar sua presença. Tente novamente.'
                );

                updateAttendanceButton(confirmacoes.usuarioConfirmou);

            } finally {
                attendanceButton.disabled = false;
            }
        });
    }

    attendanceSection.append(participantCount, attendanceButton);

    const detailsButton = document.createElement('a');
    detailsButton.className = 'event-button';
    detailsButton.href = `/evento-detalhe.html?id=${evento.id_evento}`;
    detailsButton.textContent = 'Ver detalhes →';

    article.append(
        title,
        description,
        information,
        gamesSection,
        status,
        attendanceSection,
        detailsButton
    );

    return article;
}

async function updateHeader(session) {
    if (!headerActions) return;

    const requestId = ++headerRequestId;

    headerActions.replaceChildren();

    if (!session) {
        const login = document.createElement('a');
        login.href = '/login.html';
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

    if (requestId !== headerRequestId) return;

    if (error) {
        console.error('Erro ao buscar perfil:', error);
    }

    const userLink = document.createElement('a');
    userLink.href = '#';
    userLink.className = 'user-greeting';
    userLink.textContent = `♙ ${profile?.apelido || 'Aventureiro'}`;

    const logout = document.createElement('button');
    logout.className = 'btn-login logout-button';
    logout.textContent = 'Sair';
    logout.type = 'button';

    logout.addEventListener('click', async () => {
        logout.disabled = true;
        logout.textContent = 'Saindo...';

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Erro ao sair:', error);
            logout.disabled = false;
            logout.textContent = 'Sair';
        }
    });

    const createEvent = document.createElement('a');
    createEvent.href = '/evento.html';
    createEvent.className = 'btn-primary';
    createEvent.textContent = 'Criar evento';

    headerActions.replaceChildren(
        createEvent,
        userLink,
        logout
    );
}

async function loadEvents() {
    if (!eventsContainer) return;

    const requestId = ++eventsRequestId;

    eventsContainer.replaceChildren();

    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                id_evento,
                titulo,
                descricao,
                data_hora,
                local,
                status,
                evento_jogo (
                    id_jogo,
                    jogo (
                        id_jogo,
                        titulo,
                        imagem_url
                    )
                )
            `)
            .order('data_hora', { ascending: true });

        if (error) throw error;
        if (requestId !== eventsRequestId) return;

        const now = new Date();

        const upcomingEvents = (data || []).filter(evento => {
            const eventStatus = (evento.status || '').toLowerCase();

            return (
                new Date(evento.data_hora) >= now &&
                eventStatus !== 'cancelado'
            );
        });

        // Evita exibir o mesmo evento mais de uma vez.
        const uniqueEvents = [
            ...new Map(
                upcomingEvents.map(evento => [
                    evento.id_evento,
                    evento
                ])
            ).values()
        ];

        eventCounter.textContent =
            `${uniqueEvents.length} evento(s)`;

        if (uniqueEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="empty-state">
                    <span>⚜</span>
                    <h3>Nenhuma aventura encontrada</h3>
                    <p>A Danverna ainda aguarda seus próximos encontros.</p>
                </div>
            `;
            return;
        }

        let eventosConfirmados = new Set();

        if (currentSession) {
            const { data: minhasConfirmacoes, error: confirmationError } =
                await supabase
                    .from('confirmacao_de_presenca')
                    .select('id_evento, status')
                    .eq('id_usuario', currentSession.user.id);

            if (confirmationError) throw confirmationError;
            if (requestId !== eventsRequestId) return;

            eventosConfirmados = new Set(
                (minhasConfirmacoes || [])
                    .filter(item => item.status === 'Vai')
                    .map(item => Number(item.id_evento))
            );
        }

        for (const evento of uniqueEvents) {
            const { data: quantidade, error: countError } =
                await supabase.rpc('contar_participantes_evento', {
                    p_id_evento: evento.id_evento
                });

            if (countError) throw countError;
            if (requestId !== eventsRequestId) return;

            const confirmacoes = {
                quantidade: Number(quantidade || 0),
                usuarioConfirmou: eventosConfirmados.has(
                    Number(evento.id_evento)
                )
            };

            const card = await createEventCard(evento, confirmacoes);

            if (requestId !== eventsRequestId) return;

            eventsContainer.appendChild(card);
        }

        const params = new URLSearchParams(window.location.search);
        const eventoId = params.get('evento');

        if (eventoId && /^\d+$/.test(eventoId)) {
            const targetEvent = document.getElementById(
                `evento-${eventoId}`
            );

            if (targetEvent) {
                targetEvent.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                targetEvent.classList.add('event-highlight');

                setTimeout(() => {
                    targetEvent.classList.remove('event-highlight');
                }, 3000);
            }

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }

    } catch (error) {
        if (requestId !== eventsRequestId) return;

        console.error('Erro ao consultar eventos:', error);

        eventsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Não foi possível consultar os eventos.</h3>
                <p>Verifique sua conexão e tente novamente.</p>
            </div>
        `;

        if (eventCounter) {
            eventCounter.textContent = 'Indisponível';
        }
    }
}

async function initialize() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao verificar sessão:', error);
    }

    currentSession = data?.session || null;

    await updateHeader(currentSession);
    await loadEvents();
}

initialize();

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        currentSession = session;

        updateHeader(session);
        loadEvents();
    }
});
