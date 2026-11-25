
import { supabase } from './supabase.js';

const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const message = document.getElementById('auth-message');

// Exibir mensagens
function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
}

// Controlar carregamento do botão
function setLoading(form, loading, text) {
    const button = form.querySelector('button[type="submit"]');

    if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.textContent = text;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText;
    }
}



// =========================================
// CADASTRO
// =========================================

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const apelido = document.getElementById('apelido').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        if (senha.length < 8) {
            showMessage('A senha precisa ter pelo menos 8 caracteres.', true);
            return;
        }

        if (senha !== confirmarSenha) {
            showMessage('As senhas não correspondem.', true);
            return;
        }

        setLoading(registerForm, true, 'Criando sua conta...');

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {
                        nome,
                        apelido
                    },
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;

            if (data.session) {
                showMessage('Conta criada! Bem-vindo à taverna.');

                setTimeout(() => {
                    window.location.replace('/');
                }, 1200);

            } else {
                showMessage(
                    'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
                );

                registerForm.reset();
            }

        } catch (error) {
            console.error('Erro no cadastro:', error);
            showMessage(error.message || 'Não foi possível criar sua conta.', true);

        } finally {
            setLoading(registerForm, false);
        }
    });
}


// =========================================
// LOGIN
// =========================================

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const senha = document.getElementById('senha').value;

        setLoading(loginForm, true, 'Entrando...');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: senha
            });

            if (error) throw error;

            showMessage('Acesso autorizado! Bem-vindo de volta.');

setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('evento');

    if (eventoId && /^\d+$/.test(eventoId)) {
        window.location.replace(`/?evento=${eventoId}`);
    } else {
        window.location.replace('/');
    }
}, 800);

        } catch (error) {
            console.error('Erro no login:', error);
            showMessage('E-mail ou senha inválidos. Tente novamente.', true);

        } finally {
            setLoading(loginForm, false);
        }
    });
}
