import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabaseClient';

const PALETTE = {
  primary: '#986132',
  secondary: '#9C6535',
  base: '#ffffff',
  soft: '#f7f1ea',
  text: '#000000',
  textSoft: '#4b3323',
  border: '#edd8c4',
};

const ORANGE = PALETTE.primary;
const DARK_BG = PALETTE.base;
const CARD_BG = PALETTE.soft;

type ClientePerfil = {
  nombre: string | null;
  email: string;
};

export default function ProfileScreen() {
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data, error } = await supabase
        .from('cliente_app')
        .select('nombre, email')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setPerfil({
          nombre: data.nombre,
          email: data.email,
        });
      } else {
        setPerfil({
          nombre: user.user_metadata?.name ?? null,
          email: user.email ?? 'sin-correo',
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  /* =========================
     ITEM DE SECCIÓN (CLICKEABLE)
  ========================= */
  const SectionItem = ({
    title,
    subtitle,
    icon,
    onPress,
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.sectionCard}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.sectionIconCircle}>
        <Text style={styles.sectionIcon}>{icon}</Text>
      </View>

      <View style={styles.sectionTextWrapper}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.sectionChevron}>{'>'}</Text>
    </TouchableOpacity>
  );

  const nombreMostrado =
    perfil?.nombre && perfil.nombre.trim().length > 0
      ? perfil.nombre
      : perfil?.email ?? 'Usuario GeoFerre';

  const iniciales =
    nombreMostrado
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'UG';

  if (loading || !perfil) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>

        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{iniciales}</Text>
          </View>

          <View style={styles.avatarTextWrapper}>
            <Text style={styles.avatarName}>{nombreMostrado}</Text>
            <Text style={styles.avatarEmail}>{perfil.email}</Text>
          </View>
        </View>
      </View>

      {/* CONTENIDO */}
      <View style={styles.content}>
        <Text style={styles.sectionGroupLabel}>Mi Cuenta</Text>

        <SectionItem
          title="Datos personales"
          subtitle="Información de cuenta"
          icon="👤"
        />

        <SectionItem
          title="Mis direcciones"
          subtitle="Agregar o editar ubicaciones"
          icon="📍"
        />

        {/* 👉 CONECTADO A MIS PEDIDOS */}
        <SectionItem
          title="Historial de compras"
          subtitle="Seguimiento de tus pedidos"
          icon="🛒"
          onPress={() => router.push('../mis-pedidos')}
        />

        <Text
          style={[styles.sectionGroupLabel, { marginTop: 24 }]}
        >
          Configuración
        </Text>

        <SectionItem
          title="Notificaciones"
          subtitle="Preferencias de alertas"
          icon="🔔"
        />

        <SectionItem
          title="Seguridad y privacidad"
          subtitle="Gestión de datos y permisos"
          icon="🛡️"
        />
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

/* =========================
   ESTILOS
========================= */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DARK_BG,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.text,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: PALETTE.base,
    fontSize: 24,
    fontWeight: '700',
  },
  avatarTextWrapper: {
    flex: 1,
  },
  avatarName: {
    color: PALETTE.text,
    fontSize: 18,
    fontWeight: '700',
  },
  avatarEmail: {
    color: PALETTE.textSoft,
    fontSize: 13,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  sectionGroupLabel: {
    color: PALETTE.textSoft,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 18,
    color: PALETTE.base,
  },
  sectionTextWrapper: {
    flex: 1,
  },
  sectionTitle: {
    color: PALETTE.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: PALETTE.textSoft,
    fontSize: 12,
  },
  sectionChevron: {
    color: PALETTE.textSoft,
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
  },
  logoutText: {
    color: PALETTE.base,
    fontSize: 16,
    fontWeight: '700',
  },
});
