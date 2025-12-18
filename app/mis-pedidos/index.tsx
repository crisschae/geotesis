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

const COLORS = {
  primary: '#8B5A2B',
  background: '#F5F0E6',
  card: '#FFFFFF',
  muted: '#777',
  text: '#2E2E2E',
};

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

      if (!user) return;

      // 2️⃣ Obtener id_cliente
      const { data: cliente } = await supabase
        .from('cliente_app')
        .select('id_cliente')
        .eq('auth_user_id', user.id)
        .single();

      if (!cliente) return;

      // 3️⃣ Obtener pedidos del cliente
      const { data, error } = await supabase
        .from('pedido')
        .select('id_pedido, fecha_pedido, estado, monto_total')
        .eq('id_cliente', cliente.id_cliente)
        .order('fecha_pedido', { ascending: false });

      if (error) throw error;

      setPedidos(data || []);
    } catch (error) {
      console.log('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderPedido({ item }: { item: Pedido }) {
    const estado = item.estado?.toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/pedido/[id]',
            params: { id: item.id_pedido },
          })
        }
      >
        <Text style={styles.id}>Pedido #{item.id_pedido.slice(0, 8)}</Text>

        <Text style={styles.text}>
          Fecha: {new Date(item.fecha_pedido).toLocaleDateString()}
        </Text>

        <Text style={styles.text}>Estado: {estado}</Text>

        <Text style={styles.total}>Total: ${item.monto_total}</Text>

        <Text style={styles.link}>Ver seguimiento →</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No tienes pedidos registrados</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pedidos</Text>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id_pedido}
        renderItem={renderPedido}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  id: {
    fontWeight: '600',
    marginBottom: 6,
  },
  text: {
    color: COLORS.text,
    marginBottom: 4,
  },
  total: {
    fontWeight: '700',
    marginTop: 6,
  },
  link: {
    color: COLORS.primary,
    marginTop: 10,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
