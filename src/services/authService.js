import * as FirebaseAuth from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

function requireAuthFunction(name) {
  const candidate = FirebaseAuth[name];
  if (typeof candidate !== 'function') {
    throw new Error(
      `A função ${name} não foi encontrada no módulo firebase/auth. ` +
      `Verifique a versão instalada do Firebase e reinicie o Metro.`,
    );
  }
  return candidate;
}

function validateStaffProfile(profile) {
  if (!profile) {
    throw new Error('Esta conta foi autenticada, mas não possui um perfil cadastrado no sistema. Solicite ao administrador que verifique a coleção usuarios.');
  }

  if (profile.ativo !== true) {
    throw new Error('Esta conta está desativada. Procure a administração da escola.');
  }

  if (!['ADMIN', 'PROFESSOR'].includes(profile.perfil)) {
    throw new Error('Esta conta não possui perfil autorizado para acessar a área da equipe.');
  }

  return profile;
}

/** Autentica e valida o perfil no Firestore antes de liberar a área da equipe. */
export async function signInAndLoadProfile(email, password) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase não configurado. Confira o arquivo .env e reinicie o Expo.');
  }

  let credential = null;
  let stage = 'autenticação com email e senha';

  try {
    const signInMethod = requireAuthFunction('signInWithEmailAndPassword');
    credential = await signInMethod(auth, email.trim(), password);

    stage = 'leitura do perfil no Firestore';
    const profileSnapshot = await getDoc(doc(db, 'usuarios', credential.user.uid));

    stage = 'validação do perfil';
    const profile = validateStaffProfile(profileSnapshot.exists() ? profileSnapshot.data() : null);

    return { user: credential.user, profile };
  } catch (error) {
    // Não deixa uma sessão autenticada caso o perfil não tenha permissão.
    if (credential?.user && typeof FirebaseAuth.signOut === 'function') {
      try {
        await FirebaseAuth.signOut(auth);
      } catch (signOutError) {
        console.warn('[Agenda CIM] Falha ao encerrar sessão sem perfil válido:', signOutError);
      }
    }

    console.error(`[Agenda CIM] Erro na etapa ${stage}:`, error?.stack || error);
    const wrappedError = new Error(`${stage}: ${error?.message || String(error)}`);
    wrappedError.code = error?.code;
    wrappedError.originalError = error;
    throw wrappedError;
  }
}

/** Recupera e valida o perfil da sessão persistida ao abrir o painel. */
export async function getCurrentStaffProfile() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase não está configurado. Confira o arquivo .env.');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const profileSnapshot = await getDoc(doc(db, 'usuarios', currentUser.uid));
    const profile = validateStaffProfile(profileSnapshot.exists() ? profileSnapshot.data() : null);
    return { user: currentUser, profile };
  } catch (error) {
    console.error('[Agenda CIM] Não foi possível validar a sessão atual:', error?.stack || error);
    throw error;
  }
}

export async function signOutUser() {
  if (!auth) return;
  const signOutMethod = requireAuthFunction('signOut');
  await signOutMethod(auth);
}

export function getAuthErrorMessage(error) {
  const code = error?.code;
  const originalMessage = error?.message || '';

  const messages = {
    'auth/invalid-email': 'O email informado não é válido.',
    'auth/invalid-credential': 'Email ou senha incorretos. Confira os dados e tente novamente.',
    'auth/user-not-found': 'Não existe uma conta cadastrada com esse email.',
    'auth/wrong-password': 'A senha informada está incorreta.',
    'auth/user-disabled': 'Esta conta foi desativada no Firebase Authentication.',
    'auth/too-many-requests': 'Muitas tentativas de acesso. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Não foi possível conectar ao Firebase. Verifique sua internet.',
    'permission-denied': 'O Firestore bloqueou a leitura do perfil. Confira o UID do documento usuarios e as regras publicadas.',
  };

  if (messages[code]) return messages[code];
  return originalMessage || 'Não foi possível realizar a operação. Tente novamente.';
}
