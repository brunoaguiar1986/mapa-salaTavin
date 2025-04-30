// Senha: senai117@adm
// --------------------------------------------------------

async function hash(conteudo) {
    const encoder = new TextEncoder();
    const data = encoder.encode(conteudo);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))); // Converte para base64
}

const senhaAdm = `lyx4plFeLQqCNtkAK1tqq1P5/9HoQtgXpMN+TJVhXDQ=`;
const loginAdm = `adm`;

async function logar(login, senha) {
    const senhaHash = await hash(senha); // Agora o hash é assíncrono
    if (login === loginAdm && senhaHash === senhaAdm) {
        window.location.href = '../pages/admin.html';
        localStorage.setItem("token", "adm");
    } else {
        alert("Senha ou login incorretos!");
        loginForm.reset();
    }
}

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => { // Agora a função do event listener é assíncrona
    e.preventDefault();

    const login = document.getElementById('login').value;
    const senha = document.getElementById('senha').value;

    await logar(login, senha);
});