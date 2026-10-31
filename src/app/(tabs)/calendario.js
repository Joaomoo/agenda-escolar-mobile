import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen, ClassRow, Pill, ReminderCard, SectionTitle } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { demoReminders, demoSchedule } from '../../data/mockData';
import { formatDateLong, formatMonth, toISODate } from '../../utils/date';

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export default function CalendarScreen() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  const calendarCells = useMemo(() => {
    const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  }, [month]);

  const dayClasses = demoSchedule.filter((item) => item.data === selectedDate);
  const dayReminders = demoReminders.filter((item) => item.data === selectedDate);
  const hasEvent = (day) => {
    const iso = toISODate(new Date(month.getFullYear(), month.getMonth(), day));
    return demoSchedule.some((item) => item.data === iso) || demoReminders.some((item) => item.data === iso);
  };

  function changeMonth(amount) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <AppScreen>
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>ORGANIZAÇÃO</Text>
        <Text style={styles.title}>Calendário</Text>
        <Text style={styles.subtitle}>Consulte aulas e compromissos por data.</Text>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}><Text style={styles.arrowText}>‹</Text></Pressable>
          <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}><Text style={styles.arrowText}>›</Text></Pressable>
        </View>
        <View style={styles.grid}>
          {WEEKDAYS.map((day, index) => (
            <View key={`${day}-${index}`} style={styles.dayCell}><Text style={styles.weekday}>{day}</Text></View>
          ))}
          {calendarCells.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
            const iso = toISODate(new Date(month.getFullYear(), month.getMonth(), day));
            const selected = iso === selectedDate;
            const today = iso === toISODate(new Date());
            return (
              <Pressable key={iso} onPress={() => setSelectedDate(iso)} style={styles.dayCell}>
                <View style={[styles.dayBubble, selected && styles.daySelected, today && !selected && styles.dayToday]}>
                  <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>{day}</Text>
                </View>
                {hasEvent(day) ? <View style={[styles.eventDot, selected && styles.eventDotSelected]} /> : <View style={styles.eventDotPlaceholder} />}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legend}><View style={styles.legendDot} /><Text style={styles.legendText}>Dia com aula ou compromisso</Text></View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Compromissos do dia" />
        <Text style={styles.selectedDate}>{formatDateLong(selectedDate)}</Text>
        {dayClasses.length > 0 ? (
          <View style={styles.listCard}>
            <View style={styles.listHeading}><Text style={styles.listHeadingText}>Aulas</Text><Pill tone="blue">{dayClasses.length} registros</Pill></View>
            {dayClasses.map((item) => <ClassRow key={item.id} item={item} />)}
          </View>
        ) : null}
        {dayReminders.map((item) => <ReminderCard key={item.id} item={item} />)}
        {dayClasses.length === 0 && dayReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>▦</Text>
            <Text style={styles.emptyTitle}>Nenhum registro demonstrativo</Text>
            <Text style={styles.emptyText}>Quando a programação real for publicada, as aulas e os avisos aparecerão aqui.</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.demoFootnote}>Calendário com dados fictícios para validação visual.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pageHeader: { gap: 5 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.textSecondary, fontSize: 13 },
  calendarCard: { backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
  monthArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.text, fontSize: 25, lineHeight: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 48, alignItems: 'center', justifyContent: 'center' },
  weekday: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  dayBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  dayNumber: { color: colors.text, fontSize: 12, fontWeight: '700' },
  dayNumberSelected: { color: '#FFFFFF' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 1 },
  eventDotSelected: { backgroundColor: '#FFFFFF' },
  eventDotPlaceholder: { width: 4, height: 4, marginTop: 1 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  legendText: { color: colors.textSecondary, fontSize: 10 },
  sectionBlock: { gap: 10 },
  selectedDate: { color: colors.textSecondary, fontSize: 12, textTransform: 'capitalize', marginTop: -5 },
  listCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, padding: 14 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  listHeadingText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, padding: 23, gap: 8 },
  emptyIcon: { color: colors.primary, fontSize: 30 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  demoFootnote: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
});
