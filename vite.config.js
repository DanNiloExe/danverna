
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        cadastro: resolve(import.meta.dirname, 'cadastro.html'),
        evento: resolve(import.meta.dirname, 'evento.html'),
        eventoDetalhe: resolve(import.meta.dirname, 'evento-detalhe.html'),
        jogos: resolve(import.meta.dirname, 'jogos.html')
    }
});
