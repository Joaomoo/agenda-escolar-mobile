import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen, Pill, ReminderCard, SectionTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import { demoReminders } from '../../data/mockData';
import { formatDateShort } from '../../utils/date';

export default function NoticesScreen() {
  const sortedReminders = [...demoReminders].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>COMUNICAÇÃO DA TURMA</Text>
        <Text style={styles.title}>Avisos</Text>
        <Text style={styles.subtitle}>Comunicados e lembretes publicados pela equipe escolar.</Text>
      </View>

      <View style={styles.highlight}>
        <View style={styles.highlightIcon}><Text style={styles.bell}>◉</Text></View>
        <View style={styles.highlightTextBlock}>
          <Text style={styles.highlightTitle}>Fique por dentro</Text>
          <Text style={styles.highlightText}>Os novos lembretes aparecerão nesta central e também poderão chegar como notificações no celular.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Comunicados" />
        <View style={styles.demoLabel}><Pill tone="amber">Demonstração</Pill><Text style={styles.demoText}>Conteúdo fictício para montar as telas.</Text></View>
        {sortedReminders.map((item) => (
          <View key={item.id} style={styles.noticeWrapper}>
            <Text style={styles.dateLabel}>{formatDateShort(item.data)}</Text>
            <ReminderCard item={item} />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 5 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  highlight: { flexDirection: 'row', backgroundColor: colors.primarySoft, padding: 15, borderRadius: 16, gap: 12, alignItems: 'center' },
  highlightIcon: { width: 42, height: 42, backgroundColor: '#FFFFFF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bell: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  highlightTextBlock: { flex: 1, gap: 4 },
  highlightTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  highlightText: { color: '#53648F', fontSize: 11, lineHeight: 16 },
  section: { gap: 13 },
  demoLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  demoText: { color: colors.textSecondary, fontSize: 10 },
  noticeWrapper: { gap: 7 },
  dateLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
});
