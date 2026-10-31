import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

function ensureDatabase() {
  if (!db) {
    throw new Error('Firestore não configurado. Preencha as variáveis Firebase no arquivo .env.');
  }
}

function mapClass(document) {
  const data = document.data();
  return {
    id: document.id,
    ...data,
    start: data.horarioInicial || data.start || '',
    end: data.horarioFinal || data.end || '',
    subject: data.materia || data.subject || '',
    teacher: data.professor || data.teacher || '',
    period: data.periodo ?? data.period ?? '',
    type: data.tipo || data.type || 'AULA',
  };
}

// As regras públicas exigem que a consulta inclua publicado == true.
export async function getClassesByDate(date) {
  ensureDatabase();
  const classesQuery = query(
    collection(db, 'aulas'),
    where('publicado', '==', true),
    where('data', '==', date),
  );
  const snapshot = await getDocs(classesQuery);
  return snapshot.docs
    .map(mapClass)
    .sort((first, second) => Number(first.period) - Number(second.period));
}

export function subscribeToClassesByDate(date, onChange, onError) {
  ensureDatabase();
  const classesQuery = query(
    collection(db, 'aulas'),
    where('publicado', '==', true),
    where('data', '==', date),
  );
  return onSnapshot(
    classesQuery,
    (snapshot) => {
      const classes = snapshot.docs
        .map(mapClass)
        .sort((first, second) => Number(first.period) - Number(second.period));
      onChange(classes);
    },
    onError,
  );
}
