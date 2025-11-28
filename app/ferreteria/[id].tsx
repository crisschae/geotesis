// app/ferreteria/[id].tsx
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { supabase } from '@/lib/supabaseClient';

type Store = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  opening_hours?: any | null;
  rating_avg?: number | null;
  hero_image_url?: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  image_url?: string | null;
  store_id: string;
};

export default function FerreteriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setErr(null);
      const { data: storeData, error: sErr } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (sErr || !storeData) {
        setErr('No se pudo cargar la ferretería.');
        setLoading(false);
        return;
      }
      setStore(storeData as Store);

      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('name', { ascending: true });
      setProducts(prodData || []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8d6e63" />
        <Text style={styles.muted}>Cargando ferretería…</Text>
      </View>
    );
  }

  if (err || !store) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>❌ {err ?? 'Ferretería no encontrada'}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapsUrl = store.lat != null && store.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image
        source={{ uri: store.hero_image_url || 'https://placehold.co/1200x500?text=Ferreteria' }}
        style={styles.hero}
      />
      <Text style={styles.title}>{store.name}</Text>
      {store.rating_avg != null && <Text style={styles.rating}>⭐ {store.rating_avg.toFixed(1)} / 5</Text>}
      {store.address && <Text style={styles.subtitle}>📍 {store.address}</Text>}

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(mapsUrl)}>
          <Text style={styles.btnText}>Navegar con Google Maps</Text>
        </TouchableOpacity>
        {store.phone && (
          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => Linking.openURL(`tel:${store.phone}`)}>
            <Text style={[styles.btnText, styles.btnGhostText]}>Llamar</Text>
          </TouchableOpacity>
        )}
      </View>

      {store.description && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <Text style={styles.cardText}>{store.description}</Text>
        </View>
      )}

      {store.opening_hours && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horarios</Text>
          <Text style={styles.code}>{JSON.stringify(store.opening_hours, null, 2)}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Productos</Text>
          <Text style={styles.muted}>{products.length} ítems</Text>
        </View>
        {products.length === 0 ? (
          <Text style={styles.muted}>No hay productos publicados.</Text>
        ) : (
          <View style={styles.grid}>
            {products.map((p) => (
              <View key={p.id} style={styles.prod}>
                <Image
                  source={{ uri: p.image_url || 'https://placehold.co/600x400?text=Producto' }}
                  style={styles.prodImg}
                />
                <View style={styles.prodBody}>
                  <Text style={styles.prodTitle}>{p.name}</Text>
                  <Text style={styles.prodPrice}>
                    ${p.price.toLocaleString('es-CL')}
                  </Text>
                  {typeof p.stock === 'number' && (
                    <Text style={styles.muted}>
                      Stock: {p.stock > 0 ? p.stock : 'Agotado'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  hero: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#9CA3AF', marginTop: 4 },
  rating: { color: '#FBBF24', marginTop: 6, fontSize: 16 },
  muted: { color: '#9CA3AF' },
  error: { color: '#EF4444', fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: { backgroundColor: '#8d6e63', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#8d6e63' },
  btnText: { color: '#fff', fontWeight: '600' },
  btnGhostText: { color: '#8d6e63' },
  card: { marginTop: 16, padding: 14, backgroundColor: '#1f2937', borderRadius: 12, borderWidth: 1, borderColor: '#2a3443' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 6 },
  cardText: { color: '#D1D5DB' },
  code: { color: '#D1D5DB', fontFamily: 'monospace' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  prod: { backgroundColor: '#111827', borderRadius: 10, overflow: 'hidden', width: '48%' },
  prodImg: { width: '100%', height: 110 },
  prodBody: { padding: 8 },
  prodTitle: { color: '#fff', fontWeight: '600' },
  prodPrice: { color: '#fff' },
});
