import React from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen, ClassRow, Pill, ReminderCard, SectionTitle } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { demoReminders, demoSchedule } from '../../data/mockData';
import { formatDateLong, toISODate } from '../../utils/date';

export default function HomeScreen() {
  const today = toISODate(new Date());
  const todaysClasses = demoSchedule.filter((item) => item.data === today);
  const classesToShow = todaysClasses.length ? todaysClasses : demoSchedule.slice(0, 3);
  const todaysReminders = demoReminders.filter((item) => item.data === today);
  const nextReminder = demoReminders[0];

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CIM · AGENDA ESCOLAR</Text>
          <Text style={styles.greeting}>Olá, estudante!</Text>
          <Text style={styles.date}>{formatDateLong(today)}</Text>
        </View>
        <Link href="/login" asChild>
          <Pressable style={styles.teamButton}>
            <Text style={styles.teamButtonText}>Equipe</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Pill tone="green">Turma piloto</Pill>
        <Text style={styles.heroTitle}>Sua rotina escolar, organizada.</Text>
        <Text style={styles.heroText}>Aulas, atividades e comunicados reunidos em um só lugar.</Text>
        <View style={styles.heroBottom}>
          <Text style={styles.heroFootnote}>Consulte sua programação quando precisar.</Text>
          <Text style={styles.heroMark}>CIM</Text>
        </View>
      </View>

      <View style={styles.demoNotice}>
        <Text style={styles.demoNoticeText}>Prévia do aplicativo · informações demonstrativas</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{classesToShow.length}</Text>
          <Text style={styles.statLabel}>Aulas na prévia</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todaysReminders.length + demoReminders.length}</Text>
          <Text style={styles.statLabel}>Avisos de exemplo</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Programação" action="Ver calendário" />
        <View style={styles.whiteCard}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={styles.cardHeadingTitle}>{todaysClasses.length ? 'Aulas de hoje' : 'Exemplo de aulas'}</Text>
              <Text style={styles.cardHeadingSubtitle}>{formatDateLong(today)}</Text>
            </View>
            <Pill tone="blue">Turma CIM</Pill>
          </View>
          {classesToShow.map((item) => <ClassRow key={item.id} item={item} />)}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Próximo lembrete" action="Ver avisos" />
        {nextReminder ? <ReminderCard item={nextReminder} compact /> : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  greeting: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.9, marginTop: 5 },
  date: { color: colors.textSecondary, fontSize: 12, marginTop: 5, textTransform: 'capitalize' },
  teamButton: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  teamButtonText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  hero: { backgroundColor: '#1D2B55', minHeight: 190, borderRadius: radius.large, padding: 20, overflow: 'hidden', justifyContent: 'space-between' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#315EF4', opacity: 0.35, right: -58, top: -70 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.5, maxWidth: 260, marginTop: 13 },
  heroText: { color: '#D9E1FF', fontSize: 13, lineHeight: 19, maxWidth: 280, marginTop: 7 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 17 },
  heroFootnote: { color: '#B9C6ED', fontSize: 10, flex: 1 },
  heroMark: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', letterSpacing: 1.4 },
  demoNotice: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.warningSoft, borderRadius: 10 },
  demoNoticeText: { color: colors.warning, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, padding: 15 },
  statNumber: { color: colors.text, fontSize: 23, fontWeight: '900' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  sectionBlock: { gap: 12 },
  whiteCard: { backgroundColor: colors.surface, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, padding: 15 },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, borderBottomColor: colors.border, borderBottomWidth: 1 },
  cardHeadingTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  cardHeadingSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
});
