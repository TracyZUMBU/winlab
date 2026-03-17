import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { otpSchema, type OtpFormValues } from '../validators';
import { sendEmailOtp, verifyEmailOtp } from '../services';
import { AUTH_MESSAGES, AUTH_ROUTES, OTP_CODE_LENGTH } from '../constants/authConstants';
import { getProfileByUserId } from '../services/profileService';

const ACCENT = '#FF8C00';

export const OTPScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const emailFromParams = typeof params.email === 'string' ? params.email : '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: '',
      email: emailFromParams,
    },
  });

  const codeField = register('code');
  const codeValue = watch('code');

  const onSubmit = async (values: OtpFormValues) => {
    setServerError(null);

    const email = values.email ?? emailFromParams;
    if (!email) {
      setServerError("L'email est manquant, veuillez recommencer le flux.");
      router.replace(AUTH_ROUTES.email);
      return;
    }

    const result = await verifyEmailOtp({ email, token: values.code });

    if (!result.success) {
      setServerError(result.errorMessage ?? AUTH_MESSAGES.invalidCode);
      return;
    }

    const user = result.user;

    try {
      const profile = await getProfileByUserId(user.id);

      if (profile) {
        router.replace(AUTH_ROUTES.appIndex);
      } else {
        router.replace({
          pathname: AUTH_ROUTES.createProfile,
        });
      }
    } catch (error: any) {
      setServerError(error?.message ?? AUTH_MESSAGES.genericError);
    }
  };

  const handleResend = async () => {
    const email = emailFromParams;
    if (!email) {
      setServerError("L'email est manquant, veuillez recommencer le flux.");
      router.replace(AUTH_ROUTES.email);
      return;
    }

    setServerError(null);
    setResendLoading(true);
    try {
      await sendEmailOtp({ email });
    } catch (error: any) {
      setServerError(error?.message ?? AUTH_MESSAGES.genericError);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Entrez le code"
      subtitle={`Nous avons envoyé un code à ${emailFromParams || 'votre email'}.`}
    >
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>CODE DE VÉRIFICATION</Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={OTP_CODE_LENGTH}
          placeholder="000000"
          placeholderTextColor="#94A3B8"
          style={[
            styles.input,
            errors.code ? styles.inputError : undefined,
          ]}
          value={codeValue}
          onChangeText={(text) => {
            setValue('code', text.replace(/\D/g, ''), { shouldValidate: true });
          }}
          onBlur={codeField.onBlur}
        />
        {errors.code?.message ? (
          <Text style={styles.errorText}>{errors.code.message}</Text>
        ) : null}
      </View>

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Vous n’avez pas reçu le code ?</Text>
        <Pressable onPress={handleResend} disabled={resendLoading}>
          {resendLoading ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <Text style={styles.resendLink}>Renvoyer le code</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            isSubmitting && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Valider</Text>
          )}
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#FFFFFF',
    color: '#020617',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: '#DC2626',
  },
  serverError: {
    marginTop: 12,
    fontSize: 14,
    color: '#DC2626',
  },
  resendRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

