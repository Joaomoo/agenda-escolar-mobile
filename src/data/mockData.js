import { addDays, toISODate } from '../utils/date';

// Dados fictícios apenas para demonstrar a interface. Substituir pelo Firestore.
const today = new Date();

export const demoSchedule = [
  {
    id: 'demo-class-1',
    data: toISODate(today),
    period: 1,
    start: '07:10',
    end: '07:55',
    subject: 'Matemática',
    teacher: 'Prof. Flávio',
    type: 'AULA',
  },
  {
    id: 'demo-class-2',
    data: toISODate(today),
    period: 2,
    start: '07:55',
    end: '08:40',
    subject: 'Português',
    teacher: 'Profª Jurema',
    type: 'AULA',
  },
  {
    id: 'demo-class-3',
    data: toISODate(today),
    period: 3,
    start: '08:40',
    end: '09:25',
    subject: 'Biologia',
    teacher: 'Profª Tesser',
    type: 'AULA',
  },
  {
    id: 'demo-class-4',
    data: toISODate(addDays(today, 1)),
    period: 1,
    start: '07:10',
    end: '07:55',
    subject: 'História',
    teacher: 'Prof. Altair',
    type: 'AULA',
  },
  {
    id: 'demo-class-5',
    data: toISODate(addDays(today, 1)),
    period: 2,
    start: '07:55',
    end: '08:40',
    subject: 'Inglês',
    teacher: 'Profª Fabíola',
    type: 'AULA',
  },
];

export const demoReminders = [
  {
    id: 'demo-reminder-1',
    data: toISODate(addDays(today, 3)),
    time: '09:00',
    title: 'Seminário: mudanças climáticas',
    description: 'Preparar apresentação em grupo sobre causas, consequências e possíveis soluções.',
    subject: 'Geografia',
    category: 'Apresentação',
    author: 'Professor de Geografia',
  },
  {
    id: 'demo-reminder-2',
    data: toISODate(addDays(today, 5)),
    time: '07:10',
    title: 'Avaliação de Matemática',
    description: 'Revisar os conteúdos trabalhados em sala.',
    subject: 'Matemática',
    category: 'Prova',
    author: 'Professor de Matemática',
  },
];
