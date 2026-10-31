import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../constants/theme';

export function AppScreen({ children, contentContainerStyle, scroll = true }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.screenContent, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function SectionTitle({ title, action, onActionPress }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Pill({ children, tone = 'blue' }) {
  const toneStyle = {
    blue: [styles.pillBlue, styles.pillBlueText],
    green: [styles.pillGreen, styles.pillGreenText],
    amber: [styles.pillAmber, styles.pillAmberText],
    gray: [styles.pillGray, styles.pillGrayText],
  }[tone] || [styles.pillBlue, styles.pillBlueText];

  return (
    <View style={[styles.pill, toneStyle[0]]}>
      <Text style={[styles.pillText, toneStyle[1]]}>{children}</Text>
    </View>
  );
}

export function ClassRow({ item }) {
  const isVacant = item.type === 'AULA_VAGA';
  const isBreak = item.type === 'INTERVALO';
  const subject = isVacant ? 'Aula vaga' : (isBreak ? (item.subject || 'Intervalo') : item.subject);
  const detail = isVacant ? 'Sem aula neste período' : (isBreak ? 'Pausa da turma' : (item.teacher || 'Professor não informado'));

  return (
    <View style={styles.classRow}>
      <View style={styles.timeColumn}>
        <Text style={styles.classStart}>{item.start}</Text>
        <Text style={styles.classEnd}>{item.end}</Text>
      </View>
      <View style={[styles.classDivider, isVacant && styles.classDividerVacant, isBreak && styles.classDividerBreak]} />
      <View style={styles.classInfo}>
        <Text style={[styles.classSubject, (isVacant || isBreak) && styles.classSubjectMuted]}>{subject}</Text>
        <Text style={styles.classTeacher}>{detail}</Text>
      </View>
      <Text style={styles.periodText}>{isBreak ? 'Pausa' : (isVacant ? 'Livre' : `${item.period}ª`)}</Text>
    </View>
  );
}

export function ReminderCard({ item, compact = false }) {
  const categoryTone = item.category === 'Prova' ? 'amber' : 'blue';

  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderTop}>
        <Pill tone={categoryTone}>{item.category || 'Comunicado'}</Pill>
        <Text style={styles.reminderDate}>{item.time || 'Horário não informado'}</Text>
      </View>
      <Text style={styles.reminderTitle}>{item.title}</Text>
      {!compact && item.description ? (
        <Text style={styles.reminderDescription}>{item.description}</Text>
      ) : null}
      <View style={styles.reminderFooter}>
        <Text style={styles.reminderMeta}>{item.subject || 'Geral'}</Text>
        {item.author ? <Text style={styles.reminderMeta}>{item.author}</Text> : null}
      </View>
    </View>
  );
}

export function PrimaryButton({ title, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.buttonSecondary : styles.buttonPrimary,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={[styles.buttonText, secondary ? styles.buttonSecondaryText : null]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screenContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, gap: 22 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.35 },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '800' },
  pillBlue: { backgroundColor: colors.primarySoft },
  pillBlueText: { color: colors.primaryDark },
  pillGreen: { backgroundColor: colors.successSoft },
  pillGreenText: { color: colors.success },
  pillAmber: { backgroundColor: colors.warningSoft },
  pillAmberText: { color: colors.warning },
  pillGray: { backgroundColor: '#EEF0F5' },
  pillGrayText: { color: colors.textSecondary },
  classRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  timeColumn: { width: 54 },
  classStart: { color: colors.text, fontSize: 13, fontWeight: '800' },
  classEnd: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  classDivider: { width: 3, height: 38, borderRadius: 3, backgroundColor: colors.primary },
  classDividerVacant: { backgroundColor: colors.success },
  classDividerBreak: { backgroundColor: colors.warning },
  classInfo: { flex: 1 },
  classSubject: { color: colors.text, fontSize: 14, fontWeight: '800' },
  classSubjectMuted: { color: colors.textSecondary },
  classTeacher: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  periodText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  reminderCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, padding: 15, gap: 10 },
  reminderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderDate: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  reminderTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  reminderDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  reminderFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  reminderMeta: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  button: { paddingVertical: 15, paddingHorizontal: 18, borderRadius: radius.medium, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  buttonSecondaryText: { color: colors.text },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.45 },
});
