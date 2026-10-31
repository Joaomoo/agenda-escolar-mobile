import React, { useState } from 'react';
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
import { AppScreen } from '../components/ui';
import { colors, radius } from '../constants/theme';
import { getAuthErrorMessage, signInAndLoadProfile } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Campos obrigatórios', 'Informe seu email e sua senha.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInAndLoadProfile(normalizedEmail, password);
      // O painel valida novamente o perfil ao abrir, protegendo sessões restauradas.
      router.replace('/painel');
    } catch (error) {
      Alert.alert('Não foi possível entrar', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.container}>
      <Link href="/(tabs)" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>‹  Voltar para agenda</Text>
        </Pressable>
      </Link>

      <View style={styles.brandMark}>
        <Text style={styles.brandLetters}>CIM</Text>
      </View>
      <Text style={styles.eyebrow}>ÁREA RESTRITA</Text>
      <Text style={styles.title}>Acesso da equipe</Text>
      <Text style={styles.subtitle}>
        Entre com sua conta para gerenciar a programação e os lembretes da turma.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="nome@escola.com"
          placeholderTextColor="#A2AABC"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!loading}
          returnKeyType="next"
          style={styles.input}
        />

        <Text style={styles.label}>Senha</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            placeholderTextColor="#A2AABC"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setPasswordVisible((value) => !value)}
            hitSlop={10}
            style={styles.showPassword}
          >
            <Text style={styles.showPasswordText}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [styles.submit, pressed && styles.pressed, loading && styles.disabled]}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Entrar</Text>}
        </Pressable>
      </View>

      <Text style={styles.helpText}>
        Acesso exclusivo para professores e administradores cadastrados pela escola.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 8, justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12 },
  backText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  brandMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 24 },
  brandLetters: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -0.9, marginTop: 7 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 340 },
  formCard: { marginTop: 27, backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 4 },
  input: { height: 49, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 14, backgroundColor: '#FBFCFE' },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 82 },
  showPassword: { position: 'absolute', right: 13, paddingVertical: 10, paddingHorizontal: 4 },
  showPasswordText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  submit: { height: 51, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.55 },
  helpText: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
});
