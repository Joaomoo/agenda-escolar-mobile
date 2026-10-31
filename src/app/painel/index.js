import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppScreen, Pill } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { getAuthErrorMessage, getCurrentStaffProfile, signOutUser } from '../../services/authService';

function DashboardAction({ number, title, description, status = 'Próxima etapa', onPress }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.actionRow, pressed && onPress ? styles.actionPressed : null]}>
      <View style={styles.actionNumber}>
        <Text style={styles.actionNumberText}>{number}</Text>
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Pill tone={onPress ? 'blue' : 'gray'}>{status}</Pill>
    </Pressable>
  );
}

export default function TeamPanelScreen() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const result = await getCurrentStaffProfile();
        if (!active) return;
        if (!result) {
          router.replace('/login');
          return;
        }
        setAccount(result);
      } catch (error) {
        console.warn('[Agenda CIM] Acesso ao painel negado:', error);
        try { await signOutUser(); } catch (signOutError) {
          console.warn('[Agenda CIM] Falha ao encerrar sessão inválida:', signOutError);
        }
        if (active) setAccessError(getAuthErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Não foi possível sair', getAuthErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <AppScreen contentContainerStyle={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Validando acesso da equipe...</Text></AppScreen>;
  }

  if (accessError || !account) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <View style={styles.errorIcon}><Text style={styles.errorIconText}>!</Text></View>
        <Text style={styles.errorTitle}>Acesso não autorizado</Text>
        <Text style={styles.errorText}>{accessError || 'Entre com uma conta de professor ou administrador.'}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}><Text style={styles.primaryButtonText}>Voltar para o login</Text></Pressable>
        <Link href="/(tabs)" style={styles.publicLink}>Voltar à agenda pública</Link>
      </AppScreen>
    );
  }

  const { user, profile } = account;
  const isAdmin = profile.perfil === 'ADMIN';
  const roleLabel = isAdmin ? 'ADMINISTRADOR' : 'PROFESSOR';
  const displayName = profile.nome || user.email?.split('@')[0] || 'Usuário';

  return (
    <AppScreen contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Link href="/(tabs)" asChild><Pressable><Text style={styles.back}>‹  Agenda pública</Text></Pressable></Link>
        <Pressable onPress={handleSignOut} disabled={signingOut} style={styles.logoutButton}>
          {signingOut ? <ActivityIndicator color={colors.danger} size="small" /> : <Text style={styles.logoutText}>Sair</Text>}
        </Pressable>
      </View>

      <View style={styles.welcomeBlock}>
        <Pill tone={isAdmin ? 'blue' : 'green'}>{roleLabel}</Pill>
        <Text style={styles.title}>Olá, {displayName}!</Text>
        <Text style={styles.subtitle}>Este é o espaço de trabalho da equipe do Agenda Escolar CIM.</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryOrb} />
        <Text style={styles.summaryEyebrow}>TURMA PILOTO</Text>
        <Text style={styles.summaryTitle}>Colégio Interação Modelo</Text>
        <Text style={styles.summaryText}>CIM · Programação e comunicados escolares</Text>
        <View style={styles.summaryFooter}><Pill tone="green">Conta validada</Pill><Text style={styles.summaryMark}>CIM</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações da equipe</Text>
        {isAdmin ? (
          <View style={styles.actionsCard}>
            <DashboardAction number="01" title="Importar programação" description="Enviar o PDF semanal, revisar as aulas reconhecidas e publicar para a turma." status="Abrir" onPress={() => router.push('/painel/importar')} />
            <View style={styles.separator} />
            <DashboardAction number="02" title="Programações publicadas" description="Consultar versões e acompanhar as programações da turma." />
            <View style={styles.separator} />
            <DashboardAction number="03" title="Gerenciar equipe" description="Organizar os acessos de professores e administradores." />
          </View>
        ) : (
          <View style={styles.actionsCard}>
            <DashboardAction number="01" title="Criar lembrete" description="Selecionar uma data e publicar um aviso para os alunos." />
            <View style={styles.separator} />
            <DashboardAction number="02" title="Meus lembretes" description="Consultar e editar os comunicados cadastrados por você." />
          </View>
        )}
      </View>

      <View style={styles.nextStepCard}>
        <Text style={styles.nextStepTitle}>Importação local com OCR</Text>
        <Text style={styles.nextStepText}>A leitura do PDF acontece no aparelho. O administrador revisa a tabela antes de gravar as aulas no Firestore.</Text>
      </View>
      <Text style={styles.footerNote}>Acesso restrito · As permissões são verificadas pelo Firebase.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 8 },
  centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 13, marginTop: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  logoutButton: { minWidth: 52, minHeight: 38, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.dangerSoft },
  logoutText: { color: colors.danger, fontSize: 12, fontWeight: '900' },
  welcomeBlock: { gap: 7, marginTop: 12 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.9 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  email: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
  summaryCard: { backgroundColor: '#1D2B55', minHeight: 158, borderRadius: radius.large, padding: 18, overflow: 'hidden', justifyContent: 'space-between' },
  summaryOrb: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: '#315EF4', opacity: 0.35, right: -48, top: -72 },
  summaryEyebrow: { color: '#B9C6ED', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  summaryTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 12 },
  summaryText: { color: '#D9E1FF', fontSize: 12, marginTop: 5 },
  summaryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  summaryMark: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', letterSpacing: 1.2 },
  section: { gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  actionsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, paddingHorizontal: 15 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 16 },
  actionPressed: { opacity: 0.72 },
  actionNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionNumberText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  actionContent: { flex: 1, gap: 4 },
  actionTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  actionDescription: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  separator: { height: 1, backgroundColor: colors.border },
  nextStepCard: { backgroundColor: colors.primarySoft, padding: 15, borderRadius: radius.medium, gap: 5 },
  nextStepTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  nextStepText: { color: colors.primaryDark, fontSize: 12, lineHeight: 18 },
  footerNote: { textAlign: 'center', color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  errorIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft, marginBottom: 12 },
  errorIconText: { color: colors.danger, fontSize: 24, fontWeight: '900' },
  errorTitle: { color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  errorText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  primaryButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.medium },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  publicLink: { color: colors.primary, marginTop: 16, fontSize: 12, fontWeight: '800' },
});
