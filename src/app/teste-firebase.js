import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { AppScreen, Pill, PrimaryButton } from '../components/ui';
import { colors, radius } from '../constants/theme';
import { runFirestoreConnectionChecks } from '../services/firebaseDiagnostics';
import {
  getAuthErrorMessage,
  getAuthSdkDiagnostics,
  signInAndLoadProfile,
} from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';

function ResultRow({ item }) {
  return (
    <View style={styles.resultRow}>
      <View style={[styles.resultDot, item.ok ? styles.dotSuccess : styles.dotError]} />
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}>{item.label || item.name}</Text>
        <Text style={styles.resultDetail}>{item.detail}</Text>
      </View>
    </View>
  );
}

export default function FirebaseTestScreen() {
  const [checks, setChecks] = useState([]);
  const [checking, setChecking] = useState(false);
  const [sdkChecks, setSdkChecks] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authResult, setAuthResult] = useState(null);

  async function handlePublicChecks() {
    setChecking(true);
    setChecks([]);
    try {
      const result = await runFirestoreConnectionChecks();
      setChecks(result);
    } catch (error) {
      setChecks([{ label: 'Inicialização do Firebase', ok: false, detail: getAuthErrorMessage(error) }]);
    } finally {
      setChecking(false);
    }
  }

  function handleSdkCheck() {
    setSdkChecks(getAuthSdkDiagnostics());
  }

  async function handleAdminCheck() {
    if (!email.trim() || !password) {
      setAuthResult({ ok: false, detail: 'Informe o email e a senha do administrador.' });
      return;
    }

    setAuthLoading(true);
    setAuthResult(null);
    try {
      const { profile } = await signInAndLoadProfile(email, password);
      setAuthResult({
        ok: true,
        detail: `Login e leitura do perfil confirmados. Perfil: ${profile.perfil}. Nome: ${profile.nome || 'Não informado'}.`,
      });
      setPassword('');
    } catch (error) {
      setAuthResult({ ok: false, detail: getAuthErrorMessage(error) });
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.container}>
      <Link href="/login" asChild>
        <Pressable><Text style={styles.back}>‹  Voltar ao login</Text></Pressable>
      </Link>

      <Pill tone={isFirebaseConfigured ? 'green' : 'amber'}>
        {isFirebaseConfigured ? 'Variáveis Firebase encontradas' : 'Firebase não configurado'}
      </Pill>
      <Text style={styles.title}>Diagnóstico Firebase</Text>
      <Text style={styles.subtitle}>
        Testes de leitura e autenticação para validar a conexão do Agenda Escolar CIM. Esta tela não cria nem exclui dados.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Conexão com o Firestore</Text>
        <Text style={styles.cardDescription}>
          Testa a leitura da turma e as consultas públicas previstas nas regras de segurança.
        </Text>
        <PrimaryButton
          title={checking ? 'Testando conexão...' : 'Testar leitura do Firestore'}
          onPress={handlePublicChecks}
          disabled={checking || !isFirebaseConfigured}
        />
        {checking ? <ActivityIndicator color={colors.primary} /> : null}
        {checks.map((item) => <ResultRow key={item.label} item={item} />)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Diagnóstico do SDK Authentication</Text>
        <Text style={styles.cardDescription}>
          Verifica se as funções necessárias do pacote firebase/auth estão disponíveis nesta instalação. Não exige email nem senha.
        </Text>
        <PrimaryButton title="Verificar funções do SDK Auth" onPress={handleSdkCheck} />
        {sdkChecks.map((item) => <ResultRow key={item.name} item={item} />)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Login do administrador</Text>
        <Text style={styles.cardDescription}>
          Use a conta criada no Firebase Authentication. A senha é usada somente nesta tentativa e não é armazenada por esta tela.
        </Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email do administrador"
          placeholderTextColor="#98A2B3"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha do administrador"
          placeholderTextColor="#98A2B3"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <PrimaryButton
          title={authLoading ? 'Validando...' : 'Testar login e perfil'}
          onPress={handleAdminCheck}
          disabled={authLoading || !isFirebaseConfigured}
        />
        {authLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {authResult ? (
          <View style={[styles.authResult, authResult.ok ? styles.authSuccess : styles.authError]}>
            <Text style={[styles.authResultTitle, authResult.ok ? styles.successText : styles.errorText]}>
              {authResult.ok ? 'Autenticação confirmada' : 'Não foi possível validar'}
            </Text>
            <Text style={styles.resultDetail}>{authResult.detail}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.footnote}>
        Depois de concluir os testes, removeremos esta rota de diagnóstico antes da versão de entrega.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  back: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: -12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: 17, gap: 12 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  cardDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  resultDot: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
  dotSuccess: { backgroundColor: colors.success },
  dotError: { backgroundColor: colors.danger },
  resultBody: { flex: 1, gap: 3 },
  resultTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  resultDetail: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: -6 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, color: colors.text, fontSize: 13, backgroundColor: '#FBFCFE' },
  authResult: { padding: 12, borderRadius: 12, gap: 5 },
  authSuccess: { backgroundColor: colors.successSoft },
  authError: { backgroundColor: colors.dangerSoft },
  authResultTitle: { fontSize: 12, fontWeight: '900' },
  successText: { color: colors.success },
  errorText: { color: colors.danger },
  footnote: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10 },
});
