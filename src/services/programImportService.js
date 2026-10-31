import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

const PILOT_CLASS_ID = 'cim-turma-piloto';

function requireAdminSession() {
  if (!db || !auth?.currentUser) {
    throw new Error('Sua sessão expirou. Entre novamente com uma conta administrativa.');
  }
}

/** Publica uma grade semanal já revisada. O PDF é processado localmente e não é enviado ao Storage. */
export async function publishWeeklyProgram({ startDate, fileName, turmaNome, periods, days, interval }) {
  requireAdminSession();

  const userId = auth.currentUser.uid;
  const friday = new Date(`${startDate}T12:00:00`);
  friday.setDate(friday.getDate() + 4);
  const endDate = [friday.getFullYear(), String(friday.getMonth() + 1).padStart(2, '0'), String(friday.getDate()).padStart(2, '0')].join('-');

  const publishedProgramsQuery = query(
    collection(db, 'programacoes'),
    where('turmaId', '==', PILOT_CLASS_ID),
    where('status', '==', 'PUBLICADA'),
    where('dataInicio', '==', startDate),
  );
  const previousPrograms = await getDocs(publishedProgramsQuery);
  const batch = writeBatch(db);
  let archivedOldClassCount = 0;

  // Uma nova versão da mesma semana substitui a anterior sem apagar o histórico da programação.
  for (const previousProgram of previousPrograms.docs) {
    const oldClassesQuery = query(
      collection(db, 'aulas'),
      where('programacaoId', '==', previousProgram.id),
      where('publicado', '==', true),
    );
    const oldClasses = await getDocs(oldClassesQuery);
    oldClasses.docs.forEach((oldClass) => {
      batch.update(oldClass.ref, { publicado: false, substituidoEm: serverTimestamp() });
      archivedOldClassCount += 1;
    });
    batch.update(previousProgram.ref, {
      status: 'SUBSTITUIDA',
      substituidoEm: serverTimestamp(),
      substituidoPorUid: userId,
    });
  }

  if (archivedOldClassCount > 400) {
    throw new Error('Esta semana possui registros demais para substituição em uma única operação. Solicite suporte antes de publicar.');
  }

  const programRef = doc(collection(db, 'programacoes'));
  const totalLessons = days.reduce((total, day) => total + day.classes.filter((item) => item.tipo === 'AULA').length, 0);
  const totalVacancies = days.reduce((total, day) => total + day.classes.filter((item) => item.tipo === 'AULA_VAGA').length, 0);

  batch.set(programRef, {
    turmaId: PILOT_CLASS_ID,
    turmaNome: turmaNome || 'Turma piloto',
    tipo: 'SEMANAL',
    mesReferencia: startDate.slice(0, 7),
    dataInicio: startDate,
    dataFim: endDate,
    arquivoNome: fileName || 'cronograma.pdf',
    origem: 'OCR_LOCAL',
    status: 'PUBLICADA',
    totalAulas: totalLessons,
    totalAulasVagas: totalVacancies,
    totalPeriodos: periods.length,
    criadoPor: userId,
    criadoEm: serverTimestamp(),
    publicadoEm: serverTimestamp(),
  });

  let createdClassCount = 0;
  days.forEach((day) => {
    const date = new Date(`${startDate}T12:00:00`);
    date.setDate(date.getDate() + day.index);
    const data = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

    day.classes.forEach((item) => {
      const classRef = doc(collection(db, 'aulas'));
      batch.set(classRef, {
        programacaoId: programRef.id,
        turmaId: PILOT_CLASS_ID,
        data,
        diaSemana: day.label,
        periodo: item.period,
        horarioInicial: item.horarioInicial,
        horarioFinal: item.horarioFinal,
        materia: item.tipo === 'AULA_VAGA' ? 'Aula vaga' : item.materia.trim(),
        professor: item.professor.trim(),
        tipo: item.tipo,
        publicado: true,
        criadoPor: userId,
        criadoEm: serverTimestamp(),
      });
      createdClassCount += 1;
    });

    if (interval?.horarioInicial && interval?.horarioFinal) {
      const intervalRef = doc(collection(db, 'aulas'));
      batch.set(intervalRef, {
        programacaoId: programRef.id,
        turmaId: PILOT_CLASS_ID,
        data,
        diaSemana: day.label,
        periodo: 4.5,
        horarioInicial: interval.horarioInicial,
        horarioFinal: interval.horarioFinal,
        materia: interval.label || 'Intervalo',
        professor: '',
        tipo: 'INTERVALO',
        publicado: true,
        criadoPor: userId,
        criadoEm: serverTimestamp(),
      });
      createdClassCount += 1;
    }
  });

  const totalBatchWrites = archivedOldClassCount + previousPrograms.size + createdClassCount + 1;
  if (totalBatchWrites > 500) {
    throw new Error('A publicação excede o limite de 500 operações do Firestore. Divida a programação antes de publicar.');
  }

  await batch.commit();
  return {
    programacaoId: programRef.id,
    aulasCriadas: createdClassCount,
    aulasRegulares: totalLessons,
    aulasVagas: totalVacancies,
    programacoesSubstituidas: previousPrograms.size,
  };
}
