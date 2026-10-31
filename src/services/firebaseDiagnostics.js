import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

function describeError(error) {
  if (error?.code === 'permission-denied') {
    return 'A conexão chegou ao Firestore, mas as regras bloquearam esta leitura. Confira as regras e os filtros da consulta.';
  }
  if (error?.code === 'unavailable') {
    return 'Firestore indisponível no momento. Verifique a internet e tente novamente.';
  }
  return error?.message || 'Erro desconhecido durante o teste.';
}

async function runCheck(label, operation) {
  try {
    const detail = await operation();
    return { label, ok: true, detail };
  } catch (error) {
    return { label, ok: false, detail: describeError(error) };
  }
}

/**
 * Testa somente leituras. Não cria, altera ou exclui dados no Firestore.
 * As consultas incluem os mesmos filtros exigidos pelas regras públicas.
 */
export async function runFirestoreConnectionChecks() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não inicializado. Confira o arquivo .env e reinicie o Expo com npx expo start -c.');
  }

  const checks = [];

  checks.push(await runCheck('Ler turma piloto', async () => {
    const snapshot = await getDoc(doc(db, 'turmas', 'cim-turma-piloto'));
    if (!snapshot.exists()) {
      throw new Error('O documento turmas/cim-turma-piloto não foi encontrado. Confira o ID no Firestore.');
    }
    const turma = snapshot.data();
    if (turma.ativo !== true) {
      throw new Error('O documento da turma existe, mas o campo ativo não está definido como true.');
    }
    return `Leitura permitida: ${turma.nome || 'Turma sem nome'}.`;
  }));

  checks.push(await runCheck('Consultar aulas publicadas', async () => {
    const ref = query(
      collection(db, 'aulas'),
      where('publicado', '==', true),
      limit(1),
    );
    const snapshot = await getDocs(ref);
    return `Consulta permitida: ${snapshot.size} registro(s) encontrado(s).`;
  }));

  checks.push(await runCheck('Consultar lembretes publicados', async () => {
    const ref = query(
      collection(db, 'lembretes'),
      where('publicado', '==', true),
      limit(1),
    );
    const snapshot = await getDocs(ref);
    return `Consulta permitida: ${snapshot.size} registro(s) encontrado(s).`;
  }));

  checks.push(await runCheck('Consultar programações publicadas', async () => {
    const ref = query(
      collection(db, 'programacoes'),
      where('status', '==', 'PUBLICADA'),
      limit(1),
    );
    const snapshot = await getDocs(ref);
    return `Consulta permitida: ${snapshot.size} registro(s) encontrado(s).`;
  }));

  return checks;
}
