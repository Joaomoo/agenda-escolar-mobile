import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

function ensureDatabase() {
  if (!db) {
    throw new Error('Firestore não configurado. Preencha as variáveis Firebase no arquivo .env.');
  }
}

function mapReminder(document) {
  return { id: document.id, ...document.data() };
}

export async function getRemindersByDate(date) {
  ensureDatabase();
  const remindersQuery = query(collection(db, 'lembretes'), where('data', '==', date));
  const snapshot = await getDocs(remindersQuery);
  return snapshot.docs.map(mapReminder);
}

export function subscribeToReminders(onChange, onError) {
  ensureDatabase();
  const remindersQuery = query(collection(db, 'lembretes'));

  return onSnapshot(
    remindersQuery,
    (snapshot) => {
      const reminders = snapshot.docs
        .map(mapReminder)
        .sort((first, second) => (first.data || '').localeCompare(second.data || ''));
      onChange(reminders);
    },
    onError,
  );
}

export async function createReminder(reminderData) {
  ensureDatabase();
  return addDoc(collection(db, 'lembretes'), {
    ...reminderData,
    criadoEm: new Date().toISOString(),
  });
}

export async function updateReminder(reminderId, changes) {
  ensureDatabase();
  return updateDoc(doc(db, 'lembretes', reminderId), {
    ...changes,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function deleteReminder(reminderId) {
  ensureDatabase();
  return deleteDoc(doc(db, 'lembretes', reminderId));
}
