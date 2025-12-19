import GeoFerreHeader from "@/components/GeoFerreHeader";
import Colors from "@/constants/Colors";
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabaseClient'; 

interface Pedido {
  id_pedido: string;
  fecha_pedido: string;
  estado: string;
  monto_total: number;
}

export default function MisPedidosScreen() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    try {
      setLoading(true);

      // 1️⃣ Usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('❌ No hay usuario autenticado');
        return;
      }

      // 2️⃣ Obtener id_cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('cliente_app')
        .select('id_cliente')
        .eq('auth_user_id', user.id)
        .single();

      if (clienteError) {
        console.log('❌ Error obteniendo cliente:', clienteError);
        return;
      }

      if (!cliente) {
        console.log('❌ No se encontró el cliente');
        return;
      }

      console.log('✅ Cliente encontrado:', cliente.id_cliente);

      // 3️⃣ Obtener pedidos del cliente
      const { data, error } = await supabase
        .from('pedido')
        .select('id_pedido, fecha_pedido, estado, monto_total')
        .eq('id_cliente', cliente.id_cliente)
        .order('fecha_pedido', { ascending: false });

      if (error) {
        console.log('❌ Error cargando pedidos:', error);
        throw error;
      }

      console.log('✅ Pedidos cargados:', data?.length || 0);
      setPedidos(data || []);
    } catch (error) {
      console.log('❌ Error general:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderPedido({ item }: { item: Pedido }) {
    const estado = item.estado?.toUpperCase();
    const estadoStyle = estadoEstilos[estado as EstadoKey] || estadoEstilos.DEFAULT;
    const fechaTxt = new Date(item.fecha_pedido).toLocaleDateString("es-CL");

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log('🔍 Navegando a pedido:', item.id_pedido);
          // ✅ CORRECCIÓN: Ruta correcta - ambos viven en app/
          router.push(`/pedido/${item.id_pedido}`);
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.id}>Pedido #{item.id_pedido.slice(0, 8)}</Text>
          <View style={[styles.badge, estadoStyle.badge]}>
            <Text style={[styles.badgeText, estadoStyle.badgeText]}>{estado}</Text>
          </View>
        </View>

        <Text style={styles.text}>Fecha: {fechaTxt}</Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.total}>${item.monto_total}</Text>
        </View>

        <Text style={styles.link}>Ver seguimiento →</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
        <Text style={{ marginTop: 12, color: PALETTE.textSoft }}>
          Cargando pedidos...
        </Text>
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>
          📦 No tienes pedidos registrados
        </Text>
        <Text style={{ color: PALETTE.textSoft }}>
          Realiza tu primera compra
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GeoFerreHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Mis pedidos</Text>

        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id_pedido}
          renderItem={renderPedido}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>
    </View>
  );
}

const PALETTE = Colors.palette;
type EstadoKey = "PAGADO" | "LISTO" | "RETIRADO" | "PENDIENTE" | "DEFAULT";

const estadoEstilos: Record<EstadoKey, { badge: any; badgeText: any }> = {
  PAGADO: {
    badge: { backgroundColor: "rgba(16, 185, 129, 0.14)", borderColor: "#10B981" },
    badgeText: { color: "#0f9f6e" },
  },
  LISTO: {
    badge: { backgroundColor: "rgba(59, 130, 246, 0.12)", borderColor: "#2563EB" },
    badgeText: { color: "#1d4ed8" },
  },
  RETIRADO: {
    badge: { backgroundColor: "rgba(107, 114, 128, 0.12)", borderColor: "#6B7280" },
    badgeText: { color: "#374151" },
  },
  PENDIENTE: {
    badge: { backgroundColor: "rgba(245, 158, 11, 0.14)", borderColor: "#F59E0B" },
    badgeText: { color: "#b45309" },
  },
  DEFAULT: {
    badge: { backgroundColor: PALETTE.accentLight, borderColor: PALETTE.border },
    badgeText: { color: PALETTE.textSoft },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: PALETTE.base,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  id: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
  },
  text: {
    color: PALETTE.textSoft,
    marginBottom: 4,
    fontSize: 14,
  },
  total: {
    fontWeight: '700',
    marginTop: 6,
    fontSize: 18,
    color: PALETTE.primary,
  },
  link: {
    color: PALETTE.primary,
    marginTop: 12,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.background,
  },
});
