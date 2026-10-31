import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { convert } from 'react-native-pdf-to-image';
import { isSupported, recognizeText } from 'expo-mlkit-ocr';
import { AppScreen, Pill, PrimaryButton } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { getCurrentStaffProfile } from '../../services/authService';
import { publishWeeklyProgram } from '../../services/programImportService';
import {
  addLocalDays,
  formatLocalIsoDate,
  isValidClock,
  parseBrazilianMondayDate,
  parseCimTimetable,
} from '../../utils/cimTimetableParser';

const MAX_PDF_BYTES = 15 * 1024 * 1024;

function Button({ title, onPress, disabled, secondary = false, loading = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, (disabled || loading) && styles.disabledButton, pressed && !disabled && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.primary : '#FFFFFF'} /> : <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>}
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', style, editable = true }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        editable={editable}
        style={[styles.input, !editable && styles.inputDisabled, style]}
      />
    </View>
  );
}

function updateCell(schedule, dayIndex, period, patch) {
  return {
    ...schedule,
    days: schedule.days.map((day) => day.index !== dayIndex ? day : {
      ...day,
      classes: day.classes.map((item) => item.period !== period ? item : { ...item, ...patch }),
    }),
  };
}

function getWeekdayDate(startDate, dayIndex) {
  return formatLocalIsoDate(addLocalDays(startDate, dayIndex));
}

export default function ImportProgramScreen() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [pdf, setPdf] = useState(null);
  const [mondayInput, setMondayInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentStaffProfile()
      .then((result) => {
        if (!active) return;
        if (!result || result.profile?.perfil !== 'ADMIN') {
          router.replace('/painel');
          return;
        }
        setAccount(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || 'Não foi possível validar o acesso administrativo.');
      })
      .finally(() => {
        if (active) setAccessLoading(false);
      });
    return () => { active = false; };
  }, [router]);

  const validation = useMemo(() => {
    if (!parsed) return { ready: false, pending: 0, missingTimes: 0, dateError: 'Informe a segunda-feira da semana.' };
    let pending = 0;
    parsed.days.forEach((day) => day.classes.forEach((item) => {
      if (item.tipo === 'REVISAO' || (item.tipo === 'AULA' && !item.materia.trim())) pending += 1;
    }));
    const missingTimes = parsed.periods.filter((period) => !isValidClock(period.horarioInicial) || !isValidClock(period.horarioFinal)).length;
    let dateError = '';
    try { parseBrazilianMondayDate(mondayInput); } catch (dateErrorObject) { dateError = dateErrorObject.message; }
    return { ready: pending === 0 && missingTimes === 0 && !dateError, pending, missingTimes, dateError };
  }, [parsed, mondayInput]);

  async function handlePickPdf() {
    setError('');
    setParsed(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_PDF_BYTES) {
        throw new Error('O PDF ultrapassa o limite de 15 MB desta primeira versão.');
      }
      if (asset.mimeType && asset.mimeType !== 'application/pdf' && !asset.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Selecione um arquivo PDF.');
      }
      setPdf(asset);
    } catch (pickError) {
      setError(pickError?.message || 'Não foi possível selecionar o PDF.');
    }
  }

  async function handleAnalyze() {
    if (!pdf) {
      setError('Selecione o PDF da programação antes de analisar.');
      return;
    }
    if (!isSupported()) {
      setError('O OCR não está disponível neste dispositivo. Verifique a versão do sistema e a instalação do development build.');
      return;
    }

    setBusy(true);
    setError('');
    setParsed(null);
    setOcrText('');

    try {
      const converted = await convert(pdf.uri);
      const pages = converted?.outputFiles || [];
      if (!pages.length) throw new Error('Não foi possível converter a página do PDF em imagem.');
      if (pages.length !== 1) {
        throw new Error(`Este primeiro MVP importa uma grade semanal de uma página por vez. O PDF selecionado possui ${pages.length} páginas.`);
      }

      const imagePath = pages[0];
      const imageUri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;
      const recognition = await recognizeText(imageUri);
      setOcrText(recognition?.text || '');
      const timetable = parseCimTimetable(recognition);
      setParsed(timetable);
    } catch (analysisError) {
      setError(analysisError?.message || 'Não foi possível interpretar o cronograma.');
    } finally {
      setBusy(false);
    }
  }

  function updatePeriod(periodNumber, patch) {
    setParsed((current) => ({
      ...current,
      periods: current.periods.map((period) => period.period === periodNumber ? { ...period, ...patch } : period),
      days: current.days.map((day) => ({
        ...day,
        classes: day.classes.map((item) => item.period === periodNumber ? {
          ...item,
          ...(patch.horarioInicial !== undefined ? { horarioInicial: patch.horarioInicial } : {}),
          ...(patch.horarioFinal !== undefined ? { horarioFinal: patch.horarioFinal } : {}),
        } : item),
      })),
    }));
  }

  async function handlePublish() {
    if (!validation.ready || !parsed || !account) return;
    let weekStart;
    try {
      weekStart = parseBrazilianMondayDate(mondayInput);
    } catch (dateErrorObject) {
      setError(dateErrorObject.message);
      return;
    }

    setPublishing(true);
    setError('');
    try {
      const normalizedDays = parsed.days.map((day) => ({
        ...day,
        classes: day.classes.map((item) => {
          const period = parsed.periods.find((candidate) => candidate.period === item.period);
          return {
            ...item,
            horarioInicial: period?.horarioInicial || item.horarioInicial,
            horarioFinal: period?.horarioFinal || item.horarioFinal,
          };
        }),
      }));
      const result = await publishWeeklyProgram({
        startDate: formatLocalIsoDate(weekStart),
        fileName: pdf.name,
        turmaNome: parsed.turmaNome,
        periods: parsed.periods,
        days: normalizedDays,
        interval: parsed.interval,
      });
      Alert.alert(
        'Programação publicada',
        `${result.aulasRegulares} aulas e ${result.aulasVagas} períodos vagos foram publicados. ${result.programacoesSubstituidas ? `${result.programacoesSubstituidas} versão(ões) anterior(es) foram substituídas.` : ''}`,
        [{ text: 'Voltar ao painel', onPress: () => router.replace('/painel') }],
      );
    } catch (publishError) {
      setError(publishError?.message || 'Não foi possível publicar a programação.');
    } finally {
      setPublishing(false);
    }
  }

  if (accessLoading) {
    return <AppScreen contentContainerStyle={styles.centered}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Validando perfil administrativo...</Text></AppScreen>;
  }

  if (!account) {
    return <AppScreen contentContainerStyle={styles.centered}><Text style={styles.title}>Acesso administrativo necessário</Text><Text style={styles.muted}>{error || 'Entre com uma conta ADMIN para importar a programação.'}</Text><Link href="/painel" style={styles.backLink}>Voltar ao painel</Link></AppScreen>;
  }

  return (
    <AppScreen contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Link href="/painel" style={styles.backLink}>‹  Painel da equipe</Link>
        <Pill tone="blue">ADMIN</Pill>
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>PROGRAMAÇÃO ESCOLAR</Text>
        <Text style={styles.title}>Importar PDF</Text>
        <Text style={styles.subtitle}>Selecione a grade semanal, informe a segunda-feira de referência, revise o OCR e publique as aulas da turma piloto.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Processamento local</Text>
        <Text style={styles.infoText}>O PDF é convertido e interpretado no próprio aparelho. O arquivo original não é enviado para armazenamento em nuvem; somente as aulas revisadas serão gravadas no Firestore.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Selecionar programação</Text>
        <Text style={styles.help}>Nesta primeira versão, cada PDF deve conter uma única página com uma grade semanal.</Text>
        <Button title={pdf ? 'Selecionar outro PDF' : 'Escolher PDF da escola'} onPress={handlePickPdf} secondary />
        {pdf ? (
          <View style={styles.fileRow}>
            <Text style={styles.fileIcon}>PDF</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>{pdf.name}</Text>
              <Text style={styles.muted}>{pdf.size ? `${(pdf.size / 1024).toFixed(0)} KB` : 'Arquivo selecionado'}</Text>
            </View>
            <Pill tone="green">Selecionado</Pill>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Data de referência</Text>
        <Text style={styles.help}>Informe a segunda-feira da semana representada no PDF. As aulas serão distribuídas de segunda a sexta-feira.</Text>
        <Field label="Segunda-feira (DD/MM/AAAA)" value={mondayInput} onChangeText={setMondayInput} placeholder="Ex.: 03/11/2025" keyboardType="numeric" />
        <Button title="Analisar PDF e reconhecer aulas" onPress={handleAnalyze} disabled={!pdf} loading={busy} />
      </View>

      {busy ? (
        <View style={styles.progressCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.progressTitle}>Analisando programação...</Text>
          <Text style={styles.help}>Convertendo a página em imagem e reconhecendo textos localmente. Isso pode levar alguns instantes.</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Não foi possível continuar</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {parsed ? (
        <>
          <View style={styles.resultHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>3. Conferir programação</Text>
              <Text style={styles.help}>{parsed.turmaNome || 'Turma piloto'} · {parsed.periods.length} períodos por dia</Text>
            </View>
            <Pill tone={validation.ready ? 'green' : 'amber'}>{validation.ready ? 'Pronta' : 'Revisar'}</Pill>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Horários dos períodos</Text>
            {parsed.periods.map((period) => (
              <View key={period.period} style={styles.periodTimeRow}>
                <Text style={styles.periodNumber}>{period.period}ª</Text>
                <TextInput
                  value={period.horarioInicial}
                  onChangeText={(value) => updatePeriod(period.period, { horarioInicial: value })}
                  placeholder="07:10"
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                />
                <Text style={styles.timeSeparator}>até</Text>
                <TextInput
                  value={period.horarioFinal}
                  onChangeText={(value) => updatePeriod(period.period, { horarioFinal: value })}
                  placeholder="07:55"
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                />
                {!isValidClock(period.horarioInicial) || !isValidClock(period.horarioFinal) ? <Text style={styles.warningMark}>!</Text> : null}
              </View>
            ))}
            {parsed.interval ? (
              <View style={styles.intervalRow}>
                <Text style={styles.intervalTitle}>Intervalo / {parsed.interval.label}</Text>
                <Text style={styles.muted}>{parsed.interval.horarioInicial || 'Horário não reconhecido'} – {parsed.interval.horarioFinal || 'Horário não reconhecido'}</Text>
              </View>
            ) : null}
          </View>

          {parsed.days.map((day) => (
            <View key={day.key} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.label}</Text>
                <Text style={styles.dayDate}>{mondayInput ? (() => { try { const monday = parseBrazilianMondayDate(mondayInput); return getWeekdayDate(monday, day.index).split('-').reverse().join('/'); } catch { return 'Data pendente'; } })() : 'Data pendente'}</Text>
              </View>
              {day.classes.map((item) => {
                const isVacant = item.tipo === 'AULA_VAGA';
                const isReview = item.tipo === 'REVISAO';
                const period = parsed.periods.find((candidate) => candidate.period === item.period);
                return (
                  <View key={`${day.key}-${item.period}`} style={[styles.classEditor, isReview && styles.reviewEditor, isVacant && styles.vacantEditor]}>
                    <View style={styles.classTopLine}>
                      <Text style={styles.classPeriod}>{item.period}ª aula</Text>
                      <Text style={styles.classTime}>{period?.horarioInicial || '--:--'} – {period?.horarioFinal || '--:--'}</Text>
                      <Pill tone={isVacant ? 'green' : isReview ? 'amber' : 'blue'}>{isVacant ? 'Aula vaga' : isReview ? 'Revisar' : 'Aula'}</Pill>
                    </View>
                    {isVacant ? (
                      <Button title="Restaurar como aula" secondary onPress={() => setParsed((current) => updateCell(current, day.index, item.period, { tipo: 'REVISAO', materia: '', professor: '' }))} />
                    ) : (
                      <>
                        <TextInput
                          value={item.materia}
                          onChangeText={(value) => setParsed((current) => updateCell(current, day.index, item.period, { materia: value, tipo: value.trim() ? 'AULA' : 'REVISAO' }))}
                          placeholder="Matéria identificada"
                          style={styles.cellInput}
                        />
                        <TextInput
                          value={item.professor}
                          onChangeText={(value) => setParsed((current) => updateCell(current, day.index, item.period, { professor: value }))}
                          placeholder="Professor (opcional)"
                          style={styles.cellInput}
                        />
                        <Pressable onPress={() => setParsed((current) => updateCell(current, day.index, item.period, { tipo: 'AULA_VAGA', materia: 'Aula vaga', professor: '' }))} style={styles.markVacantButton}>
                          <Text style={styles.markVacantText}>Marcar como aula vaga</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.validationCard}>
            <Text style={styles.validationTitle}>Validação antes da publicação</Text>
            <Text style={styles.validationText}>{validation.pending} período(s) precisam de matéria ou confirmação.</Text>
            <Text style={styles.validationText}>{validation.missingTimes} horário(s) precisam ser corrigidos.</Text>
            {validation.dateError ? <Text style={styles.validationError}>{validation.dateError}</Text> : null}
          </View>
          <Button title="Publicar programação da semana" onPress={handlePublish} disabled={!validation.ready} loading={publishing} />
        </>
      ) : null}

      {ocrText && !parsed ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Texto reconhecido (diagnóstico)</Text>
          <Text style={styles.ocrText}>{ocrText.slice(0, 1600)}</Text>
        </View>
      ) : null}

      <Text style={styles.footer}>A publicação substitui uma versão anterior da mesma semana, mantendo o registro da versão substituída.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8, gap: 16 },
  centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backLink: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  header: { gap: 5 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  infoCard: { backgroundColor: colors.primarySoft, borderRadius: radius.medium, padding: 15, gap: 5 },
  infoTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  infoText: { color: colors.primaryDark, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: 15, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  help: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  muted: { color: colors.textSecondary, fontSize: 12 },
  button: { minHeight: 48, paddingHorizontal: 15, paddingVertical: 13, borderRadius: radius.medium, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 13, backgroundColor: colors.surfaceMuted },
  fileIcon: { color: '#FFFFFF', backgroundColor: '#D64D56', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, fontSize: 10, fontWeight: '900' },
  fileInfo: { flex: 1, gap: 3 },
  fileName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  input: { minHeight: 47, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text, fontSize: 14, backgroundColor: colors.surfaceMuted },
  inputDisabled: { opacity: 0.6 },
  progressCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: 20, alignItems: 'center', gap: 10 },
  progressTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  errorCard: { backgroundColor: colors.dangerSoft, borderRadius: radius.medium, padding: 14, gap: 5 },
  errorTitle: { color: colors.danger, fontSize: 13, fontWeight: '900' },
  errorText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  periodNumber: { width: 25, color: colors.text, fontWeight: '900', fontSize: 12 },
  timeInput: { width: 84, height: 40, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted, textAlign: 'center', fontSize: 12 },
  timeSeparator: { color: colors.textSecondary, fontSize: 11 },
  warningMark: { color: colors.danger, fontWeight: '900' },
  intervalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 },
  intervalTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  dayCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: 13, gap: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  dayDate: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  classEditor: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 8 },
  reviewEditor: { borderLeftWidth: 3, borderLeftColor: colors.warning, paddingLeft: 9 },
  vacantEditor: { borderLeftWidth: 3, borderLeftColor: colors.success, paddingLeft: 9 },
  classTopLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  classPeriod: { color: colors.text, fontSize: 12, fontWeight: '900' },
  classTime: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  cellInput: { minHeight: 39, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 10, color: colors.text, backgroundColor: colors.surfaceMuted, fontSize: 12 },
  markVacantButton: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 3 },
  markVacantText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  validationCard: { backgroundColor: colors.primarySoft, borderRadius: radius.medium, padding: 14, gap: 5 },
  validationTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  validationText: { color: colors.primaryDark, fontSize: 12 },
  validationError: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  ocrText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  footer: { color: colors.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: 8 },
});
